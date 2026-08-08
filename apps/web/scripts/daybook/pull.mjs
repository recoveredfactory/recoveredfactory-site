#!/usr/bin/env node
// Pull an Immigration Daybook edition from the PromptQL automation and write it
// into the archive as plain markdown: src/content/daybook/{en,es}/YYYY-MM-DD.md.
//
// Usage: node scripts/daybook/pull.mjs [--raw-only] [--offline] [--force]
//   --raw-only   fetch and save scripts/daybook/out/response.json, write nothing
//   --offline    re-template from the saved response.json instead of hitting the
//                API (deterministic re-runs; no LLM spend)
//   --force      write even when the manifest says the edition isn't shippable
//   --skip-cards don't render per-edition social cards (needs chrome + convert)
//
// Reads PQL_DAYBOOK_URL / PQL_DAYBOOK_KEY from apps/web/.env.
//
// The endpoint takes no parameters that select an edition: a run always returns
// the latest row on the `immigration_daybook_finals` shelf, and passing an
// `edition_date` in the manifest is silently ignored (verified 2026-08-04). So
// this script is a daily "fetch whatever is current" job, not a backfill tool.
// Editions already on disk are left alone unless their date matches the one that
// comes back. Reaching further back means going at the shelf table directly.
//
// Unlike the DDP pull, this writes plain markdown with no <script> block and no
// Svelte components. Editions are loaded by src/lib/daybook/loader.ts with ?raw
// and rendered with `marked` — deliberately NOT through mdsvex, which compiles
// every matched file into the bundle at build time. That is fine for a few dozen
// essays and would not be fine for a weekday newsletter that adds ~500 files a
// year, in two languages.

import { execFileSync } from 'node:child_process';
import { readFileSync, mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { fetchUpcoming, toCalendarEntry } from './watch.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const webRoot = join(here, '..', '..');

const LANGS = ['en', 'es'];

// The standing note at the top of every edition ("Welcome to the free pilot
// run…"). It is the same italic paragraph in every issue, so it is split off the
// body and stored separately: it renders as a standing note rather than as
// indexed prose, and it never becomes the meta description. Boilerplate repeated
// across 500 pages is exactly what gets an archive classified as thin.
const STANDING_NOTE = /^\*(?!\*)([\s\S]+?)\*\s*$/m;

// Dek tuning. These live up here with the rest of the configuration rather than
// beside deriveDek because the script does its work at module top level, and a
// `const` declared below that point is still in its dead zone when the templating
// runs.
const DEK_BEATS = 3;
// Sized so three Spanish headlines fit: Spanish runs materially longer than
// English, and a tighter budget silently gave the ES edition two beats where EN
// got three. Search engines truncate a long description for display rather than
// penalizing it, so the cost of the extra room is nil.
const DEK_MAX_CHARS = 380;

// Standing rubrics ("Upcoming", "Around the system", "Who saw what?",
// "Próximamente", "¿Quién vio qué?") are section furniture, not beats. They are
// reliably short where a story headline is a full clause, so length separates
// them without hardcoding a list per language.
const RUBRIC_MAX_CHARS = 35;

// Carousel tuning, up here for the same dead-zone reason as the dek settings.
//
// One story beat, not three. The headline is the hook and the calendar is the
// payoff — three more headlines is more of the hook and none of the payoff. That
// makes a five-slide deck: cover, one story, two calendar slides, the terms.
const CAROUSEL_BEATS = 1;

// A nut sentence longer than this is one nobody reads off a phone.
const NUT_MAX_CHARS = 320;

// Two dated entries a slide, two slides. Four deadlines is a useful number to
// screenshot; eight is a document.
const UPCOMING_SLIDES = 2;
const UPCOMING_PER_SLIDE = 2;

// Watch-item summaries are written to explain a rule, not to fit a card.
const UPCOMING_MAX_CHARS = 240;

const args = new Set(process.argv.slice(2));
const offline = args.has('--offline');
const rawOnly = args.has('--raw-only');
const force = args.has('--force');
// Cards need headless Chrome and ImageMagick; --skip-cards is for environments
// that have neither, and for re-running the templating quickly.
const skipCards = args.has('--skip-cards');

const env = Object.fromEntries(
  readFileSync(join(webRoot, '.env'), 'utf8')
    .split('\n')
    .filter((line) => line.includes('=') && !line.startsWith('#'))
    .map((line) => [line.slice(0, line.indexOf('=')), line.slice(line.indexOf('=') + 1)]),
);

const url = env.PQL_DAYBOOK_URL;
const key = env.PQL_DAYBOOK_KEY;
if (!url || !key) {
  console.error('Missing PQL_DAYBOOK_URL / PQL_DAYBOOK_KEY in apps/web/.env');
  process.exit(1);
}

const outDir = join(here, 'out');
mkdirSync(outDir, { recursive: true });
const responsePath = join(outDir, 'response.json');

let response;
if (offline) {
  if (!existsSync(responsePath)) {
    console.error(`No saved response at ${responsePath}; run once without --offline first.`);
    process.exit(1);
  }
  response = JSON.parse(readFileSync(responsePath, 'utf8'));
  console.log('Offline: re-templating from scripts/daybook/out/response.json');
} else {
  // Same contract as the DDP automation: multipart/form-data, 'manifest' first.
  const form = new FormData();
  form.append('manifest', '{}');

  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `pat ${key}` },
    body: form,
  });

  const text = await res.text();
  if (!res.ok) {
    console.error(`PromptQL request failed: HTTP ${res.status}`);
    console.error(text.slice(0, 2000));
    process.exit(1);
  }

  response = JSON.parse(text);
  writeFileSync(responsePath, JSON.stringify(response, null, 2));
  console.log(`Saved raw response (${text.length} bytes) to scripts/daybook/out/response.json`);
}

