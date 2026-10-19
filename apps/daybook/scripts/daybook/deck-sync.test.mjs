// node --test apps/daybook/scripts/daybook/deck-sync.test.mjs
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { DEFAULT_BASE, SLIDE_FILE, bogotaDates, bucketFromBase, buildManifest, manifestKey, needsRender, plan, postStatus, postable, prefixFor, slideKey, storedName } from './deck-sync.mjs';

const index = {
  format: 'daybook-index/1',
  editions: [
    { date: '2026-10-14', lang: 'en', title: 'A', published_at: '2026-10-14T11:00:00Z', revision: 2 },
    { date: '2026-10-14', lang: 'es', title: 'B', published_at: '2026-10-14T12:00:00Z', revision: 1 },
    { date: '2026-10-13', lang: 'en', title: 'C', published_at: '2026-10-13T11:00:00Z', revision: 1 },
  ],
};

test('today and yesterday are Bogota dates, not UTC ones', () => {
  // 03:00 UTC on Oct. 15 is still 22:00 on Oct. 14 in Bogota.
  assert.deepEqual(bogotaDates(new Date('2026-10-15T03:00:00Z')), ['2026-10-14', '2026-10-13']);
  assert.deepEqual(bogotaDates(new Date('2026-10-15T12:00:00Z')), ['2026-10-15', '2026-10-14']);
  assert.deepEqual(bogotaDates(new Date('2027-01-01T05:30:00Z')), ['2027-01-01', '2026-12-31']);
});

test('a deck is due when missing or older than the index, and only then', () => {
  assert.equal(needsRender(1, null), true);
  assert.equal(needsRender(2, { revision: 1 }), true);
  assert.equal(needsRender(2, { revision: 2 }), false);
  assert.equal(needsRender(2, { revision: 3 }), false);
  assert.equal(needsRender(2, {}), true);
});

test('the plan renders only what changed, and a rerun renders nothing', () => {
  const first = plan(index, ['2026-10-14', '2026-10-13'], {});
  assert.deepEqual(
    first.map(({ date, langs }) => [date, langs.filter((l) => l.render).map((l) => l.lang)]),
    [['2026-10-14', ['en', 'es']], ['2026-10-13', ['en']]],
  );

  const done = {
    '2026-10-14/en': { revision: 2 },
    '2026-10-14/es': { revision: 1 },
    '2026-10-13/en': { revision: 1 },
  };
  assert.ok(plan(index, ['2026-10-14', '2026-10-13'], done).every(({ langs }) => langs.every((l) => !l.render)));
  // A redraw after a design change: every published deck is due again.
  assert.ok(plan(index, ['2026-10-14', '2026-10-13'], done, { rerender: true }).every(({ langs }) => langs.every((l) => l.render)));

  // A republish of the English bumps its revision: English is due, Spanish is not.
  const republished = plan(index, ['2026-10-14'], { ...done, '2026-10-14/en': { revision: 1 } });
  assert.deepEqual(republished[0].langs.map((l) => [l.lang, l.render]), [['en', true], ['es', false]]);
});

test('a date with nothing published plans no languages', () => {
  assert.deepEqual(plan(index, ['2026-10-15'], {}), [{ date: '2026-10-15', langs: [] }]);
});

test('keys sit under social/, and test runs under test/social/', () => {
  assert.equal(slideKey(prefixFor(false), '2026-10-14', 'en', 2, '01-cover.png'), 'social/2026-10-14/en/r2/01-cover.png');
  assert.equal(slideKey(prefixFor(true), '2026-10-14', 'es', 1, '03-story.png'), 'test/social/2026-10-14/es/r1/03-story.png');
  assert.equal(manifestKey(prefixFor(false), '2026-10-14', 'en'), 'social/2026-10-14/en/deck.json');
  assert.equal(manifestKey(prefixFor(true), '2026-10-14', 'en'), 'test/social/2026-10-14/en/deck.json');
});

test('the bucket comes off an S3 URL, and a local base has none', () => {
  assert.equal(bucketFromBase(DEFAULT_BASE), 'news-ingester-production-daybookeditionsbucket-bcneortr');
  assert.equal(bucketFromBase('https://b.s3.us-east-1.amazonaws.com'), 'b');
  assert.equal(bucketFromBase('http://127.0.0.1:8765'), null);
});

