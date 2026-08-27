import type { UpcomingEntry } from '$lib/daybook/upcoming';
import type { Lang } from '$lib/i18n';

/**
 * The Upcoming calendar, read out of the edition that carried it.
 *
 * For the archive's first three weeks this section existed in exactly one place,
 * the sent email, and the page had to reconstruct it from the pipeline's
 * snapshot — which holds a deterministic slate, not the editorial selection, so
 * the page could only ever show the entries that both the snapshot and the email
 * happened to contain. On 2026-08-26 the composer began serving the calendar
 * inside the edition markdown, properly set: one paragraph an entry, opening
 * with a bolded date and the rule's name, then the prose and its citation.
 *
 * That is the selection itself, so the page reads it from there — and when the
 * markdown arrives without one, which it did again on Aug. 27, out of the sent
 * email, where the calendar has been every day since the first edition. The
 * snapshot stays the last resort: it reconstructs a subset, so it is what the
 * page shows only when the edition itself carries nothing to read.
 *
 * Where a story's headline is the edition talking to a reader, these entries are
 * closer to data, and the parse holds itself to that: an entry it cannot date is
 * skipped rather than guessed at, and a section that yields fewer than two of
 * them is left in the body where it was, because a single dated paragraph is
 * more likely to be a story that opens on a deadline than a calendar.
 */

// AP-style English months as the Daybook writes them, and Spanish month names.
// Both maps are keyed lowercase and stripped of the trailing period so
// "Sept." and "sept" land on the same index.
const MONTHS: Record<Lang, Record<string, number>> = {
  en: {
    jan: 0,
    feb: 1,
    march: 2,
    april: 3,
    may: 4,
    june: 5,
    july: 6,
    aug: 7,
    sept: 8,
    oct: 9,
    nov: 10,
    dec: 11,
  },
  es: {
    enero: 0,
    febrero: 1,
    marzo: 2,
    abril: 3,
    mayo: 4,
    junio: 5,
    julio: 6,
    agosto: 7,
    septiembre: 8,
    octubre: 9,
    noviembre: 10,
    diciembre: 11,
  },
};

export const EVENT_DATE: Record<Lang, RegExp> = {
  en: /^(jan\.|feb\.|march|april|may|june|july|aug\.|sept\.|oct\.|nov\.|dec\.)\s+(\d{1,2})\b/i,
  es: /^(\d{1,2})\s+de\s+([a-záéíóú]+)/i,
};

export function parseEntryDate(text: string, lang: Lang, editionDate: string): string | null {
  const match = text.trim().match(EVENT_DATE[lang]);
  if (!match) return null;

  const [rawMonth, rawDay] = lang === 'en' ? [match[1], match[2]] : [match[2], match[1]];
  const month = MONTHS[lang][rawMonth.toLowerCase().replace(/\.$/, '')];
  if (month === undefined) return null;

  return toIso(month, Number(rawDay), editionDate);
}

/**
 * A month and a day, as the year the calendar means by them.
 *
 * Entries carry a day and a month but never a year. The calendar looks forward,
 * so an entry whose month falls before the edition's month belongs to the next
 * year — a December edition pointing at "Jan. 12" means the January after it,
 * not the one ten months gone. A date the calendar cannot hold, "Feb. 31", is
 * rejected rather than rolled over into March.
 */
function toIso(month: number, day: number, editionDate: string): string | null {
  if (!Number.isInteger(day) || day < 1 || day > 31) return null;

  const [editionYear, editionMonth] = editionDate.split('-').map(Number);
  const year = month < editionMonth - 1 ? editionYear + 1 : editionYear;

  const iso = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  const check = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(check.getTime()) || check.getUTCDate() !== day) return null;

  return iso;
}

