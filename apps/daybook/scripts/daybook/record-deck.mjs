#!/usr/bin/env node
// Build the Immigration Daybook carousel from daybook/1 edition records — the
// full rundown, not the pull's six-slide teaser.
//
// Usage: node scripts/daybook/record-deck.mjs <record.json> [<record.json> …]
//                                             [--out <deck.json>] [--render [--images <dir>]]
//                                             [--cover-kicker]
//   <record.json>  one daybook/1 record per language for the same date. A file
//                  holding an array of records (a PromptQL artifact download) works too.
//   --out          where the deck JSON goes; default scripts/daybook/out/record-deck-<date>.json
//   --render       run og.mjs's carousel over it
//   --images       og.mjs's --out for that render; default its own (static/images)
//   --cover-kicker the cover as the rundown's front page: a kicker over the hed and a
//                  count of what follows. Off, the cover is the lede story. See og.mjs.
//   --no-287g      leave off the 287(g) map (it needs the network; see tracker287g)
//   --pick <file>  the edition's one picked image, by hand until compose writes it
//                  into the record: {story, png, marks, dims, caption}; see attachPick
//
// The record is the composer's output: `{format: "daybook/1", date, lang, title,
// description, body_md, upcoming[], …}`. The stories are cut from it with
// pull.mjs's own rules (deck.mjs), so a slide says what the edition says, in the
// same cut. What makes it a rundown:
//
//   - the lede on the cover and the next three stories after it, not every one
//     (David, 2026-10-16: "we want to keep this slim -- if there's five top
//     sections in the email, there could be 3-4 here"); see DECK_STORIES;
//   - every calendar entry is on the deck, three to a slide, at close to full
//     length — the calendar is what the post is for;
//   - no round-up. Around the system stays in the edition (David, 2026-10-15);
//   - a 287(g) map every day, between the stories and the calendar (David,
//     2026-10-16): who joined ICE's list in the two weeks up to its last change,
//     and how many days ago that change was. See tracker287g.
//
// The calendar comes off `upcoming[]`, which the composer assembles from the
// watch-item rows, so there is nothing to parse out of an email and nothing to
// reconcile between languages.

import { spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildDeck, packBoards, trimToClause } from './deck.mjs';
import { tracker287g } from './tracker287g.mjs';
import { entryFrom } from './upcoming.mjs';

const here = dirname(fileURLToPath(import.meta.url));

// Story slides after the cover. The edition's order is its ranking, so the ones
// past this are the ones it ranked lowest, and they stay in the edition.
const DECK_STORIES = 3;

// Instagram's ceiling on a carousel. A deck past it does not post at all.
const MAX_SLIDES = 20;

// Three entries to a board, or four (David, 2026-10-17: "either 3 or 4 items, I
// think 3 with a 36-40px font and more concise language"). The concise language
// is the calendar line news-ingester writes for each watch item and attaches at
// publish (`upcoming[].line`, about 100 characters). An entry without one
// falls back to its whole plain summary, 300-480 characters. CALENDAR_SLIDE_CHARS
// still bounds a board, so two of those share one at a readable size, as they
// did on 2026-10-16. See packBoards in deck.mjs.
const CALENDAR_PER_SLIDE = 3;
const CALENDAR_SLIDE_CHARS = 820;

// Enough for a whole plain summary: the 10-14 English ones run 295-368
// characters. Set against Spanish, which runs 20-30% longer than the English it
// is translated from, so the Spanish of a 368-character entry (~475) still fits
// whole. Measured on the 10-14 boards (the --fit og.mjs settles on): the English
// fits at 0.89-0.92, about 27px entry text on the 1080px card; the same entries
// at Spanish length at 0.81-0.84; a board of three full 480-character entries at
// 0.78, 23.5px, which is the floor this budget is set to. A longer summary is
// cut at a sentence, then a clause, never mid-word.
const CALENDAR_ENTRY_MAX = 480;

// Publishers as the calendar's meta row names them. The watch items carry the
// blog's full title, which the row (one line, small caps) cuts off mid-name —
// "THE INSIGHTFUL IMMIGRATION BLOG (CYRUS D. …". Keyed on the record's label
// exactly; anything not here prints as given.
const CALENDAR_SOURCES = new Map([
  ['The Insightful Immigration Blog (Cyrus D. Mehta & Partners)', 'Cyrus Mehta'],
  ['WR Immigration (Wolfsdorf Rosenthal)', 'WR Immigration'],
]);