test('the manifest lists slides in deck order with their public URLs', () => {
  const manifest = buildManifest({
    base: `${DEFAULT_BASE}/`,
    prefix: '',
    date: '2026-10-14',
    lang: 'en',
    revision: 2,
    files: ['08-subscribe.png', '01-cover.png', '06-upcoming.png', '02-story.png'],
    renderedAt: '2026-10-14T11:15:00.000Z',
  });
  assert.deepEqual(manifest, {
    format: 'daybook-deck/1',
    date: '2026-10-14',
    lang: 'en',
    revision: 2,
    rendered_at: '2026-10-14T11:15:00.000Z',
    slides: [
      { name: 'cover', url: `${DEFAULT_BASE}/social/2026-10-14/en/r2/01-cover.png` },
      { name: 'story', url: `${DEFAULT_BASE}/social/2026-10-14/en/r2/02-story.png` },
      { name: 'upcoming', url: `${DEFAULT_BASE}/social/2026-10-14/en/r2/06-upcoming.png` },
      { name: 'subscribe', url: `${DEFAULT_BASE}/social/2026-10-14/en/r2/08-subscribe.png` },
    ],
  });
});

// ── The broadcast gate ─────────────────────────────────────────────────────
// Rendering is the preview (the web lock); posting waits for the broadcast lock.

const published = [
  {
    date: '2026-10-19',
    langs: [
      { lang: 'en', revision: 1, render: false },
      { lang: 'es', revision: 1, render: false },
    ],
  },
];
const markFor = (...langs) => ({
  '2026-10-19': {
    format: 'daybook-broadcast/1',
    date: '2026-10-19',
    langs: Object.fromEntries(langs.map((lang) => [lang, { broadcast_at: '2026-10-19T11:00:00Z', revision: 1 }])),
  },
});

test('a published, current deck with no broadcast mark is not postable: it waits', () => {
  assert.deepEqual(postable(published, new Set(), {}, ['en', 'es'], { '2026-10-19': null }), []);
  assert.deepEqual(
    postStatus(published, new Set(), {}, ['en', 'es'], { '2026-10-19': null }).map((d) => `${d.lang} ${d.status}`),
    ['en waiting for broadcast', 'es waiting for broadcast'],
  );
});

test('a mark for English only: English is postable, Spanish waits', () => {
  assert.deepEqual(postable(published, new Set(), {}, ['en', 'es'], markFor('en')), [{ date: '2026-10-19', lang: 'en', revision: 1 }]);
  assert.equal(postStatus(published, new Set(), {}, ['en', 'es'], markFor('en'))[1].status, 'waiting for broadcast');
});

test('a marked deck that is already posted is not postable again', () => {
  const posted = { '2026-10-19/en': { facebook: { id: '1', revision: 1 } } };
  assert.deepEqual(postable(published, new Set(), posted, ['en', 'es'], markFor('en', 'es')), [{ date: '2026-10-19', lang: 'es', revision: 1 }]);
  assert.equal(postStatus(published, new Set(), posted, ['en'], markFor('en'))[0].status, 'already posted');
});

test('a test post ignores the broadcast mark', () => {
  assert.deepEqual(postable(published, new Set(), {}, ['en'], {}, { gate: false }), [{ date: '2026-10-19', lang: 'en', revision: 1 }]);
  // The gate off doesn't make a stale or posted deck postable.
  const stale = [{ date: '2026-10-19', langs: [{ lang: 'en', revision: 2, render: true }] }];
  assert.deepEqual(postable(stale, new Set(), {}, ['en'], {}, { gate: false }), []);
  assert.deepEqual(postable(published, new Set(), { '2026-10-19/en': { facebook: {} } }, ['en'], {}, { gate: false }), []);
});

test('every slide og.mjs draws is uploaded, the 287(g) map included', () => {
  for (const file of ['01-cover.jpg', '02-story.jpg', '05-287g.jpg', '06-upcoming.jpg', '09-subscribe.png']) {
    assert.ok(SLIDE_FILE.test(file), file);
  }
  for (const file of ['deck.json', 'cover.png', '01-cover.html']) assert.ok(!SLIDE_FILE.test(file), file);
});

