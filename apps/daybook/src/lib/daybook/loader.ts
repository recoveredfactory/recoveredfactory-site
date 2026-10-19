import { marked } from 'marked';
import { dev } from '$app/environment';
import { env as privateEnv } from '$env/dynamic/private';
import { env } from '$env/dynamic/public';

import { copy } from '$lib/copy';
import { inDateOrder, liftCalendar, readEmailCalendar } from '$lib/daybook/calendar';
import type { DossierSlide } from '$lib/daybook/dossier';
import { createRemote, type DeckSlide, type EditionRecord, type IndexEntry, type Remote } from '$lib/daybook/remote';
import { extractEvents, type CalendarEvent } from '$lib/daybook/schema';
import type { UpcomingEntry } from '$lib/daybook/upcoming';
import type { Lang } from '$lib/i18n';

// The Daybook publishes every weekday in two languages, so this archive grows by
// roughly 500 files a year. That is why editions are globbed with `?raw` and
// rendered here with `marked` instead of going through mdsvex like the essays in
// src/lib/blog/loader.ts: mdsvex compiles every matched file into the bundle at
// build time, which is the wrong trade for a corpus this size and this static.
// Editions are plain markdown and never contain components.

// Editions dated before the public launch are the pre-launch pilot runs. They
// stay on disk and stay readable in dev and on staging — you can see the archive
// working before there is an archive — but they never reach production, the
// sitemap, or the feed. This mirrors the draft handling in the blog loader
// rather than inventing a second visibility rule.
const ARCHIVE_START = '2026-08-05';
const SHOW_PILOT = dev || env.PUBLIC_STAGE !== 'prod';

export type EditionMeta = {
  date: string;
  lang: Lang;
  title: string;
  description: string;
  standing?: string;
  /**
   * This edition's own social card, written by the pull only when the card
   * actually rendered. static/images is gitignored by design, so the
   * frontmatter is the committed record of which cards exist — the page falls
   * back to the wordmark plate when this is absent.
   */
  socialImage?: string;
  /**
   * Slug of a dossier deck to show above this edition — a directory under
   * scripts/daybook/dossiers/. Set by hand on the editions a campaign is
   * pointing at; carried forward by the pull like the override flags, since
   * nothing derives it.
   */
  dossier?: string;
  /**
   * Shortcode of the Instagram post that deck went out as — the `Db_3uMaoDj4`
   * in an instagram.com/p/ URL. The card links out to it; it is never embedded.
   */
  instagramPost?: string;
  /**
   * The calendar entries the sent email carried, as watch-item ids joined by
   * commas — the frontmatter is a flat key/value format, so a list is a string.
   * Written by the pull off the edition manifest; see `getUpcoming`.
   */
  upcomingIds?: string;
  /**
   * `"true"` on an edition that deliberately ran no calendar.
   *
   * An empty calendar and an unreadable one look identical from here, and the
   * page treats the second as a reason to rebuild one from the snapshot. On an
   * edition that skipped Upcoming on purpose — 2026-09-04 was the first, whose
   * email told readers the section was "in the shop for a tuneup" — that
   * reconstruction prints a slate of deadlines the edition never ran, directly
   * contradicting what it said. So the skip is recorded rather than inferred:
   * inferring it would also suppress the calendar on the editions that meant to
   * run one and lost it upstream, which is exactly the case the snapshot
   * fallback exists for.
   *
   * A string, not a boolean, because the frontmatter is a flat key/value format
   * with no types — the pull writes a bare `true` and it is read back as one.
   * Set by hand and carried forward by the pull, the way `dossier` is.
   */
  upcomingSkipped?: string;
  kitBroadcastId?: number;
  docUrl?: string;
  sourceStatus?: string;
  /**
   * Who edited this edition's translation. Written on every Spanish edition by
   * the pull and carried forward from the file, the way `dossier` is — a credit
   * is a fact about the edition, so it lives in the edition rather than as a
   * constant in the component that draws it. English editions are not
   * translations and do not carry one.
   */
  translationEditor?: string;
};

export type EditionSummary = EditionMeta & {
  /** True for pre-launch pilot editions — never visible in production. */
  pilot: boolean;
};

export type EditionSection = {
  /** The section's own headline, as written. */
  heading: string;
  /** That section rendered, heading included. */
  html: string;
};

