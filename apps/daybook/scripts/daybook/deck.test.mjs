import assert from 'node:assert/strict';
import { test } from 'node:test';

import { storyLine } from './deck.mjs';

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
