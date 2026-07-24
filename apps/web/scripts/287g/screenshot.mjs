#!/usr/bin/env node
// Capture mobile-width screenshots of the 287(g) network-expansion charts for
// the newsletter. Mirrors scripts/ddp/screenshot.mjs.
//
// Usage: node scripts/287g/screenshot.mjs [--url http://localhost:5173] [--lang en,es]
//
// Needs the dev (or preview) server running, plus google-chrome and
// ImageMagick's `convert` on the PATH. Renders each chart's bare embed page
// (/{lang}/embed/{chart}) at 2x (phone width for the bars, desktop width for
// the table — see WINDOW), trims the surrounding surface, and re-adds even
// padding. The state-table shot is a capped preview (see the embed route's
// PREVIEW_CHARTS) meant to link out to the live table.

import { execFileSync } from 'node:child_process';
import { mkdirSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));

const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};

const baseUrl = flag('url', 'http://localhost:5173').replace(/\/$/, '');
const langs = flag('lang', 'en,es').split(',');
const CHARTS = ['287g-signings', '287g-state-table'];
const SURFACE = '#f3f1e9';

// Capture width per chart. The signings bars read fine at phone width; the
// four-column state table needs desktop room so its widest header (the Spanish
// "% de nuevas agencias con menos de 10 oficiales") doesn't clip the last
// column. Height is generous — the surface is trimmed off afterward.
const WINDOW = {
  '287g-signings': '390,1400',
  '287g-state-table': '720,1600',
};
const DEFAULT_WINDOW = '390,1400';

try {
  // redirect: 'manual' so a cold server's `/` → `/{lang}` redirect returns at
  // once instead of blocking on the destination route's first-hit compile.
  await fetch(baseUrl, { redirect: 'manual', signal: AbortSignal.timeout(5000) });
} catch {
  console.error(`No server responding at ${baseUrl} — start one with \`pnpm dev\`,`);
  console.error('or pass --url for a different address.');
  process.exit(1);
}

const outDir = join(here, 'out', 'screenshots');
mkdirSync(outDir, { recursive: true });

const chromeFlags = [
  '--headless=new',
  '--disable-gpu',
  '--hide-scrollbars',
  '--force-device-scale-factor=2',
  '--virtual-time-budget=10000',
];

const shoot = (url, outPath, windowSize) =>
  execFileSync('google-chrome', [
    ...chromeFlags,
    `--window-size=${windowSize}`,
    `--screenshot=${outPath}`,
    url,
  ], {
    // stderr is dropped: headless Chrome spews harmless dbus/UPower noise here.
    stdio: ['ignore', 'ignore', 'ignore'],
  });

const targets = [];
for (const lang of langs) {
  for (const chart of CHARTS) {
    targets.push({
      chart,
      lang,
      url: `${baseUrl}/${lang}/embed/${chart}`,
      window: WINDOW[chart] ?? DEFAULT_WINDOW,
    });
  }
}

// Warm-up pass. A dev server compiles each route's client modules on first
// browser hit, and --virtual-time-budget only advances page timers — it does
// not wait for that real compile work. So a cold first render can screenshot
// before the chart has measured its width and painted its SVG. Load every page
// once, discarded, to warm Vite before the captures that we keep.
const warm = join(outDir, '.warm.png');
for (const { url, window } of targets) shoot(url, warm, window);
rmSync(warm, { force: true });

for (const { chart, lang, url, window } of targets) {
  const raw = join(outDir, `.${chart}-${lang}-raw.png`);
  const out = join(outDir, `${chart}-${lang}.png`);

  shoot(url, raw, window);

  execFileSync('convert', [
    raw,
    '-trim', '+repage',
    '-bordercolor', SURFACE,
    '-border', '40',
    out,
  ]);
  rmSync(raw);
  console.log(`Wrote scripts/287g/out/screenshots/${chart}-${lang}.png`);
}
