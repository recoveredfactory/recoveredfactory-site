// node --test apps/daybook/scripts/daybook/deck-post.test.mjs
// Everything here runs against a fake fetch. Nothing reaches Meta.
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { test } from 'node:test';

import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  CAPTION_MAX,
  PAUSE_MS,
  buildCaption,
  checkAccounts,
  fitInstagram,
  formatCheck,
  isTestDeck,
  postDeck,
  runPosts,
  writePosted,
} from './deck-post.mjs';
import { postable } from './deck-sync.mjs';

const record = {
  format: 'daybook/1',
  date: '2026-10-14',
  lang: 'en',
  title: 'Refugees get 10 days to contest status termination',
  description: 'A final work-permit rule takes effect, and San Antonio sues over a proposed detention site.',
  revision: 2,
};

const slide = (n, name) => ({
  name,
  url: `https://bucket.s3.amazonaws.com/social/2026-10-14/en/r2/${String(n).padStart(2, '0')}-${name}.png`,
});
const deckOf = (names) => ({ format: 'daybook-deck/1', date: '2026-10-14', lang: 'en', revision: 2, slides: names.map((name, i) => slide(i + 1, name)) });
const deck = deckOf(['cover', 'story', 'story', 'story', 'story', 'upcoming', 'upcoming', 'subscribe']);

const env = {
  DAYBOOK_FB_PAGE_ID: '111',
  DAYBOOK_META_PAGE_TOKEN: 'page-token',
  DAYBOOK_META_APP_SECRET: 'app-secret',
};
const withInstagram = { ...env, DAYBOOK_IG_USER_ID: '999' };

