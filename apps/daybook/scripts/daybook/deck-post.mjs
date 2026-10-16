#!/usr/bin/env node
// Post rendered Immigration Daybook decks to the Daybook's Facebook Page, and to
// its Instagram account once one is linked. A dry run unless --confirm.
//
// Usage: node scripts/daybook/deck-post.mjs (--postable <json> | --date YYYY-MM-DD --lang en|es | --deck <url>)
//                                           [--test | --test-post] [--confirm] [--force] [--record-dir <dir>]
//                                           [--base <url>] [--pause-seconds <n>]
//        node scripts/daybook/deck-post.mjs --check
//   --postable    the decks to post, as deck-sync.mjs's `postable` output: [{date, lang}, …]
//   --date/--lang one deck by name; --deck one deck by its manifest URL
//   --test        read the bucket's test/ mirror. A test deck is never posted, only dry-run.
//   --test-post   a REAL post of a deck from the test/ mirror, to the live accounts, for
//                 checking the path end to end. With --confirm it posts. The caption says it
//                 is a test, links to the site's home page, and the permalinks print with
//                 "delete by hand". Its posted.json goes under test/social/, never the live path.
//   --check       read-only: the Page, its Instagram account, the token's scopes, and whether
//                 each platform can post. Never posts; always exits 0.
//   --confirm     post. Without it, print exactly what would be posted and make no Graph call.
//   --force       post to a platform even when posted.json says it already has this deck
//   --record-dir  where each updated posted.json is written (see below); default: not written
//   --base        the bucket's base URL; default $DAYBOOK_EDITIONS_URL, then the production bucket
//   --pause-seconds  the wait between a date's English post and its Spanish one; default 180
//
// Both languages post every day to the same consolidated accounts (David,
// 2026-10-15): English first, then Spanish a few minutes later, in the same
// run. A deck posts only once David's broadcast lock marks its language
// (deck-sync.mjs decides what is offered). A Spanish deck that was not ready
// when its English one posted gets its own run once it is; posted.json is per
// language, so the two never get in each other's way.
//
// Credentials come from the environment, which the workflow fills from the
// GitHub environment `social` (written by meta-auth.mjs, or set by hand):
//   DAYBOOK_META_SYSTEM_TOKEN                     a Business Settings system user token,
//                                                 which never expires. When set it wins:
//                                                 the Page token is derived from it at run
//                                                 time (GET /{page}?fields=access_token,…),
//                                                 Facebook posts with that Page token, and
//                                                 Instagram publishes with the system token.
//   DAYBOOK_FB_PAGE_ID                            the Page. With a system token and no id,
//                                                 the Page named "Recovered Factory" in
//                                                 /me/accounts is used, or the run fails.
//   DAYBOOK_META_PAGE_TOKEN                       the older route: a Page token, used only
//                                                 when there is no system token
//   DAYBOOK_META_APP_SECRET                       for appsecret_proof, when present
//   DAYBOOK_META_APP_ID                           with the secret, lets --check read the
//                                                 token's scopes (debug_token)
//   DAYBOOK_IG_USER_ID                            the linked Instagram account. With a
//                                                 system token and no id, the Page's own
//                                                 instagram_business_account is used.
//
// What was posted is kept beside the deck as social/{date}/{lang}/posted.json:
// `{facebook: {id, permalink, posted_at, revision}, instagram: {…}}`. A platform
// that is in it is never posted to again for that date and language, a
// republished revision included, unless --force. This script reads that file
// from the bucket but does not write it there: the posting job runs in the
// `social` environment, which the deck role does not trust, so it writes the
// merged file under --record-dir at its bucket key ({record-dir}/social/… or
// {record-dir}/test/social/…) and a follow-up job uploads it. See the workflow.
//
// The caption is built from the record, never by a model: title, description,
// and the line that says where to read it.

import { createHmac } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { pathToFileURL } from 'node:url';

import { trimToClause } from './deck.mjs';
import { DEFAULT_BASE, prefixFor } from './deck-sync.mjs';

export const GRAPH_VERSION = 'v25.0';

// Instagram's carousel ceiling: "Carousels are limited to 10 images, videos,
// or a mix of the two" (developers.facebook.com/docs/instagram-platform/
// content-publishing, read 2026-10-15). Facebook's multi-photo post has no such
// cut at this deck's length.
export const INSTAGRAM_MAX_ITEMS = 10;

// Instagram's caption limit; Facebook's is far higher, so one caption serves both.
export const CAPTION_MAX = 2200;