if (response.error) {
  console.error(`Automation reported error: ${JSON.stringify(response.error)}`);
  process.exit(1);
}

if (rawOnly) process.exit(0);

const artifact = (name) => response.artifacts?.find((a) => a.name === name);

const manifestArtifact = artifact('daybook_final_manifest');
if (!manifestArtifact?.data) {
  console.error("Artifact 'daybook_final_manifest' missing; cannot place the edition.");
  process.exit(1);
}
const manifest = JSON.parse(manifestArtifact.data);

const editionDate = manifest.edition_date;
if (!/^\d{4}-\d{2}-\d{2}$/.test(editionDate ?? '')) {
  console.error(`Manifest has no usable edition_date (got ${JSON.stringify(editionDate)}).`);
  process.exit(1);
}

// The publish gate. `faithfulness_blocked` is the automation's own signal that a
// claim in the edition did not survive its source check — that must never reach
// the archive on autopilot, so --force has to be typed by a human who has read
// the edition. `url_parity` false means the EN and ES editions cite different
// URLs, which is a real editorial problem but not a correctness one, so it warns.
// `ship_ready` is the automation's own verdict that an edition is fit to go.
// `final` is stronger and means a human finished it — the Aug. 5 edition came
// through as `final` with notes reading "hand-final; canonical editor bolding".
// Both publish. Anything else is a state this script has not seen, and the right
// response to an unknown state is to stop rather than to guess.
const SHIPPABLE_STATUSES = new Set(['ship_ready', 'final']);

const shippable = SHIPPABLE_STATUSES.has(manifest.status) && !manifest.faithfulness_blocked;
if (!shippable) {
  const why = [
    !SHIPPABLE_STATUSES.has(manifest.status) && `status=${manifest.status}`,
    manifest.faithfulness_blocked && 'faithfulness_blocked=true',
  ]
    .filter(Boolean)
    .join(', ');
  if (!force) {
    console.error(`Edition ${editionDate} is not shippable (${why}). Refusing to write.`);
    console.error('Read the edition, then re-run with --force if it is genuinely fine.');
    process.exit(1);
  }
  console.warn(`WARNING: writing ${editionDate} despite ${why} (--force).`);
}
if (manifest.url_parity === false) {
  console.warn(`WARNING: ${editionDate} has url_parity=false — EN and ES cite different sources.`);
}