/** A fake Graph API: answers by path, and keeps every call for the assertions. */
function fakeGraph({ statuses = ['IN_PROGRESS', 'FINISHED'] } = {}) {
  const calls = [];
  let photo = 0;
  let item = 0;
  const pending = [...statuses];
  const fetch = async (url, init = {}) => {
    const u = new URL(url);
    const params = init.method === 'GET' ? u.searchParams : new URLSearchParams(init.body);
    const path = u.pathname.replace(/^\/v25\.0\//, '');
    calls.push({ method: init.method, path, params: Object.fromEntries(params) });
    const reply = (json) => ({ ok: true, status: 200, json: async () => json });
    if (path === '111/photos') return reply({ id: `photo${(photo += 1)}`, post_id: `story${photo}` });
    if (path === '111/feed') return reply({ id: '111_555' });
    if (path === '111_555') return reply({ permalink_url: 'https://www.facebook.com/111/posts/555' });
    if (path === '999/media' && params.get('media_type') === 'CAROUSEL') return reply({ id: 'carousel1' });
    if (path === '999/media') return reply({ id: `item${(item += 1)}` });
    if (path === 'carousel1') return reply({ status_code: pending.shift() ?? 'FINISHED' });
    if (path === '999/media_publish') return reply({ id: 'igmedia1' });
    if (path === 'igmedia1') return reply({ permalink: 'https://www.instagram.com/p/abc/' });
    return { ok: false, status: 400, json: async () => ({ error: { message: `unexpected ${path}` } }) };
  };
  return { fetch, calls };
}

const quiet = () => {};
const noSleep = async () => {};

test('the caption: title, description, and where to read it, in English', () => {
  assert.equal(
    buildCaption(record),
    'Refugees get 10 days to contest status termination\n' +
      'A final work-permit rule takes effect, and San Antonio sues over a proposed detention site.\n\n' +
      'Today’s Immigration Daybook, free every weekday morning: immigrationdaybook.com/en/2026-10-14',
  );
});

test('the caption in Spanish, and without a description', () => {
  const es = buildCaption({ ...record, lang: 'es', title: 'Refugiados: 10 días para impugnar', description: undefined });
  assert.equal(
    es,
    'Refugiados: 10 días para impugnar\n\n' +
      'El Immigration Daybook de hoy, gratis cada mañana entre semana: immigrationdaybook.com/es/2026-10-14',
  );
});

test('a caption past 2,200 characters gives up description, never the title or the link', () => {
  const long = { ...record, description: 'The rule changes the deadline. '.repeat(120).trim() };
  const caption = buildCaption(long);
  assert.ok(caption.length <= CAPTION_MAX, `${caption.length}`);
  assert.ok(caption.startsWith(`${record.title}\nThe rule changes the deadline.`));
  assert.ok(caption.endsWith('immigrationdaybook.com/en/2026-10-14'));
  assert.equal(buildCaption(record).length < CAPTION_MAX, true);
});

test('Instagram takes ten: stories come off the end first, the calendar stays', () => {
  const names = ['cover', ...Array(9).fill('story'), 'upcoming', 'upcoming', 'subscribe'];
  const { slides, dropped } = fitInstagram(deckOf(names).slides);
  assert.equal(slides.length, 10);
  assert.deepEqual(slides.map((s) => s.name), ['cover', ...Array(6).fill('story'), 'upcoming', 'upcoming', 'subscribe']);
  assert.deepEqual(dropped.map((s) => s.name), ['story', 'story', 'story']);
  assert.deepEqual(slides.map((s) => s.url), deckOf(names).slides.filter((s, i) => i < 7 || i > 9).map((s) => s.url));
  // Past the stories, the subscribe plate goes before any of the calendar.
  const calendarHeavy = fitInstagram(deckOf(['cover', 'story', ...Array(9).fill('upcoming'), 'subscribe']).slides);
  assert.deepEqual(calendarHeavy.dropped.map((s) => s.name), ['story', 'subscribe']);
  assert.equal(calendarHeavy.slides.filter((s) => s.name === 'upcoming').length, 9);
});

test('Facebook: every slide uploaded unpublished, then one feed post carrying them, with appsecret_proof', async () => {
  const graph = fakeGraph();
  const result = await postDeck({ deck, record, posted: null, env, confirm: true, fetch: graph.fetch, log: quiet, now: () => new Date('2026-10-14T12:00:00Z') });

  assert.deepEqual(graph.calls.map((c) => `${c.method} ${c.path}`), [
    ...deck.slides.map(() => 'POST 111/photos'),
    'POST 111/feed',
    'GET 111_555',
  ]);
  const uploads = graph.calls.filter((c) => c.path === '111/photos');
  assert.deepEqual(uploads.map((c) => c.params.url), deck.slides.map((s) => s.url));
  assert.ok(uploads.every((c) => c.params.published === 'false'));

  const feed = graph.calls.find((c) => c.path === '111/feed').params;
  assert.equal(feed.message, buildCaption(record));
  assert.deepEqual(
    deck.slides.map((s, i) => JSON.parse(feed[`attached_media[${i}]`])),
    deck.slides.map((s, i) => ({ media_fbid: `photo${i + 1}` })),
  );

  const proof = createHmac('sha256', 'app-secret').update('page-token').digest('hex');
  assert.ok(graph.calls.every((c) => c.params.access_token === 'page-token' && c.params.appsecret_proof === proof));

  assert.deepEqual(result.posted.facebook, {
    id: '111_555',
    permalink: 'https://www.facebook.com/111/posts/555',
    posted_at: '2026-10-14T12:00:00.000Z',
    revision: 2,
  });
  assert.equal(result.posted.instagram, undefined, 'no IG account linked: Instagram is skipped');
  assert.equal(result.changed, true);
});

test('Instagram: item containers, a carousel, polled to FINISHED, then published', async () => {
  const graph = fakeGraph({ statuses: ['IN_PROGRESS', 'IN_PROGRESS', 'FINISHED'] });
  const slept = [];
  const result = await postDeck({
    deck,
    record,
    posted: { facebook: { id: 'x', permalink: 'p', revision: 2 } },
    env: withInstagram,
    confirm: true,
    fetch: graph.fetch,
    log: quiet,
    sleep: async (ms) => slept.push(ms),
  });

  assert.deepEqual(graph.calls.map((c) => `${c.method} ${c.path}`), [
    ...deck.slides.map(() => 'POST 999/media'),
    'POST 999/media',
    'GET carousel1',
    'GET carousel1',
    'GET carousel1',
    'POST 999/media_publish',
    'GET igmedia1',
  ]);
  const items = graph.calls.slice(0, deck.slides.length);
  assert.deepEqual(items.map((c) => c.params.image_url), deck.slides.map((s) => s.url));
  assert.ok(items.every((c) => c.params.is_carousel_item === 'true'));
  const carousel = graph.calls[deck.slides.length].params;
  assert.equal(carousel.media_type, 'CAROUSEL');
  assert.equal(carousel.children, deck.slides.map((s, i) => `item${i + 1}`).join(','));
  assert.equal(carousel.caption, buildCaption(record));
  assert.equal(graph.calls.find((c) => c.path === '999/media_publish').params.creation_id, 'carousel1');
  assert.equal(slept.length, 2);
  assert.equal(result.posted.instagram.permalink, 'https://www.instagram.com/p/abc/');
});

test('Instagram gives up after a bounded wait, and what did post is still recorded', async () => {
  const graph = fakeGraph({ statuses: Array(100).fill('IN_PROGRESS') });
  const result = await postDeck({ deck, record, posted: null, env: withInstagram, confirm: true, fetch: graph.fetch, log: quiet, sleep: noSleep });
  assert.ok(result.posted.facebook, 'Facebook posted');
  assert.equal(result.posted.instagram, undefined);
  const ig = result.outcome.find((o) => o.platform === 'instagram');
  assert.equal(ig.failed, true);
  assert.match(ig.result, /not ready after/);
  assert.equal(graph.calls.filter((c) => c.path === 'carousel1').length, 30);
  assert.equal(graph.calls.some((c) => c.path === '999/media_publish'), false);
});

test('an Instagram post of a long deck sends ten items', async () => {
  const long = deckOf(['cover', ...Array(9).fill('story'), 'upcoming', 'upcoming', 'subscribe']);
  const graph = fakeGraph();
  await postDeck({ deck: long, record, posted: { facebook: { revision: 2, permalink: 'p' } }, env: withInstagram, confirm: true, fetch: graph.fetch, log: quiet, sleep: noSleep });
  const items = graph.calls.filter((c) => c.path === '999/media' && c.params.is_carousel_item === 'true');
  assert.equal(items.length, 10);
  assert.equal(graph.calls.find((c) => c.params.media_type === 'CAROUSEL').params.children.split(',').length, 10);
});

test('a deck already posted to a platform is skipped, unless forced', async () => {
  const posted = {
    facebook: { id: '111_1', permalink: 'https://www.facebook.com/111/posts/1', posted_at: '2026-10-14T11:00:00Z', revision: 1 },
  };
  const graph = fakeGraph();
  const result = await postDeck({ deck, record, posted, env, confirm: true, fetch: graph.fetch, log: quiet });
  assert.equal(graph.calls.length, 0);
  assert.equal(result.changed, false);
  assert.deepEqual(result.posted, posted);
  assert.match(result.outcome[0].result, /already posted r1/);

  const forced = await postDeck({ deck, record, posted, env, confirm: true, force: true, fetch: fakeGraph().fetch, log: quiet });
  assert.equal(forced.posted.facebook.id, '111_555');
});

test('a dry run makes no Graph call at all, and prints the post per platform', async () => {
  let calls = 0;
  const lines = [];
  const result = await postDeck({
    deck,
    record,
    posted: null,
    env,
    confirm: false,
    fetch: async () => {
      calls += 1;
      throw new Error('a dry run must not fetch');
    },
    log: (line) => lines.push(line),
  });
  assert.equal(calls, 0);
  assert.equal(result.changed, false);
  const out = lines.join('\n');
  assert.match(out, /facebook — DRY RUN, would post as 111/);
  assert.match(out, /instagram — DRY RUN, would post as nobody yet \(no DAYBOOK_IG_USER_ID/);
  assert.match(out, /Today’s Immigration Daybook, free every weekday morning: immigrationdaybook\.com\/en\/2026-10-14/);
  for (const s of deck.slides) assert.ok(out.includes(s.url));
});

test('decks offered for posting: current, in a posted language, not yet posted', () => {
  const planned = [
    {
      date: '2026-10-14',
      langs: [
        { lang: 'en', revision: 2, render: false },
        { lang: 'es', revision: 1, render: false },
      ],
    },
    { date: '2026-10-15', langs: [{ lang: 'en', revision: 1, render: true }] },
  ];
  const rendered = new Set(['2026-10-15/en']);
  assert.deepEqual(postable(planned, rendered, {}, ['en']), [
    { date: '2026-10-14', lang: 'en', revision: 2 },
    { date: '2026-10-15', lang: 'en', revision: 1 },
  ]);
  assert.deepEqual(postable(planned, rendered, { '2026-10-14/en': { facebook: {} } }, ['en', 'es']), [
    { date: '2026-10-14', lang: 'es', revision: 1 },
    { date: '2026-10-15', lang: 'en', revision: 1 },
  ]);
  // A deck whose render failed or was a dry run is not in the bucket, so it is not offered.
  assert.deepEqual(postable(planned, new Set(), {}, ['en']), [{ date: '2026-10-14', lang: 'en', revision: 2 }]);
});

// Both languages post every day (David, 2026-10-15): English, a pause, Spanish.
const esRecord = { ...record, lang: 'es', title: 'Refugiados: 10 días para impugnar', description: 'Entra en vigor una regla final.' };
const esDeck = { ...deck, lang: 'es', slides: deck.slides.map((s) => ({ ...s, url: s.url.replace('/en/', '/es/') })) };
const loadFrom = (bucket) => async ({ date, lang }) => bucket[`${date}/${lang}`] ?? { deck: null, record: null, posted: null };

test('one approved run posts English, waits, then Spanish', async () => {
  const graph = fakeGraph();
  const events = [];
  const fetch = async (url, init) => {
    const res = await graph.fetch(url, init);
    if (new URL(url).pathname.endsWith('/feed')) events.push(`feed ${new URLSearchParams(init.body).get('message').split('\n')[0]}`);
    return res;
  };
  const results = await runPosts({
    // Handed over in the wrong order on purpose: the run sorts them.
    targets: [{ date: '2026-10-14', lang: 'es' }, { date: '2026-10-14', lang: 'en' }],
    load: loadFrom({
      '2026-10-14/en': { deck, record, posted: null },
      '2026-10-14/es': { deck: esDeck, record: esRecord, posted: null },
    }),
    env,
    confirm: true,
    fetch,
    sleep: async (ms) => events.push(`sleep ${ms}`),
    log: quiet,
  });

  assert.deepEqual(events, [
    `feed ${record.title}`,
    `sleep ${PAUSE_MS}`,
    `feed ${esRecord.title}`,
  ]);
  assert.ok(PAUSE_MS >= 120_000 && PAUSE_MS <= 300_000, 'minutes, not hours');
  assert.deepEqual(results.map((r) => r.target.lang), ['en', 'es']);
  const esFeed = graph.calls.filter((c) => c.path === '111/feed')[1].params.message;
  assert.ok(esFeed.endsWith('El Immigration Daybook de hoy, gratis cada mañana entre semana: immigrationdaybook.com/es/2026-10-14'));
  // Each language keeps its own posted.json.
  assert.equal(results[0].posted.facebook.revision, 2);
  assert.equal(results[1].posted.facebook.revision, 2);
  assert.notEqual(results[0], results[1]);
});

test('Spanish arriving late gets its own run, without touching the English record', async () => {
  const enPosted = { facebook: { id: '111_1', permalink: 'https://www.facebook.com/111/posts/1', posted_at: '2026-10-14T11:00:00Z', revision: 2 } };
  const bucket = {
    '2026-10-14/en': { deck, record, posted: enPosted },
    '2026-10-14/es': { deck: esDeck, record: esRecord, posted: null },
  };
  const slept = [];

  // The morning run: only English was ready, and it posted then (enPosted). The
  // later run is handed Spanish alone, since deck-sync offers only unposted decks.
  const graph = fakeGraph();
  const results = await runPosts({
    targets: [{ date: '2026-10-14', lang: 'es' }],
    load: loadFrom(bucket),
    env,
    confirm: true,
    fetch: graph.fetch,
    sleep: async (ms) => slept.push(ms),
    log: quiet,
  });
  assert.equal(slept.length, 0, 'no pause: nothing posted before it in this run');
  assert.equal(results.length, 1);
  assert.equal(results[0].target.lang, 'es');
  assert.ok(results[0].posted.facebook);
  assert.equal(graph.calls.filter((c) => c.path === '111/feed').length, 1);
  assert.deepEqual(bucket['2026-10-14/en'].posted, enPosted, 'English record unchanged');

  // And a run handed both still posts only the Spanish: English is already up.
  const again = fakeGraph();
  const both = await runPosts({
    targets: [{ date: '2026-10-14', lang: 'en' }, { date: '2026-10-14', lang: 'es' }],
    load: loadFrom(bucket),
    env,
    confirm: true,
    fetch: again.fetch,
    sleep: async (ms) => slept.push(ms),
    log: quiet,
  });
  assert.equal(both[0].changed, false);
  assert.equal(slept.length, 0, 'no pause after an English that did not post');
  assert.equal(again.calls.filter((c) => c.path === '111/feed').length, 1);
});

test('a Spanish deck that is not rendered yet is skipped, not failed', async () => {
  const results = await runPosts({
    targets: [{ date: '2026-10-14', lang: 'en' }, { date: '2026-10-14', lang: 'es' }],
    load: loadFrom({ '2026-10-14/en': { deck, record, posted: null } }),
    env,
    confirm: true,
    fetch: fakeGraph().fetch,
    sleep: noSleep,
    log: quiet,
  });
  assert.equal(results[0].changed, true);
  assert.match(results[1].outcome[0].result, /skipped: no deck yet/);
  assert.equal(results[1].outcome[0].failed, undefined);
});

// ── --check ────────────────────────────────────────────────────────────────

const checkEnv = {
  DAYBOOK_FB_PAGE_ID: '111',
  DAYBOOK_META_PAGE_TOKEN: 'page-token-SECRET',
  DAYBOOK_META_APP_SECRET: 'app-secret',
  DAYBOOK_META_APP_ID: '4242',
};

/** A fake Graph API for --check: the Page lookup and debug_token. Anything else, or any POST, fails the test. */
function fakeCheck({ page, debug }) {
  const calls = [];
  const fetch = async (url, init = {}) => {
    assert.equal(init.method, 'GET', '--check only reads');
    const u = new URL(url);
    calls.push({ path: u.pathname.replace(/^\/v25\.0\//, ''), params: Object.fromEntries(u.searchParams) });
    const reply = (json) => ({ ok: true, status: 200, json: async () => json });
    if (u.pathname.endsWith('/111')) return reply(page);
    if (u.pathname.endsWith('/debug_token')) return reply({ data: debug });
    throw new Error(`unexpected ${u.pathname}`);
  };
  return { fetch, calls };
}

test('--check on the first real token: no pages_manage_posts, so Facebook can not post', async () => {
  const graph = fakeCheck({
    page: { id: '111', name: 'Recovered Factory' },
    debug: {
      type: 'PAGE',
      is_valid: true,
      expires_at: 0,
      scopes: ['pages_show_list', 'pages_read_engagement', 'business_management', 'public_profile'],
      granular_scopes: [{ scope: 'pages_show_list', target_ids: ['111'] }],
    },
  });
  const report = await checkAccounts({ env: checkEnv, fetch: graph.fetch });
  assert.equal(report.verdict.facebook.canPost, false);
  assert.match(report.verdict.facebook.reason, /missing pages_manage_posts/);
  assert.equal(report.verdict.instagram.canPost, false);
  assert.match(report.verdict.instagram.reason, /no Instagram business account/);

  // debug_token is asked with the app token, about the Page token.
  const debugCall = graph.calls.find((c) => c.path === 'debug_token');
  assert.equal(debugCall.params.access_token, '4242|app-secret');
  assert.equal(debugCall.params.input_token, 'page-token-SECRET');
  assert.equal(debugCall.params.appsecret_proof, undefined);

  const out = formatCheck(report).join('\n');
  assert.match(out, /facebook: can NOT post — missing pages_manage_posts/);
  assert.match(out, /expires_at never/);
  assert.match(out, /granular: pages_show_list → 111/);
  assert.ok(!out.includes('page-token-SECRET') && !out.includes('app-secret'), 'never prints a secret');
});

test('--check with everything granted: both platforms can post, and the Instagram account matches', async () => {
  const graph = fakeCheck({
    page: { id: '111', name: 'Recovered Factory', instagram_business_account: { id: '999', username: 'recoveredfactory' } },
    debug: {
      type: 'PAGE',
      is_valid: true,
      expires_at: 0,
      data_access_expires_at: 1798761600,
      scopes: ['pages_show_list', 'pages_read_engagement', 'pages_manage_posts', 'business_management', 'instagram_basic', 'instagram_content_publish'],
      granular_scopes: [
        { scope: 'pages_manage_posts', target_ids: ['111'] },
        { scope: 'instagram_content_publish', target_ids: ['999'] },
        { scope: 'instagram_basic', target_ids: ['999'] },
      ],
    },
  });
  const report = await checkAccounts({ env: { ...checkEnv, DAYBOOK_IG_USER_ID: '999' }, fetch: graph.fetch });
  assert.deepEqual(
    [report.verdict.facebook.canPost, report.verdict.instagram.canPost],
    [true, true],
  );
  assert.equal(report.verdict.instagram.account, 'matches DAYBOOK_IG_USER_ID');
  const out = formatCheck(report).join('\n');
  assert.match(out, /Instagram on the Page: @recoveredfactory \(999\) — matches DAYBOOK_IG_USER_ID/);
  assert.match(out, /instagram: CAN post/);

  // The same grants with the wrong account id configured: said plainly.
  const wrong = await checkAccounts({ env: { ...checkEnv, DAYBOOK_IG_USER_ID: '123' }, fetch: graph.fetch });
  assert.match(wrong.verdict.instagram.account, /does NOT match DAYBOOK_IG_USER_ID \(123\)/);
});

test('--check without an app id reports what it can and says the verdicts are unknown', async () => {
  const graph = fakeCheck({ page: { id: '111', name: 'Recovered Factory' }, debug: {} });
  const { DAYBOOK_META_APP_ID, ...env } = checkEnv;
  const report = await checkAccounts({ env, fetch: graph.fetch });
  assert.equal(report.verdict.facebook.canPost, null);
  assert.ok(report.notes.some((n) => /No DAYBOOK_META_APP_ID/.test(n)));
  assert.equal(graph.calls.some((c) => c.path === 'debug_token'), false);
});

// ── --test-post ────────────────────────────────────────────────────────────

const testDeck = {
  ...deck,
  slides: deck.slides.map((s) => ({ ...s, url: s.url.replace('/social/', '/test/social/') })),
};

test('a test post says so, and links to the site rather than an edition that does not exist', () => {
  assert.equal(
    buildCaption(record, { test: true }),
    'Test post: this will be deleted shortly.\n' +
      'Refugees get 10 days to contest status termination\n' +
      'A final work-permit rule takes effect, and San Antonio sues over a proposed detention site.\n\n' +
      'Today’s Immigration Daybook, free every weekday morning: immigrationdaybook.com',
  );
  assert.equal(
    buildCaption({ ...record, lang: 'es', title: 'Refugiados: 10 días para impugnar', description: '' }, { test: true }),
    'Publicación de prueba: se borrará en breve.\n' +
      'Refugiados: 10 días para impugnar\n\n' +
      'El Immigration Daybook de hoy, gratis cada mañana entre semana: immigrationdaybook.com',
  );
});

test('--test-post records posted.json only under test/, and posts the test caption', async () => {
  const graph = fakeGraph();
  const lines = [];
  const results = await runPosts({
    targets: [{ date: '2026-10-14', lang: 'en' }],
    load: async () => ({ deck: testDeck, record, posted: null }),
    env,
    confirm: true,
    testPost: true,
    prefix: '', // ignored: a test post always records in the test mirror
    fetch: graph.fetch,
    sleep: noSleep,
    log: (line) => lines.push(line),
  });
  assert.equal(results[0].key, 'test/social/2026-10-14/en/posted.json');
  assert.match(graph.calls.find((c) => c.path === '111/feed').params.message, /^Test post: this will be deleted shortly\./);
  assert.ok(lines.some((l) => /TEST POST — delete by hand: https:\/\/www\.facebook\.com\/111\/posts\/555/.test(l)));

  const dir = mkdtempSync(join(tmpdir(), 'deck-post-'));
  try {
    assert.deepEqual(writePosted(results, dir), ['test/social/2026-10-14/en/posted.json']);
    assert.ok(existsSync(join(dir, 'test/social/2026-10-14/en/posted.json')));
    assert.equal(existsSync(join(dir, 'social')), false, 'nothing on the live path');
    assert.equal(JSON.parse(readFileSync(join(dir, 'test/social/2026-10-14/en/posted.json'), 'utf8')).facebook.id, '111_555');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('--test-post refuses a deck that is not in the test area', async () => {
  assert.equal(isTestDeck(testDeck), true);
  assert.equal(isTestDeck(deck), false);
  assert.equal(isTestDeck({ ...testDeck, slides: [...testDeck.slides, slide(9, 'story')] }), false, 'one live slide is enough to refuse');

  const graph = fakeGraph();
  const results = await runPosts({
    targets: [{ date: '2026-10-14', lang: 'en' }],
    load: async () => ({ deck, record, posted: null }),
    env,
    confirm: true,
    testPost: true,
    fetch: graph.fetch,
    sleep: noSleep,
    log: quiet,
  });
  assert.equal(graph.calls.length, 0, 'no Graph call for a live deck');
  assert.match(results[0].outcome[0].result, /not a test-area deck/);
  assert.equal(results[0].outcome[0].failed, true);

  // And on the command line, before anything is fetched.
  const script = join(dirname(fileURLToPath(import.meta.url)), 'deck-post.mjs');
  const cli = spawnSync('node', [script, '--test-post', '--confirm', '--deck', 'https://bucket.s3.amazonaws.com/social/2026-10-14/en/deck.json'], { encoding: 'utf8' });
  assert.equal(cli.status, 1);
  assert.match(cli.stderr, /--test-post takes only a deck from the test area/);
});
