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
  kitBroadcastId?: number;
  docUrl?: string;
  sourceStatus?: string;
};

export type EditionSummary = EditionMeta & {
  /** True for pre-launch pilot editions — never visible in production. */
  pilot: boolean;
};

export type Edition = EditionSummary & { html: string; events: CalendarEvent[] };

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

const editionsByLang = {
  en: parseAll(rawByLang.en, 'en'),
  es: parseAll(rawByLang.es, 'es'),
} satisfies Record<Lang, Map<string, RawEdition>>;

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
  return { ...toSummary(entry), ...rendered(entry, lang, 2) };
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

const rendered = (entry: RawEdition, lang: Lang, baseLevel: 2 | 3) => ({
  html: render(entry.body, baseLevel),
  events: extractEvents(entry.body, lang, entry.meta.date),
});

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
