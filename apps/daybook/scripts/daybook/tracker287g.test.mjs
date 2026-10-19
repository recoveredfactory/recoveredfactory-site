import assert from 'node:assert/strict';
import { test } from 'node:test';

import { parseCsv, trackerFrom } from './tracker287g.mjs';

const row = (over) => ({
  status: 'active',
  state: 'TX',
  first_seen_date: '2026-09-01',
  latitude: '30.1',
  longitude: '-97.2',
  snapshot_date: '2026-10-16',
  ...over,
});

test('parseCsv reads quoted fields, doubled quotes and a byte-order mark', () => {
  const rows = parseCsv('﻿name,state\r\n"Sheriff, County ""A""",TX\r\nPolice,GA\n');
  assert.deepEqual(rows, [
    { name: 'Sheriff, County "A"', state: 'TX' },
    { name: 'Police', state: 'GA' },
  ]);
});

test('the window is the two weeks up to the last change on or before the edition', () => {
  const rows = [
    row({ first_seen_date: '2026-09-28' }), // before the window
    row({ first_seen_date: '2026-09-30', state: 'GA' }),
    row({ first_seen_date: '2026-10-13', state: 'GA' }),
    row({ first_seen_date: '2026-10-15', state: 'TN' }), // after the edition: not on the list yet
  ];
  const t = trackerFrom(rows, '2026-10-14');
  assert.equal(t.last, '2026-10-13');
  assert.equal(t.since, 1);
  assert.equal(t.start, '2026-09-29');
  assert.equal(t.added, 2);
  assert.deepEqual(t.top, [['GA', 2]]);
  assert.equal(t.fresh.length, 2);
  assert.equal(t.old.length, 1);
});

test('a quiet list keeps its last batch on the map and counts the days since', () => {
  // The summer of 2026: nothing new for 24 days.
  const rows = [row({ first_seen_date: '2026-07-21' }), row({ first_seen_date: '2026-07-10' })];
  const t = trackerFrom(rows, '2026-08-13');
  assert.equal(t.last, '2026-07-21');
  assert.equal(t.since, 23);
  assert.equal(t.added, 2);
});

test("the map runs every day, whatever the file's date", () => {
  // 2026-10-19: the Monday deck went out without its map on Friday's file.
  const friday = [row({ snapshot_date: '2026-10-16', first_seen_date: '2026-10-16' })];
  assert.equal(trackerFrom(friday, '2026-10-19').skip, undefined);
  assert.equal(trackerFrom(friday, '2026-10-19').since, 3);
  assert.equal(trackerFrom([row({ snapshot_date: '2026-10-01' })], '2026-10-19').skip, undefined);
});

test('terminated agencies and agencies outside the lower 48 stay off the map', () => {
  const rows = [
    row({ first_seen_date: '2026-10-10' }),
    row({ first_seen_date: '2026-10-10', status: 'terminated' }),
    row({ first_seen_date: '2026-10-10', state: 'AK', latitude: '61.2', longitude: '-149.9' }),
    row({ first_seen_date: '2026-10-10', latitude: '', longitude: '' }),
  ];
  const t = trackerFrom(rows, '2026-10-14');
  assert.equal(t.added, 3); // counted: the Alaska agency and the one with no place
  assert.equal(t.fresh.length, 1); // drawn: only the mappable lower-48 one
});

test('the top states are the three largest, ties alphabetical', () => {
  const states = ['TN', 'TN', 'GA', 'GA', 'TX', 'TX', 'PA'];
  const t = trackerFrom(states.map((state) => row({ state, first_seen_date: '2026-10-10' })), '2026-10-14');
  assert.deepEqual(t.top, [['GA', 2], ['TN', 2], ['TX', 2]]);
});
