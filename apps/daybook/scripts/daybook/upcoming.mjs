// The Upcoming calendar as the composer decided it.
//
// `immigration_daybook_final` answers `mode: "upcoming_json"` with an
// `immigration_daybook_upcoming_json` artifact: the deterministic slate, the
// published subset when it was run as part of composition, and the policy and
// audit trail behind both. That artifact is the canonical snapshot — its own
// `determinism` block says the published subset is not reproducible by
// re-running once selection.mode is anything but `eligible_only` — so it is
// archived beside the edition and read back from there, never re-derived.
//
// This replaces picking items out of the database by nearest deadline. The two
// disagree substantially: on 2026-08-07 proximity surfaced Paperwork Reduction
// Act renewals while the composer ran the N-400 fee increase and the ORR sponsor
// rule. Selection is editorial, and it happens upstream.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

// Schemas this script has been read against. v2 (first seen 2026-08-17) renamed
// the artifact, moved the counts under `audit`, lifted `policy_sha256` to the
// top level, and dropped `render_order` / `render_order_es` in favour of
// `eligible_order` alone — so Spanish no longer gets its own tie-break. Both
// readers here and in src/lib/daybook/upcoming.ts fall back to `eligible_order`,
// which is why the change was survivable. A third one should still shout.
const KNOWN_SCHEMAS = new Set([
  'immigration-daybook-upcoming.v1',
  'immigration-daybook-upcoming-manifest.v2',
]);

/** Where an edition's snapshot lives, committed alongside the markdown. */
export const upcomingPath = (webRoot, date) =>
  join(webRoot, 'src', 'content', 'daybook', 'upcoming', `${date}.json`);

/**
 * The snapshot for an edition: from disk when it is already archived, otherwise
 * from the program, which archives it on the way through.
 *
 * `offline` never reaches the network — same contract as the rest of the pull,
 * so a re-template produces the same slides it did the first time.
 */
export async function loadUpcoming({ webRoot, url, key, date, offline }) {
  const path = upcomingPath(webRoot, date);

  if (existsSync(path)) {
    return JSON.parse(readFileSync(path, 'utf8'));
  }
  if (offline) {
    console.warn(`WARNING: ${date}: no archived upcoming snapshot and --offline; skipping it.`);
    return null;
  }

  const manifest = {
    inputs: [
      { name: 'trigger', title: 'Immigration Daybook Upcoming JSON trigger', artifact_type: 'text' },
    ],
    timezone: 'America/Bogota',
    entrypoint: 'default.run.json',
  };

  const form = new FormData();
  form.append('manifest', new Blob([JSON.stringify(manifest)], { type: 'application/json' }));
  form.append(
    'trigger',
    new Blob([JSON.stringify({ mode: 'upcoming_json', edition_date: date })], {
      type: 'text/plain',
    }),
  );

  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `pat ${key}` },
    body: form,
  });
  if (!res.ok) {
    console.warn(`WARNING: ${date}: upcoming_json request failed (HTTP ${res.status}).`);
    return null;
  }

  const payload = JSON.parse(await res.text());
  const raw = payload.artifacts?.find((a) => a.name === 'immigration_daybook_upcoming_json')?.data;
  if (!raw) {
    console.warn(`WARNING: ${date}: no immigration_daybook_upcoming_json artifact came back.`);
    return null;
  }

  const doc = JSON.parse(raw);
  if (!KNOWN_SCHEMAS.has(doc.schema_version)) {
    console.warn(
      `WARNING: ${date}: upcoming snapshot is ${doc.schema_version}, which this script has not ` +
        `been read against (known: ${[...KNOWN_SCHEMAS].join(', ')}). Reading it anyway — ` +
        'check the item fields if the slides look wrong.',
    );
  }

  // Stored as it came back rather than re-serialized: the artifact documents its
  // own canonical form (sorted keys, two-space indent, no runtime timestamp), so
  // the bytes are comparable across runs and worth keeping exactly.
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, raw.endsWith('\n') ? raw : `${raw}\n`);
  console.log(`Wrote src/content/daybook/upcoming/${date}.json`);

  return doc;
}