export const stripInline = (value: string) =>
  value
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/\*\*|\*|`/g, '')
    .replace(/\s+/g, ' ')
    .trim();

// An entry: a paragraph, optionally a list item, opening on a bolded run. The
// run has to *start* with the date, which is what separates it from a story's
// bolded lead — and from every other paragraph in an edition, since nothing else
// opens on "Aug. 28 —" or "28 de agosto —".
const ENTRY = /^(?:[-*+][ \t]+)?\*\*([\s\S]+?)\*\*[ \t]*([\s\S]*)$/;

// The citations at the end of an entry, which the card sets as its own row
// rather than as part of the sentence.
const TRAILING_LINKS = /(?:[\s,;·]*\[[^\]]+\]\([^)\s]+\))+[\s.]*$/;

const LINK = /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g;

// Fewer than two dated entries is not a calendar. See the note at the top.
const MIN_ENTRIES = 2;

/**
 * Split an edition's body into the prose the page renders and the calendar it
 * draws as a card.
 *
 * Returns the body untouched and no entries when there is no calendar in it,
 * which is every edition before 2026-08-26 and any day the shape changes again.
 */
export function liftCalendar(
  body: string,
  lang: Lang,
  editionDate: string,
): { body: string; entries: UpcomingEntry[] } {
  const blocks = body.split(/\n(?=## )/);

  for (const [at, block] of blocks.entries()) {
    const entries = readEntries(block, lang, editionDate);
    if (entries.length < MIN_ENTRIES) continue;

    const kept = blocks.filter((_, i) => i !== at);
    return { body: kept.join('\n'), entries };
  }

  return { body, entries: [] };
}

function readEntries(block: string, lang: Lang, editionDate: string): UpcomingEntry[] {
  const entries: UpcomingEntry[] = [];

  for (const paragraph of block.split(/\n[ \t]*\n/)) {
    const text = paragraph.trim().replace(/^## .*\n?/, '');
    const entry = text.match(ENTRY);
    if (!entry) continue;

    const [, bolded, tail] = entry;
    const date = parseEntryDate(bolded, lang, editionDate);
    if (!date) continue;

    // The bolded run also names the rule — "Aug. 28 — Alien Registration Form
    // and Evidence of Registration." — which the email's own card does not
    // print. The card is a date and a sentence about it, so the name is left
    // where the entry's prose can stand without it.
    const summary = stripInline(tail.replace(TRAILING_LINKS, ''));
    if (!summary) continue;

    const sources = new Map<string, { label: string; url: string }>();
    for (const [, label, url] of tail.matchAll(LINK)) {
      if (!sources.has(url)) sources.set(url, { label: stripInline(label), url });
    }

    entries.push({
      date,
      summary,
      sources: [...sources.values()],
      repeatsDate: entries.at(-1)?.date === date,
    });
  }

  return entries;
}

// ---------------------------------------------------------------------------

// The calendar as the email set it.
//
// The markdown carries it only sometimes — Aug. 26 is the one edition that got
// it right, and Aug. 27 was back to a bare heading. The sent artifact carries it
// nearly every day and has since the launch edition, in one shape: a two-cell
// table row, a 54-pixel date chip beside the entry's prose and its citation.
// Mail clients understand tables and little else, which is why that shape has
// outlived three different serialisations of the markdown beside it.
//
// So this reads what subscribers were actually sent, and it reads it for the
// whole archive rather than for the days since the parse existed. Where the
// snapshot could only ever rebuild a subset — six eligible items against the
// eight dates the Aug. 21 email ran — this is the eight.
const EMAIL_ROW = /<td[^>]*width="54"[^>]*>([\s\S]*?)<\/td>\s*<td[^>]*>([\s\S]*?)<\/td>/gi;

// The chip: an abbreviated month over a bare day, each in its own div. Three
// letters is enough to name a month in both languages, and taking only three
// means "SEPT" and "SEP" land on the same one.
const CHIP = /<div[^>]*>\s*([A-Za-zÁÉÍÓÚÑ]{3,5})\.?\s*<\/div>\s*<div[^>]*>\s*(\d{1,2})\s*<\/div>/i;

const CELL_DIV = /<div[^>]*>([\s\S]*?)<\/div>/gi;

const ANCHOR = /<a\b[^>]*\shref="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi;

const CHIP_MONTHS: Record<Lang, Record<string, number>> = {
  en: { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 },
  es: { ene: 0, feb: 1, mar: 2, abr: 3, may: 4, jun: 5, jul: 6, ago: 7, sep: 8, oct: 9, nov: 10, dic: 11 },
};

/**
 * The calendar out of an edition's sent HTML. Empty when the email carried none,
 * which happens — the Spanish edition shipped `Próximamente` as a heading with
 * nothing under it on Aug. 21, Aug. 26 and Aug. 27.
 */
export function readEmailCalendar(html: string, lang: Lang, editionDate: string): UpcomingEntry[] {
  const entries: UpcomingEntry[] = [];

  for (const [, chipCell, bodyCell] of html.matchAll(EMAIL_ROW)) {
    const chip = chipCell.match(CHIP);
    if (!chip) continue;

    const month = CHIP_MONTHS[lang][chip[1].toLowerCase().slice(0, 3)];
    if (month === undefined) continue;

    const date = toIso(month, Number(chip[2]), editionDate);
    if (!date) continue;

    const sources = new Map<string, { label: string; url: string }>();
    for (const [, url, label] of bodyCell.matchAll(ANCHOR)) {
      if (!/^https?:/i.test(url) || sources.has(url)) continue;
      sources.set(url, { label: fromHtml(label), url });
    }

    // The entry's prose is the cell's first div that is not the citation row.
    const prose = [...bodyCell.matchAll(CELL_DIV)]
      .map(([, inner]) => inner)
      .find((inner) => !/<a\b/i.test(inner));

    const summary = fromHtml(prose ?? '');
    if (!summary) continue;

    entries.push({
      date,
      summary,
      sources: [...sources.values()],
      repeatsDate: entries.at(-1)?.date === date,
    });
  }

  return entries;
}

const ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
};

// Enough of an HTML decoder for prose the pipeline wrote and the mailer escaped.
const fromHtml = (value: string) =>
  value
    .replace(/<[^>]+>/g, ' ')
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/&([a-z]+);/gi, (whole, name) => ENTITIES[name.toLowerCase()] ?? whole)
    .replace(/\s+/g, ' ')
    .trim();
