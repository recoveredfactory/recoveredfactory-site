import { marked } from 'marked';
import { dev } from '$app/environment';
import { env } from '$env/dynamic/public';

import { extractEvents, type CalendarEvent } from '$lib/daybook/schema';
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
  kitBroadcastId?: number;
  docUrl?: string;
  sourceStatus?: string;
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
   * archived before the email HTML was captured. This is the only place the
   * Upcoming calendar exists: the markdown artifact ships that section empty.
   */
  emailHtml: string | null;
  events: CalendarEvent[];
};

export type EditionMonth = {
  /** `YYYY-MM`. */
  month: string;
  editions: EditionSummary[];
};

type RawEdition = { meta: EditionMeta; body: string };

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

const toSummary = (entry: RawEdition): EditionSummary => ({
  ...entry.meta,
  pilot: isPilot(entry.meta.date),
});

/** Every visible edition for a language, newest first. */
export function listEditions(lang: Lang): EditionSummary[] {
  return [...editionsByLang[lang].values()]
    .filter((entry) => isVisible(entry.meta.date))
    .sort((a, b) => b.meta.date.localeCompare(a.meta.date))
    .map(toSummary);
}

/** One edition, rendered. Undefined for a date that is missing or not yet visible. */
export function getEdition(lang: Lang, date: string): Edition | undefined {
  const entry = editionsByLang[lang].get(date);
  if (!entry || !isVisible(date)) return undefined;

  // An edition page puts the edition's own headline in the h1, so its sections
  // are h2s.
  return { ...toSummary(entry), ...rendered(entry, lang, 2, true) };
}

/** Visible editions grouped by `YYYY-MM`, newest month first. */
export function listMonths(lang: Lang): EditionMonth[] {
  const byMonth = new Map<string, EditionSummary[]>();

  for (const edition of listEditions(lang)) {
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
export function getMonth(lang: Lang, month: string): Edition[] {
  if (!/^\d{4}-\d{2}$/.test(month)) return [];

  // A month page reads h1 (the month) → h2 (each edition's headline) → h3 (that
  // edition's sections), so everything shifts down one from the edition view.
  return listEditions(lang)
    .filter((edition) => edition.date.startsWith(month))
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((edition) => ({
      ...edition,
      ...rendered(editionsByLang[lang].get(edition.date)!, lang, 3),
    }));
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
  const heading = html.match(/<h[1-6] class="rf-daybook__section">([\s\S]*?)<\/h[1-6]>\n?/);
  if (!heading) return html;

  const text = heading[1].replace(/<[^>]+>/g, '').trim();
  return text === title.trim() ? html.replace(heading[0], '') : html;
};

const rendered = (entry: RawEdition, lang: Lang, baseLevel: 2 | 3, withEmail = false) => {
  const title = entry.meta.title ?? '';
  const { intro, sections } = split(entry.body, baseLevel);

  return {
    html: dropLedeHeading(render(entry.body, baseLevel), title),
    intro,
    sections: sections.map((section, i) =>
      i === 0 ? { ...section, html: dropLedeHeading(section.html, title) } : section,
    ),
    // The standing note is written in markdown like the rest of the edition and
    // routinely carries a link — "we updated [287(g) Watch](…)". It lives in the
    // frontmatter rather than the body, so it misses the body's render and was
    // reaching the page as its own source text, brackets and URL and all.
    standingHtml: entry.meta.standing ? renderInline(entry.meta.standing) : '',
    emailHtml: withEmail ? (emailsByDate[lang].get(entry.meta.date) ?? null) : null,
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
function split(body: string, baseLevel: 2 | 3): { intro: string; sections: EditionSection[] } {
  const blocks = body.split(/\n(?=## )/);
  const lead = blocks[0]?.startsWith('## ') ? '' : (blocks.shift() ?? '');

  return {
    intro: lead.trim() ? render(lead, baseLevel) : '',
    sections: blocks.map((block) => ({
      heading: block.match(/^## (.+)$/m)?.[1]?.trim() ?? '',
      html: render(block, baseLevel),
    })),
  };
}

/** The raw markdown, for the `.md` companion routes. Undefined if not visible. */
export function getEditionMarkdown(lang: Lang, date: string): string | undefined {
  const entry = editionsByLang[lang].get(date);
  if (!entry || !isVisible(date)) return undefined;
  return entry.body.trim();
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
    return `<h${level} class="rf-daybook__section">${text}</h${level}>\n`;
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