export type Edition = EditionSummary & {
  /** The edition rendered from markdown — semantic, site-styled. */
  html: string;
  /** The standing note with its markdown rendered. Empty when there is none. */
  standingHtml: string;
  /**
   * Anything before the first section — the Spanish editions' translator's
   * note, mostly. Empty string when the body opens straight into a headline.
   */
  intro: string;
  /**
   * The same markdown, split at its section headings.
   *
   * The page needs somewhere to put things *between* an edition's sections —
   * the Upcoming calendar, which lives outside the markdown entirely, and a
   * subscribe ask that reads better after the lede than stacked above it.
   * Neither is possible against one blob of rendered HTML, so the blob is also
   * offered in pieces. `html` stays for the month roundups, which want it whole.
   */
  sections: EditionSection[];
  /**
   * The edition as it was sent, sanitised at pull time. Null for editions
   * archived before the email HTML was captured.
   */
  emailHtml: string | null;
  /**
   * The Upcoming calendar as the edition ran it — out of the body when the
   * markdown carries one, otherwise out of the sent email. Either way it is
   * drawn as a card between the stories, not as prose in the middle of them.
   * Empty only when the edition itself carried no calendar, where the page falls
   * back to the pipeline's snapshot; see `getUpcoming`.
   */
  upcoming: UpcomingEntry[];
  events: CalendarEvent[];
};

export type EditionMonth = {
  /** `YYYY-MM`. */
  month: string;
  editions: EditionSummary[];
};

type RawEdition = {
  meta: EditionMeta;
  body: string;
  /**
   * Set on an edition published to S3 (see ./remote). Its calendar is the
   * record's own `upcoming`, and it has no sent email, hand calendar or
   * snapshot to fall back on — the record is the whole edition.
   */
  remote?: { upcoming: UpcomingEntry[] };
};

const rawByLang = {
  en: import.meta.glob<string>('/src/content/daybook/en/*.md', {
    eager: true,
    query: '?raw',
    import: 'default',
  }),
  es: import.meta.glob<string>('/src/content/daybook/es/*.md', {
    eager: true,
    query: '?raw',
    import: 'default',
  }),
} satisfies Record<Lang, Record<string, string>>;

// The sent email, keyed by date. Pulled alongside the markdown and stored as a
// sibling file rather than inlined, so the archived artifact stays diffable and
// the markdown file stays readable.
const emailByLang = {
  en: import.meta.glob<string>('/src/content/daybook/en/*.html', {
    eager: true,
    query: '?raw',
    import: 'default',
  }),
  es: import.meta.glob<string>('/src/content/daybook/es/*.html', {
    eager: true,
    query: '?raw',
    import: 'default',
  }),
} satisfies Record<Lang, Record<string, string>>;

// A calendar written by hand, for a language whose email shipped without one.
//
// The Spanish edition has run `Próximamente` as a bare heading over the footer
// on Aug. 21, Aug. 26, Aug. 27 and Sept. 8. On those days the page had nothing
// of the edition's own to read and fell through to the pipeline's snapshot,
// which holds the eligible slate rather than the selection: on Sept. 8 that was
// three October items the edition never ran, and none of the three September
// form deadlines its lede was about. So the calendar the other language sent can
// be translated and committed beside the edition, and it is read here ahead of
// everything else — the edition's markdown, its email, the snapshot.
//
// Ahead of all three because the file is only ever written on purpose. On
// Sept. 28 the Spanish email ran a calendar, but a different one from the
// English — Sept. 30 where the English ran Oct. 5 and Oct. 13 — and English is
// the standard, so the file is also how a wrong calendar gets corrected.
const handByLang = {
  en: import.meta.glob<{ entries?: UpcomingEntry[] }>(
    '/src/content/daybook/en/*.upcoming.json',
    { eager: true, import: 'default' },
  ),
  es: import.meta.glob<{ entries?: UpcomingEntry[] }>(
    '/src/content/daybook/es/*.upcoming.json',
    { eager: true, import: 'default' },
  ),
} satisfies Record<Lang, Record<string, unknown>>;

const handCalendars = {
  en: handByDate(handByLang.en),
  es: handByDate(handByLang.es),
};

function handByDate<T>(files: Record<string, T>): Map<string, T> {
  const map = new Map<string, T>();
  for (const [path, value] of Object.entries(files)) {
    const date = path.split('/').pop()?.replace(/\.upcoming\.json$/, '') ?? '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) map.set(date, value);
  }
  return map;
}