const argv = process.argv.slice(2);
const flag = (name) => {
  const i = argv.indexOf(name);
  return i === -1 ? null : argv[i + 1];
};
const valued = new Set(['--out', '--images', '--pick']);
const files = argv.filter((arg, i) => !arg.startsWith('--') && !valued.has(argv[i - 1]));
const render = argv.includes('--render');
const coverKicker = argv.includes('--cover-kicker');
const with287g = !argv.includes('--no-287g');

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
const tracker = with287g ? await tracker287g(date) : null;

for (const record of records) {
  const { lang } = record;

  // From the first `##`. The italic lead above it is the edition's standfirst:
  // the page and the email open on it, but it is not a section, and the deck's
  // cover is cut from the lede section the way the pull's always was.
  const start = record.body_md.search(/^## /m);
  const body = start === -1 ? record.body_md : record.body_md.slice(start);

  // The stories only: no events, so buildDeck sets no board of its own.
  const built = buildDeck({ body, headline: record.title }, date, [], shape, lang, { beats: DECK_STORIES });
  if (!shape) shape = built.shape;
  const deck = built.deck;
  delete deck.briefs;

  // A lede with no bolded claim leaves the cover a hed alone. The description
  // is the edition's own dek, so it is the next-best line to set under it.
  if (!deck.nut && record.description) deck.nut = record.description;

  deck.upcoming = calendar(record.upcoming ?? [], lang);
  if (tracker) deck.tracker = tracker;
  if (flag('--pick')) attachPick(deck, flag('--pick'), lang);
  if (coverKicker) deck.coverKicker = true;

  // Cover, the stories, the calendar, the offer. Past Instagram's ceiling the
  // stories at the end come off first: they are the edition's own order, so the
  // last ones are the ones it ranked lowest, and the calendar is the payoff.
  const fixed = 2 + deck.upcoming.length + (deck.tracker ? 1 : 0);
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
    `${date} ${lang}: cover + ${deck.beats.length} stories${deck.tracker ? ' + 287(g)' : ''} + ` +
      `${deck.upcoming.length} calendar + subscribe = ${fixed + deck.beats.length} slides.`,
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
 * Every entry the edition ran, in the record's order, packed onto boards (see
 * CALENDAR_PER_SLIDE). Every entry gets a board: a deadline left off to make the
 * boards even is a deadline a reader never sees.
 */
function calendar(upcoming, lang) {
  const entries = upcoming
    .filter((item) => item.date && (item.line?.trim() || item.text?.trim()))
    .map((item) => {
      const label = (item.sources?.[0]?.label ?? '').trim();
      const entry = entryFrom(
        { iso: item.date, text: (item.line?.trim() || item.text).trim(), publisher: CALENDAR_SOURCES.get(label) ?? label },
        lang,
        date,
      );
      const text = trimToClause(entry.text, CALENDAR_ENTRY_MAX);
      if (text !== entry.text) {
        console.log(`${date} ${lang}: calendar ${entry.iso} cut from ${entry.text.length} to ${text.length} characters.`);
      }
      return { ...entry, text };
    });

  return packBoards(entries, CALENDAR_PER_SLIDE, CALENDAR_SLIDE_CHARS).map((board) => ({ entries: board }));
}

/**
 * The one picked image (David, 2026-10-16): at most one an edition, a crop of a
 * source document showing the change itself, set between a story's headline
 * and its line. Until compose writes it into the record, it comes in as a file:
 *
 *   {"story": "cover" | a fragment of a story's headline,
 *    "png": "<crop, relative to this file>", "marks": [...], "dims": [...],
 *    "caption": "Interim final rule, Federal Register, Oct. 14, 2026"}
 *
 * marks and dims are fractions of the crop, the shape a text-anchored PDF crop
 * produces. A pick whose story is not on the deck is dropped with a warning
 * rather than set beside some other story.
 */
function attachPick(deck, file, lang) {
  const pick = JSON.parse(readFileSync(file, 'utf8'));
  const src = `data:image/png;base64,${readFileSync(resolve(dirname(file), pick.png)).toString('base64')}`;
  const shown = { src, marks: pick.marks ?? [], dims: pick.dims ?? [], caption: pick[`caption_${lang}`] ?? pick.caption ?? '' };
  if (pick.story === 'cover') {
    deck.pick = shown;
    return;
  }
  const beat = deck.beats.find((b) => b.headline.toLowerCase().includes(String(pick.story ?? '').toLowerCase()));
  if (beat) beat.pick = shown;
  else console.warn(`WARNING: ${deck.date} ${lang}: the pick names "${pick.story}", which is not on the deck — dropped.`);
}