// A carousel container is ready when its status_code is FINISHED. Meta suggests
// checking about once a minute for no more than five; images are usually done
// in seconds, so poll faster but stop at the same five minutes.
const POLL_MS = 10_000;
const POLL_MAX = 30;

// Between a date's English post and its Spanish one, so the two don't land in
// the feed as a pair. Minutes, not hours: one run posts both.
export const PAUSE_MS = 180_000;

// The order a date's decks post in. English is the edition; Spanish is its
// translation and follows it.
const LANG_ORDER = ['en', 'es'];

const SITE = 'immigrationdaybook.com';

const READ_LINE = {
  en: (link) => `Today’s Immigration Daybook, free every weekday morning: ${link}`,
  es: (link) => `El Immigration Daybook de hoy, gratis cada mañana entre semana: ${link}`,
};

// The first line of a --test-post caption, so nobody who sees it before it is
// deleted takes it for an edition.
const TEST_LINE = {
  en: 'Test post: this will be deleted shortly.',
  es: 'Publicación de prueba: se borrará en breve.',
};

// ── Pure parts (tested in deck-post.test.mjs) ─────────────────────────────

/**
 * The post's caption: the title, the description, and where to read the
 * edition. Under CAPTION_MAX, the description gives way first, cut at a
 * sentence or clause; the title and the link line are never cut.
 *
 * A test post opens on a line saying so, and links to the site's home page:
 * a test edition does not exist on the live site, so its date path would 404.
 */
export function buildCaption(record, { test = false, max = CAPTION_MAX } = {}) {
  const lang = record.lang === 'es' ? 'es' : 'en';
  const title = record.title.trim();
  const head = test ? `${TEST_LINE[lang]}\n${title}` : title;
  const read = READ_LINE[lang](test ? SITE : `${SITE}/${lang}/${record.date}`);
  const fixed = `${head}\n\n${read}`;

  let description = (record.description ?? '').trim();
  const room = max - fixed.length - 1; // the newline under the title
  if (description && description.length > room) description = room > 40 ? trimToClause(description, room - 1) : '';

  const caption = description ? `${head}\n${description}\n\n${read}` : fixed;
  return caption.length <= max ? caption : `${caption.slice(0, max - 1).replace(/\s+\S*$/, '')}…`;
}

/**
 * The deck cut to Instagram's ceiling. Stories come off the end first, as
 * record-deck.mjs cuts at 20, so the calendar survives; then the subscribe
 * plate; only then, and loudly, the end of the calendar.
 */
export function fitInstagram(slides, max = INSTAGRAM_MAX_ITEMS) {
  const kept = [...slides];
  const dropped = [];
  const removeLast = (test) => {
    for (let i = kept.length - 1; i > 0; i -= 1) {
      if (test(kept[i])) return dropped.push(...kept.splice(i, 1));
    }
    return 0;
  };
  while (kept.length > max && removeLast((s) => s.name === 'story'));
  while (kept.length > max && removeLast((s) => s.name === 'subscribe'));
  while (kept.length > max) dropped.push(kept.pop());
  return { slides: kept, dropped };
}

/** Which platforms this deck should go to, given the resolved credentials and what posted.json already holds. */
export function choosePlatforms(creds, posted, { force = false } = {}) {
  return Object.keys(PLATFORMS).map((name) => {
    const account = creds.accounts[name];
    if (!account) return { name, action: 'skip', reason: creds.missing[name], unconfigured: true };
    if (posted?.[name] && !force) {
      return { name, action: 'skip', reason: `already posted r${posted[name].revision}: ${posted[name].permalink}` };
    }
    return { name, action: 'post', account };
  });
}

/** A Graph API client over an injectable fetch. Every call carries the token, and appsecret_proof when the secret is set. */
export function graphClient({ token, appSecret, fetch = globalThis.fetch, version = GRAPH_VERSION }) {
  const base = `https://graph.facebook.com/${version}`;
  const auth = { access_token: token, ...(appSecret ? { appsecret_proof: createHmac('sha256', appSecret).update(token).digest('hex') } : {}) };
  const call = async (method, path, params) => {
    const body = new URLSearchParams({ ...params, ...auth });
    const res =
      method === 'GET'
        ? await fetch(`${base}/${path}?${body}`, { method })
        : await fetch(`${base}/${path}`, { method, body });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || json.error) throw new Error(`${method} ${path}: ${json.error?.message ?? `HTTP ${res.status}`}`);
    return json;
  };
  return {
    get: (path, fields, params = {}) => call('GET', path, { ...(fields ? { fields } : {}), ...params }),
    post: (path, params) => call('POST', path, params),
  };
}

