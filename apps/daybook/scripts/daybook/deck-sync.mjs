#!/usr/bin/env node
// Render each published Immigration Daybook edition's social deck into the
// editions bucket. Run by .github/workflows/daybook-deck.yml on a schedule.
//
// Usage: node scripts/daybook/deck-sync.mjs [--test] [--date YYYY-MM-DD] [--dry-run]
//                                           [--base <url>] [--bucket <name>] [--work <dir>]
//                                           [--post-langs en[,es]] [--test-post]
//   --test     read test/editions/…, write test/social/… (the bucket's rehearsal mirror)
//   --date     that edition date only; default today and yesterday in America/Bogota
//   --dry-run  render, but upload nothing; print the keys and the manifest instead
//   --base     the bucket's base URL; default $DAYBOOK_EDITIONS_URL, then the production bucket
//   --bucket   the bucket uploads go to; default the one in --base's hostname
//   --work     where records, deck JSON and PNGs go; default a fresh temp directory
//   --post-langs  which languages' decks to offer for posting; default en,es (see below)
//   --test-post   a manual test post: the test area (implies --test), and the broadcast
//                 mark does not gate what is offered for posting
//
// The contract is news-ingester's docs/EDITIONS.md. In short: the index
// (editions/index.json) says what is published and at which revision; a deck
// is rendered from the records and written to
// social/{date}/{lang}/r{revision}/{NN}-{name}.jpg, immutable; and LAST,
// once every slide is up, social/{date}/{lang}/deck.json points at them.
//
// A language is rendered only when its deck.json is missing or carries an
// older revision than the index. So a rerun with nothing new reads the index
// and the manifests, renders nothing, and says so — which is what the
// fifteen-minute schedule does on every run but the one after a publish.
//
// Rendering is the preview: a deck renders as soon as its edition is published
// (David's first lock, `publish_edition`). Posting waits for the second lock,
// `broadcast_edition`, which writes editions/{date}/broadcast.json. A deck is
// offered for posting only when that mark lists its language. Until then the
// run logs "rendered; waiting for broadcast".
//
// Uploads go through the AWS CLI, which the runner has; the SDK is not a
// dependency of this repo. A failed upload exits non-zero, and a language
// whose slides did not all land gets no manifest, so the bucket never points
// at a partial deck.

import { spawnSync } from 'node:child_process';
import { appendFileSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));

// The production bucket. Its base URL is news-ingester's deploy output
// daybookEditionsUrl; reads are public and anonymous.
export const DEFAULT_BASE = 'https://news-ingester-production-daybookeditionsbucket-bcneortr.s3.amazonaws.com';

// Slides never change under a key: a new revision gets a new r{n} path.
export const SLIDE_CACHE = 'public, max-age=31536000, immutable';
// The manifest is the one mutable pointer, cached like the records and index.
export const MANIFEST_CACHE = 'public, max-age=60';

// Editions lock in the Bogota morning. Today and yesterday covers an edition
// published late the night before and a run that straddles midnight.
const ZONE = 'America/Bogota';

// ── Pure parts (tested in deck-sync.test.mjs) ─────────────────────────────

/** YYYY-MM-DD for `now` in Bogota, and the day before. */
export function bogotaDates(now = new Date()) {
  const day = (d) => new Intl.DateTimeFormat('en-CA', { timeZone: ZONE }).format(d);
  return [day(now), day(new Date(now.getTime() - 86_400_000))];
}

/** `test/` or nothing: the rehearsal mirror sits beside the live keys. */
export const prefixFor = (test) => (test ? 'test/' : '');

/** The bucket name off a virtual-hosted S3 URL, or null for anything else (a local fake). */
export function bucketFromBase(base) {
  const match = new URL(base).hostname.match(/^(.+)\.s3(?:[.-][a-z0-9-]+)?\.amazonaws\.com$/);
  return match ? match[1] : null;
}

export const manifestKey = (prefix, date, lang) => `${prefix}social/${date}/${lang}/deck.json`;

