#!/usr/bin/env node
// Capture mobile-width screenshots of the DDP charts for the newsletter.
//
// Usage: node scripts/ddp/screenshot.mjs [--url http://localhost:5173] [--lang en,es]
//
// Needs the dev (or preview) server running, plus google-chrome and
// ImageMagick's `convert` on the PATH. Renders each chart's bare embed page
// (/{lang}/embed/{chart}) at 390px / 2x, trims the surrounding surface, and
// re-adds even padding. The EN arrest-volume shot is also copied to
// static/images/ddp-arrest-volume.png, which the posts use as previewImage.

import { execFileSync } from 'node:child_process';
import { copyFileSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const webRoot = join(here, '..', '..');

const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};

const baseUrl = flag('url', 'http://localhost:5173').replace(/\/$/, '');
const langs = flag('lang', 'en,es').split(',');
const CHARTS = ['ddp-arrest-volume', 'ddp-departure-countries', 'ddp-stay-length'];
const SURFACE = '#f3f1e9';

try {
  await fetch(baseUrl, { signal: AbortSignal.timeout(3000) });
} catch {
  console.error(`No server responding at ${baseUrl} — start one with \`pnpm dev\`,`);
  console.error('or pass --url for a different address.');
  process.exit(1);
}

const outDir = join(here, 'out', 'screenshots');
mkdirSync(outDir, { recursive: true });

for (const lang of langs) {
  for (const chart of CHARTS) {
    const url = `${baseUrl}/${lang}/embed/${chart}`;
    const raw = join(outDir, `.${chart}-${lang}-raw.png`);
    const out = join(outDir, `${chart}-${lang}.png`);

    execFileSync('google-chrome', [
      '--headless=new',
      '--disable-gpu',
      '--hide-scrollbars',
      '--window-size=390,1400',
      '--force-device-scale-factor=2',
      '--virtual-time-budget=10000',
      `--screenshot=${raw}`,
      url,
    ], { stdio: ['ignore', 'ignore', 'inherit'] });

    execFileSync('convert', [
      raw,
      '-trim', '+repage',
      '-bordercolor', SURFACE,
      '-border', '40',
      out,
    ]);
    rmSync(raw);
    console.log(`Wrote scripts/ddp/out/screenshots/${chart}-${lang}.png`);
  }
}

// Social/OG preview image for the posts (static/images is gitignored by design;
// it ships with the local build).
const preview = join(outDir, 'ddp-arrest-volume-en.png');
const previewDest = join(webRoot, 'static', 'images', 'ddp-arrest-volume.png');
mkdirSync(dirname(previewDest), { recursive: true });
copyFileSync(preview, previewDest);
console.log('Copied EN arrest-volume shot to static/images/ddp-arrest-volume.png');