// ── Platforms ──────────────────────────────────────────────────────────────
// One entry per place a deck goes: who it posts as (null when not configured)
// and how. Threads joins here when its account exists, with its own token
// (graph.threads.net, a container per image, then a CAROUSEL container, then
// threads_publish) — the same shape as Instagram's.

export const PLATFORMS = {
  facebook: { slides: (slides) => ({ slides, dropped: [] }), post: postFacebook },
  instagram: { slides: (slides) => fitInstagram(slides), post: postInstagram },
};

// ── Credentials ────────────────────────────────────────────────────────────

const PAGE_NAME = 'Recovered Factory';
const PAGE_FIELDS = 'access_token,name,instagram_business_account{id,username}';

/**
 * Who posts, and with which token: `{mode, page, igAccount, igSource, notes,
 * accounts: {facebook, instagram}, missing}`. An account is `{id, token,
 * appSecret}`, or null with the reason in `missing`.
 *
 * With DAYBOOK_META_SYSTEM_TOKEN (it wins over a Page token): the Page and its
 * token are read with it, Facebook uses that Page token, and Instagram the
 * system token. Facebook Login for Business can't grant the posting
 * permissions to a user token (its configurations offer only
 * business_management and pages_show_list), so a system user is the route.
 * Without one, the Page token is used for both, as before, and nothing is
 * fetched. Never logs a token.
 */
export async function resolveCredentials({ env, fetch = globalThis.fetch, log = () => {}, version = GRAPH_VERSION }) {
  const appSecret = env.DAYBOOK_META_APP_SECRET || undefined;
  const system = env.DAYBOOK_META_SYSTEM_TOKEN || null;

  if (!system) {
    const token = env.DAYBOOK_META_PAGE_TOKEN || null;
    const pageId = env.DAYBOOK_FB_PAGE_ID || null;
    const igId = env.DAYBOOK_IG_USER_ID || null;
    return {
      mode: 'page',
      page: pageId ? { id: pageId, name: null } : null,
      igAccount: null,
      igSource: igId ? 'env' : null,
      notes: [],
      accounts: {
        facebook: pageId && token ? { id: pageId, token, appSecret } : null,
        instagram: igId && token ? { id: igId, token, appSecret } : null,
      },
      missing: {
        facebook: 'no DAYBOOK_FB_PAGE_ID / DAYBOOK_META_PAGE_TOKEN',
        instagram: 'no DAYBOOK_IG_USER_ID; no Instagram account is linked yet',
      },
    };
  }

  const api = graphClient({ token: system, appSecret, fetch, version });
  let page;
  if (env.DAYBOOK_FB_PAGE_ID) {
    page = { id: env.DAYBOOK_FB_PAGE_ID, ...(await api.get(env.DAYBOOK_FB_PAGE_ID, PAGE_FIELDS)) };
  } else {
    const { data = [] } = await api.get('me/accounts', `id,${PAGE_FIELDS}`);
    const named = data.filter((p) => (p.name ?? '').trim().toLowerCase() === PAGE_NAME.toLowerCase());
    if (named.length !== 1) {
      const list = data.map((p) => `${p.id} "${p.name}"`).join('; ') || 'none';
      throw new Error(
        `DAYBOOK_FB_PAGE_ID is not set, and ${named.length ? 'more than one' : 'none'} of the system user's Pages ` +
          `is named "${PAGE_NAME}". Its Pages: ${list}. Set DAYBOOK_FB_PAGE_ID.`,
      );
    }
    page = named[0];
    log(`No DAYBOOK_FB_PAGE_ID: using the Page "${page.name}" (${page.id}) from the system user's Pages.`);
  }

  const pageId = String(page.id);
  const igAccount = page.instagram_business_account ?? null;
  let igId = env.DAYBOOK_IG_USER_ID || null;
  let igSource = igId ? 'env' : null;
  if (!igId && igAccount) {
    igId = String(igAccount.id);
    igSource = 'page';
    log(`No DAYBOOK_IG_USER_ID: using the Page's Instagram account @${igAccount.username ?? '?'} (${igAccount.id}).`);
  }

  const notes = [];
  if (!page.access_token) {
    notes.push(`The system user got no Page token for ${pageId}: assign it to the Page in Business Settings, with content permissions.`);
  }

  return {
    mode: 'system',
    page: { id: pageId, name: page.name ?? null },
    igAccount,
    igSource,
    notes,
    accounts: {
      facebook: page.access_token ? { id: pageId, token: page.access_token, appSecret } : null,
      // Instagram publishes with the system token itself, as Meta's docs show for a system user.
      instagram: igId ? { id: igId, token: system, appSecret } : null,
    },
    missing: {
      facebook: `no Page token for ${pageId} from the system user`,
      instagram: 'no DAYBOOK_IG_USER_ID, and no Instagram account on the Page',
    },
  };
}

