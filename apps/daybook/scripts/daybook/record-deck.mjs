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
//   --pick <file>  the edition's one picked image from a local crop, overriding
//                  the record's social.pick (see pick.mjs)
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
//
// That is the basic format, and `record.social.deck` varies it per edition
// (David, 2026-10-19: "a basic format and parameters to vary it"). Every key is
// optional, and an absent one keeps the default:
//
//   "social": { "deck": {
//     "stories": 3,               // story slides after the cover: how many, in the
//                                 // edition's order, or which, by section number
//                                 // (1 is the lede): [2, 4, 5]
//     "tracker": true,            // the 287(g) map
//     "calendar": true,           // the calendar boards
//     "calendar_per_slide": 4,    // entries to a board, 1-4
//     "subscribe": true           // the closing slide
//   } }
//
// A story takes as many slides as social.slides has entries for it, each with
// its own words and image (deck.mjs applySocialCopy). A Spanish record without
// a deck of its own takes the English one's.

import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { applySocialCopy, buildDeck, copyTarget, deckKnobs, packBoards, trimToClause } from './deck.mjs';
import { asPick, loadPick, placement, placePick, withEnglishImages } from './pick.mjs';
import { tracker287g } from './tracker287g.mjs';
import { entryFrom } from './upcoming.mjs';

const here = dirname(fileURLToPath(import.meta.url));

// Story slides after the cover. The edition's order is its ranking, so the ones
// past this are the ones it ranked lowest, and they stay in the edition.
const DECK_STORIES = 3;

// Instagram's ceiling on a carousel. A deck past it does not post at all.
const MAX_SLIDES = 20;

// Up to four entries to a board, evened out (David, 2026-10-17: "We could do
// 4x to a slide this way", once the date chip went to one line and the
// countdown came off). The short entries are the calendar lines news-ingester
// writes for each watch item and attaches at publish (`upcoming[].line`, about
// 100 characters). An entry without one falls back to its whole plain summary,
// 300-480 characters, and CALENDAR_SLIDE_CHARS then packs those two to a
// board. See packBoards in deck.mjs.
const CALENDAR_PER_SLIDE = 4;
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

// Every warning a deck's build prints goes into its deck JSON as well, and from
// there into deck.json beside the script: the desk previews the deck from
// deck.json and never sees this log.
const warned = [];
const printWarning = console.warn;
console.warn = (...args) => {
  warned.push(args.join(' ').replace(/^WARNING: /, ''));
  printWarning(...args);
};

// The picked image comes from the record (social.pick, pick.mjs). A Spanish
// record without one of its own takes the English pick, which crops the same
// document; its caption is the pick's caption_es if it has one. Made once a
// run: both languages show the same crop.
const english = records.find((record) => record.lang === 'en');
const englishPick = english?.social?.pick;
const picks = new Map();
const pickFor = (pick, at) => {
  const key = JSON.stringify([pick.pdf, pick.image, pick.data, pick.page, pick.quote, pick.mark]);
  if (!picks.has(key)) picks.set(key, loadPick(pick, { work: mkdtempSync(join(tmpdir(), 'daybook-pick-')), label: `${date}: `, at }));
  return picks.get(key);
};

