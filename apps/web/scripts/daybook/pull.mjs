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
//   --no-upcoming leave the calendar off the carousel (see the note below)
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

import { spawnSync } from 'node:child_process';
import { readFileSync, mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  loadUpcoming,
  publishedFromText,
  upcomingItems,
  toCalendarEntry as toEntryFromSnapshot,
} from './upcoming.mjs';

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

// Who edits the Spanish editions. Every Spanish edition is an edited
// translation and carries the credit; the English ones are not translations of
// anything and carry none. Written as frontmatter rather than as a constant in
// the component that draws it, so an edition someone else edits is a one-line
// change to that edition instead of a special case in the render — and so the
// archive keeps the credit that was true on the day.
const TRANSLATION_EDITOR = 'Diana Vanessa Riascos-Gamez';

// Standing rubrics ("Upcoming", "Around the system", "Who saw what?",
// "Próximamente", "¿Quién vio qué?") are section furniture, not beats. They are
// reliably short where a story headline is a full clause, so length separates
// them without hardcoding a list per language.
const RUBRIC_MAX_CHARS = 35;

// The Upcoming calendar flattened to text: an indented month abbreviation, then
// an indented day. See stripFlattenedCalendar. Declared up here with the rest of
// the configuration for the dead-zone reason the dek settings give.
const FLATTENED_CALENDAR = /^[ \t]+\p{Lu}{3,12}[ \t]*\n[ \t]+\d{1,2}[ \t]*$/mu;

// The email's sign-off, which the markdown began carrying on 2026-08-26: the
// project line, the sibling-project links and the copyright. Recognised by where
// its links go — everything in it points at our own sites, PromptQL or the
// licence. See stripEmailFooter.
const FOOTER_HOSTS = /^(?:[a-z0-9-]+\.)*(?:recoveredfactory\.net|promptql\.io|creativecommons\.org)$/;


// Carousel tuning, up here for the same dead-zone reason as the dek settings.
//
// Six slides: cover, two stories, two calendar, the terms. The lede has no
// slide of its own — its nut sentence shares the cover with the hed that was
// written off it — so these two beats are the stories a reader has not been
// told yet.
const CAROUSEL_BEATS = 2;

// A nut sentence longer than this is one nobody reads off a phone.
const NUT_MAX_CHARS = 320;

// The supporting sentence that rides under the nut on a story slide. The nut is
// the claim; this is the first thing the edition offers in support of it, and
// without it a slide is a headline and a restatement of the headline.
//
// Budgeted against Spanish, which runs 20-30% longer than the English it is
// translated from. The slide scales its own type to fill the frame, so a long
// one costs a size step rather than an overflow — but past this the step is one
// nobody reads at arm's length.
const DETAIL_MAX_CHARS = 280;

// Publications credited on a story slide. Beyond three the credit line stops
// reading as attribution and starts reading as a list, and the fourth name is
// always the one nobody has heard of.
const CAROUSEL_SOURCES = 3;

// When the bolded claim only says the headline again.
//
// The automation writes a compressed lead for every section, and on a section
// whose headline is already specific that lead can come out as the headline in
// longer words — "Trump signs birthright-citizenship and birth-tourism orders",
// then "President Trump signed two immigration executive orders on Aug. 6." Two
// tiers of a slide saying one thing, and the actual news (what the two orders
// do) pushed off the card.
//
// So a claim that is both short and largely built from the headline's own words
// is dropped, and the sentences under it move up a tier. Both conditions have
// to hold: a long claim carries specifics whatever it shares with the headline
// — the TPS lead repeats "TPS" and "Haitians" and then gives a date, a court
// and an outcome — and a short claim with fresh words is a real second beat.
//
// This edits the edition rather than copying it, which is a bigger licence than
// the rest of this file takes. It is bounded to dropping a sentence the
// headline has already made, it says so on the console when it fires, and no
// deck posts without someone looking at it.
const RESTATEMENT_MAX_CHARS = 100;
const RESTATEMENT_OVERLAP = 0.3;

// A promoted sentence is prose written to run under a claim, not to be one, so
// it gets a tighter budget than a claim written for the job.
const PROMOTED_NUT_MAX = 240;

// Not a linguistic stoplist — just the words common enough on both sides to
// make an overlap ratio meaningless. English and Spanish together, because the
// test runs on whichever language the edition was written in.
const STOPWORDS = new Set(
  ('the and for that with from has have had its are was were will would this these those but not '
    + 'который los las del por con que una unos unas sus son han fue este esta estas estos como para '
    + 'sobre entre mientras donde their there they them then than also into over under after before '
    + 'been being more most some such only other another where which while about')
    .split(/\s+/)
    .filter(Boolean),
);

// Abbreviations that end in a period without ending a sentence. Three-letter
// capitals are deliberately absent: a sentence ending in ICE, DHS or ORR is far
// commoner in this corpus than one that does not.
const ABBREVIATIONS = new Set(
  ('mr mrs ms dr sr sra st no inc rep sen gov vs jan feb mar apr aug sept sep oct nov dec')
    .split(' '),
);