/**
 * Facebook: each slide uploaded to the Page unpublished, then one feed post
 * carrying them all. The upload's `id` is the photo, which is what
 * attached_media takes; its `post_id` is a feed story and is not.
 */
export async function postFacebook({ api, account, caption, slides }) {
  const photos = [];
  for (const slide of slides) {
    const photo = await api.post(`${account.id}/photos`, { url: slide.url, published: 'false' });
    photos.push(photo.id);
  }
  const params = { message: caption };
  photos.forEach((id, i) => {
    params[`attached_media[${i}]`] = JSON.stringify({ media_fbid: id });
  });
  const post = await api.post(`${account.id}/feed`, params);
  const { permalink_url: permalink } = await api.get(post.id, 'permalink_url');
  return { id: post.id, permalink: permalink ?? `https://www.facebook.com/${post.id}` };
}

/**
 * Instagram: an item container per slide, a CAROUSEL container over them with
 * the caption, a bounded wait for it to finish, then publish.
 */
export async function postInstagram({ api, account, caption, slides, sleep = defaultSleep, pollMs = POLL_MS, pollMax = POLL_MAX }) {
  const children = [];
  for (const slide of slides) {
    const item = await api.post(`${account.id}/media`, { image_url: slide.url, is_carousel_item: 'true' });
    children.push(item.id);
  }
  const carousel = await api.post(`${account.id}/media`, { media_type: 'CAROUSEL', children: children.join(','), caption });

  let status = null;
  for (let i = 0; i < pollMax; i += 1) {
    ({ status_code: status } = await api.get(carousel.id, 'status_code'));
    if (status === 'FINISHED') break;
    if (status === 'ERROR' || status === 'EXPIRED') throw new Error(`Instagram container ${carousel.id} is ${status}`);
    await sleep(pollMs);
  }
  if (status !== 'FINISHED') {
    throw new Error(`Instagram container ${carousel.id} not ready after ${(pollMax * pollMs) / 1000}s (last status ${status})`);
  }

  const published = await api.post(`${account.id}/media_publish`, { creation_id: carousel.id });
  const { permalink } = await api.get(published.id, 'permalink');
  return { id: published.id, permalink: permalink ?? null };
}

const defaultSleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Post one deck everywhere it is due. Returns the merged posted.json and the
 * per-platform outcome; never throws for one platform's failure, so what did
 * post is still recorded.
 */
export async function postDeck({ deck, record, posted, env, creds, confirm, force = false, test = false, fetch = globalThis.fetch, now = () => new Date(), log = console.log, sleep }) {
  const caption = buildCaption(record, { test });
  const outcome = [];
  const merged = { ...(posted ?? {}) };
  const accounts = creds ?? (await resolveCredentials({ env, fetch, log }));

  for (const choice of choosePlatforms(accounts, posted, { force })) {
    // A dry run still previews a platform that has no account yet, so the
    // caption and slides can be checked before the credentials exist.
    if (choice.action === 'skip' && (confirm || !choice.unconfigured)) {
      log(`${deck.date} ${deck.lang} ${choice.name}: skip (${choice.reason}).`);
      outcome.push({ platform: choice.name, result: `skipped: ${choice.reason}` });
      continue;
    }

    const platform = PLATFORMS[choice.name];
    const { slides, dropped } = platform.slides(deck.slides);
    if (dropped.length) {
      log(`WARNING: ${deck.date} ${deck.lang} ${choice.name}: ${deck.slides.length} slides is past its limit; ` + `left off ${dropped.map((s) => s.name).join(', ')}.`);
    }

    if (!confirm) {
      const who = choice.account ? choice.account.id : `nobody yet (${choice.reason})`;
      log(`\n${deck.date} ${deck.lang} ${choice.name} — DRY RUN, would post as ${who}:`);
      log('  caption:');
      for (const line of caption.split('\n')) log(`    ${line}`);
      log(`  ${slides.length} slides, in order:`);
      slides.forEach((slide, i) => log(`    ${i + 1}. ${slide.name}  ${slide.url}`));
      outcome.push({ platform: choice.name, result: `dry run${choice.account ? '' : ' (not configured)'}: ${slides.length} slides` });
      continue;
    }

    try {
      const api = graphClient({ token: choice.account.token, appSecret: choice.account.appSecret, fetch });
      const done = await platform.post({ api, account: choice.account, caption, slides, ...(sleep ? { sleep } : {}) });
      merged[choice.name] = { id: done.id, permalink: done.permalink, posted_at: now().toISOString(), revision: deck.revision };
      log(`${deck.date} ${deck.lang} ${choice.name}: posted ${done.id} ${done.permalink ?? ''}`);
      if (test) log(`  TEST POST — delete by hand: ${done.permalink ?? `${choice.name} post ${done.id}`}`);
      outcome.push({ platform: choice.name, result: `${test ? 'TEST posted (delete by hand)' : 'posted'}: ${done.permalink ?? done.id}` });
    } catch (err) {
      log(`${deck.date} ${deck.lang} ${choice.name}: FAILED: ${err.message}`);
      outcome.push({ platform: choice.name, result: `FAILED: ${err.message}`, failed: true });
    }
  }

  return { posted: merged, outcome, changed: confirm && outcome.some((o) => /^(TEST )?posted/.test(o.result)) };
}