export const slideKey = (prefix, date, lang, revision, file) =>
  `${prefix}social/${date}/${lang}/r${revision}/${file}`;

/**
 * What to do for each date: which languages the index publishes, at which
 * revision, and which of them need a render. `manifests` maps `date/lang` to
 * the deck.json found (null when it answered 403/404).
 */
// A slide og.mjs draws: `{NN}-{name}.jpg` (PNG until 2026-10-17, still read).
// Names can carry digits: the 287(g) slide is `05-287g.jpg`, which a
// letters-only pattern dropped from the upload while it still rendered (caught
// in a dry run, 2026-10-17).
export const SLIDE_FILE = /^\d+-[a-z0-9]+\.(?:png|jpg)$/;
const slideType = (file) => (file.endsWith('.jpg') ? 'image/jpeg' : 'image/png');

// `rerender` redraws decks that are already current, for a design change to
// reach an edition that's already out. Posting is unaffected: a deck with a
// posted.json is never offered again.
export function plan(index, dates, manifests, { rerender = false } = {}) {
  return dates.map((date) => {
    const published = (index?.editions ?? []).filter((edition) => edition.date === date);
    const langs = published.map((edition) => {
      const manifest = manifests[`${date}/${edition.lang}`] ?? null;
      return {
        lang: edition.lang,
        revision: edition.revision,
        deckRevision: manifest?.revision ?? null,
        render: rerender || needsRender(edition.revision, manifest),
      };
    });
    return { date, langs };
  });
}

/** A deck is due when there is none, or when it was rendered from an older revision. */
export function needsRender(revision, manifest) {
  if (!manifest) return true;
  return !(Number(manifest.revision) >= Number(revision));
}

/**
 * Where each published deck stands for posting, in a language being posted:
 * `ready`, or why not.
 * - `not current`: its render is due and didn't land this run.
 * - `already posted`: it has a posted.json. A deck re-rendered after a
 *   republish keeps it, and is not offered again; deck-post.mjs never posts a
 *   date and language twice to one platform.
 * - `waiting for broadcast`: the date's broadcast.json doesn't list it yet.
 *
 * `rendered` holds `date/lang` for decks this run uploaded. `posted` maps
 * `date/lang` to the posted.json found, or null. `broadcast` maps a date to its
 * broadcast.json, or null. With `gate: false` (a manual test post) the mark is
 * not consulted.
 */
export function postStatus(planned, rendered, posted, langs, broadcast = {}, { gate = true } = {}) {
  return planned.flatMap(({ date, langs: published }) =>
    published
      .filter((l) => langs.includes(l.lang))
      .map((l) => {
        const deck = { date, lang: l.lang, revision: l.revision };
        if (l.render && !rendered.has(`${date}/${l.lang}`)) return { ...deck, status: 'not current' };
        if (posted[`${date}/${l.lang}`]) return { ...deck, status: 'already posted' };
        if (gate && !broadcast[date]?.langs?.[l.lang]) return { ...deck, status: 'waiting for broadcast' };
        return { ...deck, status: 'ready' };
      }),
  );
}

/** The decks ready to post: current, broadcast (unless the gate is off), and not yet posted. */
export function postable(planned, rendered, posted, langs, broadcast = {}, options = {}) {
  return postStatus(planned, rendered, posted, langs, broadcast, options)
    .filter((deck) => deck.status === 'ready')
    .map(({ date, lang, revision }) => ({ date, lang, revision }));
}

/**
 * The deck.json for one language: the slides in deck order, by the name og.mjs
 * gave them (`03-story.png` → `story`) and their public URL.
 */
