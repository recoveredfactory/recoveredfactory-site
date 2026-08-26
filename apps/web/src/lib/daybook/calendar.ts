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
 * That is the selection itself, so the page reads it from there. The snapshot
 * stays the fallback for every edition written before this shape existed, and
 * for any day the parse cannot make sense of.
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
  const day = Number(rawDay);
  if (month === undefined || !Number.isInteger(day) || day < 1 || day > 31) return null;

  // Entries carry a day and a month but never a year. The calendar looks
  // forward, so an entry whose month falls before the edition's month belongs to
  // the next year — a December edition pointing at "Jan. 12" means the January
  // after it, not the one ten months gone.
  const [editionYear, editionMonth] = editionDate.split('-').map(Number);
  const year = month < editionMonth - 1 ? editionYear + 1 : editionYear;

  const iso = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  // Reject a date the calendar cannot actually hold, e.g. "Feb. 31".
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