/**
 * The items to put on cards, in the order the composer would render them.
 *
 * `selected_items` is the published subset and wins whenever it is populated.
 * It is empty on every edition seen so far — `selection.mode` reads
 * `eligible_only`, because the upcoming program runs on its own rather than as
 * part of composition — and the eligible slate is then wider than what shipped.
 *
 * `publishedIds` closes that gap: the ids the edition's manifest says went out,
 * passed down by pull.mjs. When they resolve, they decide both the set and the
 * order. When they do not — an older edition, or a manifest that never carried
 * them — the eligible slate stands, which is the behaviour this had all along.
 *
 * Ordering is otherwise per language: v1 gave Spanish its own `render_order_es`
 * because both sorts broke ties on the summary text, so two items sharing a date
 * could fall differently. v2 ships neither and `eligible_order` carries both.
 */
export function upcomingItems(doc, lang = 'en', publishedIds = null) {
  if (!doc) return [];

  const selected = doc.selected_items ?? [];
  const eligible = doc.eligible_items ?? [];
  const items = selected.length ? selected : eligible;

  if (publishedIds?.length) {
    const byId = new Map(items.map((item) => [item.id, item]));
    const published = publishedIds.map((id) => byId.get(id)).filter(Boolean);
    if (published.length) return published;
  }

  const order = (item) =>
    (lang === 'es' ? item.render_order_es : item.render_order) ??
    item.render_order ??
    item.eligible_order ??
    Number.MAX_SAFE_INTEGER;

  return [...items].sort((a, b) => order(a) - order(b));
}

/**
 * Shape one item for a card.
 *
 * The policy carries the fallback chain the composer itself uses, per language
 * — Spanish is `["plain_summary_es", "plain_summary", …]`, so an item with no
 * Spanish summary shows the English one rather than vanishing from the deck.
 * That is the composer's call to make, not this script's, so it is followed
 * rather than second-guessed, up to the point where the chain stops offering
 * prose anyone wrote. See COMPOSED_SUMMARY.
 *
 * Beyond the date and the summary the entry carries the two facts the snapshot
 * holds that survive translation: the weekday, and the publisher standing
 * behind the date. `status` was a third — 'Comments open' off
 * `comment_period_open` — and came back off the card: it needed a label nobody
 * wrote, in two languages, for a vocabulary of one known value. `theme` is out
 * for the same kind of reason: it exists in English only ('Naturalization Fees
 * — Rulemaking'), and an English rubric over Spanish prose is worse than none.
 */
export function toCalendarEntry(item, lang, doc, from = null) {
  const preference =
    (lang === 'es' ? doc?.policy?.summary_preference_es : doc?.policy?.summary_preference) ??
    DEFAULT_PREFERENCE[lang] ??
    DEFAULT_PREFERENCE.en;

  const field = preference.find((name) => item[name]?.trim());
  if (!field || !item.key_date) return null;

  if (!COMPOSED_SUMMARY.has(field)) {
    console.warn(
      `WARNING: ${item.key_date} ${lang}: "${(item.title ?? '').slice(0, 60)}" has no composed ` +
        `summary — off the calendar slide, still in the edition.`,
    );
    return null;
  }

  const text = item[field];

  const date = new Date(`${item.key_date}T00:00:00Z`);

  return {
    iso: item.key_date,
    month: MONTH_LABEL[lang][date.getUTCMonth()],
    day: String(date.getUTCDate()),
    weekday: weekdayLabel(date, lang),
    countdown: countdownLabel(item.key_date, from, lang),
    publisher: (item.publisher ?? '').trim(),
    text: text.trim(),
  };
}