// The calendar is fetched once and shaped per language, because both languages
// are columns on the same watch item — two queries would be the same rows twice.
// Enough rows for the deck plus slack, since an item with no Spanish summary
// drops out of the ES deck and the next one takes its place.
const watchItems = await loadWatchItems(editionDate);
const calendarFor = (lang) =>
  watchItems.map((row) => toCalendarEntry(row, lang)).filter(Boolean);

let wrote = 0;
const decks = {};
for (const lang of LANGS) {
  const md = artifact(`daybook_final_${lang}_md`);
  if (!md?.data) {
    console.error(`Artifact 'daybook_final_${lang}_md' missing; skipping ${lang}.`);
    continue;
  }

  const dir = join(webRoot, 'src', 'content', 'daybook', lang);
  mkdirSync(dir, { recursive: true });

  const path = join(dir, `${editionDate}.md`);
  // Read before writing: this is where a hand-set hed or dek is recovered from
  // the file that is about to be overwritten.
  const edition = applyOverrides(
    prepareEdition(md.data, lang, editionDate),
    readFrontmatter(path),
    lang,
    editionDate,
  );

  // The card carries the hed, so it renders from the effective one — a card
  // still showing the automation's headline under a hed you rewrote is the
  // version everyone else sees when the edition is shared.
  const socialImage = renderEditionCard(lang, editionDate, edition.headline);

  // The edition as it went out, saved beside the markdown.
  //
  // The email HTML is the archive's record of what subscribers actually
  // received, and it is the only place the Upcoming calendar exists — the
  // markdown artifact ships that section empty. It comes back by reference
  // rather than inline, so it has to be fetched from the artifacts endpoint.
  // Fetched before the deck is built because the carousel reads the calendar.
  const html = await fetchEmailHtml(lang);
  const sanitized = html ? sanitizeEmailHtml(html) : '';

  decks[lang] = buildDeck(edition, editionDate, calendarFor(lang));

  writeFileSync(path, serializeEdition(edition, lang, editionDate, socialImage));
  console.log(
    `Wrote src/content/daybook/${lang}/${editionDate}.md` + (socialImage ? ' (+ card)' : ''),
  );
  wrote += 1;

  if (html) {
    writeFileSync(join(dir, `${editionDate}.html`), `${sanitized}\n`);
    console.log(`Wrote src/content/daybook/${lang}/${editionDate}.html`);
  } else {
    console.warn(
      `WARNING: ${editionDate} ${lang}: no email HTML. The edition will render from ` +
        'markdown, without the Upcoming calendar.',
    );
  }
}

if (!wrote) {
  console.error('No editions written.');
  process.exit(1);
}

renderCarousel(decks, editionDate);

// ---------------------------------------------------------------------------

/**
 * Fetch a language's email HTML, which the automation returns by reference.
 *
 * The bytes are cached under out/ so --offline can re-template a full edition,
 * HTML included, without going back to the network — same contract as
 * response.json.
 */
async function fetchEmailHtml(lang) {
  const name = `daybook_final_${lang}_html`;
  const cachePath = join(outDir, `${name}.html`);

  if (offline) {
    return existsSync(cachePath) ? readFileSync(cachePath, 'utf8') : null;
  }

  const entry = artifact(name);
  if (!entry) return null;
  if (entry.data) {
    writeFileSync(cachePath, entry.data);
    return entry.data;
  }

  const artifactId = entry.metadata?.artifact_id;
  if (!artifactId) return null;

  const base = url.replace(/\/execute_program\/.*$/, '');
  const res = await fetch(`${base}/artifacts/${artifactId}/data`, {
    headers: { Authorization: `pat ${key}` },
  });
  if (!res.ok) {
    console.warn(`Could not fetch '${name}' by reference: HTTP ${res.status}`);
    return null;
  }

  const html = await res.text();
  writeFileSync(cachePath, html);
  return html;
}