/** Decks in posting order: by date, English before Spanish. */
export function orderTargets(targets) {
  const rank = (lang) => (LANG_ORDER.includes(lang) ? LANG_ORDER.indexOf(lang) : LANG_ORDER.length);
  return [...targets].sort((a, b) => a.date.localeCompare(b.date) || rank(a.lang) - rank(b.lang));
}

/**
 * Post a run's decks in order. `load` reads one deck's manifest, record and
 * posted.json; a Spanish deck that follows its English one on the same date
 * waits `pauseMs` first, but only when the English actually posted. A deck
 * whose record has moved past it is not posted: the caption and the slides
 * would disagree.
 */
export async function runPosts({ targets, load, env, confirm, force = false, testPost = false, prefix = '', fetch, sleep = defaultSleep, pauseMs = PAUSE_MS, log = console.log, now }) {
  const results = [];
  let previous = null;
  // A test post reads and records only in the test/ mirror, whatever it is handed.
  const area = testPost ? prefixFor(true) : prefix;

  // Credentials once a run. With a system token this reads the Page (a GET,
  // never a post); a failure fails every deck in the run, loudly.
  let creds = null;
  let credsError = null;
  try {
    creds = await resolveCredentials({ env, fetch, log });
    for (const note of creds.notes) log(`Note: ${note}`);
  } catch (err) {
    credsError = `credentials: ${err.message}`;
    log(credsError);
  }

  for (const target of orderTargets(targets)) {
    const key = postedKey(area, target.date, target.lang);
    if (credsError) {
      results.push({ target, key, outcome: [{ platform: '—', result: `FAILED: ${credsError}`, failed: true }], changed: false });
      continue;
    }
    const { deck, record, posted } = await load(target);
    if (!deck || !record) {
      log(`${target.date} ${target.lang}: no ${deck ? 'record' : 'deck'} yet; skipped.`);
      results.push({ target, key, outcome: [{ platform: '—', result: `skipped: no ${deck ? 'record' : 'deck'} yet` }], changed: false });
      continue;
    }
    if (Number(record.revision) !== Number(deck.revision)) {
      const reason = `the deck is r${deck.revision} but the record is r${record.revision}; wait for the re-render`;
      log(`${target.date} ${target.lang}: ${reason}.`);
      results.push({ target, key, deck, outcome: [{ platform: '—', result: `FAILED: ${reason}`, failed: true }], changed: false });
      continue;
    }
    // A real post of a test deck must be a test deck all the way down: every
    // slide it would hand Meta has to live in the test/ mirror.
    if (testPost && !isTestDeck(deck)) {
      const reason = 'not a test-area deck (every slide must be under test/social/); refusing to test-post it';
      log(`${target.date} ${target.lang}: ${reason}.`);
      results.push({ target, key, deck, outcome: [{ platform: '—', result: `FAILED: ${reason}`, failed: true }], changed: false });
      continue;
    }

    const follows = previous && previous.date === target.date && previous.lang === 'en' && target.lang !== 'en';
    if (follows && previous.changed) {
      log(`Waiting ${Math.round(pauseMs / 60_000)} min before the ${target.lang} post.`);
      await sleep(pauseMs);
    } else if (follows && !confirm) {
      log(`(A confirmed run waits ${Math.round(pauseMs / 60_000)} min here before the ${target.lang} post.)`);
    }

    log(`\nDeck ${deck.date} ${deck.lang} r${deck.revision}, ${deck.slides.length} slides${confirm ? '' : ' — dry run'}.`);
    const result = await postDeck({ deck, record, posted, creds, confirm, force, test: testPost, fetch, log, now, sleep });
    results.push({ target, key, deck, ...result });
    previous = { ...target, changed: result.changed };
  }
  return results;
}