/**
 * How far off the deadline is, counted from the edition's own date.
 *
 * This is the only thing on a calendar slide that changes day to day. The
 * deadlines are standing ones — the N-400 fee comment period closed on Aug. 24
 * whether the edition was the 7th, the 11th, the 13th or the 17th — so four
 * consecutive decks carried the same three entries, word for word, and the
 * calendar slides came out byte-identical. That is what --no-upcoming was for.
 *
 * A countdown is not a workaround for that: it is the fact the reader actually
 * wants. "Aug. 24" answers when; "in six days" answers whether there is still
 * time, which is the question someone reads a deadline to ask. It is derived
 * from the date rather than written, it is true on the day it is posted, and it
 * makes an entry the archive has carried for a fortnight new every morning.
 *
 * Counted in whole UTC days, because key_date is a date and not a moment. An
 * entry already past gets nothing rather than a negative number: the composer
 * puts same-day items on the calendar and the edition is read the day it is
 * sent, so "0 days ago" would be a bug report rather than a fact.
 */
function countdownLabel(iso, from, lang) {
  if (!from) return '';

  const days = Math.round(
    (Date.parse(`${iso}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000,
  );
  if (!Number.isFinite(days) || days < 0) return '';

  return (COUNTDOWN[lang] ?? COUNTDOWN.en)(days);
}

// Furniture, in the same register as the weekday above it: the shortest true
// statement of the interval, not a call to act on it. Whether a deadline is
// worth acting on is the edition's line to write, not the chip's.
const COUNTDOWN = {
  en: (days) => (days === 0 ? 'TODAY' : days === 1 ? 'TOMORROW' : `IN ${days} DAYS`),
  es: (days) => (days === 0 ? 'HOY' : days === 1 ? 'MAÑANA' : `EN ${days} DÍAS`),
};

/**
 * Recover the published calendar from the edition as it was actually sent.
 *
 * The manifest's per-language `notes` is meant to be the record of which watch
 * items went out, and usually is. It is not always there: on 2026-08-18 neither
 * language carried `upcoming_ids`, the readers fell back to the whole eligible
 * slate, and the deck put an Aug. 31 H-2B attestation on the board — an item the
 * composer had kept off — in place of the Sep. 9 H-1B fee the edition ran. The
 * board was wrong about the one thing it exists to be right about.
 *
 * The email is the other record of what shipped, and pull.mjs already has it in
 * hand before it builds the deck. The composer renders each item's own
 * `plain_summary` into that email verbatim, so an item is published if and only
 * if its summary is in the sent text — no guessing, no proximity heuristic, no
 * second opinion about editorial selection.
 *
 * Matched on the item's own language, against that language's email.
 */
export function publishedFromText(doc, lang, text) {
  const items = doc?.eligible_items ?? [];
  if (!items.length || !text) return null;

  const haystack = fold(text);

  const ids = items
    .filter((item) => {
      const summary = (lang === 'es' ? item.plain_summary_es : item.plain_summary) || item.plain_summary;
      const needle = fold(summary ?? '').slice(0, MATCH_CHARS);
      return needle.length >= MATCH_CHARS && haystack.includes(needle);
    })
    .map((item) => item.id);

  return ids.length ? ids : null;
}

// Case, accents, curly quotes, em dashes, HTML entities and tag whitespace all
// differ between a summary in the snapshot's JSON and the same sentence set into
// an email. Folding both sides to bare letters and digits makes the comparison
// about the words and nothing else.
const fold = (value) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '');

// Long enough that no two watch items share an opening. Short enough to survive
// a copy edit made to the email after the snapshot was taken.
const MATCH_CHARS = 60;

/** 'MON' / 'LUN'. Intl gives 'lun.' in Spanish; the period is furniture here. */
function weekdayLabel(date, lang) {
  return new Intl.DateTimeFormat(lang === 'es' ? 'es-ES' : 'en-US', {
    weekday: 'short',
    timeZone: 'UTC',
  })
    .format(date)
    .replace(/\.$/, '')
    .toUpperCase();
}

// The fields the composer actually wrote plain language into.
//
// The policy's chain runs past them to `what_to_watch_for` and then `title`,
// which are the raw record — the Federal Register's own abstract, English only,
// whichever language is being rendered. That tail is right for the newsletter,
// where a rough entry sits in a long list and the reader has the rest of the
// page for context. It is wrong for a card: on 2026-08-11 the two items missing
// a composed summary both fell on the edition date, sorted first, and took the
// whole first calendar slide — "Final rule. The Energy Security and Lightering
// Independence Act of 2022 amended the nonimmigrant classifications for aliens
// in transit (C)…", set in Spanish type on the Spanish deck.
//
// So a slide takes composed prose or nothing. This drops the item from the
// carousel only; the edition still carries it, and the console says which.
const COMPOSED_SUMMARY = new Set(['plain_summary', 'plain_summary_es']);

// Only reached if the policy block goes missing, which would mean the artifact
// changed shape under us.
const DEFAULT_PREFERENCE = {
  en: ['plain_summary', 'what_to_watch_for', 'title'],
  es: ['plain_summary_es', 'plain_summary', 'what_to_watch_for', 'title'],
};

const MONTH_LABEL = {
  en: ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'],
  es: ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'],
};

// ---------------------------------------------------------------------------

/**
 * The calendar as the email set it, for the carousel.
 *
 * `publishedFromText` above answers a narrower question — which watch items went
 * out — and it answers it by finding each item's own `plain_summary` in the sent
 * text. That held until 2026-09-08, when the composer rewrote every summary on
 * its way into the email ("The Office of Refugee Resettlement, which houses
 * unaccompanied immigrant children, wants to keep using…" became "The Office of
 * Refugee Resettlement's comment period closes on a proposal to keep using…")
 * and all eight matches missed. Three of the eight entries that shipped that day
 * had no watch item behind them at all, so no amount of matching would have
 * recovered the set: the snapshot cannot express that calendar.
 *
 * What can is the email itself, read the way src/lib/daybook/calendar.ts already
 * reads it for the page — the two-cell table row, a 54-pixel date chip beside
 * the entry's prose and its citation, a shape that has outlived three
 * serialisations of the markdown beside it. This is that parse, emitting deck
 * entries instead of page entries. The two live apart because the page is
 * TypeScript the pull cannot import; they are the same twenty lines and a change
 * to one belongs in the other.
 *
 * The snapshot stays behind this as the fallback, for an edition whose email
 * never came back.
 */
export function calendarFromEmail(html, lang, editionDate) {
  if (!html) return [];

  const entries = [];

  // A row whose chip is empty carries the date of the row above it; see the twin
  // of this loop in src/lib/daybook/calendar.ts. First seen 2026-09-10.
  let carried = null;

  for (const [, chipCell, bodyCell] of html.matchAll(EMAIL_ROW)) {
    const chip = chipCell.match(CHIP);
    const month = chip ? CHIP_MONTHS[lang][chip[1].toLowerCase().slice(0, 3)] : undefined;

    const iso =
      chip && month !== undefined ? chipIso(month, Number(chip[2]), editionDate) : carried;
    if (!iso) continue;

    carried = iso;

    // The entry's prose is the cell's first div that is not the citation row;
    // the publisher is the first link's label, which is what the email prints.
    const divs = [...bodyCell.matchAll(CELL_DIV)].map(([, inner]) => inner);
    const text = fromHtml(divs.find((inner) => !/<a\b/i.test(inner)) ?? '');
    if (!text) continue;

    const publisher = fromHtml(bodyCell.match(ANCHOR)?.[1] ?? '');

    entries.push(entryFrom({ iso, text, publisher }, lang, editionDate));
  }

  return entries.sort((a, b) => a.iso.localeCompare(b.iso));
}

/**
 * A calendar written by hand, for a language whose email shipped without one.
 *
 * The Spanish edition has run `Próximamente` as a bare heading over the footer
 * on Aug. 21, Aug. 26, Aug. 27 and Sept. 8. On those days Spanish readers got no
 * calendar and the page had nothing of the edition's to read, so it fell through
 * to the snapshot — which on Sept. 8 meant three October items the edition never
 * ran, and none of the three September form deadlines its own lede was about.
 *
 * So the calendar can be supplied beside the edition, translated from the one
 * the other language actually sent, and credited like the rest of the
 * translation. It is committed, it is never written or overwritten by the pull,
 * and it is only ever reached when the edition's own email carried nothing.
 */
export function handCalendar(webRoot, lang, editionDate, from = editionDate) {
  const path = join(webRoot, 'src', 'content', 'daybook', lang, `${editionDate}.upcoming.json`);
  if (!existsSync(path)) return [];

  const doc = JSON.parse(readFileSync(path, 'utf8'));
  return (doc.entries ?? [])
    .filter((entry) => entry.date && entry.summary?.trim())
    .map((entry) =>
      entryFrom(
        {
          iso: entry.date,
          text: entry.summary.trim(),
          publisher: entry.sources?.[0]?.label ?? '',
        },
        lang,
        from,
      ),
    )
    .sort((a, b) => a.iso.localeCompare(b.iso));
}

/** The month/day/weekday/countdown furniture every calendar entry carries. */
function entryFrom({ iso, text, publisher }, lang, from) {
  const date = new Date(`${iso}T00:00:00Z`);
  return {
    iso,
    month: MONTH_LABEL[lang][date.getUTCMonth()],
    day: String(date.getUTCDate()),
    weekday: weekdayLabel(date, lang),
    countdown: countdownLabel(iso, from, lang),
    publisher: publisher.trim(),
    text,
  };
}

// A chip carries a month and a day and no year. The calendar looks forward, so a
// month before the edition's belongs to the next year — a December edition
// pointing at JAN 12 means the January after it.
function chipIso(month, day, editionDate) {
  if (!Number.isInteger(day) || day < 1 || day > 31) return null;

  const [editionYear, editionMonth] = editionDate.split('-').map(Number);
  const year = month < editionMonth - 1 ? editionYear + 1 : editionYear;

  const iso = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  const check = new Date(`${iso}T00:00:00Z`);
  return Number.isNaN(check.getTime()) || check.getUTCDate() !== day ? null : iso;
}

const EMAIL_ROW = /<td[^>]*width="54"[^>]*>([\s\S]*?)<\/td>\s*<td[^>]*>([\s\S]*?)<\/td>/gi;

// An abbreviated month over a bare day, each in its own div. Three letters names
// a month in both languages, so "SEPT" and "SEP" land on the same one.
const CHIP = /<div[^>]*>\s*([A-Za-zÁÉÍÓÚÑ]{3,5})\.?\s*<\/div>\s*<div[^>]*>\s*(\d{1,2})\s*<\/div>/i;

const CELL_DIV = /<div[^>]*>([\s\S]*?)<\/div>/gi;

const ANCHOR = /<a\b[^>]*\shref="[^"]*"[^>]*>([\s\S]*?)<\/a>/i;

const CHIP_MONTHS = {
  en: { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 },
  es: { ene: 0, feb: 1, mar: 2, abr: 3, may: 4, jun: 5, jul: 6, ago: 7, sep: 8, oct: 9, nov: 10, dic: 11 },
};

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };

// Enough of an HTML decoder for prose the pipeline wrote and the mailer escaped.
const fromHtml = (value) =>
  value
    .replace(/<[^>]+>/g, ' ')
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/&([a-z]+);/gi, (whole, name) => ENTITIES[name.toLowerCase()] ?? whole)
    .replace(/\s+/g, ' ')
    .trim();
