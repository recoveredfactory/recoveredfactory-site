#!/usr/bin/env node
// Render each published Immigration Daybook edition's social deck into the
// editions bucket. Run by .github/workflows/daybook-deck.yml on a schedule.
//
// Usage: node scripts/daybook/deck-sync.mjs [--test] [--date YYYY-MM-DD] [--dry-run]
//                                           [--base <url>] [--bucket <name>] [--work <dir>]
//                                           [--post-langs en[,es]]
//   --test     read test/editions/…, write test/social/… (the bucket's rehearsal mirror)
//   --date     that edition date only; default today and yesterday in America/Bogota
//   --dry-run  render, but upload nothing; print the keys and the manifest instead
//   --base     the bucket's base URL; default $DAYBOOK_EDITIONS_URL, then the production bucket
//   --bucket   the bucket uploads go to; default the one in --base's hostname
//   --work     where records, deck JSON and PNGs go; default a fresh temp directory
//   --post-langs  which languages' decks to offer for posting; default en,es (see below)
//
// The contract is news-ingester's docs/EDITIONS.md. In short: the index
// (editions/index.json) says what is published and at which revision; a deck
// is rendered from the records and written to
// social/{date}/{lang}/r{revision}/{NN}-{name}.png, immutable; and LAST,
// once every slide is up, social/{date}/{lang}/deck.json points at them.
//
// A language is rendered only when its deck.json is missing or carries an
// older revision than the index. So a rerun with nothing new reads the index
// and the manifests, renders nothing, and says so — which is what the
// fifteen-minute schedule does on every run but the one after a publish.
//
// Uploads go through the AWS CLI, which the runner has; the SDK is not a
// dependency of this repo. A failed upload exits non-zero, and a language
// whose slides did not all land gets no manifest, so the bucket never points
// at a partial deck.

import { spawnSync } from 'node:child_process';
import { appendFileSync, mkdirSync, mkdtempSync, readdirSync, writeFileSync } from 'node:fs';
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
export function plan(index, dates, manifests) {
  return dates.map((date) => {
    const published = (index?.editions ?? []).filter((edition) => edition.date === date);
    const langs = published.map((edition) => {
      const manifest = manifests[`${date}/${edition.lang}`] ?? null;
      return {
        lang: edition.lang,
        revision: edition.revision,
        deckRevision: manifest?.revision ?? null,
        render: needsRender(edition.revision, manifest),
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
 * The decks ready to post: in a language being posted, current in the bucket
 * (rendered this run, or already up to date) and with no posted.json yet.
 * `rendered` holds `date/lang` for decks this run uploaded; `posted` maps
 * `date/lang` to the posted.json found, or null. A deck re-rendered after a
 * republish already has a posted.json and is not offered again: deck-post.mjs
 * never posts a date and language twice to one platform.
 */
export function postable(planned, rendered, posted, langs) {
  return planned.flatMap(({ date, langs: published }) =>
    published
      .filter((l) => langs.includes(l.lang))
      .filter((l) => !l.render || rendered.has(`${date}/${l.lang}`))
      .filter((l) => !posted[`${date}/${l.lang}`])
      .map((l) => ({ date, lang: l.lang, revision: l.revision })),
  );
}

/**
 * The deck.json for one language: the slides in deck order, by the name og.mjs
 * gave them (`03-story.png` → `story`) and their public URL.
 */
export function buildManifest({ base, prefix, date, lang, revision, files, renderedAt }) {
  return {
    format: 'daybook-deck/1',
    date,
    lang,
    revision,
    rendered_at: renderedAt,
    slides: [...files].sort().map((file) => ({
      name: file.replace(/^\d+-/, '').replace(/\.png$/, ''),
      url: `${base.replace(/\/+$/, '')}/${slideKey(prefix, date, lang, revision, file)}`,
    })),
  };
}

// ── The run ────────────────────────────────────────────────────────────────

async function main() {
  const argv = process.argv.slice(2);
  const value = (name) => {
    const i = argv.indexOf(name);
    return i === -1 ? null : argv[i + 1];
  };
  const test = argv.includes('--test');
  const dryRun = argv.includes('--dry-run');
  const base = (value('--base') ?? process.env.DAYBOOK_EDITIONS_URL ?? DEFAULT_BASE).replace(/\/+$/, '');
  const prefix = prefixFor(test);
  const dates = value('--date') ? [value('--date')] : bogotaDates();
  const work = value('--work') ?? mkdtempSync(join(tmpdir(), 'daybook-deck-'));
  mkdirSync(work, { recursive: true });

  const bucket = value('--bucket') ?? bucketFromBase(base);
  if (!dryRun && !bucket) throw new Error(`${base} is not an S3 bucket URL; uploads need one (or use --dry-run).`);

  console.log(`Deck sync: ${test ? 'test' : 'live'} area of ${base}, dates ${dates.join(', ')}${dryRun ? ', dry run' : ''}.`);

  const index = await getJson(`${base}/${prefix}editions/index.json`);
  if (!index) throw new Error(`No index at ${base}/${prefix}editions/index.json.`);
  if (index.format !== 'daybook-index/1') throw new Error(`Index format is ${index.format}, not daybook-index/1.`);

  const manifests = {};
  for (const edition of index.editions ?? []) {
    if (!dates.includes(edition.date)) continue;
    manifests[`${edition.date}/${edition.lang}`] = await getJson(`${base}/${manifestKey(prefix, edition.date, edition.lang)}`);
  }

  const rows = [];
  const rendered = new Set();
  let failed = false;

  for (const { date, langs } of plan(index, dates, manifests)) {
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
      const rendered = renderDate({ date, langs, due, records, work });
      for (const { lang, revision, dir, files } of rendered) {
        const manifest = buildManifest({ base, prefix, date, lang, revision, files, renderedAt: new Date().toISOString() });

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
          upload(join(dir, file), bucket, slideKey(prefix, date, lang, revision, file), 'image/png', SLIDE_CACHE);
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
  for (const { date, langs } of planned) {
    for (const l of langs) {
      if (postLangs.includes(l.lang)) posted[`${date}/${l.lang}`] = await getJson(`${base}/${prefix}social/${date}/${l.lang}/posted.json`);
    }
  }
  const ready = postable(planned, rendered, posted, postLangs);
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
    const files = readdirSync(slides).filter((file) => /^\d+-[a-z]+\.png$/.test(file)).sort();
    if (!files.length) throw new Error(`og.mjs drew no slides for ${date} ${l.lang}`);
    return { lang: l.lang, revision: l.revision, dir: slides, files };
  });
}

/** JSON at a URL, or null when the bucket says it is not there (403 or 404: anonymous reads of a missing key are 403). */
async function getJson(url) {
  const res = await fetch(url, { headers: { 'cache-control': 'no-cache' } });
  if (res.status === 403 || res.status === 404) return null;
  if (!res.ok) throw new Error(`GET ${url}: HTTP ${res.status}`);
  return res.json();
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