// One calendar slide, up to four dated entries on it, and never fewer than
// three.
//
// This used to be two slides of two, on the reasoning that four deadlines is a
// useful number to screenshot and eight is a document. Four was the right
// number; two slides was not. The entries arrived at 420 characters apiece, so
// each slide came out as two paragraphs of Federal Register prose under a date,
// which is a document at two entries just as surely as at eight — and it cost a
// third of the deck to say what one card says better.
//
// One board instead: every deadline the edition published, in date order, each
// cut to the clause that carries the number. The full text is what the
// newsletter is for.
const UPCOMING_SLIDES = 1;
const UPCOMING_PER_SLIDE = 4;

// A board of two entries is a list; three is a board. Below that the slide is
// dropped rather than shipped half-empty — which is the same rule the two-up
// slides had, set at the number a single board needs.
const UPCOMING_MIN_PER_SLIDE = 3;

// Watch-item summaries are written to explain a rule, not to fit a card, and on
// a board four of them share the room two used to have. So this is a clause
// budget rather than a paragraph one: enough for the fact and the number under
// it — "DHS wants to raise the cost of applying for US citizenship (Form N-400)
// from $760 to $1,330 on paper, and $710 to $1,280 online" — and the rest of the
// rule is in the edition, which is where someone acting on a deadline should be
// reading it anyway.
//
// Set against Spanish rather than English: the same entry runs 20-30% longer in
// Spanish, and a budget that fits the English cut "…de la Oficina de" off the
// end of the Spanish one, which is worse than a smaller type size.
const UPCOMING_MAX_CHARS = 190;

// The round-up slide: the edition's last section, the one that is a list of
// briefs under a short rubric rather than a story under a headline.
//
// The deck used to throw this away entirely. An edition carries three or four
// stories and then six or seven items in a closing list, and the carousel read
// the stories and stopped — so a reader who swiped the whole deck saw a third of
// the day. The list is the cheapest breadth in the newsletter and it was going
// nowhere.
//
// Four of them, and never fewer than three. They run in the edition's own
// order: which item leads a round-up is an editorial call that was already made.
//
// Four rather than three because of how the slide is set. Every size on a
// portrait slide is a multiple of --fit and the fitter grows the type until the
// card is full, so a card with three short briefs on it does not come out
// roomy — it comes out with the briefs set larger than the nut sentence on the
// cover, which says a one-line item matters more than the day's lead. Four
// items is the number that fills the frame at the size this prose should be.
const BRIEFS = 4;
const BRIEFS_MIN = 3;

// One sentence each. The bullets open with the news and then qualify it for
// another two sentences — "…the nonbinding resolutions came amid renewed
// progressive anger after recent fatal ICE encounters" — and the qualification
// is what the edition is for.
const BRIEF_MAX_CHARS = 165;

// One publication a brief, not three. A story slide has the room for a credit
// line and the standing to want one; a brief is a single line, and three names
// under it is longer than the news.
const BRIEF_SOURCES = 1;

const args = new Set(process.argv.slice(2));
const offline = args.has('--offline');
const rawOnly = args.has('--raw-only');
const force = args.has('--force');
// Cards need headless Chrome and ImageMagick; --skip-cards is for environments
// that have neither, and for re-running the templating quickly.
const skipCards = args.has('--skip-cards');

// Leave the calendar off the carousel for this run.
//
// This was written when the calendar took two of six slides and the deadlines
// were standing ones, so consecutive editions carried the same four entries and
// the slides came out byte-identical — 2026-08-11 and 2026-08-12 were the same
// two cards in both languages. That was not wrong; it is what a deadline is. It
// was just not worth a third of the deck.
//
// The board answers most of that: one slide instead of two, and a countdown
// that is different every morning off the same row. The flag stays for the
// other case it covers — a day whose slate is thin, or a deck that wants the
// room for something else.
//
// The snapshot is still fetched and still archived either way, because it is
// the record.
const noUpcoming = args.has('--no-upcoming');

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

// Which calendar entries the composer actually published.
//
// The snapshot's own `selected_items` is empty on every edition seen so far and
// `selection.mode` reads `eligible_only`, so the readers downstream fall back to
// the whole eligible slate — which is one or two entries longer than what went
// out. On 2026-08-17 the email carried five and the eligible set held six, the
// sixth being an OMB paperwork renewal of exactly the kind the composer keeps
// off the calendar.
//
// So the set has to come from somewhere, and there are two candidates: the
// manifest says what was meant to ship, and the email is what shipped. The email
// wins. It is the artifact subscribers received, it is fetched on every run
// anyway, and every item on it is matched by the composer's own summary text —
// see publishedFromText. The manifest's `upcoming_ids` is bookkeeping written
// alongside the send rather than by it, and its record has not held up: on
// 2026-08-17 only `es` carried the field, on 2026-08-18 neither did, and the
// deck that day put an Aug. 31 H-2B attestation on the board in place of the
// Sep. 9 H-1B fee the edition ran.
//
// The manifest is still read, for two reasons. It covers an edition whose email
// never came back, and where both exist a disagreement between them is worth
// saying out loud — it is the cheapest signal there is that the bookkeeping
// upstream has drifted.
//
// Whichever answers, it is archived into the edition frontmatter, which is the
// committed record the page can reach.
const manifestUpcomingIds = (() => {
  for (const lang of LANGS) {
    try {
      const ids = JSON.parse(manifest[lang]?.notes ?? '{}').upcoming_ids;
      if (Array.isArray(ids) && ids.length) return ids;
    } catch {
      // A notes blob that is not JSON is not worth stopping the pull over.
    }
  }
  return null;
})();