const editionsByLang = {
  en: parseAll(rawByLang.en, 'en'),
  es: parseAll(rawByLang.es, 'es'),
} satisfies Record<Lang, Map<string, RawEdition>>;

const emailsByDate = {
  en: byDate(emailByLang.en),
  es: byDate(emailByLang.es),
} satisfies Record<Lang, Map<string, string>>;

function byDate(modules: Record<string, string>): Map<string, string> {
  const map = new Map<string, string>();
  for (const [path, source] of Object.entries(modules)) {
    const date = path.split('/').pop()?.replace(/\.html$/, '') ?? '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) map.set(date, source.trim());
  }
  return map;
}

function parseAll(modules: Record<string, string>, lang: Lang): Map<string, RawEdition> {
  const byDate = new Map<string, RawEdition>();

  for (const [path, source] of Object.entries(modules)) {
    const date = path.split('/').pop()?.replace(/\.md$/, '') ?? '';
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) continue;

    const parsed = splitFrontmatter(source);
    if (!parsed) continue;

    byDate.set(date, {
      meta: { ...parsed.meta, date, lang } as EditionMeta,
      body: parsed.body,
    });
  }

  return byDate;
}

// The frontmatter is written by scripts/daybook/pull.mjs and only ever contains
// flat `key: "value"` and `key: 123` pairs, so it is read directly rather than
// pulling in a YAML parser for a format we control on both ends.
function splitFrontmatter(source: string): { meta: Record<string, unknown>; body: string } | null {
  const match = source.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return null;

  const meta: Record<string, unknown> = {};
  for (const line of match[1].split('\n')) {
    const at = line.indexOf(':');
    if (at < 1) continue;
    const key = line.slice(0, at).trim();
    const value = line.slice(at + 1).trim();
    if (value.startsWith('"') && value.endsWith('"')) {
      meta[key] = value.slice(1, -1).replace(/\\"/g, '"').replace(/\\\\/g, '\\');
    } else if (/^-?\d+$/.test(value)) {
      meta[key] = Number(value);
    } else {
      meta[key] = value;
    }
  }

  return { meta, body: match[2] };
}

const isPilot = (date: string) => date < ARCHIVE_START;
const isVisible = (date: string) => SHOW_PILOT || !isPilot(date);

// Remote editions are never pilots: the bucket only exists from the relaunch on.
const toSummary = (entry: RawEdition): EditionSummary => ({
  ...entry.meta,
  pilot: !entry.remote && isPilot(entry.meta.date),
});

// ---------------------------------------------------------------------------

// Editions published to S3 since the 2026-10-19 relaunch; see ./remote. Off when
// DAYBOOK_EDITIONS_URL is unset, which leaves the site exactly the archive on
// disk. Built on first use rather than at import, so the environment is read
// when a request needs it.
let remoteSource: Remote | undefined;
const remote = () =>
  (remoteSource ??= createRemote({ baseUrl: privateEnv.DAYBOOK_EDITIONS_URL ?? '' }));

// A date both committed here and published remotely is served from the file.
// Committing an edition is deliberate — it is the hand override for one that
// was published wrong — so the file wins. Said once per edition per instance,
// not on every request.
const collisions = new Set<string>();

function remoteSummaries(lang: Lang, entries: IndexEntry[]): EditionSummary[] {
  const summaries: EditionSummary[] = [];
  const seen = new Set<string>();

  for (const entry of entries) {
    if (entry.lang !== lang || seen.has(entry.date)) continue;
    seen.add(entry.date);

    if (editionsByLang[lang].has(entry.date)) {
      const key = `${lang}/${entry.date}`;
      if (!collisions.has(key)) {
        collisions.add(key);
        console.warn(
          `daybook remote: ${key} is published and committed; serving the committed file`,
        );
      }
      continue;
    }

    summaries.push({
      date: entry.date,
      lang,
      title: entry.title,
      description: entry.description,
      pilot: false,
    });
  }

  return summaries;
}

/** The remote edition for a date, if the index lists one and its record reads. */
async function remoteRaw(lang: Lang, date: string): Promise<RawEdition | undefined> {
  if (editionsByLang[lang].has(date)) return undefined;
  const index = await remote().index();
  const listed = index.some((entry) => entry.lang === lang && entry.date === date);
  if (!listed) return undefined;
  const record = await remote().record(date, lang);
  return record ? fromRecord(record) : undefined;
}

const isText = (value: unknown): value is string => typeof value === 'string' && value.trim() !== '';

/**
 * A daybook/1 record as the same raw edition a markdown file becomes.
 *
 * The record has no frontmatter, so the meta comes from its fields. Its body is
 * the edition's markdown in the archive's own shape — an optional italic lead,
 * `##` sections, Around the system — and goes through the same render. The
 * calendar is not in the body: it is `upcoming`, structured, in the order the
 * desk chose it.
 */
function fromRecord(record: EditionRecord): RawEdition {
  const upcoming = recordUpcoming(record.upcoming);
  const headings = [...record.body_md.matchAll(/^## (.+)$/gm)].map((found) => found[1].trim());

  return {
    meta: {
      date: record.date,
      lang: record.lang,
      title: record.title.trim(),
      // The pull's own fallback: the section heads, joined the way the archive's
      // descriptions are.
      description: isText(record.description) ? record.description.trim() : headings.join(' · '),
      ...(isText(record.standing) ? { standing: record.standing.trim() } : {}),
      // The record is the edition, calendar included. One that carried no
      // calendar ran none, so the page draws none instead of reaching for the
      // snapshot reconstruction the archive falls back on.
      ...(upcoming.length ? {} : { upcomingSkipped: 'true' }),
    },
    body: record.body_md,
    remote: { upcoming },
  };
}

/**
 * The record's calendar as the entries the card draws. An entry with no usable
 * date or no text is dropped rather than printed as an empty row, the same rule
 * the snapshot reader keeps.
 */
function recordUpcoming(items: unknown): UpcomingEntry[] {
  const entries: UpcomingEntry[] = [];

  for (const item of Array.isArray(items) ? items : []) {
    const row = (item ?? {}) as { date?: unknown; text?: unknown; sources?: unknown };
    const date = typeof row.date === 'string' ? row.date.slice(0, 10) : '';
    const summary = typeof row.text === 'string' ? row.text.trim() : '';
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !summary) continue;

    const sources = (Array.isArray(row.sources) ? row.sources : [])
      .map((source) => (source ?? {}) as { label?: unknown; url?: unknown })
      .filter((source): source is { label?: unknown; url: string } =>
        typeof source.url === 'string' && /^https?:\/\//.test(source.url),
      )
      .map((source) => ({
        label: isText(source.label) ? source.label.trim() : source.url,
        url: source.url,
      }));

    entries.push({ date, summary, sources, repeatsDate: entries.at(-1)?.date === date });
  }

  return entries;
}

/** A record rendered as an edition page, the way getEdition renders one. */
export function editionFromRecord(record: EditionRecord): Edition {
  const entry = fromRecord(record);
  const page = rendered(entry, record.lang, 2, { withEmail: true, ledeLevel: 1 });
  return { ...toSummary(entry), ...page };
}

// ---------------------------------------------------------------------------

/** Every visible edition for a language, newest first — the archive on disk and the bucket. */
export async function listEditions(lang: Lang): Promise<EditionSummary[]> {
  const local = [...editionsByLang[lang].values()]
    .filter((entry) => isVisible(entry.meta.date))
    .map(toSummary);
  const published = remoteSummaries(lang, await remote().index());

  return [...local, ...published].sort((a, b) => b.date.localeCompare(a.date));
}

/** Whether a language has a visible edition for a date, without rendering it. */
export async function hasEdition(lang: Lang, date: string): Promise<boolean> {
  if (editionsByLang[lang].has(date)) return isVisible(date);
  return (await remote().index()).some((entry) => entry.lang === lang && entry.date === date);
}

/** One edition, rendered. Undefined for a date that is missing or not yet visible. */
export async function getEdition(lang: Lang, date: string): Promise<Edition | undefined> {
  const local = editionsByLang[lang].get(date);
  if (local && !isVisible(date)) return undefined;
  const entry = local ?? (await remoteRaw(lang, date));
  if (!entry) return undefined;

  // An edition page draws no headline above the stories, so the lede's own
  // heading is the h1 and the sections under it are h2s.
  return { ...toSummary(entry), ...rendered(entry, lang, 2, { withEmail: true, ledeLevel: 1 }) };
}

/** Visible editions grouped by `YYYY-MM`, newest month first. */
export async function listMonths(lang: Lang): Promise<EditionMonth[]> {
  const byMonth = new Map<string, EditionSummary[]>();

  for (const edition of await listEditions(lang)) {
    const month = edition.date.slice(0, 7);
    const bucket = byMonth.get(month);
    if (bucket) bucket.push(edition);
    else byMonth.set(month, [edition]);
  }

  return [...byMonth.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([month, editions]) => ({ month, editions }));
}

/** Every edition in a month, rendered, oldest first — the month page reads forward. */
export async function getMonth(lang: Lang, month: string): Promise<Edition[]> {
  if (!/^\d{4}-\d{2}$/.test(month)) return [];

  const editions = (await listEditions(lang))
    .filter((edition) => edition.date.startsWith(month))
    .sort((a, b) => a.date.localeCompare(b.date));

  // A month page reads h1 (the month) → h2 (each edition's headline) → h3 (that
  // edition's sections), so everything shifts down one from the edition view.
  // A published edition whose record will not read is left off the month
  // rather than taking the page down.
  const months = await Promise.all(
    editions.map(async (edition) => {
      const entry = editionsByLang[lang].get(edition.date) ?? (await remoteRaw(lang, edition.date));
      return entry ? { ...edition, ...rendered(entry, lang, 3) } : null;
    }),
  );
  return months.filter((edition): edition is Edition => edition !== null);
}

// `withEmail` is false for the month roundups: thirty editions stacked on one
// page, each carrying its own email masthead and 600px frame, would be absurd.
// Those read from markdown; only the edition page shows the sent artifact.
/**
 * Drop the lede story's own heading where the page already prints it.
 *
 * An edition's title is derived from its first section's headline — that is the
 * design, and `titleOverride` is how an editor says otherwise. So on a page that
 * draws the title as its headline, the lede's heading is the same words again,
 * one type size down, directly underneath. A newspaper does not do this: the
 * lede's headline *is* the page's headline, and its copy runs straight off it.
 *
 * Matched on text rather than position, because the Spanish editions open with a
 * translator's note before the first heading. An edition whose title was
 * overridden does not match and keeps both, which is right — there the two are
 * genuinely different lines.
 */
const dropLedeHeading = (html: string, title: string) => {
  const heading = html.match(/<h[1-6] class="db-section">([\s\S]*?)<\/h[1-6]>\n?/);
  if (!heading) return html;

  const text = heading[1].replace(/<[^>]+>/g, '').trim();
  return text === title.trim() ? html.replace(heading[0], '') : html;
};

/**
 * `ledeLevel` — the heading level the first story renders at.
 *
 * An edition page draws no headline of its own. A newsletter needs one because
 * a subject line has to name a whole issue in one string; a page does not, and
 * printing the lede's headline again at display size above the lede was the
 * email's shape showing through. What the page has instead is a masthead — the
 * publication in the crumb, the date under it — and then stories, which is how
 * a front page has always worked. The judgment about what leads shows up as
 * position rather than as a second headline.
 *
 * So on an edition the lede's own heading is the h1 and the rest are h2s, and
 * the title goes on doing its real job in `<title>`, og tags, the share text,
 * RSS and the archive listing, where a name for the whole thing is genuinely
 * needed. A month roundup passes nothing and keeps its own hierarchy.
 */
const rendered = (
  entry: RawEdition,
  lang: Lang,
  baseLevel: 2 | 3,
  { withEmail = false, ledeLevel }: { withEmail?: boolean; ledeLevel?: 1 | 2 } = {},
) => {
  const title = entry.meta.title ?? '';
  // The calendar comes out of the prose before anything renders: the page draws
  // it as a card, and a month page — which stacks whole editions — is the last
  // place that wants twenty near-identical lists of the same deadlines. It stays
  // in `entry.body`, so the .md companion still serves the edition entire.
  const calendar = liftCalendar(entry.body, lang, entry.meta.date);
  const { intro, sections } = split(calendar.body, baseLevel, ledeLevel);

  // The body is the better source when it has one — it is the edition's own
  // text — but it has carried a calendar exactly once. The sent artifact has
  // carried one nearly every day since the launch edition, so it is read here
  // whatever the page is going to do with the email itself. A published record
  // carries its calendar structured and has no email beside it.
  const email = entry.remote ? '' : (emailsByDate[lang].get(entry.meta.date) ?? '');
  const fromEmail = readEmailCalendar(email, lang, entry.meta.date);
  const byHand = entry.remote ? [] : (handCalendars[lang].get(entry.meta.date)?.entries ?? []);
  const upcoming = entry.remote
    ? entry.remote.upcoming
    : byHand.length
      ? inDateOrder(byHand)
      : calendar.entries.length
        ? calendar.entries
        : fromEmail;

  return {
    // The whole-body render is what the month roundups draw, and those print the
    // edition's title above it — so there the duplicate heading still goes.
    html: dropLedeHeading(render(calendar.body, baseLevel), title),
    intro,
    sections,
    // The standing note is written in markdown like the rest of the edition and
    // routinely carries a link — "we updated [287(g) Watch](…)". It lives in the
    // frontmatter rather than the body, so it misses the body's render and was
    // reaching the page as its own source text, brackets and URL and all.
    standingHtml: entry.meta.standing ? renderInline(entry.meta.standing) : '',
    emailHtml: withEmail && !entry.remote ? (emailsByDate[lang].get(entry.meta.date) ?? null) : null,
    upcoming,
    events: extractEvents(entry.body, lang, entry.meta.date),
  };
};

/**
 * Cut the body at its section headings and render each piece on its own.
 *
 * Rendering per block rather than slicing the finished HTML keeps this honest:
 * marked never sees a partial document, so a section cannot inherit or leak
 * state from the one above it.
 */
function split(
  body: string,
  baseLevel: 2 | 3,
  ledeLevel?: 1 | 2,
): { intro: string; sections: EditionSection[] } {
  const blocks = body.split(/\n(?=## )/);
  const lead = blocks[0]?.startsWith('## ') ? '' : (blocks.shift() ?? '');

  return {
    intro: lead.trim() ? render(lead, baseLevel) : '',
    sections: blocks.map((block, i) => ({
      heading: block.match(/^## (.+)$/m)?.[1]?.trim() ?? '',
      html: render(block, i === 0 ? (ledeLevel ?? baseLevel) : baseLevel),
    })),
  };
}

/** The raw markdown, for the `.md` companion routes. Undefined if not visible. */
export async function getEditionMarkdown(lang: Lang, date: string): Promise<string | undefined> {
  const local = editionsByLang[lang].get(date);
  if (local && !isVisible(date)) return undefined;
  const entry = local ?? (await remoteRaw(lang, date));
  return entry?.body.trim();
}

// Date formatting lives in ./format — importing this module drags every
// edition's markdown along with it, so anything the browser needs stays out of
// here. See the note at the top of that file.

// ---------------------------------------------------------------------------

// One renderer per heading depth. An edition's sections are written as `##` but
// the level they should render at depends on what is above them: on an edition
// page the h1 is the edition's own headline, so sections are h2; on a month page
// the h1 is the month and each edition's headline takes the h2, so sections drop
// to h3. Rendering at the right level matters because a document that jumps h1 →
// h3 is a genuine accessibility defect, not a cosmetic one.
function makeRenderer(baseLevel: number) {
  const renderer = new marked.Renderer();

  // Editions cite heavily, and those outbound links to named outlets are part of
  // what makes the archive worth trusting — so they stay followable. They open
  // in a new tab with noopener because a reader checking a source should not
  // lose the edition.
  renderer.link = ({ href, title, text }) => {
    const external = /^https?:\/\//.test(href ?? '');
    const attrs = [
      `href="${escapeAttr(href ?? '')}"`,
      title ? `title="${escapeAttr(title)}"` : '',
      external ? 'target="_blank" rel="noopener"' : '',
    ]
      .filter(Boolean)
      .join(' ');
    return `<a ${attrs}>${text}</a>`;
  };

  renderer.heading = ({ tokens, depth }) => {
    const text = marked.parseInline(tokens.map((t) => t.raw).join(''), { renderer }) as string;
    // `##` is the section level the automation writes, so it maps to baseLevel
    // and anything nested deeper steps down from there.
    const level = Math.min(baseLevel + Math.max(depth - 2, 0), 6);
    return `<h${level} class="db-section">${text}</h${level}>\n`;
  };

  return renderer;
}

const renderers = new Map<number, ReturnType<typeof makeRenderer>>();

function rendererFor(baseLevel: number) {
  const cached = renderers.get(baseLevel);
  if (cached) return cached;

  const renderer = makeRenderer(baseLevel);
  renderers.set(baseLevel, renderer);
  return renderer;
}

const render = (body: string, baseLevel: number) =>
  marked.parse(neutralizeHtml(body), {
    renderer: rendererFor(baseLevel),
    async: false,
    gfm: true,
  }) as string;

// One line of markdown with no block wrapper around it — the standing note,
// which the page sets as a note and puts in its own <p>. Same renderer as the
// body, so its links open out the same way and the same escaping applies.
const renderInline = (text: string) =>
  marked.parseInline(neutralizeHtml(text), {
    renderer: rendererFor(2),
    async: false,
    gfm: true,
  }) as string;

// Editions are generated prose and legitimately contain no HTML, so every `<`
// outside a code span is escaped before the markdown is parsed. That closes the
// path from a stray tag in a headline or a source title through to the rendered
// page, without relying on the generator to stay well behaved.
function neutralizeHtml(body: string): string {
  return body
    .split('\n')
    .map((line) =>
      line
        .split('`')
        .map((segment, i) => (i % 2 === 0 ? segment.replaceAll('<', '&lt;') : segment))
        .join('`'),
    )
    .join('\n');
}

function escapeAttr(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

// ---------------------------------------------------------------------------
// The social deck and the slate, both read from the bucket beside the editions.

export type EditionDeck = {
  /** The edition the deck was cut from. */
  date: string;
  slides: DossierSlide[];
  /** Shortcode of the Instagram post it went out as, once it has. */
  instagramPost?: string;
};

/**
 * A published edition's deck, as the card on the page shows it. Null for an
 * archived edition (its card, if any, is a dossier) and until the deck Action
 * has rendered one, a minute or two after the edition is published. The
 * Instagram link appears once the broadcast has posted it.
 */
export async function getDeck(lang: Lang, date: string): Promise<EditionDeck | null> {
  if (editionsByLang[lang].has(date)) return null;
  const deck = await remote().deck(date, lang);
  if (!deck) return null;
  const posted = await remote().posted(date, lang);
  const shortcode = posted?.instagram?.match(/instagram\.com\/(?:p|reel)\/([\w-]+)/)?.[1];
  return {
    date,
    // A deck rendered before slides carried their words (the first, 10/14) says
    // at least where in the deck a slide is.
    slides: deck.slides.map((slide, i, all) => ({
      src: slide.url,
      alt: slideAlt(slide, lang) || copy[lang].ui.dossier.slide(i + 1, all.length),
      caption: '',
    })),
    ...(shortcode ? { instagramPost: shortcode } : {}),
  };
}

/**
 * The words on a slide, for anyone who can't see it: every slide kind carries
 * the text it was drawn from, so the alt text is that text, in order.
 */
function slideAlt(slide: DeckSlide, lang: Lang): string {
  const text = slide.text;
  const words = (value: unknown) => (typeof value === 'string' ? value.trim() : '');
  const list = (value: unknown) => (Array.isArray(value) ? value.map(words).filter(Boolean) : []);
  const parts = [words(text.headline), words(text.line), ...list(text.items)];
  for (const entry of Array.isArray(text.entries) ? text.entries : []) {
    const row = (entry ?? {}) as Record<string, unknown>;
    parts.push([words(row.date), words(row.text)].filter(Boolean).join(': '));
  }
  const sources = list(text.sources);
  if (sources.length) parts.push(`${copy[lang].ui.dossier.sources}: ${sources.join(', ')}`);
  return parts
    .filter(Boolean)
    .map((part) => (/[.!?…:]$/.test(part) ? part : `${part}.`))
    .join(' ');
}

/** Today in Bogota, the day the desk and the slate count from. */
const today = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' }).format(new Date());

/**
 * The standing Upcoming slate, from today to the end of its window, in its
 * short calendar lines where it has them. The file is rewritten nightly, so an
 * item that has passed since is dropped here; one with no words in this
 * language is left out rather than printed in the other.
 */
export async function getSlateUpcoming(lang: Lang, on: string = today()): Promise<UpcomingEntry[]> {
  const slate = await remote().slate();
  if (!slate) return [];
  const entries: UpcomingEntry[] = [];
  for (const item of [...slate.items].sort((a, b) => a.date.localeCompare(b.date))) {
    const words = lang === 'en' ? item.en : item.es;
    if (!words || item.date < on || item.date > slate.to) continue;
    entries.push({
      date: item.date,
      summary: words.line ?? words.text,
      sources: item.sources,
      repeatsDate: entries.at(-1)?.date === item.date,
    });
  }
  return entries;
}
