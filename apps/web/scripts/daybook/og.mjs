#!/usr/bin/env node
// Render the Immigration Daybook social/OG cards, one per language.
//
// Usage: node scripts/daybook/og.mjs [--lang en,es] [--out ../../static/images]
//
// Needs google-chrome and ImageMagick's `convert` on the PATH, and network
// access the first time so Chrome can fetch Lora + Jost from Google Fonts.
// Composes a standalone 1200x630 card rather than screenshotting the live page:
// the page is a tall scroll with a signup form in it, and the card wants the
// plate, the wordmark, and the terms with nothing else.
//
// The deck line is deliberately NOT on the card. Deck copy is under A/B test
// (see ACTIVE_DECK in the page files) and baking it in would mean regenerating
// and redeploying these images on every message change.
//
// Composed on a 1200x630 canvas, shot at 2x, and downsampled to 1600x840 —
// same 1.91:1 frame the platforms want. The extra size is deliberate: the OG
// tag runs through the image resizer at w=1600 (see getResizedImageUrl), so a
// 1200px card would be upscaled and softened on the way out.

import { execFileSync } from 'node:child_process';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));

const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};

const langs = flag('lang', 'en,es').split(',');
const outDir = resolve(here, flag('out', '../../static/images'));

// Straight off the page's style block — see the .rf-hero rules in
// src/content/blog/{en,es}/immigration-daybook.md.
const OUT_SIZE = '1600x840';

const INK = '#12161d';
const CREAM = '#f3f1e9';
const CRIMSON = '#e8244f';

// `factsSize` keeps the terms on a single line. The Spanish strip is ~15%
// longer than the English one and wraps at the same size, orphaning the last
// term and throwing the card off balance.
const COPY = {
  en: {
    eyebrow: 'Recovered Factory',
    wordmark: ['Immigration', 'Daybook'],
    facts: ['Monday–Friday', 'All 53 jurisdictions', 'English & Spanish', 'Free'],
    factsSize: 22,
  },
  es: {
    eyebrow: 'Recovered Factory',
    wordmark: ['Immigration', 'Daybook'],
    facts: ['De lunes a viernes', 'Las 53 jurisdicciones', 'Español e inglés', 'Gratis'],
    factsSize: 18,
  },
};

const card = ({ eyebrow, wordmark, facts, factsSize }) => `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Jost:wght@500;600;700&family=Lora:wght@400;500;600&display=swap" rel="stylesheet" />
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: 1200px; height: 630px; }
  body {
    background: ${INK};
    color: ${CREAM};
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 0 86px;
    -webkit-font-smoothing: antialiased;
  }
  .eyebrow {
    font-family: "Jost", sans-serif;
    font-size: 21px;
    font-weight: 600;
    letter-spacing: 0.3em;
    text-transform: uppercase;
    color: ${CRIMSON};
    margin-bottom: 34px;
  }
  .wordmark {
    font-family: "Lora", serif;
    font-weight: 600;
    font-size: 118px;
    line-height: 0.95;
    letter-spacing: -0.035em;
    color: ${CREAM};
  }
  .facts {
    display: flex;
    flex-wrap: nowrap;
    white-space: nowrap;
    gap: ${Math.round(factsSize * 1.5)}px;
    margin-top: 46px;
    padding-top: 30px;
    border-top: 3px solid ${CRIMSON};
    list-style: none;
    font-family: "Jost", sans-serif;
    font-size: ${factsSize}px;
    font-weight: 600;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: rgba(243, 241, 233, 0.74);
  }
</style>
</head>
<body>
  <p class="eyebrow">${eyebrow}</p>
  <h1 class="wordmark">${wordmark.join('<br />')}</h1>
  <ul class="facts">${facts.map((f) => `<li>${f}</li>`).join('')}</ul>
</body>
</html>`;

const workDir = join(here, 'out');
mkdirSync(workDir, { recursive: true });
mkdirSync(outDir, { recursive: true });

for (const lang of langs) {
  const copy = COPY[lang];
  if (!copy) {
    console.error(`No copy for lang "${lang}" — known: ${Object.keys(COPY).join(', ')}`);
    process.exitCode = 1;
    continue;
  }

  const html = join(workDir, `.og-${lang}.html`);
  const raw = join(workDir, `.og-${lang}-2x.png`);
  const out = join(outDir, `immigration-daybook-og-${lang}.png`);

  writeFileSync(html, card(copy));

  execFileSync(
    'google-chrome',
    [
      '--headless=new',
      '--disable-gpu',
      '--hide-scrollbars',
      '--force-device-scale-factor=2',
      // Generous: the card must not shoot before the webfonts land, or it
      // silently renders in a fallback face.
      '--virtual-time-budget=20000',
      '--window-size=1200,630',
      `--screenshot=${raw}`,
      `file://${html}`,
    ],
    // stderr is dropped: headless Chrome spews harmless dbus/UPower noise here.
    { stdio: ['ignore', 'ignore', 'ignore'] },
  );

  execFileSync('convert', [raw, '-resize', OUT_SIZE, '-strip', out]);
  rmSync(raw, { force: true });
  rmSync(html, { force: true });

  console.log(`Wrote static/images/immigration-daybook-og-${lang}.png`);
}