for (const record of records) {
  const { lang } = record;
  const from = warned.length;
  const knobs = deckKnobs(record.social?.deck ?? (lang === 'en' ? undefined : english?.social?.deck), { date, lang, stories: DECK_STORIES, perSlide: CALENDAR_PER_SLIDE });

  // From the first `##`. The italic lead above it is the edition's standfirst:
  // the page and the email open on it, but it is not a section, and the deck's
  // cover is cut from the lede section the way the pull's always was.
  const start = record.body_md.search(/^## /m);
  const body = start === -1 ? record.body_md : record.body_md.slice(start);

  // The stories only: no events, so buildDeck sets no board of its own.
  const built = buildDeck({ body, headline: record.title }, date, [], shape, lang, { beats: knobs.stories });
  if (!shape) shape = built.shape;
  const deck = built.deck;
  delete deck.briefs;

  // A lede with no bolded claim leaves the cover a hed alone. The description
  // is the edition's own dek, so it is the next-best line to set under it.
  if (!deck.nut && record.description) deck.nut = record.description;

  // The composer's carousel copy, where the record has it (deck.mjs). A
  // Spanish entry with no image of its own takes the English entry's in the
  // same place, as the pick does: the same document, its caption translated.
  const slides = lang === 'en' ? record.social?.slides : withEnglishImages(record.social?.slides, english?.social?.slides, { date, lang });
  applySocialCopy(deck, slides, lang);

  deck.upcoming = knobs.calendar ? calendar(record.upcoming ?? [], lang, knobs.calendarPerSlide) : [];
  if (tracker && knobs.tracker) deck.tracker = tracker;
  if (!knobs.subscribe) deck.subscribe = false;

  // Each slide's image (social.slides[].image), then the older one-per-edition
  // pick on the story it names, unless that slide already has an image.
  for (const target of [deck, ...deck.beats].flatMap((t) => [t, ...(t.more ?? [])])) {
    if (!target.image) continue;
    const image = asPick(target.image);
    delete target.image;
    const shown = await pickFor(image, `the image for "${target.headline ?? target.hed}"`);
    if (shown) target.pick = { ...shown, ...placement(image, shown), caption: image?.caption ?? '' };
  }
  const pick = record.social?.pick ?? englishPick;
  if (flag('--pick')) attachPick(deck, flag('--pick'), lang);
  else if (pick && !copyTarget(deck, pick.story)?.pick) {
    const shown = await pickFor(pick);
    const caption = (record.social?.pick ? pick.caption : pick[`caption_${lang}`] ?? pick.caption) ?? '';
    if (shown) placePick(deck, { ...shown, ...placement(pick, shown), caption }, pick.story, lang);
  }
  if (coverKicker) deck.coverKicker = true;

  // Past the ceiling the stories at the end come off first, each with the
  // slides it added: they are the edition's own order, so the last ones are the
  // ones it ranked lowest, and the calendar is the payoff.
  const storySlides = (beat) => 1 + (beat.more?.length ?? 0);
  const fixed = 1 + (deck.more?.length ?? 0) + deck.upcoming.length + (deck.tracker ? 1 : 0) + (deck.subscribe === false ? 0 : 1);
  const count = () => fixed + deck.beats.reduce((n, beat) => n + storySlides(beat), 0);
  if (count() > MAX_SLIDES) {
    const dropped = [];
    while (deck.beats.length && count() > MAX_SLIDES) dropped.unshift(`"${deck.beats.pop().headline}"`);
    console.warn(`WARNING: ${date} ${lang}: past ${MAX_SLIDES} slides; dropped ${dropped.length} story(ies) off the end: ${dropped.join(', ')}.`);
  }

  deck.warnings = warned.slice(from).map((w) => w.replace(new RegExp(`^${date} ${lang}: `), ''));
  decks[lang] = deck;
  const added = (deck.more?.length ?? 0) + deck.beats.reduce((n, beat) => n + (beat.more?.length ?? 0), 0);
  console.log(
    `${date} ${lang}: cover + ${deck.beats.length} stories${added ? ` + ${added} added` : ''}${deck.tracker ? ' + 287(g)' : ''} + ` +
      `${deck.upcoming.length} calendar${deck.subscribe === false ? '' : ' + subscribe'} = ${count()} slides.`,
  );
}
console.warn = printWarning;

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
function calendar(upcoming, lang, perSlide = CALENDAR_PER_SLIDE) {
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

  return packBoards(entries, perSlide, CALENDAR_SLIDE_CHARS).map((board) => ({ entries: board }));
}

/**
 * The one picked image from a local crop (--pick), which overrides the
 * record's social.pick (pick.mjs). The file:
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
  placePick(deck, shown, pick.story, lang);
}