let upcomingIds = manifestUpcomingIds;
let upcomingFrom = manifestUpcomingIds ? 'manifest' : null;

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

// The calendar, both languages, from the one archived snapshot.
//
// This used to read the ingestion database and pick by nearest deadline, which
// disagreed badly with what the newsletter ran — and then, briefly, English came
// from the snapshot while Spanish still came from the database. Both paths are
// gone. Selection and ordering are editorial, they happen upstream, and there is
// one record of them.
const snapshot = await loadUpcoming({ webRoot, url, key, date: editionDate, offline });
if (snapshot) {
  // v2 moved the counts under `audit` and lifted `policy_sha256` to the top
  // level; v1 kept both beside `selection`. Read either, because a log line that
  // says "0 items" over a full calendar is worse than no log line.
  const mode = snapshot.selection?.mode ?? 'unknown';
  const eligible =
    snapshot.audit?.eligible_count ??
    snapshot.selection?.eligible_count ??
    snapshot.eligible_items?.length ??
    0;
  const policy = snapshot.policy_sha256 ?? snapshot.policy?.policy_sha256 ?? '';
  const published = upcomingIds ? `${upcomingIds.length} published` : 'no published set on the manifest';
  console.log(
    `Upcoming: selection.mode=${mode} ` +
      `(${eligible} eligible, ${published}, policy ${policy ? policy.slice(0, 12) : '?'}).`,
  );

  const known = new Set((snapshot.eligible_items ?? []).map((item) => item.id));
  const missing = (upcomingIds ?? []).filter((id) => !known.has(id));
  if (missing.length) {
    console.warn(
      `WARNING: ${editionDate}: the manifest publishes upcoming ids [${missing.join(', ')}] ` +
        'that are not in the snapshot. Falling back to the full eligible slate for those.',
    );
  }
}

const calendarFor = (lang) =>
  noUpcoming
    ? []
    : upcomingItems(snapshot, lang, upcomingIds)
        .map((item) => toEntryFromSnapshot(item, lang, snapshot, editionDate))
        .filter(Boolean);

if (noUpcoming) console.log('--no-upcoming: the calendar stays off the carousel this run.');

let wrote = 0;
const decks = {};

// Which stories had their claim dropped as a restatement, decided once and
// carried across languages. The Spanish edition is built in parallel from the
// English draft, section for section, so a per-language decision would let the
// same edition come out as two differently shaped decks — and a test run on a
// translation is a test run on different words. English decides; Spanish
// follows.
let deckShape = null;

