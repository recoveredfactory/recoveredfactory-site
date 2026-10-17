import assert from 'node:assert/strict';
import { test } from 'node:test';

import { applySocialCopy, buildDeck, dropAttribution, inlineCites, packBoards, splitCredits, storyLine } from './deck.mjs';

// n five-character words: n * 5 - 1 characters.
const filler = (n) => Array(n).fill('word').join(' ');
const claim = `${filler(40)}.`; // 200 characters

test('the line is the claim and the whole next sentence when they fit', () => {
  const short = 'USCIS cut the response period from 30 days to 10.';
  const support = 'The rule takes effect Oct. 14. Lawyers expect challenges.';
  assert.equal(storyLine(short, support), `${short} The rule takes effect Oct. 14.`);
});

test('a long second sentence is cut on a clause, with an ellipsis', () => {
  const support =
    'Teare said his office is investigating a possible aggravated-assault charge against the officer, ' +
    `and he accused federal authorities ${filler(30)}.`;
  assert.equal(
    storyLine(claim, support),
    `${claim} Teare said his office is investigating a possible aggravated-assault charge against the officer…`,
  );
});

test('a second sentence with no clause mark in range is dropped, never cut mid-phrase', () => {
  const support =
    'Teare said his office is investigating a possible aggravated-assault charge and accused federal ' +
    `authorities of failing to cooperate fully or preserve potential vehicle evidence ${filler(10)}.`;
  assert.equal(storyLine(claim, support), claim);
});

test('a claim that leaves too little room stands alone', () => {
  const long = `${filler(64)}.`; // 320 characters
  assert.equal(storyLine(long, `A second sentence, with a comma, that would not fit ${filler(12)}.`), long);
});

const entries = (...lengths) => lengths.map((n, i) => ({ id: i + 1, text: 'x'.repeat(n) }));
const ids = (boards) => boards.map((board) => board.map((entry) => entry.id));

test('short calendar lines go up to four to a board, evened out, in date order', () => {
  const short = (n) => entries(...Array(n).fill(100));
  assert.deepEqual(ids(packBoards(short(4), 4, 820)), [[1, 2, 3, 4]]);
  assert.deepEqual(ids(packBoards(short(5), 4, 820)), [[1, 2, 3], [4, 5]]);
  assert.deepEqual(ids(packBoards(short(6), 4, 820)), [[1, 2, 3], [4, 5, 6]]);
  assert.deepEqual(ids(packBoards(short(7), 4, 820)), [[1, 2, 3, 4], [5, 6, 7]]);
  assert.deepEqual(ids(packBoards(short(9), 4, 820)), [[1, 2, 3], [4, 5, 6], [7, 8, 9]]);
});

test('whole plain summaries pack by length instead', () => {
  assert.deepEqual(ids(packBoards(entries(400, 380, 300, 350, 330), 4, 820)), [[1, 2], [3, 4], [5]]);
});

// The first live edition, 2026-10-17: phrases linked inside the prose, no credits after the claim.
const LIVE = {
  cnn:
    '**Six legal-service providers sued to stop accelerated immigration proceedings for unaccompanied children.** CNN reports that the plaintiffs say children have received sharply shortened schedules, sometimes without enough time to find lawyers or prepare claims; [the lawsuit remains unresolved and filing it did not stop the process](https://us.cnn.com/2026/10/15/politics/lawsuit).',
  reason:
    '**A federal judge dismissed the Justice Department’s challenge to New York City laws.** [The ruling leaves the city provisions in place](https://reason.com/volokh/2026/10/16/sanctuary/), though the government may appeal.',
};

test('a linked clause at the end of a paragraph is prose, not a credit', () => {
  const { prose, links } = splitCredits(LIVE.cnn);
  assert.equal(links.length, 0);
  assert.equal(prose, LIVE.cnn);
});

test('house-style credits after the claim still count', () => {
  const { prose, sources } = splitCredits('**USCIS cut the period to 10 days.** The rule takes effect Oct. 14. [Associated Press](https://apnews.com/a), [Fragomen](https://fragomen.com/b).');
  assert.deepEqual(sources, ['Associated Press', 'Fragomen']);
  assert.equal(prose, '**USCIS cut the period to 10 days.** The rule takes effect Oct. 14.');
});

test('inline links are credited as guesses: the name the prose gives, else the address', () => {
  assert.deepEqual(inlineCites(LIVE.cnn).map((c) => [c.name, c.guessed]), [['CNN', true]]);
  assert.deepEqual(inlineCites(LIVE.reason).map((c) => c.name), ['reason.com']);
  assert.deepEqual(
    inlineCites('[Modern Law Group explains that statutory argument](https://lawofficeimmigration.com/blog/x).').map((c) => c.name),
    ['Modern Law Group'],
  );
  // One credit per outlet, in order.
  assert.deepEqual(
    inlineCites('CNN reports [one](https://www.cnn.com/a) and [two](https://edition.cnn.com/b), then [three](https://reason.com/c).').map((c) => c.name),
    ['CNN', 'reason.com'],
  );
});

test('a story slide credits every outlet its section cites, once each', () => {
  const section = [
    '## Lawsuit challenges accelerated cases for children',
    LIVE.cnn,
    'A second paragraph adds detail. [Associated Press](https://apnews.com/x), [CNN](https://www.cnn.com/y).',
    'The Guardian reports that [more is coming](https://www.theguardian.com/z).',
  ].join('\n\n');
  const { deck } = buildDeck({ body: `${section}\n\n## Second story\n\n**A claim.** More.`, headline: 'Hed' }, '2026-10-17', [], null, 'en', { beats: 1 });
  assert.deepEqual(deck.sources, ['CNN', 'Associated Press', 'The Guardian']);
});

test('a slide line drops "CNN reports that"; the cite row already says it', () => {
  assert.equal(dropAttribution('CNN reports that the plaintiffs say children got shortened schedules.'), 'The plaintiffs say children got shortened schedules.');
  assert.equal(dropAttribution('News From The States reported that DHS had not announced it.'), 'DHS had not announced it.');
  assert.equal(dropAttribution('The plaintiffs say CNN reports that nothing.'), 'The plaintiffs say CNN reports that nothing.');
});

test('the composer\'s carousel copy replaces the cut copy, story by story', () => {
  const deck = { date: '2026-10-17', hed: 'Edition hed', line: 'cut', beats: [{ headline: 'Lawsuit challenges accelerated cases for children', line: 'cut' }] };
  applySocialCopy(
    deck,
    [
      { story: 'cover', headline: 'TPS for Ukraine and Sudan runs out Monday', line: 'Written for the slide.', sources: [{ name: 'News From The States', url: 'https://newsfromthestates.com/a' }] },
      { story: 'accelerated cases', line: 'Six providers sued.', sources: [{ name: 'CNN', url: 'https://cnn.com/b' }] },
      { story: 'not on the deck', line: 'Dropped.' },
    ],
    'en',
  );
  assert.equal(deck.hed, 'TPS for Ukraine and Sudan runs out Monday');
  assert.equal(deck.line, 'Written for the slide.');
  assert.deepEqual(deck.sources, ['News From The States']);
  assert.equal(deck.beats[0].headline, 'Lawsuit challenges accelerated cases for children');
  assert.equal(deck.beats[0].line, 'Six providers sued.');
  assert.deepEqual(deck.beats[0].links, [{ name: 'CNN', url: 'https://cnn.com/b' }]);
});
