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
export function toCalendarEntry(item, lang, doc) {
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
    publisher: (item.publisher ?? '').trim(),
    text: text.trim(),
  };
}

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