test('the manifest carries each slide’s words and a script the desk can post as is', () => {
  const manifest = buildManifest({
    base: 'https://b.example',
    prefix: '',
    date: '2026-10-17',
    lang: 'en',
    revision: 2,
    files: ['02-story.png', '01-cover.png', '03-upcoming.png'],
    renderedAt: 't',
    script: [
      { file: '01-cover.png', kind: 'cover', headline: 'Refugees get 10 days', line: 'USCIS cut it.', sources: ['Associated Press'], image: 'Interim final rule' },
      { file: '02-story.png', kind: 'story', headline: 'A lawsuit', line: 'Six providers sued.', sources: ['CNN'] },
      { file: '03-upcoming.png', kind: 'calendar', headline: 'What’s coming', page: '1/1', entries: [{ date: 'Oct. 19', day: 'Monday', text: 'Extensions end.' }] },
    ],
  });
  assert.equal(manifest.slides[0].text.headline, 'Refugees get 10 days');
  assert.equal(manifest.slides[1].text.sources[0], 'CNN');
  assert.equal(
    manifest.script_md,
    [
      '**1. Refugees get 10 days** · [image](https://b.example/social/2026-10-17/en/r2/01-cover.png)\n[picked image: Interim final rule]\nUSCIS cut it.\nSources: Associated Press',
      '**2. A lawsuit** · [image](https://b.example/social/2026-10-17/en/r2/02-story.png)\nSix providers sued.\nSources: CNN',
      '**3. What’s coming** (1/1) · [image](https://b.example/social/2026-10-17/en/r2/03-upcoming.png)\n- Oct. 19, Monday: Extensions end.',
    ].join('\n\n'),
  );
});

test('a slide is stored under a hash of its pixels, so a redraw never reuses a key', () => {
  const first = storedName('06-upcoming.jpg', Buffer.from('page one'));
  const again = storedName('06-upcoming.jpg', Buffer.from('page one'));
  const redrawn = storedName('06-upcoming.jpg', Buffer.from('page two'));
  assert.match(first, /^06-upcoming-[0-9a-f]{12}\.jpg$/);
  assert.equal(first, again);
  assert.notEqual(first, redrawn);

  const manifest = buildManifest({
    base: 'https://b.example',
    prefix: '',
    date: '2026-10-19',
    lang: 'en',
    revision: 4,
    files: ['06-upcoming.jpg'],
    stored: { '06-upcoming.jpg': redrawn },
    renderedAt: 't',
  });
  assert.deepEqual(manifest.slides, [{ name: 'upcoming', url: `https://b.example/social/2026-10-19/en/r4/${redrawn}` }]);
});

test('the script names what to check: the build’s warnings and what Instagram leaves off', () => {
  const names = ['cover', 'story', 'story', 'story', 'story', 'story', '287g', 'upcoming', 'upcoming', 'upcoming', 'subscribe'];
  const files = names.map((name, i) => `${String(i + 1).padStart(2, '0')}-${name}.jpg`);
  const manifest = buildManifest({
    base: 'https://b.example',
    prefix: '',
    date: '2026-10-19',
    lang: 'en',
    revision: 1,
    files,
    renderedAt: 't',
    script: files.map((file, i) => ({ file, kind: names[i], headline: `Slide ${i + 1}` })),
    warnings: ['the image for "Slide 2" could not be made (answered 403). Text only.'],
  });
  assert.deepEqual(manifest.warnings, ['the image for "Slide 2" could not be made (answered 403). Text only.']);
  assert.deepEqual(manifest.instagram_leaves_off, [6]);
  const [top, ...slides] = manifest.script_md.split('\n\n');
  assert.equal(
    top,
    '**Check before broadcast:**\n- the image for "Slide 2" could not be made (answered 403). Text only.\n' +
      '- 11 slides: Instagram takes 10, so it leaves off the 1 marked below. Facebook posts them all.',
  );
  assert.match(slides[5], /^\*\*6\. Slide 6\*\* · \[image\]\([^)]+\) · \*not on Instagram\*$/);
  assert.doesNotMatch(slides[4], /not on Instagram/);
});