export function buildManifest({ base, prefix, date, lang, revision, files, renderedAt, script = [] }) {
  const said = new Map(script.map(({ file, ...text }) => [file, text]));
  const slides = [...files].sort().map((file) => ({
    name: file.replace(/^\d+-/, '').replace(/\.(?:png|jpg)$/, ''),
    url: `${base.replace(/\/+$/, '')}/${slideKey(prefix, date, lang, revision, file)}`,
    ...(said.has(file) ? { text: said.get(file) } : {}),
  }));
  return {
    format: 'daybook-deck/1',
    date,
    lang,
    revision,
    rendered_at: renderedAt,
    slides,
    ...(said.size ? { script_md: scriptMarkdown(slides) } : {}),
  };
}

/**
 * The deck as the desk shows it to David between publish and broadcast: each
 * slide's words, numbered, with a link to its image. og.mjs writes the words
 * (script.json) from the same deck it draws, so this is what will post.
 */
export function scriptMarkdown(slides) {
  return slides
    .map((slide, i) => {
      const t = slide.text ?? {};
      const head = `**${i + 1}. ${t.headline ?? slide.name}**${t.page ? ` (${t.page})` : ''} · [image](${slide.url})`;
      const body = [];
      if (t.image) body.push(`[picked image: ${t.image}]`);
      if (t.line) body.push(t.line);
      for (const item of t.items ?? []) body.push(`- ${item}`);
      for (const e of t.entries ?? []) body.push(`- ${e.date}, ${e.day}: ${e.text}`);
      if (t.sources?.length) body.push(`Sources: ${t.sources.join(' · ')}`);
      return [head, ...body].join('\n');
    })
    .join('\n\n');
}

// ── The run ────────────────────────────────────────────────────────────────

