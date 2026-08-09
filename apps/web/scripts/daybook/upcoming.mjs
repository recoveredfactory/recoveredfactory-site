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

const SCHEMA = 'immigration-daybook-upcoming.v1';

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
  if (doc.schema_version !== SCHEMA) {
    console.warn(
      `WARNING: ${date}: upcoming snapshot is ${doc.schema_version}, expected ${SCHEMA}. ` +
        'Reading it anyway — check the item fields if the slides look wrong.',
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
 * It is empty when the program is run on its own rather than as part of
 * composition — `selection.mode` reads `eligible_only` — and then the
 * deterministic slate is the best available answer and also, on the editions
 * seen so far, the same five the newsletter shipped.
 */
export function upcomingItems(doc) {
  if (!doc) return [];

  const selected = doc.selected_items ?? [];
  const items = selected.length ? selected : (doc.eligible_items ?? []);

  return [...items].sort((a, b) => (a.render_order ?? 0) - (b.render_order ?? 0));
}

/**
 * Shape one item for a card.
 *
 * `summary_preference` in the policy is the order the composer itself falls back
 * through, so this follows it rather than inventing a second preference.
 */
export function toCalendarEntry(item, lang, doc) {
  const preference = doc?.policy?.summary_preference ?? ['plain_summary', 'what_to_watch_for', 'title'];
  const text = preference.map((field) => item[field]).find((value) => value?.trim());
  if (!text || !item.key_date) return null;

  const date = new Date(`${item.key_date}T00:00:00Z`);

  return {
    iso: item.key_date,
    month: MONTH_LABEL[lang][date.getUTCMonth()],
    day: String(date.getUTCDate()),
    text: text.trim(),
  };
}

const MONTH_LABEL = {
  en: ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'],
  es: ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'],
};