/** Where a deck's posted.json lives in the bucket. */
export const postedKey = (prefix, date, lang) => `${prefix}social/${date}/${lang}/posted.json`;

/** A deck whose every slide is in the test/ mirror. */
export function isTestDeck(deck) {
  return (
    Array.isArray(deck?.slides) &&
    deck.slides.length > 0 &&
    deck.slides.every((slide) => {
      try {
        return new URL(slide.url).pathname.startsWith('/test/social/');
      } catch {
        return false;
      }
    })
  );
}

/**
 * Each changed posted.json, written under `dir` at its own bucket key, for the
 * record job to upload as is. Returns the keys written.
 */
export function writePosted(results, dir) {
  const keys = [];
  for (const result of results) {
    if (!result.changed) continue;
    const path = join(dir, result.key);
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, JSON.stringify(result.posted, null, 2));
    keys.push(result.key);
  }
  return keys;
}

// ── --check ────────────────────────────────────────────────────────────────

const FACEBOOK_SCOPES = ['pages_manage_posts'];
const INSTAGRAM_SCOPES = ['instagram_basic', 'instagram_content_publish'];

/**
 * What the credentials can do, read-only: the Page and the Instagram account
 * linked to it, the scopes of the token in use (debug_token, which needs the
 * app id and secret), and a verdict per platform. With a system token, that is
 * the token debugged, and the Page token is derived but never shown. Never
 * posts, never prints a token, and never throws for a failed lookup: it
 * reports it.
 */
export async function checkAccounts({ env, fetch = globalThis.fetch, version = GRAPH_VERSION }) {
  const system = env.DAYBOOK_META_SYSTEM_TOKEN || null;
  const token = system || env.DAYBOOK_META_PAGE_TOKEN || null;
  const report = {
    mode: system ? 'system' : 'page',
    page: null,
    instagram: null,
    igEnv: env.DAYBOOK_IG_USER_ID || null,
    igSource: null,
    pageToken: null,
    token: null,
    notes: [],
    verdict: {},
  };

  if (!token || (!system && !env.DAYBOOK_FB_PAGE_ID)) {
    const reason = 'no DAYBOOK_META_SYSTEM_TOKEN, and no DAYBOOK_FB_PAGE_ID / DAYBOOK_META_PAGE_TOKEN';
    report.verdict = { facebook: { canPost: false, reason }, instagram: { canPost: false, reason } };
    return report;
  }

  if (system) {
    try {
      const creds = await resolveCredentials({ env, fetch, version, log: (line) => report.notes.push(line) });
      report.page = creds.page;
      report.instagram = creds.igAccount;
      report.igSource = creds.igSource;
      report.pageToken = Boolean(creds.accounts.facebook);
      report.notes.push(...creds.notes);
    } catch (err) {
      report.notes.push(`Page lookup failed: ${err.message}`);
    }
  } else {
    const api = graphClient({ token, appSecret: env.DAYBOOK_META_APP_SECRET, fetch, version });
    try {
      const page = await api.get(env.DAYBOOK_FB_PAGE_ID, 'name,instagram_business_account{id,username}');
      report.page = { id: page.id ?? env.DAYBOOK_FB_PAGE_ID, name: page.name ?? null };
      report.instagram = page.instagram_business_account ?? null;
      report.igSource = report.igEnv ? 'env' : null;
    } catch (err) {
      report.notes.push(`Page lookup failed: ${err.message}`);
    }
  }

  if (env.DAYBOOK_META_APP_ID && env.DAYBOOK_META_APP_SECRET) {
    // An app token (id|secret) is how debug_token is asked; it takes no appsecret_proof.
    const app = graphClient({ token: `${env.DAYBOOK_META_APP_ID}|${env.DAYBOOK_META_APP_SECRET}`, fetch, version });
    try {
      const { data = {} } = await app.get('debug_token', null, { input_token: token });
      report.token = {
        type: data.type ?? null,
        is_valid: data.is_valid ?? null,
        expires_at: data.expires_at ?? null,
        data_access_expires_at: data.data_access_expires_at ?? null,
        scopes: data.scopes ?? [],
        granular_scopes: (data.granular_scopes ?? []).map((g) => ({ scope: g.scope, target_ids: g.target_ids ?? [] })),
      };
    } catch (err) {
      report.notes.push(`debug_token failed: ${err.message}`);
    }
  } else {
    report.notes.push('No DAYBOOK_META_APP_ID: the token\'s scopes can\'t be read, so neither verdict is certain.');
  }

  report.verdict = verdicts(report, report.page?.id ?? env.DAYBOOK_FB_PAGE_ID);
  return report;
}