async function main() {
  const argv = process.argv.slice(2);
  const value = (name) => {
    const i = argv.indexOf(name);
    return i === -1 ? null : argv[i + 1];
  };
  const testPost = argv.includes('--test-post');
  const test = argv.includes('--test') || testPost;
  const dryRun = argv.includes('--dry-run');
  const rerender = argv.includes('--rerender');
  const base = (value('--base') ?? process.env.DAYBOOK_EDITIONS_URL ?? DEFAULT_BASE).replace(/\/+$/, '');
  const prefix = prefixFor(test);
  const dates = value('--date') ? [value('--date')] : bogotaDates();
  const work = value('--work') ?? mkdtempSync(join(tmpdir(), 'daybook-deck-'));
  mkdirSync(work, { recursive: true });

  const bucket = value('--bucket') ?? bucketFromBase(base);
  if (!dryRun && !bucket) throw new Error(`${base} is not an S3 bucket URL; uploads need one (or use --dry-run).`);

  console.log(`Deck sync: ${test ? 'test' : 'live'} area of ${base}, dates ${dates.join(', ')}${dryRun ? ', dry run' : ''}.`);

  // No index means nothing has been published in this area yet, which is the
  // normal state before the first edition and for an idle test area. That's
  // nothing to do, not a failure: a scheduled run every 15 minutes must not
  // fail (and email) until something is published.
  let index = await getJson(`${base}/${prefix}editions/index.json`);
  if (!index) {
    console.log(`No index at ${base}/${prefix}editions/index.json yet: nothing published in this area.`);
    index = { format: 'daybook-index/1', editions: [] };
  }
  if (index.format !== 'daybook-index/1') throw new Error(`Index format is ${index.format}, not daybook-index/1.`);

  const manifests = {};
  for (const edition of index.editions ?? []) {
    if (!dates.includes(edition.date)) continue;
    manifests[`${edition.date}/${edition.lang}`] = await getJson(`${base}/${manifestKey(prefix, edition.date, edition.lang)}`);
  }

  const rows = [];
  const rendered = new Set();
  let failed = false;

  for (const { date, langs } of plan(index, dates, manifests, { rerender })) {
    if (!langs.length) {
      console.log(`${date}: nothing published.`);
      rows.push({ date, lang: '—', revision: '—', result: 'nothing published' });
      continue;
    }

    const due = langs.filter((l) => l.render);
    for (const l of langs.filter((l) => !l.render)) {
      console.log(`${date} ${l.lang}: deck is current (r${l.deckRevision}).`);
      rows.push({ date, lang: l.lang, revision: l.revision, result: `up to date (r${l.deckRevision})` });
    }
    if (!due.length) continue;

    try {
      // Every published language's record, due or not: Spanish needs the
      // English one for its shape even when only Spanish is being drawn.
      const records = {};
      for (const l of langs) records[l.lang] = await getJson(`${base}/${prefix}editions/${date}/${l.lang}.json`);
      // `drawn`, not `rendered`: that name is the run-wide set of uploaded
      // decks the posting step reads, and shadowing it here broke the first
      // real upload (run 38902725604: "rendered.add is not a function").
      const drawn = renderDate({ date, langs, due, records, work });
      for (const { lang, revision, dir, files, script } of drawn) {
        const manifest = buildManifest({ base, prefix, date, lang, revision, files, script, renderedAt: new Date().toISOString() });

        if (dryRun) {
          console.log(`${date} ${lang} r${revision}: would write`);
          for (const file of files) console.log(`  ${slideKey(prefix, date, lang, revision, file)}`);
          console.log(`  ${manifestKey(prefix, date, lang)} (last)`);
          console.log(JSON.stringify(manifest, null, 2));
          rows.push({ date, lang, revision, result: `dry run: ${files.length} slides rendered, nothing uploaded` });
          continue;
        }

        // Every slide first; the manifest only once they have all landed.
        for (const file of files) {
          upload(join(dir, file), bucket, slideKey(prefix, date, lang, revision, file), slideType(file), SLIDE_CACHE);
        }
        const manifestPath = join(work, `deck-${date}-${lang}.json`);
        writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
        upload(manifestPath, bucket, manifestKey(prefix, date, lang), 'application/json', MANIFEST_CACHE);

        console.log(`${date} ${lang} r${revision}: ${files.length} slides and deck.json uploaded.`);
        rows.push({ date, lang, revision, result: `rendered ${files.length} slides` });
        rendered.add(`${date}/${lang}`);
      }
    } catch (err) {
      failed = true;
      console.error(`${date}: ${err.message}`);
      for (const l of due) rows.push({ date, lang: l.lang, revision: l.revision, result: `FAILED: ${err.message.split('\n')[0]}` });
    }
  }

  if (!rows.some((row) => /^rendered|^dry run/.test(row.result)) && !failed) {
    console.log('Nothing to do: every published deck is current.');
  }
  // What the posting job may take up. Only a deck that is in the bucket counts,
  // so a dry run, which uploads nothing, offers only decks rendered before it.
  const postLangs = (value('--post-langs') ?? 'en,es').split(',').map((lang) => lang.trim()).filter(Boolean);
  const planned = plan(index, dates, manifests);
  const posted = {};
  const broadcast = {};
  for (const { date, langs } of planned) {
    const offered = langs.filter((l) => postLangs.includes(l.lang));
    for (const l of offered) posted[`${date}/${l.lang}`] = await getJson(`${base}/${prefix}social/${date}/${l.lang}/posted.json`);
    // The second lock: a missing mark answers 403, which getJson reads as null.
    if (offered.length && !testPost) broadcast[date] = await getJson(`${base}/${prefix}editions/${date}/broadcast.json`);
  }
  if (testPost) console.log('Test post: the broadcast mark does not gate this run.');
  const statuses = postStatus(planned, rendered, posted, postLangs, broadcast, { gate: !testPost });
  for (const deck of statuses.filter((d) => d.status === 'waiting for broadcast')) {
    console.log(`${deck.date} ${deck.lang}: rendered; waiting for broadcast`);
  }
  const ready = statuses.filter((d) => d.status === 'ready').map(({ date, lang, revision }) => ({ date, lang, revision }));
  console.log(ready.length ? `Ready to post: ${ready.map((d) => `${d.date} ${d.lang}`).join(', ')}.` : 'Nothing ready to post.');
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `postable=${JSON.stringify(ready)}\n`);

  summarize(rows, { test, dryRun, dates });
  if (failed) process.exit(1);
}