/**
 * Strip the parts of the email HTML that must not run in a page.
 *
 * This is generated markup from our own pipeline rather than arbitrary input,
 * so the job is narrow: remove anything executable or document-scoped, and keep
 * every inline style, because the inline styles are the thing being preserved.
 *
 * The <style> block is dropped rather than scoped. A <style> element in the page
 * body applies to the whole document, and this one carries only a word-break
 * rule, a max-width tweak for sub-384px screens, and an underline on .ck-link —
 * nothing the inline styles do not already cover.
 *
 * The two languages do not arrive in the same shape. EN comes back as the exact
 * Kit broadcast, which is a fragment. ES has no Kit broadcast, so the automation
 * hands over a whole standalone document — doctype, <head> with a Google Fonts
 * <link>, styled <body> — and that gets injected mid-page, where the parser
 * discards the structural tags and honours the stylesheet link the site's CSP
 * would rather it did not. So the document scaffolding comes off and what was
 * inside <body> is kept: a fragment either way, whatever the pipeline sends.
 *
 * Regex sanitising is not a general defence and should not be treated as one. It
 * holds here because the input is a known generator; if editions ever carry
 * third-party HTML, this needs a real parser.
 */
function sanitizeEmailHtml(html) {
  return html
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, '')
    .replace(/<\/?(script|style)\b[^>]*>/gi, '')
    .replace(/<!doctype[^>]*>/gi, '')
    .replace(/<head\b[^>]*>[\s\S]*?<\/head\s*>/gi, '')
    .replace(/<\/?(html|head|body)\b[^>]*>/gi, '')
    // Anything document-scoped that was never in a <head> to begin with.
    .replace(/<(link|meta|base)\b[^>]*>/gi, '')
    .replace(/<title\b[^>]*>[\s\S]*?<\/title\s*>/gi, '')
    // Temporary, and deliberately not general: the ES render currently leaks the
    // markdown's own title and draft label into the sent HTML, which puts a bare
    // second "Immigration Daybook" under the styled masthead and the words
    // "Borrador en español" on a published edition. Being fixed upstream — delete
    // this line once it is. The unstyled wordmark h1 is the tell, and the italic
    // paragraph only comes off when that h1 is there, so the standing note (also
    // wholly italic, immediately after) is left alone.
    .replace(/<h1\b[^>]*>\s*Immigration Daybook\s*<\/h1>\s*<p\b[^>]*>\s*<em>[\s\S]*?<\/em>\s*<\/p>/i, '')
    .replace(/\son[a-z]+\s*=\s*"[^"]*"/gi, '')
    .replace(/\son[a-z]+\s*=\s*'[^']*'/gi, '')
    .replace(/\son[a-z]+\s*=\s*[^\s>]+/gi, '')
    .replace(/((?:href|src)\s*=\s*)(["'])\s*javascript:[^"']*\2/gi, '$1$2#$2')
    .trim();
}

// Turn the automation's edition markdown into an archive file: split off the
// standing note, derive a title and description from what the edition actually
// says (never invented here — the archive should not put words in the
// newsletter's mouth), and record the provenance the manifest carries.
function prepareEdition(markdown, lang, date) {
  let body = markdown.trim();

  let standing = '';
  const noteMatch = body.match(STANDING_NOTE);
  if (noteMatch && body.startsWith(noteMatch[0])) {
    standing = noteMatch[1].trim();
    body = body.slice(noteMatch[0].length).trim();
  }

  body = stripUnresolvedSections(body, lang, date);
  body = repairCalendarBullets(body);

  // The lede story's headline is the first H2. It is the searchable thing about
  // an edition — nobody looks for "Immigration Daybook August 3", they look for
  // the story — so it becomes the title, and the date brands it in the route.
  const headline = body.match(/^## (.+)$/m)?.[1]?.trim() ?? '';

  return { body, standing, headline, description: deriveDek(body) };
}

/**
 * Read an edition file's frontmatter, or {} if it is not there yet.
 *
 * Same flat `key: "value"` format the pull writes and src/lib/daybook/loader.ts
 * reads — no YAML parser on either end, because nothing but this script ever
 * writes the file.
 */
function readFrontmatter(path) {
  if (!existsSync(path)) return {};

  const match = readFileSync(path, 'utf8').match(/^---\n([\s\S]*?)\n---\n/);
  if (!match) return {};

  const meta = {};
  for (const line of match[1].split('\n')) {
    const at = line.indexOf(':');
    if (at < 1) continue;
    const value = line.slice(at + 1).trim();
    meta[line.slice(0, at).trim()] =
      value.startsWith('"') && value.endsWith('"')
        ? value.slice(1, -1).replace(/\\"/g, '"').replace(/\\\\/g, '\\')
        : value;
  }
  return meta;
}

/**
 * Let a human's hed and dek outrank the derived ones.
 *
 * Both are derived from the edition's own section headlines, which is right
 * most days and wrong on the days it matters: a lede headline can be accurate
 * and still bury what the story is about. The Aug. 6 edition led on "Spotlight
 * turns to children" when the news was a $150 million contract handing those
 * children's legal representation to a politically connected firm — a hed that
 * says nothing is worse in the archive than in the inbox, because it is also
 * the page title, the social card, and the search result.
 *
 * So `titleOverride: true` / `descriptionOverride: true` in the frontmatter
 * pin the values beside them and the next pull carries them forward instead of
 * re-deriving. The flag is what makes it durable — editing `title:` alone is
 * silently reverted on the next run, so an unflagged divergence warns rather
 * than disappearing quietly.
 *
 * Overriding the hed also moves the card and the first beat of a derived dek,
 * since both follow the hed. Pin the dek too when you want them to differ —
 * which is the usual case for a question hed, where repeating it as the dek's
 * lead beat asks the reader something twice instead of answering it.
 */
function applyOverrides(prepared, existing, lang, date) {
  const held = (field, derived) => {
    const previous = existing[field];
    if (existing[`${field}Override`] === 'true' && previous) return previous;

    if (previous && previous !== derived) {
      console.warn(
        `WARNING: ${date} ${lang}: replacing ${field} "${previous}" with the derived ` +
          `"${derived}". Add ${field}Override: true to keep the hand-set one.`,
      );
    }
    return derived;
  };

  return {
    ...prepared,
    headline: held('title', prepared.headline),
    description: held('description', prepared.description),
    titleOverride: existing.titleOverride === 'true',
    descriptionOverride: existing.descriptionOverride === 'true',
  };
}

function serializeEdition(
  { body, standing, headline, description, titleOverride, descriptionOverride },
  lang,
  date,
  socialImage,
) {
  const perLang = manifest[lang] ?? {};
  const frontmatter = [
    '---',
    `date: "${date}"`,
    `lang: "${lang}"`,
    `title: "${escapeYaml(headline)}"`,
    // Written only when set, so the frontmatter of an ordinary edition stays
    // quiet and the flag reads as what it is: someone made a call here.
    titleOverride ? 'titleOverride: true' : null,
    `description: "${escapeYaml(description)}"`,
    descriptionOverride ? 'descriptionOverride: true' : null,
    standing ? `standing: "${escapeYaml(standing)}"` : null,
    // Written only when the card actually rendered, so the page can fall back
    // to the wordmark plate rather than pointing at an image that is not there.
    // static/images is gitignored by design, so the frontmatter — which is
    // committed — is the record of which cards exist.
    socialImage ? `socialImage: "${socialImage}"` : null,
    perLang.kit_broadcast_id ? `kitBroadcastId: ${perLang.kit_broadcast_id}` : null,
    perLang.doc_url ? `docUrl: "${perLang.doc_url}"` : null,
    `sourceStatus: "${manifest.status}"`,
    '---',
  ]
    .filter((line) => line !== null)
    .join('\n');

  return `${frontmatter}\n\n${body}\n`;
}

/**
 * Render this edition's social card and return its public path, or '' if it
 * could not be made.
 *
 * A card wants the day's headline on it — a wordmark plate repeated under every
 * shared edition says nothing about the edition being shared. But rendering one
 * needs headless Chrome and ImageMagick, which the rest of this script does
 * not, so a missing toolchain degrades to the generic card instead of failing
 * the pull. The archive is the point; the card is a bonus.
 */
function renderEditionCard(lang, date, headline) {
  if (skipCards || !headline) return '';

  try {
    execFileSync(
      'node',
      [
        join(here, 'og.mjs'),
        '--card',
        'edition',
        '--lang',
        lang,
        '--edition',
        date,
        '--headline',
        headline,
      ],
      { stdio: ['ignore', 'ignore', 'pipe'] },
    );
    return `/images/immigration-daybook-og-${date}-${lang}.png`;
  } catch (err) {
    console.warn(
      `WARNING: ${date} ${lang}: could not render the social card ` +
        `(${err.message.split('\n')[0]}). Falling back to the generic card.`,
    );
    return '';
  }
}

/**
 * Build the Instagram deck for one language.
 *
 * Everything here is the edition's own copy, re-cut for a 4:5 frame: the hed
 * (including a hand-set one, since this runs after the overrides), then a slide
 * per story section carrying its headline and the bolded sentence underneath —
 * which is the automation's own one-line version of that story, so the slide
 * says what the section says.
 */
/**
 * Watch items for the calendar slides, or [] if they cannot be read.
 *
 * A missing NEWS_INGESTER_DB_URL is not an error: the archive, the cards and the
 * story slides all work without it, and the pull should still run for anyone who
 * has the PromptQL credentials but not the database. It just says so, because a
 * carousel that quietly loses its most useful slides looks the same as one that
 * never had them.
 */
async function loadWatchItems(date) {
  if (!env.NEWS_INGESTER_DB_URL) {
    console.warn(
      'WARNING: no NEWS_INGESTER_DB_URL in apps/web/.env — the carousel will ship ' +
        'without its Upcoming slides.',
    );
    return [];
  }

  try {
    const rows = await fetchUpcoming({
      connectionString: env.NEWS_INGESTER_DB_URL,
      editionDate: date,
      limit: UPCOMING_SLIDES * UPCOMING_PER_SLIDE + 4,
    });
    console.log(`Read ${rows.length} upcoming watch items for the carousel.`);
    return rows;
  } catch (err) {
    console.warn(`WARNING: could not read the watch calendar (${err.message}).`);
    return [];
  }
}

function buildDeck({ body, headline }, date, events) {
  const beats = body
    .split(/\n(?=## )/)
    .map((section) => ({
      headline: stripInlineMd(section.match(/^## (.+)$/m)?.[1] ?? ''),
      nut: nutSentence(section),
    }))
    .filter((beat) => beat.headline.length > RUBRIC_MAX_CHARS)
    .slice(0, CAROUSEL_BEATS);

  // The calendar is the payoff, so it goes in whole slides rather than as a
  // footnote: two dated entries a slide, up to UPCOMING_SLIDES of them.
  const trimmed = events.map((entry) => ({
    ...entry,
    text: trimToSentence(entry.text, UPCOMING_MAX_CHARS),
  }));

  const upcoming = [];
  for (let i = 0; i < trimmed.length && upcoming.length < UPCOMING_SLIDES; i += UPCOMING_PER_SLIDE) {
    const entries = trimmed.slice(i, i + UPCOMING_PER_SLIDE);
    // A half-full final slide reads as a mistake rather than as a short week.
    if (entries.length === UPCOMING_PER_SLIDE) upcoming.push({ entries });
  }

  return { date, hed: headline, beats, upcoming };
}

// Calendar prose is written to explain, not to fit a card. Cut on a sentence
// where possible — a deadline that ends mid-clause is worse than a shorter one.
function trimToSentence(text, max) {
  if (text.length <= max) return text;

  const cut = text.slice(0, max);
  const stop = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('? '), cut.lastIndexOf('! '));
  if (stop > max * 0.45) return cut.slice(0, stop + 1);

  const space = cut.lastIndexOf(' ');
  return `${(space > 0 ? cut.slice(0, space) : cut).replace(/[\s,;:—–-]+$/, '')}…`;
}

// The bolded lead of a section: the automation writes one at the top of each
// story, and it is already the compressed version. Nothing is paraphrased here.
function nutSentence(section) {
  const bold = section.match(/\*\*(?!\s)([^*]+?)\*\*/)?.[1];
  if (!bold) return '';

  const nut = stripInlineMd(bold);
  if (nut.length <= NUT_MAX_CHARS) return nut;

  const cut = nut.slice(0, NUT_MAX_CHARS);
  const stop = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('? '), cut.lastIndexOf('! '));
  return stop > 120 ? cut.slice(0, stop + 1) : `${cut.slice(0, cut.lastIndexOf(' '))}…`;
}

/**
 * Render the carousels, and say where they are.
 *
 * They land under static/images/social/<date>/<lang>/ so they ship with the
 * site: posting happens on a phone, and a file on a laptop is not on a phone.
 * Opening the printed URL on the phone and long-pressing each slide is the
 * whole workflow — no transfer, no cable, no link in a bio.
 */
function renderCarousel(decks, date) {
  const langs = Object.keys(decks);
  if (skipCards || !langs.length) return;

  const deckFile = join(outDir, `deck-${date}.json`);
  writeFileSync(deckFile, JSON.stringify(decks, null, 2));

  try {
    execFileSync(
      'node',
      [join(here, 'og.mjs'), '--card', 'carousel', '--lang', langs.join(','), '--deck', deckFile],
      { stdio: ['ignore', 'ignore', 'pipe'] },
    );
  } catch (err) {
    console.warn(
      `WARNING: ${date}: could not render the carousels (${err.message.split('\n')[0]}).`,
    );
    return;
  }

  console.log('\nCarousels — open on the phone you post from:');
  for (const lang of langs) {
    console.log(`  ${lang}: https://immigrationdaybook.com/images/social/${date}/${lang}/`);
  }
}

// Drop sections the upstream pipeline did not fill in.
//
// `## Upcoming` has arrived unfilled in two different ways: first as a literal
// `{{ replace }}` placeholder, and after that was fixed upstream, as a bare
// heading with nothing under it. Both mean the same thing — whatever renders the
// calendar runs after this artifact is written — and both have to be caught,
// because a heading followed by nothing reads as broken software just as surely
// as a raw template tag does.
//
// The email HTML does carry the calendar, and that is what an edition page
// renders — so this is no longer a hole in the archive. It is still a hole in
// the markdown, which is what feeds RSS, the .md companions, and the month
// roundups, so the warning stays.
function stripUnresolvedSections(body, lang, date) {
  const sections = body.split(/\n(?=## )/);

  const kept = sections.filter((section) => {
    const heading = section.match(/^## (.+)$/m)?.[1]?.trim() ?? '(untitled)';
    const placeholder = section.match(/\{\{\s*\w+\s*\}\}/)?.[0];
    const empty = !section.replace(/^## .+$/m, '').trim();

    if (!placeholder && !empty) return true;

    console.warn(
      `WARNING: ${date} ${lang}: dropped section "${heading}" from the markdown — ` +
        (placeholder ? `unresolved placeholder (${placeholder})` : 'no content under the heading') +
        '. The email HTML still carries it; RSS and the .md companion will not.',
    );
    return false;
  });

  return kept.join('\n');
}

// Calendar entries come off the automation as `**- 4 de agosto — …**  trailing
// prose`: the opening bold swallows the list marker, so markdown sees a
// paragraph beginning with a literal `**-` instead of a list item. Swapping the
// two characters puts the marker outside the emphasis and leaves the closing
// `**` — which lands mid-line, before the entry's explanatory sentence — exactly
// where it was. Lines that do not start this way are untouched.
function repairCalendarBullets(body) {
  return body.replace(/^\*\*-[ \t]+/gm, '- **');
}

// The dek: what the edition covered, used as the meta description, as the blurb
// on the landing page's latest-edition plate, and as the standfirst on the
// archive index.
//
// Built from the edition's own section headlines rather than from its lede. A
// dek drawn from the top story alone says "Delaney Hall" and implies that is all
// the edition was about; three beats say what a reader is actually getting. The
// headlines are already editorial copy, written tight, so joining them invents
// nothing — this deliberately does not paraphrase or compress the newsletter's
// prose into words nobody wrote.
function deriveDek(body) {
  // The first H2 is the lede — it is where the title comes from, and an edition
  // never opens on a standing rubric — so it counts as a beat whatever its
  // length, and the rubric filter applies only to what follows. Without that
  // exemption a short lede reads as furniture and gets dropped: on 2026-08-06
  // "Spotlight turns to children" (27 chars) fell out of the English dek while
  // "La atención se vuelca hacia la niñez" (36) stayed, so the same edition
  // summarized itself two different ways in its two languages.
  const beats = [...body.matchAll(/^## (.+)$/gm)]
    .map((match) => stripInlineMd(match[1]))
    .filter((headline, i) => i === 0 || headline.length > RUBRIC_MAX_CHARS);

  const picked = [];
  for (const beat of beats.slice(0, DEK_BEATS)) {
    if (picked.length && [...picked, beat].join(' · ').length > DEK_MAX_CHARS) break;
    picked.push(beat);
  }
  if (picked.length) return picked.join(' · ');

  // Fallback for an edition with no story headlines: the bolded nut of the
  // opening item, which is the automation's own one-line version of it.
  const bold = firstProsePara(body).match(/\*\*(?!\s)([^*]+?)\*\*/)?.[1];
  if (bold) {
    const dek = stripInlineMd(bold);
    if (dek.length >= 40 && dek.length <= 200) {
      return /[.?!]$/.test(dek) ? dek : `${dek}.`;
    }
  }

  return firstSentences(body);
}

// A function declaration, not a const arrow: these helpers are called during
// module evaluation, before a `const` further down the file is initialized.
function stripInlineMd(value) {
  return value
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/\*\*|\*|`/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// The first real paragraph of the body: not a heading, not a list item, and not
// one of the italic production notes the editions open with.
function firstProsePara(body) {
  const isNote = (p) => /^\*(?!\*)[\s\S]+\*$/.test(p);
  return (
    body
      .replace(/^## .+$/m, '')
      .split('\n\n')
      .map((p) => p.trim())
      .find((p) => p && !p.startsWith('#') && !p.startsWith('-') && !isNote(p)) ?? ''
  );
}

// Fallback dek. Strips inline markdown so the description does not leak `**` or
// link syntax into search results, and stops at ~180 chars on a sentence
// boundary.
//
// Wholly-italic paragraphs are skipped. Editions open with production notes set
// that way — the standing welcome, and in Spanish a "Nota del traductor"
// explaining that the edition was built in parallel from the English draft.
// Those are disclosures for readers, not summaries, and letting one become the
// meta description puts an internal process note in the search result.
function firstSentences(body) {
  const plain = stripInlineMd(firstProsePara(body));

  if (plain.length <= 180) return plain;

  // Prefer ending on a sentence. Failing that, end on a word — a description
  // that stops mid-word ("…Customs Enforcemen…") reads as broken software, and
  // this string is on the landing page and in every search result.
  const cut = plain.slice(0, 180);
  const stop = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('? '), cut.lastIndexOf('! '));
  if (stop > 80) return cut.slice(0, stop + 1);

  const space = cut.lastIndexOf(' ');
  return `${(space > 80 ? cut.slice(0, space) : cut).replace(/[\s,;:—–-]+$/, '')}…`;
}

function escapeYaml(s) {
  return s.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}