for (const lang of LANGS) {
  const md = artifact(`daybook_final_${lang}_md`);
  if (!md?.data) {
    console.error(`Artifact 'daybook_final_${lang}_md' missing; skipping ${lang}.`);
    continue;
  }

  const dir = join(webRoot, 'src', 'content', 'daybook', lang);
  mkdirSync(dir, { recursive: true });

  const path = join(dir, `${editionDate}.md`);

  // The edition as it went out, saved beside the markdown.
  //
  // The email HTML is the archive's record of what subscribers actually
  // received, and it is the only place the Upcoming calendar exists — the
  // markdown artifact ships that section empty. It comes back by reference
  // rather than inline, so it has to be fetched from the artifacts endpoint.
  //
  // Fetched before the edition is prepared rather than after, because the email
  // is also the only place a section headline the markdown dropped can be read
  // back from, and prepareEdition needs it to do that. It has to happen before
  // the deck is built either way, since the carousel reads the calendar.
  const html = await fetchEmailHtml(lang);
  const sanitized = html ? sanitizeEmailHtml(html) : '';

  // Read before writing: this is where a hand-set hed or dek is recovered from
  // the file that is about to be overwritten.
  const existing = readFrontmatter(path);
  const edition = applyOverrides(
    prepareEdition(md.data, lang, editionDate, emailHeadings(html), existing),
    existing,
    lang,
    editionDate,
  );

  // The card carries the hed, so it renders from the effective one — a card
  // still showing the automation's headline under a hed you rewrote is the
  // version everyone else sees when the edition is shared.
  const socialImage = renderEditionCard(lang, editionDate, edition.headline);

  // What the edition actually carried, read off the edition itself.
  //
  // Read here rather than up with the manifest because this is the first point
  // the email exists, and it has to happen before the deck is built. Taken from
  // the first language that yields a set and reused for the other: the snapshot
  // says the published set is language-neutral, and two languages disagreeing
  // about which deadlines the edition ran would be a worse bug than either of
  // the ones this guards against.
  if (upcomingFrom !== 'email' && html) {
    const fromEmail = publishedFromText(snapshot, lang, emailText(html));
    if (fromEmail) {
      if (manifestUpcomingIds && manifestUpcomingIds.join(',') !== fromEmail.join(',')) {
        console.warn(
          `WARNING: ${editionDate}: the manifest and the ${lang} email disagree about the ` +
            `calendar. Manifest [${manifestUpcomingIds.join(', ')}], email ` +
            `[${fromEmail.join(', ')}]. Going with the email — it is what subscribers got.`,
        );
      }
      upcomingIds = fromEmail;
      upcomingFrom = 'email';
      console.log(`Upcoming: ${fromEmail.length} published, read off the ${lang} email.`);
    } else if (!upcomingIds) {
      console.warn(
        `WARNING: ${editionDate}: no calendar recoverable from the ${lang} email and none on ` +
          'the manifest. Falling back to the whole eligible slate, which is wider than what ' +
          'shipped — check the board before posting it.',
      );
    }
  }

  const built = buildDeck(edition, editionDate, calendarFor(lang), deckShape, lang);
  decks[lang] = built.deck;
  deckShape = built.shape;

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
 *
 * The cache is keyed by edition date, and that is not decoration. It used to be
 * one file per language, which is correct as long as --offline only ever
 * re-templates the edition the cache was filled from. Refresh response.json
 * with --raw-only and then re-template, and the two halves come from different
 * editions: on 2026-08-11 the markdown was the 11th and the archived email was
 * the 7th, which is the whole sent-edition view on the page — and the only
 * place the Upcoming calendar renders at all. Keyed by date, a mismatch is a
 * cache miss and says so, instead of shipping the wrong edition quietly.
 */
async function fetchEmailHtml(lang) {
  const name = `daybook_final_${lang}_html`;
  const cachePath = join(outDir, `${name}-${editionDate}.html`);

  if (offline) {
    if (existsSync(cachePath)) return readFileSync(cachePath, 'utf8');
    console.warn(
      `WARNING: ${editionDate} ${lang}: no cached email HTML for this edition and --offline; ` +
        'the archived .html will be empty. Re-run without --offline to fetch it.',
    );
    return null;
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
 * The email as words, for matching against the snapshot.
 *
 * Entity references come out rather than being decoded: every one in this
 * corpus stands for punctuation — an em dash, a curly quote, an ampersand — and
 * the match folds punctuation away regardless. Decoding them would only risk
 * `&mdash;` arriving in the comparison as the letters "mdash".
 */
function emailText(html) {
  return html
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[#a-z0-9]+;/gi, ' ');
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
function prepareEdition(markdown, lang, date, headings = [], existing = {}) {
  let body = markdown.trim();

  let standing = '';
  const noteMatch = body.match(STANDING_NOTE);
  if (noteMatch && body.startsWith(noteMatch[0])) {
    standing = noteMatch[1].trim();
    body = body.slice(noteMatch[0].length).trim();
  } else {
    // Upstream stopped italicising the note on Aug. 19, and an un-split note is
    // boilerplate indexed as prose on every edition that carries it. An edition
    // opens on its lede's H2, so anything ahead of the first heading is the
    // note whatever its markup. Only a single paragraph is taken: the
    // frontmatter is one flat `key: "value"` line per key with no newline
    // escaping, and the note renders inline with no block wrapper around it.
    const firstHeading = body.search(/^## /m);
    const lead = firstHeading > 0 ? body.slice(0, firstHeading).trim() : '';
    if (lead && !/\n\s*\n/.test(lead)) {
      standing = lead;
      body = body.slice(firstHeading).trim();
    }
  }

  body = stripUnresolvedSections(body, lang, date);
  body = stripFlattenedCalendar(body, lang, date);
  body = repairCalendarBullets(body);
  body = dropOrphanBullets(body, lang, date);
  body = stripEmailFooter(body, lang, date);
  body = recoverLedeHeading(body, headings, existing, lang, date);

  // The lede story's headline is the first H2. It is the searchable thing about
  // an edition — nobody looks for "Immigration Daybook August 3", they look for
  // the story — so it becomes the title, and the date brands it in the route.
  const headline = body.match(/^## (.+)$/m)?.[1]?.trim() ?? '';

  return { body, standing, headline, description: deriveDek(body) };
}

/**
 * The section headlines the email ran, in order.
 *
 * One shape since the launch edition: an `<h2>` per section, with the standing
 * rubrics ("Upcoming", "Around the system") among them and nothing else in the
 * document using the tag. No filtering, then — the caller wants the first one
 * and does not care what follows it.
 */
function emailHeadings(html) {
  if (!html) return [];

  return [...html.matchAll(/<h2\b[^>]*>([\s\S]*?)<\/h2>/gi)]
    .map((match) =>
      match[1]
        .replace(/<[^>]+>/g, '')
        .replace(
          /&(amp|lt|gt|quot|apos|#39|nbsp);/g,
          (_, name) =>
            ({ amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", '#39': "'", nbsp: ' ' })[name],
        )
        .replace(/\s+/g, ' ')
        .trim(),
    )
    .filter(Boolean);
}

/**
 * Put the lede's headline back when the markdown artifact drops it.
 *
 * An edition opens on its lede's H2. Twice now — 2026-09-01 and 2026-09-02 —
 * both languages' markdown has opened straight into the lede's bolded nut with
 * no heading above it, and that is silent damage: the first H2 in the file is
 * then the *second* story, and it becomes the hed, the dek's first beat, the
 * social card and the carousel cover. The edition leads on the wrong news
 * everywhere except in the inbox, and nothing in the run says so.
 *
 * The email is the repair. Its `<h2>`s have been the same shape since the launch
 * edition and the English one has never lost the lede's, so when the body opens
 * with prose the email's first heading is the one the markdown dropped.
 *
 * Spanish is the case the email cannot fix: on both days the Spanish email was a
 * heading short too, because the edition is built in parallel from the English
 * draft and there is no Spanish source for a line nobody wrote. Writing one is
 * editorial work, not a string operation, so the fallback is a hand-set `title:`
 * with `titleOverride: true`, and that one line then does all of it — the
 * heading goes back into the body, and the dek, the card and the carousel cover
 * all derive off it. Failing that, this warns rather than guessing.
 *
 * The email is tried before the pinned hed, not after. A hed and a section
 * headline are different things on purpose — a hed can be rewritten to say what
 * the story is about while the body keeps the headline subscribers read — so the
 * pin only stands in where the archive has no headline of its own to restore.
 *
 * The standing note is already off the body by this point, and it is only taken
 * when it is a single paragraph, so anything still ahead of the first heading
 * here is a story.
 */
function recoverLedeHeading(body, headings, existing, lang, date) {
  if (body.search(/^## /m) <= 0) return body;

  const first = body.match(/^## (.+)$/m)?.[1]?.trim() ?? '';
  const fromEmail = headings[0] && headings[0] !== first ? headings[0] : '';
  const pinned = existing.titleOverride === 'true' ? (existing.title ?? '').trim() : '';
  const lede = fromEmail || pinned;

  if (!lede) {
    console.warn(
      `WARNING: ${date} ${lang}: the lede has no headline and the email has none to lift. ` +
        `The hed, dek, card and carousel will all lead on "${first}", which is the second ` +
        "story. Put the lede's headline in title: with titleOverride: true and re-run " +
        '--offline; everything else follows from it.',
    );
    return body;
  }

  console.warn(
    `WARNING: ${date} ${lang}: the markdown dropped the lede's headline. Restored ` +
      `"${lede}" from the ${fromEmail ? 'email' : 'hand-set title'}; everything derived ` +
      `would have led on "${first}".`,
  );
  return `## ${lede}\n\n${body}`;
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
    // Nothing derives these — they are set by hand on the editions a campaign
    // is pointing at, so the pull's only job is to not lose them.
    dossier: existing.dossier ?? '',
    instagramPost: existing.instagramPost ?? '',
    // Defaulted rather than only carried forward: a new edition's file does not
    // exist yet when this runs, so there is nothing to carry, and a credit that
    // only survives a re-pull is not a credit. An edition that names someone
    // else keeps them.
    translationEditor: lang === 'es' ? (existing.translationEditor ?? TRANSLATION_EDITOR) : '',
  };
}

function serializeEdition(
  {
    body,
    standing,
    headline,
    description,
    titleOverride,
    descriptionOverride,
    translationEditor,
    dossier,
    instagramPost,
  },
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
    translationEditor ? `translationEditor: "${escapeYaml(translationEditor)}"` : null,
    standing ? `standing: "${escapeYaml(standing)}"` : null,
    // Written only when the card actually rendered, so the page can fall back
    // to the wordmark plate rather than pointing at an image that is not there.
    // static/images is gitignored by design, so the frontmatter — which is
    // committed — is the record of which cards exist.
    socialImage ? `socialImage: "${socialImage}"` : null,
    dossier ? `dossier: "${escapeYaml(dossier)}"` : null,
    instagramPost ? `instagramPost: "${escapeYaml(instagramPost)}"` : null,
    // The calendar the email actually carried, so the page renders that set
    // rather than the whole eligible slate. Absent on editions pulled before
    // this was read, which keep the old fall-back behaviour.
    upcomingIds ? `upcomingIds: "${upcomingIds.join(',')}"` : null,
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
 * Run og.mjs, and let it be heard.
 *
 * The renders used to run with stdout and stderr both closed off, which threw
 * away the only thing og.mjs has to say: an exhibit that matches no beat on the
 * deck is dropped with a warning, and that warning reached nobody. Its stdout is
 * a "Wrote …" line per image — fourteen on a normal day, and noise — so only
 * stderr is relayed, which is where its warnings go.
 *
 * spawnSync rather than execFileSync because execFileSync only hands back stderr
 * on a failure, and the case worth fixing is the run that succeeds while quietly
 * leaving something off the deck.
 */
function runOg(args) {
  const run = spawnSync('node', [join(here, 'og.mjs'), ...args], { encoding: 'utf8' });

  for (const line of (run.stderr ?? '').split('\n')) {
    if (line.trim()) console.warn(line);
  }

  if (run.error) throw run.error;
  if (run.status !== 0) throw new Error(`og.mjs exited ${run.status}`);
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
    runOg(['--card', 'edition', '--lang', lang, '--edition', date, '--headline', headline]);
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
 * per story section carrying its headline, the bolded sentence underneath, the
 * sentence that follows it, and the publications credited at the end of that
 * paragraph — all of it the automation's own copy, so the slide says what the
 * section says.
 */
function buildDeck({ body, headline }, date, events, shape, lang) {
  const sections = body.split(/\n(?=## )/);

  // Story sections, in order, rubrics dropped.
  const raw = sections
    .map(readStory)
    .filter((story) => story.headline.length > RUBRIC_MAX_CHARS);

  // The hed on the cover is the deck's hed, which may be hand-set and is what a
  // reader actually sees; the beats are tested against their own headlines.
  const decided =
    shape?.length === raw.length
      ? shape
      : raw.map((story, i) => restatesHeadline(story.claim, i === 0 ? headline : story.headline));

  if (shape && shape.length !== raw.length) {
    console.warn(
      `WARNING: ${date} ${lang}: ${raw.length} story sections where the first language had ` +
        `${shape.length}. Deciding this deck's shape on its own copy — check the two decks match.`,
    );
  }

  const stories = raw.map((story, i) => shapeStory(story, decided[i], date, lang));

  // The lede rides on the cover under the hed and gets no slide of its own —
  // the hed was written off it, so that slide said the same thing twice. The
  // beats are what comes after.
  const { nut = '', detail = '', sources = [] } = stories[0] ?? {};
  const beats = stories.slice(1, 1 + CAROUSEL_BEATS);

  // The calendar is the payoff, so it goes on a whole slide rather than as a
  // footnote: every deadline the edition published, up to UPCOMING_PER_SLIDE of
  // them, on one board.
  //
  // Cut on a clause rather than a sentence. A watch item's first sentence is
  // typically 200 characters carrying the whole fee schedule, so a
  // sentence-only rule either printed all of it or none of it; the clause is
  // where the number lands.
  const trimmed = events.map((entry) => ({
    ...entry,
    text: trimToClause(entry.text, UPCOMING_MAX_CHARS),
  }));

  const upcoming = [];
  for (let i = 0; i < trimmed.length && upcoming.length < UPCOMING_SLIDES; i += UPCOMING_PER_SLIDE) {
    const entries = trimmed.slice(i, i + UPCOMING_PER_SLIDE);
    // A half-empty board reads as a mistake rather than as a short week.
    if (entries.length >= UPCOMING_MIN_PER_SLIDE) upcoming.push({ entries });
  }

  return {
    deck: {
      date,
      hed: headline,
      nut,
      detail,
      sources,
      beats,
      briefs: readBriefs(sections),
      upcoming,
    },
    shape: decided,
  };
}

/**
 * The round-up slide: the edition's closing list of briefs.
 *
 * Found from the end rather than by name. The rubric is different in every
 * Spanish edition — "Alrededor del sistema", "En el resto del sistema", "En todo
 * el sistema" — so a list of headings to match would be wrong within the week.
 * What is stable is the shape: a short rubric where a story has a headline, and
 * bullets where a story has paragraphs. `## Upcoming` is the only other section
 * of that shape, and it runs above this one when it survives at all, so the last
 * match is the round-up.
 *
 * The slide takes the rubric the edition wrote. A word for what these items are
 * is an editorial call and it has already been made three lines up the file.
 */
function readBriefs(sections) {
  const section = [...sections]
    .reverse()
    .find(
      (block) =>
        (block.match(/^## (.+)$/m)?.[1]?.trim().length ?? Infinity) <= RUBRIC_MAX_CHARS &&
        /^-\s+\S/m.test(block),
    );
  if (!section) return null;

  const items = section
    .split('\n')
    .filter((line) => /^-\s+\S/.test(line))
    .slice(0, BRIEFS)
    .map((line) => {
      const { prose, sources } = splitCredits(line.replace(/^-\s+/, '').trim());
      const [first = ''] = splitSentences(stripInlineMd(prose));
      return {
        text: trimToClause(first, BRIEF_MAX_CHARS),
        sources: sources.slice(0, BRIEF_SOURCES),
      };
    })
    .filter((item) => item.text);

  // Short of a card it is not a round-up, it is a leftover.
  if (items.length < BRIEFS_MIN) return null;

  return { rubric: stripInlineMd(section.match(/^## (.+)$/m)?.[1] ?? ''), items };
}

/**
 * One story section, read but not yet cut.
 *
 * Everything comes off the section's lead paragraph, which is where the
 * automation puts the compressed version of the story: a bolded claim, the
 * prose that supports it, and the links it was built from.
 */
function readStory(section) {
  const headline = stripInlineMd(section.match(/^## (.+)$/m)?.[1] ?? '');
  const { prose, sources } = splitCredits(leadParagraph(section));

  return {
    headline,
    claim: stripInlineMd(prose.match(/\*\*(?!\s)([^*]+?)\*\*/)?.[1] ?? ''),
    rest: stripInlineMd(prose.replace(/^[\s\S]*?\*\*(?!\s)[^*]+?\*\*/, '')),
    sources: sources.slice(0, CAROUSEL_SOURCES),
  };
}

/**
 * Cut a story into the slide's two tiers: the claim, and what supports it.
 *
 * Normally those are the bolded lead and the prose under it, straight off the
 * edition. When `promote` is set the claim only said the headline again, so it
 * comes off and everything moves up — the first sentence under it becomes the
 * claim, and the rest becomes the support. See RESTATEMENT_MAX_CHARS.
 */
function shapeStory({ headline, claim, rest, sources }, promote, date, lang) {
  if (!promote) {
    return {
      headline,
      nut: trimToClause(claim, NUT_MAX_CHARS),
      detail: trimToClause(rest, DETAIL_MAX_CHARS),
      sources,
    };
  }

  const [first = '', ...others] = splitSentences(rest);
  console.log(`${date} ${lang}: "${headline}" — dropped a claim the headline already made.`);

  return {
    headline,
    nut: trimToClause(first, PROMOTED_NUT_MAX),
    detail: trimToClause(others.join(' '), DETAIL_MAX_CHARS),
    sources,
  };
}

/**
 * Is this claim just the headline again?
 *
 * Content words on both sides, accents folded and a crude suffix stripped so
 * "signs" and "signed" match "sign". A short claim mostly built from the
 * headline's own words is a restatement; a long one is carrying specifics
 * whatever it shares. See RESTATEMENT_MAX_CHARS for why both tests.
 */
function restatesHeadline(claim, headline) {
  if (!claim || claim.length > RESTATEMENT_MAX_CHARS) return false;

  const words = contentWords(claim);
  if (!words.length) return false;

  const inHeadline = new Set(contentWords(headline));
  const shared = words.filter((word) => inHeadline.has(word)).length;
  return shared / words.length >= RESTATEMENT_OVERLAP;
}

function contentWords(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length > 2 && !STOPWORDS.has(word))
    .map((word) => word.replace(/(ing|ed|es|s)$/, ''));
}

/**
 * Split prose into sentences, without breaking on abbreviations.
 *
 * A period only ends a sentence when what follows is capitalised, and when the
 * token before it is not an abbreviation. Both halves earn their keep in this
 * corpus: "Aug. 6" is saved by the capital test (a digit follows), and the
 * Spanish "de EE. UU. donde" by the abbreviation one. Three-letter capitals are
 * deliberately NOT treated as abbreviations — a sentence ending in ICE, DHS or
 * ORR is far commoner here than one that does not.
 */
function splitSentences(text) {
  const boundary = /([.?!])\s+(?=[“"'(\[]?\p{Lu})/gu;
  const out = [];
  let start = 0;

  for (const match of text.matchAll(boundary)) {
    const token = text.slice(start, match.index).match(/([\p{L}.]+)$/u)?.[1] ?? '';
    const bare = token.toLowerCase().replace(/\.$/, '');
    if (ABBREVIATIONS.has(bare) || /^\p{Lu}{1,2}$/u.test(token)) continue;

    out.push(text.slice(start, match.index + 1).trim());
    start = match.index + match[0].length;
  }

  const tail = text.slice(start).trim();
  if (tail) out.push(tail);
  return out;
}


// The section's lead paragraph: the first one carrying a bolded claim. Sections
// open with it, but the Spanish editions sometimes carry a translator's note
// above it, and a rubric section opens with a list.
function leadParagraph(section) {
  return (
    section
      .replace(/^## .+$/m, '')
      .split('\n\n')
      .map((p) => p.trim())
      .find((p) => /\*\*(?!\s)[^*]+?\*\*/.test(p)) ?? ''
  );
}

/**
 * Split a paragraph into its prose and the publications credited at the end.
 *
 * Editions credit sources as a run of links after the final sentence —
 * `… reduce backlogs. [Axios](…), [USCIS](…)`. Only that trailing run counts:
 * links inside a sentence are part of the prose ("The [citizenship order](…)
 * requires guidance within 30 days"), and reading those as credits would put
 * half a sentence in the credit line.
 *
 * The run is allowed to close with a period, because roughly half of them do —
 * `[Newsweek](…), [Bloomberg Law](…).` — and an anchored match without it read
 * that whole edition as having no sources at all. The period belongs to the
 * citation list rather than to the prose, so it goes out with the credits.
 */
function splitCredits(paragraph) {
  const tail = paragraph.match(/((?:\[[^\]]+\]\([^)]*\)(?:\s*,\s*)?)+)\s*\.?\s*$/);
  if (!tail) return { prose: paragraph, sources: [] };

  const sources = [...tail[1].matchAll(/\[([^\]]+)\]\([^)]*\)/g)].map((m) => stripInlineMd(m[1]));
  return { prose: paragraph.slice(0, tail.index).trim(), sources };
}

/**
 * Trim prose to a budget without leaving it mid-thought.
 *
 * A whole sentence where one lands near the budget; a whole clause where none
 * does — which is the usual case, because the sentence under a claim is often a
 * single long one carrying a list. An ellipsis after "…births in US territories
 * or" strands half that list and reads as software that ran out of room; one
 * after the item before it reads as a card that stopped, which is the truth.
 * Word-break is the last resort, for prose with no clause marks at all.
 */
function trimToClause(text, max) {
  if (!text) return '';
  if (text.length <= max) return text;

  const cut = text.slice(0, max);

  const sentence = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('? '), cut.lastIndexOf('! '));
  if (sentence > max * 0.45) return cut.slice(0, sentence + 1);

  const clause = Math.max(cut.lastIndexOf(', '), cut.lastIndexOf('; '), cut.lastIndexOf(' — '));
  const at = clause > max * 0.5 ? clause : cut.lastIndexOf(' ');
  return `${cut.slice(0, at).replace(/[\s,;:—–-]+$/, '')}…`;
}

/**
 * Fold the day's hand-authored exhibits into every language's deck.
 *
 * Which document backs a story, where it is cropped and which line is marked is
 * an editorial call and is not derivable from the edition, so none of it is
 * derived: it is written by hand into
 * scripts/daybook/exhibits/<date>/exhibits.json beside the crops it names, and
 * this only carries it through. Most editions have no such file and get the deck
 * they always got.
 *
 * The whole array goes to both languages. An exhibit carries per-language copy
 * under `en` / `es` and og.mjs picks the one it is rendering, so a document that
 * is only worth showing in one language is a matter of writing copy for one —
 * not of splitting the spec.
 *
 * A malformed file throws rather than rendering the deck without it. A deck that
 * quietly drops the document is the failure mode this whole slide type exists to
 * avoid.
 */
function attachExhibits(decks, date) {
  const specFile = join(here, 'exhibits', date, 'exhibits.json');
  if (!existsSync(specFile)) return;

  const exhibits = JSON.parse(readFileSync(specFile, 'utf8'));
  if (!Array.isArray(exhibits) || !exhibits.length) return;

  for (const deck of Object.values(decks)) deck.exhibits = exhibits;
  console.log(
    `Exhibits: ${exhibits.length} on the deck, from scripts/daybook/exhibits/${date}/exhibits.json.`,
  );
}

/**
 * Drop a list marker that has lost its item.
 *
 * Seen first on 2026-08-25, in both languages: the round-up arrived with four
 * lines holding nothing but "-", each followed by a blank line and then the item
 * as its own paragraph. Markdown reads that as four empty list items, so the
 * page would have printed four empty bullets above four paragraphs.
 *
 * Safe to do unconditionally rather than by section, because a bare hyphen on a
 * line of its own is not something prose does — a real bullet carries its text
 * on the same line, and a horizontal rule needs three. The only markdown a lone
 * "-" can make is an empty list item, which is never what anybody meant.
 *
 * Counted and reported rather than done silently: this is the fourth distinct
 * shape the composer's round-trip has produced, and the count is how we notice
 * when it changes again.
 */
function dropOrphanBullets(body, lang, date) {
  const orphan = /^[ \t]*-[ \t]*$\n?/gm;
  const hits = body.match(orphan)?.length ?? 0;
  if (!hits) return body;
  console.warn(
    `WARNING: ${date} ${lang}: dropped ${hits} empty list marker${hits === 1 ? '' : 's'} — a "-" on a line with no item after it.`,
  );
  return body.replace(orphan, '');
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
  if (!langs.length) return;

  attachExhibits(decks, date);

  // Written before the --skip-cards gate: the deck is templating output, which
  // is what that flag keeps, and it is the file a layout change is tested
  // against. Skipping it too meant the only way to see a new slide was a full
  // render of the live edition directory.
  const deckFile = join(outDir, `deck-${date}.json`);
  writeFileSync(deckFile, JSON.stringify(decks, null, 2));
  if (skipCards) {
    console.log(`\nWrote scripts/daybook/out/deck-${date}.json (--skip-cards: nothing rendered).`);
    return;
  }

  try {
    runOg(['--card', 'carousel', '--lang', langs.join(','), '--deck', deckFile]);
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

// The calendar section when it arrives flattened.
//
// The third way `## Upcoming` came through wrong was filled but unusable: the
// email's calendar block reduced to text — an indented month abbreviation, an
// indented day, then the entry's prose and its source link, each on its own
// indented line. Markdown reads that as a run of paragraphs, so the page would
// print "AUG" and "24" as two lines of body copy.
//
// Matched on shape rather than on the rubric's name, for the reason readBriefs
// gives: the Spanish rubric is not stable across editions. An indented line of
// capitals over an indented bare number is nothing prose does.
//
// The calendar *set as markdown* — one paragraph an entry, opening on a bolded
// date — is a different matter and stays where it lands. Since 2026-08-26 the
// page reads its calendar out of the edition body rather than rebuilding one
// from the upcoming snapshot; see liftCalendar in src/lib/daybook/calendar.ts.
// This shape has never been readable, so there is nothing in it to keep.
function stripFlattenedCalendar(body, lang, date) {
  const kept = body.split(/\n(?=## )/).filter((section) => {
    if (!FLATTENED_CALENDAR.test(section)) return true;

    const heading = section.match(/^## (.+)$/m)?.[1]?.trim() ?? '(untitled)';
    console.warn(
      `WARNING: ${date} ${lang}: dropped section "${heading}" from the markdown — ` +
        'it arrived as the email calendar flattened to text. The page falls back to ' +
        'the upcoming snapshot; RSS and the .md companion get no calendar at all.',
    );
    return false;
  });

  return kept.join('\n');
}


// The email's sign-off, which the markdown began carrying on 2026-08-26: the
// project line, the row of sibling-project links, the copyright. It is the
// email's chrome, and on the page it would print inside the article, above the
// site's own footer saying much the same thing.
//
// Recognised by where its links go rather than by its words, which are different
// in each language and have been rewritten before: a trailing paragraph that
// links only to our own sites, to PromptQL or to the licence is furniture. The
// walk stops at the first paragraph that is anything else, so it cannot eat into
// the round-up — those are list items, and every one of them cites somebody.
function stripEmailFooter(body, lang, date) {
  // Split keeping the separators, so what is left is byte-for-byte what came in.
  const parts = body.trimEnd().split(/(\n[ \t]*\n)/);
  let end = parts.length;
  let dropped = 0;

  while (end > 0 && isFooterBlock(parts[end - 1])) {
    end -= 2;
    dropped += 1;
  }

  if (!dropped) return body;

  console.warn(
    `WARNING: ${date} ${lang}: dropped ${dropped} paragraph${dropped === 1 ? '' : 's'} of ` +
      "email sign-off from the markdown — the page and the .md companion have their own.",
  );

  return `${parts.slice(0, Math.max(end, 0)).join('').trimEnd()}\n`;
}

function isFooterBlock(block) {
  const text = block.trim();
  // A heading, a quote, a list item or a bolded lead is the edition talking.
  if (!text || /^(#|>|[-*+]\s|\d+\.\s|\*\*)/.test(text)) return false;

  const links = [...text.matchAll(/\]\((https?:\/\/[^)\s]+)\)/g)].map(([, href]) => href);
  if (!links.length) return false;

  return links.every((href) => {
    try {
      return FOOTER_HOSTS.test(new URL(href).hostname);
    } catch {
      return false;
    }
  });
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