function verdicts(report, pageId) {
  const scopes = report.token?.scopes ?? null;
  const missing = (wanted) => wanted.filter((scope) => !scopes.includes(scope));
  const grantedFor = (scope, id) => {
    const grant = report.token.granular_scopes.find((g) => g.scope === scope);
    return !grant || !grant.target_ids.length || grant.target_ids.includes(String(id));
  };

  let facebook;
  if (report.mode === 'system' && report.pageToken === false) facebook = { canPost: false, reason: 'the system user got no Page token for this Page' };
  else if (report.mode === 'system' && !report.page) facebook = { canPost: false, reason: 'the Page could not be read with the system token' };
  else if (!scopes) facebook = { canPost: null, reason: 'unknown: the token\'s scopes could not be read' };
  else if (report.token.is_valid === false) facebook = { canPost: false, reason: 'the token is not valid' };
  else if (missing(FACEBOOK_SCOPES).length) facebook = { canPost: false, reason: `missing ${missing(FACEBOOK_SCOPES).join(', ')}` };
  else if (!grantedFor('pages_manage_posts', pageId)) facebook = { canPost: false, reason: `pages_manage_posts is not granted for Page ${pageId}` };
  else facebook = { canPost: true, reason: 'pages_manage_posts granted' };

  const ig = report.instagram;
  const account = !ig
    ? null
    : report.igEnv
      ? report.igEnv === String(ig.id)
        ? 'matches DAYBOOK_IG_USER_ID'
        : `does NOT match DAYBOOK_IG_USER_ID (${report.igEnv})`
      : report.mode === 'system'
        ? 'DAYBOOK_IG_USER_ID is not set; posting uses this account, from the Page'
        : 'DAYBOOK_IG_USER_ID is not set, so the post job skips Instagram until it is';
  let instagram;
  if (!ig) instagram = { canPost: false, reason: 'the Page has no Instagram business account' };
  else if (!scopes) instagram = { canPost: null, reason: 'unknown: the token\'s scopes could not be read' };
  else if (report.token.is_valid === false) instagram = { canPost: false, reason: 'the token is not valid' };
  else if (missing(INSTAGRAM_SCOPES).length) instagram = { canPost: false, reason: `missing ${missing(INSTAGRAM_SCOPES).join(', ')}` };
  else instagram = { canPost: true, reason: 'instagram_basic and instagram_content_publish granted' };
  if (account) instagram.account = account;

  return { facebook, instagram };
}

/** The check, as lines: never a token itself. */
export function formatCheck(report) {
  const when = (t) => (t === 0 ? 'never' : t ? new Date(t * 1000).toISOString() : 'unknown');
  const yes = (v) => (v === true ? 'CAN post' : v === false ? 'can NOT post' : 'unknown');
  const lines = ['Meta check (read-only; nothing is posted)'];
  lines.push(
    `Token in use: ${report.mode === 'system' ? 'system user token (DAYBOOK_META_SYSTEM_TOKEN)' : 'Page token (DAYBOOK_META_PAGE_TOKEN)'}` +
      (report.mode === 'system' ? `; Page token derived: ${report.pageToken === null ? 'not tried' : report.pageToken ? 'yes' : 'NO'}` : ''),
  );
  lines.push(`Page: ${report.page ? `${report.page.name ?? '?'} (${report.page.id})` : 'not read'}`);
  lines.push(
    `Instagram on the Page: ${report.instagram ? `@${report.instagram.username ?? '?'} (${report.instagram.id})` : 'none'}` +
      (report.verdict.instagram?.account ? ` — ${report.verdict.instagram.account}` : ''),
  );
  if (report.token) {
    const t = report.token;
    lines.push(`Token: type ${t.type ?? '?'}, is_valid ${t.is_valid}, expires_at ${when(t.expires_at)}, data access until ${when(t.data_access_expires_at)}`);
    lines.push(`  scopes: ${t.scopes.join(', ') || '(none)'}`);
    for (const g of t.granular_scopes) lines.push(`  granular: ${g.scope} → ${g.target_ids.join(', ') || '(all)'}`);
  }
  for (const note of report.notes) lines.push(`Note: ${note}`);
  lines.push('Verdict:');
  for (const [name, v] of Object.entries(report.verdict)) lines.push(`  ${name}: ${yes(v.canPost)} — ${v.reason}`);
  return lines;
}

