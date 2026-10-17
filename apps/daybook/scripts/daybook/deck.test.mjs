import assert from 'node:assert/strict';
import { test } from 'node:test';

import { buildDeck, inlineCites, packBoards, splitCredits, storyLine } from './deck.mjs';

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

test('inline links are credited to their outlets: the house name, the prose name, or the address', () => {
  assert.deepEqual(inlineCites(LIVE.cnn).map((c) => c.name), ['CNN']);
  assert.deepEqual(inlineCites(LIVE.reason).map((c) => c.name), ['Reason']);
  assert.deepEqual(
    inlineCites('Grand Valley Ledger reports that the county [signed on](https://gvledger-unknown.example/a).').map((c) => c.name),
    ['Grand Valley Ledger'],
  );
  assert.deepEqual(inlineCites('The county [signed on](https://gvledger-unknown.example/a).').map((c) => c.name), ['gvledger-unknown.example']);
  // One credit per outlet, in order.
  assert.deepEqual(
    inlineCites('[One](https://www.cnn.com/a) and [two](https://edition.cnn.com/b), then [three](https://reason.com/c).').map((c) => c.name),
    ['CNN', 'Reason'],
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

test('a link that names its outlet, and government sites by their institution', () => {
  assert.deepEqual(
    inlineCites('[Modern Law Group explains that statutory argument](https://lawofficeimmigration.com/blog/x).').map((c) => c.name),
    ['Modern Law Group'],
  );
  assert.deepEqual(inlineCites('Senators sought [an extension](https://www.cortezmasto.senate.gov/letter.pdf).').map((c) => c.name), ['U.S. Senate']);
  assert.deepEqual(inlineCites('The [ruling](https://cdn.ca9.uscourts.gov/opinions/x.pdf) stands.').map((c) => c.name), ['Ninth Circuit']);
});
