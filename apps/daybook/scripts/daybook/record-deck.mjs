#!/usr/bin/env node
// Build the Immigration Daybook carousel from daybook/1 edition records — the
// full rundown, not the pull's six-slide teaser.
//
// Usage: node scripts/daybook/record-deck.mjs <record.json> [<record.json> …]
//                                             [--out <deck.json>] [--render [--images <dir>]]
//   <record.json>  one daybook/1 record per language for the same date. A file
//                  holding an array of records (a PromptQL artifact download) works too.
//   --out          where the deck JSON goes; default scripts/daybook/out/record-deck-<date>.json
//   --render       run og.mjs's carousel over it
//   --images       og.mjs's --out for that render; default its own (static/images)
//
// The record is the composer's output: `{format: "daybook/1", date, lang, title,
// description, body_md, upcoming[], …}`. The deck is cut from it with pull.mjs's
// own rules (deck.mjs), so a slide says what the edition says, in the same cut,
// with two differences that make it a rundown:
//
//   - every story gets a slide, not just the two after the lede;
//   - every round-up item is on the deck, set four to a slide.
//
// And one the record makes possible: the calendar comes off `upcoming[]`, which
// the composer assembles from the watch-item rows, so there is nothing to parse
// out of an email and nothing to reconcile between languages.

import { spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { BRIEFS, BRIEFS_MIN, buildDeck } from './deck.mjs';
import { entryFrom } from './upcoming.mjs';

const here = dirname(fileURLToPath(import.meta.url));

// Instagram's ceiling on a carousel. A deck past it does not post at all.
const MAX_SLIDES = 20;

const argv = process.argv.slice(2);
const flag = (name) => {
  const i = argv.indexOf(name);
  return i === -1 ? null : argv[i + 1];
};
const valued = new Set(['--out', '--images']);
const files = argv.filter((arg, i) => !arg.startsWith('--') && !valued.has(argv[i - 1]));
const render = argv.includes('--render');

if (!files.length) {
  console.error('Usage: record-deck.mjs <record.json> [<record.json> …] [--out <deck.json>] [--render]');
  process.exit(1);
}

const records = files.flatMap((file) => [JSON.parse(readFileSync(file, 'utf8'))].flat());

for (const record of records) {
  if (record.format !== 'daybook/1') {
    throw new Error(`${record.date ?? '?'} ${record.lang ?? '?'}: not a daybook/1 record (format ${record.format}).`);
  }
  if (!record.date || !record.lang || !record.title || !record.body_md) {
    throw new Error(`${record.date ?? '?'} ${record.lang ?? '?'}: a record needs date, lang, title and body_md.`);
  }
}

const dates = [...new Set(records.map((record) => record.date))];
if (dates.length !== 1) throw new Error(`One edition at a time: got ${dates.join(', ')}.`);
const [date] = dates;

// English first. Whether a story's claim only restates its headline is decided
// once, on the English, and the other language follows — the pull's rule, so
// the two decks come out the same shape. Spanish is a translation of the final
// English record; a test run on a translation is a test run on different words.
records.sort((a, b) => (a.lang === 'en' ? -1 : b.lang === 'en' ? 1 : a.lang.localeCompare(b.lang)));

let shape = null;
const decks = {};

for (const record of records) {
  const { lang } = record;

  // From the first `##`. The italic lead above it is the edition's standfirst:
  // the page and the email open on it, but it is not a section, and the deck's
  // cover is cut from the lede section the way the pull's always was.
  const start = record.body_md.search(/^## /m);
  const body = start === -1 ? record.body_md : record.body_md.slice(start);

  const events = (record.upcoming ?? [])
    .filter((item) => item.date && item.text?.trim())
    .map((item) =>
      entryFrom(
        { iso: item.date, text: item.text.trim(), publisher: item.sources?.[0]?.label ?? '' },
        lang,
        date,
      ),
    )
    .sort((a, b) => a.iso.localeCompare(b.iso));

  const built = buildDeck({ body, headline: record.title }, date, events, shape, lang, {
    beats: Infinity,
    briefs: Infinity,
  });
  if (!shape) shape = built.shape;
  const deck = built.deck;

  // A lede with no bolded claim leaves the cover a hed alone. The description
  // is the edition's own dek, so it is the next-best line to set under it.
  if (!deck.nut && record.description) deck.nut = record.description;

  deck.briefs = roundups(deck.briefs);

  // Cover, the stories, the round-ups, the calendar, the offer. Past
  // Instagram's ceiling the stories at the end come off first: they are the
  // edition's own order, so the last ones are the ones it ranked lowest.
  const fixed = 2 + deck.briefs.length + deck.upcoming.length;
  if (fixed + deck.beats.length > MAX_SLIDES) {
    const keep = Math.max(0, MAX_SLIDES - fixed);
    const dropped = deck.beats.slice(keep).map((beat) => `"${beat.headline}"`);
    console.warn(
      `WARNING: ${date} ${lang}: ${fixed + deck.beats.length} slides is past Instagram's ${MAX_SLIDES}; ` +
        `dropped ${dropped.length} story slide(s) off the end: ${dropped.join(', ')}.`,
    );
    deck.beats = deck.beats.slice(0, keep);
  }

  decks[lang] = deck;
  console.log(
    `${date} ${lang}: cover + ${deck.beats.length} stories + ${deck.briefs.length} round-up + ` +
      `${deck.upcoming.length} calendar + subscribe = ${2 + deck.beats.length + deck.briefs.length + deck.upcoming.length} slides.`,
  );
}

const outPath = resolve(flag('--out') ?? join(here, 'out', `record-deck-${date}.json`));
mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, JSON.stringify(decks, null, 2));
console.log(`Wrote ${outPath}`);

if (render) {
  const images = flag('--images');
  const run = spawnSync(
    'node',
    [
      join(here, 'og.mjs'),
      '--card',
      'carousel',
      '--lang',
      Object.keys(decks).join(','),
      '--deck',
      outPath,
      ...(images ? ['--out', resolve(images)] : []),
    ],
    { stdio: 'inherit' },
  );
  if (run.status !== 0) process.exit(run.status ?? 1);
}

/**
 * Every round-up item, set BRIEFS to a slide and never fewer than BRIEFS_MIN.
 *
 * The slide's type is fitted to fill the frame, so the count a slide carries is
 * what sets its size: four is the number the briefs were tuned at, and a slide
 * of one or two would come out set larger than the cover. So the items are
 * spread evenly — fifteen go 4, 4, 4, 3 rather than 4, 4, 4, 2, 1 — and a list
 * too short for two slides of BRIEFS_MIN stays on one: five is one slide, not
 * 3 and 2. Every slide takes the rubric the edition wrote.
 */
function roundups(briefs) {
  const items = briefs?.items ?? [];
  if (!items.length) return [];

  let count = Math.ceil(items.length / BRIEFS);
  if (items.length / count < BRIEFS_MIN) count = Math.max(1, Math.floor(items.length / BRIEFS_MIN));

  const slides = [];
  let at = 0;
  for (let i = 0; i < count; i += 1) {
    const size = Math.ceil((items.length - at) / (count - i));
    slides.push({ rubric: briefs.rubric, items: items.slice(at, at + size) });
    at += size;
  }
  return slides;
}