// ── The run ────────────────────────────────────────────────────────────────

async function main() {
  const argv = process.argv.slice(2);
  const value = (name) => {
    const i = argv.indexOf(name);
    return i === -1 ? null : argv[i + 1];
  };
  if (argv.includes('--check')) {
    // A report, not a gate: exit 0 whatever it finds.
    const report = await checkAccounts({ env: process.env });
    const lines = formatCheck(report);
    console.log(lines.join('\n'));
    if (process.env.GITHUB_STEP_SUMMARY) {
      writeFileSync(process.env.GITHUB_STEP_SUMMARY, `### Meta check\n\n\`\`\`\n${lines.join('\n')}\n\`\`\`\n`, { flag: 'a' });
    }
    return;
  }

  const test = argv.includes('--test');
  const testPost = argv.includes('--test-post');
  const confirm = argv.includes('--confirm');
  const force = argv.includes('--force');
  const base = (value('--base') ?? process.env.DAYBOOK_EDITIONS_URL ?? DEFAULT_BASE).replace(/\/+$/, '');
  const prefix = prefixFor(test || testPost);
  const pauseMs = value('--pause-seconds') ? Number(value('--pause-seconds')) * 1000 : PAUSE_MS;

  if (test && confirm) throw new Error('A test deck is never posted. Drop --confirm for a dry run, or use --test-post.');
  if (test && testPost) throw new Error('--test and --test-post are two different things; pick one.');
  if (testPost && value('--deck') && !new URL(value('--deck')).pathname.startsWith('/test/social/')) {
    throw new Error(`--test-post takes only a deck from the test area (test/social/…); ${value('--deck')} is not one.`);
  }

  let targets;
  if (value('--postable')) {
    targets = JSON.parse(value('--postable')).map(({ date, lang }) => ({ date, lang }));
  } else if (value('--date') && value('--lang')) {
    targets = [{ date: value('--date'), lang: value('--lang') }];
  } else if (value('--deck')) {
    const deck = await getJson(value('--deck'));
    if (!deck) throw new Error(`No deck at ${value('--deck')}.`);
    targets = [{ date: deck.date, lang: deck.lang }];
  } else {
    throw new Error('Name the decks: --postable <json>, --date and --lang, or --deck <url>.');
  }
  if (!targets.length) {
    console.log('Nothing to post.');
    return;
  }

  const load = async ({ date, lang }) => ({
    deck: await getJson(`${base}/${prefix}social/${date}/${lang}/deck.json`),
    record: await getJson(`${base}/${prefix}editions/${date}/${lang}.json`),
    posted: await getJson(`${base}/${prefix}social/${date}/${lang}/posted.json`),
  });
  const results = await runPosts({ targets, load, env: process.env, confirm, force, testPost, prefix, pauseMs });

  const recordDir = value('--record-dir');
  if (recordDir) {
    for (const key of writePosted(results, recordDir)) console.log(`Wrote ${join(recordDir, key)} for ${key}.`);
  }
  for (const result of results) summarize(result.target, result.deck, result.outcome, confirm, testPost);
  if (results.some((result) => result.outcome.some((o) => o.failed))) process.exit(1);
}

async function getJson(url) {
  const res = await fetch(url, { headers: { 'cache-control': 'no-cache' } });
  if (res.status === 403 || res.status === 404) return null;
  if (!res.ok) throw new Error(`GET ${url}: HTTP ${res.status}`);
  return res.json();
}

function summarize(target, deck, outcome, confirm, testPost = false) {
  const path = process.env.GITHUB_STEP_SUMMARY;
  if (!path) return;
  const lines = [
    `### Daybook ${testPost ? 'TEST post (delete by hand)' : 'post'} — ${target.date} ${target.lang}${deck ? ` r${deck.revision}` : ''}${confirm ? '' : ', dry run'}`,
    '',
    '| Platform | Result |',
    '|---|---|',
    ...outcome.map((o) => `| ${o.platform} | ${o.result} |`),
    '',
  ];
  writeFileSync(path, `${lines.join('\n')}\n`, { flag: 'a' });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
}