/**
 * Render the due languages of one date. English and Spanish go through
 * record-deck.mjs together, whichever of them is due, because Spanish takes
 * its deck shape from English; only the due ones are drawn.
 */
function renderDate({ date, langs, due, records, work }) {
  const dir = join(work, date);
  mkdirSync(dir, { recursive: true });

  const paths = langs.map((l) => {
    const record = records[l.lang];
    if (!record) throw new Error(`the index lists ${date} ${l.lang} but its record is missing`);
    // The index is the source of truth for what is current; a record behind
    // it is a read that raced a publish, and the next run will catch up.
    if (Number(record.revision) !== Number(l.revision)) {
      throw new Error(`${l.lang} record is r${record.revision} but the index says r${l.revision}; retry next run`);
    }
    const path = join(dir, `${l.lang}.json`);
    writeFileSync(path, JSON.stringify(record));
    return path;
  });

  const deckPath = join(dir, 'deck.json');
  run('node', [join(here, 'record-deck.mjs'), ...paths, '--out', deckPath]);

  const images = join(dir, 'images');
  run('node', [join(here, 'og.mjs'), '--card', 'carousel', '--lang', due.map((l) => l.lang).join(','), '--deck', deckPath, '--out', images]);

  return due.map((l) => {
    const slides = join(images, 'social', date, l.lang);
    const files = readdirSync(slides).filter((file) => SLIDE_FILE.test(file)).sort();
    if (!files.length) throw new Error(`og.mjs drew no slides for ${date} ${l.lang}`);
    const scriptPath = join(slides, 'script.json');
    const script = existsSync(scriptPath) ? JSON.parse(readFileSync(scriptPath, 'utf8')) : [];
    return { lang: l.lang, revision: l.revision, dir: slides, files, script };
  });
}

/**
 * JSON at a URL, or null when the bucket says it is not there (403 or 404:
 * anonymous reads of a missing key are 403). A network-level failure is retried
 * twice before it fails the run, and says why: the first real run lost its
 * posting step to a bare "fetch failed" on one read.
 */
async function getJson(url, tries = 3) {
  for (let attempt = 1; ; attempt++) {
    let res;
    try {
      res = await fetch(url, { headers: { 'cache-control': 'no-cache' } });
    } catch (err) {
      const why = err.cause?.code ?? err.cause?.message ?? err.message;
      if (attempt >= tries) throw new Error(`GET ${url}: ${why}`);
      console.warn(`GET ${url}: ${why}; retrying (${attempt}/${tries - 1})`);
      await new Promise((r) => setTimeout(r, 1000 * attempt));
      continue;
    }
    if (res.status === 403 || res.status === 404) return null;
    if (!res.ok) throw new Error(`GET ${url}: HTTP ${res.status}`);
    return res.json();
  }
}

function upload(path, bucket, key, contentType, cacheControl) {
  run('aws', ['s3', 'cp', path, `s3://${bucket}/${key}`, '--content-type', contentType, '--cache-control', cacheControl, '--only-show-errors']);
}

function run(command, args) {
  const result = spawnSync(command, args, { stdio: ['ignore', 'inherit', 'inherit'] });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${command} ${args.slice(0, 3).join(' ')} … exited ${result.status}`);
}

/** The job summary on Actions (a table of what was rendered or skipped); nothing elsewhere. */
function summarize(rows, { test, dryRun, dates }) {
  const path = process.env.GITHUB_STEP_SUMMARY;
  if (!path) return;
  const lines = [
    `### Daybook deck — ${test ? 'test' : 'live'}${dryRun ? ', dry run' : ''}`,
    '',
    `Dates: ${dates.join(', ')}`,
    '',
    '| Date | Lang | Revision | Result |',
    '|---|---|---|---|',
    ...rows.map((row) => `| ${row.date} | ${row.lang} | ${row.revision} | ${row.result} |`),
    '',
  ];
  appendFileSync(path, lines.join('\n'));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
}
