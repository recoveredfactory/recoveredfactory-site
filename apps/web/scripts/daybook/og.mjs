#!/usr/bin/env node
// Render the Immigration Daybook social cards, per language, per card type.
//
// Usage: node scripts/daybook/og.mjs [--lang en,es] [--card landing,announcement]
//                                    [--out ../../static/images]
//
// Needs google-chrome and ImageMagick's `convert` on the PATH, and network
// access the first time so Chrome can fetch Lora + Jost from Google Fonts.
//
// Two cards, because they do different jobs:
//
//   landing      — the wordmark plate, for /{lang}/immigration-daybook. A reader
//                  who clicks lands on the full pitch, so the card only has to
//                  identify the thing and state the terms.
//   announcement — for the launch post. A wordmark here would be inert: it just
//                  repeats og:title and gives nobody a reason to click. So this
//                  one leads with the argument and the launch date, and demotes
//                  the wordmark to a lockup.
//
// The announcement headline is deliberately its own string rather than a
// reference to ACTIVE_DECK. It currently matches the live `evidence` deck, but
// the deck is under A/B test and this card should not silently change when a
// different variant goes live — a card that shifts under a shared link is worse
// than one that lags the page.
//
// Composed on a 1200x630 canvas, shot at 2x, and downsampled to 1600x840 —
// same 1.91:1 frame the platforms want. The extra size is deliberate: the OG
// tag runs through the image resizer at w=1600 (see getSocialImageUrl), so a
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
const cards = flag('card', 'landing,announcement').split(',');
const outDir = resolve(here, flag('out', '../../static/images'));

// Edition cards only. The date names the file and sets the caption; the
// headline is passed in rather than read back out of the archive so that
// pull.mjs, which already derived it, stays the single source of that string.
const editionDate = flag('edition', '');
const editionHeadline = flag('headline', '');

const OUT_SIZE = '1600x840';

// Straight off the page's style block — see the .rf-hero rules in
// src/content/blog/{en,es}/immigration-daybook.md.
const INK = '#12161d';
const CREAM = '#f3f1e9';
const CRIMSON = '#e8244f';

const FONTS =
  'https://fonts.googleapis.com/css2?family=Jost:wght@500;600;700&family=Lora:wght@400;500;600&display=swap';

const shell = (css, body) => `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="${FONTS}" rel="stylesheet" />
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
  .rule {
    border: 0;
    border-top: 3px solid ${CRIMSON};
  }
${css}
</style>
</head>
<body>
${body}
</body>
</html>`;

// ── Landing card ──────────────────────────────────────────────────────────
// `factsSize` keeps the terms on a single line. The Spanish strip runs ~15%
// longer than the English one and wraps at a matched size, orphaning the last
// term and throwing the card off balance. With the editor credit gone there are
// two terms rather than three, so they spread to the ends of the rule instead of
// sitting bunched at the left.
const LANDING = {
  en: {
    eyebrow: 'Recovered Factory',
    wordmark: ['Immigration', 'Daybook'],
    facts: ['Monday–Friday', 'English & Spanish'],
    factsSize: 26,
  },
  es: {
    eyebrow: 'Recovered Factory',
    wordmark: ['Immigration', 'Daybook'],
    facts: ['De lunes a viernes', 'Español e inglés'],
    factsSize: 24,
  },
};

const landingCard = ({ eyebrow, wordmark, facts, factsSize }) =>
  shell(
    `
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
    justify-content: space-between;
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
  }`,
    `  <p class="eyebrow">${eyebrow}</p>
  <h1 class="wordmark">${wordmark.join('<br />')}</h1>
  <ul class="facts">${facts.map((f) => `<li>${f}</li>`).join('')}</ul>`,
  );

// ── Announcement card ─────────────────────────────────────────────────────
// Headline carries the argument; the wordmark drops to a lockup above it and
// the launch date sits under a crimson rule, where the terms live on the
// landing card. `headlineSize` is per-language because the Spanish sentence is
// longer and would otherwise run to an extra line.
const ANNOUNCEMENT = {
  en: {
    lockup: 'Immigration Daybook',
    lockupSize: 56,
    headline: 'We turn the spectacle of the immigration system into evidence, every weekday.',
    headlineSize: 58,
    meta: ['Starts Wednesday, Aug. 5'],
    metaSize: 36,
  },
  es: {
    lockup: 'Immigration Daybook',
    lockupSize: 56,
    headline:
      'Convertimos el espectáculo del sistema migratorio en evidencia, de lunes a viernes.',
    headlineSize: 54,
    meta: ['Empieza el miércoles 5 de agosto'],
    metaSize: 28,
  },
};

const announcementCard = ({ lockup, lockupSize, headline, headlineSize, meta, metaSize }) =>
  shell(
    `
  /* Tracking comes down as the size goes up: 0.28em is set for a 21px caption
     and reads as gappy once the lockup is display-sized. */
  .lockup {
    font-family: "Jost", sans-serif;
    font-size: ${lockupSize}px;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: ${CRIMSON};
    margin-bottom: 40px;
  }
  .headline {
    font-family: "Lora", serif;
    font-weight: 600;
    font-size: ${headlineSize}px;
    line-height: 1.14;
    letter-spacing: -0.022em;
    color: ${CREAM};
    text-wrap: balance;
  }
  /* One item since the editor credit came off, so space-between has nothing
     left to spread and the strip runs about two thirds of the rule. Sizing it
     to actually fill would take ~55px, level with the 56px lockup, which would
     rank a date as loudly as the masthead. A full-width rule over a shorter
     caption is the better trade. */
  .meta {
    display: flex;
    flex-wrap: nowrap;
    white-space: nowrap;
    justify-content: space-between;
    gap: ${Math.round(metaSize * 1.6)}px;
    margin-top: 44px;
    padding-top: 30px;
    border-top: 3px solid ${CRIMSON};
    list-style: none;
    font-family: "Jost", sans-serif;
    font-size: ${metaSize}px;
    font-weight: 600;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: rgba(243, 241, 233, 0.74);
  }`,
    `  <p class="lockup">${lockup}</p>
  <h1 class="headline">${headline}</h1>
  <ul class="meta">${meta.map((m) => `<li>${m}</li>`).join('')}</ul>`,
  );

// ── Edition card ──────────────────────────────────────────────────────────
// One per edition per language, carrying that day's lede headline. It reuses
// the announcement layout because the job is the same — lead with the argument,
// demote the wordmark to a lockup, date under the rule — and differs only in
// that the copy arrives from the pull instead of being written here.
//
// An edition card is the one worth generating: a wordmark plate repeated under
// every shared edition tells a reader nothing about the edition they are being
// shown, and the headline is the whole reason to click.

// Edition headlines are not written to a length. They have run from about 50 to
// about 140 characters in the first editions, and a size that fits the short
// ones overflows the frame on the long ones. Stepping the size by length keeps
// the card full without ever spilling.
const editionHeadlineSize = (text) => {
  const n = text.length;
  if (n <= 55) return 62;
  if (n <= 80) return 54;
  if (n <= 110) return 46;
  if (n <= 140) return 40;
  return 36;
};

const AP_MONTHS = [
  'Jan.',
  'Feb.',
  'March',
  'April',
  'May',
  'June',
  'July',
  'Aug.',
  'Sept.',
  'Oct.',
  'Nov.',
  'Dec.',
];

// Mirrors formatApDate in src/lib/dates.ts. Duplicated rather than imported
// because this script runs as plain node, outside the app's module aliases.
const formatCardDate = (iso, lang) => {
  const date = new Date(`${iso}T00:00:00Z`);
  if (lang === 'en') {
    return `${AP_MONTHS[date.getUTCMonth()]} ${date.getUTCDate()}, ${date.getUTCFullYear()}`;
  }
  return new Intl.DateTimeFormat('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
};

// Headlines are editorial prose and carry ampersands, angle brackets and curly
// quotes. They are interpolated straight into the card's HTML, so they have to
// be escaped or a headline eventually breaks the render silently.
const escapeHtml = (value) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const editionCopy = (lang) => {
  if (!editionDate || !editionHeadline) {
    return null;
  }
  return {
    lockup: 'Immigration Daybook',
    lockupSize: 44,
    headline: escapeHtml(editionHeadline),
    headlineSize: editionHeadlineSize(editionHeadline),
    meta: [formatCardDate(editionDate, lang)],
    metaSize: 30,
  };
};

const CARDS = {
  landing: {
    copy: LANDING,
    render: landingCard,
    file: (lang) => `immigration-daybook-og-${lang}.png`,
  },
  announcement: {
    copy: ANNOUNCEMENT,
    render: announcementCard,
    file: (lang) => `immigration-daybook-announce-og-${lang}.png`,
  },
  edition: {
    copy: editionCopy,
    render: announcementCard,
    file: (lang) => `immigration-daybook-og-${editionDate}-${lang}.png`,
  },
};

const workDir = join(here, 'out');
mkdirSync(workDir, { recursive: true });
mkdirSync(outDir, { recursive: true });

for (const cardName of cards) {
  const card = CARDS[cardName];
  if (!card) {
    console.error(`Unknown card "${cardName}" — known: ${Object.keys(CARDS).join(', ')}`);
    process.exitCode = 1;
    continue;
  }

  for (const lang of langs) {
    // Edition copy is built per run from --edition/--headline; the other cards
    // keep their copy in this file, keyed by language.
    const copy = typeof card.copy === 'function' ? card.copy(lang) : card.copy[lang];
    if (!copy) {
      console.error(
        typeof card.copy === 'function'
          ? `The ${cardName} card needs --edition <YYYY-MM-DD> and --headline <text>.`
          : `No ${cardName} copy for lang "${lang}" — known: ${Object.keys(card.copy).join(', ')}`,
      );
      process.exitCode = 1;
      continue;
    }

    const stem = cardName === 'edition' ? `${cardName}-${editionDate}-${lang}` : `${cardName}-${lang}`;
    const html = join(workDir, `.${stem}.html`);
    const raw = join(workDir, `.${stem}-2x.png`);
    const out = join(outDir, card.file(lang));

    writeFileSync(html, card.render(copy));

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

    console.log(`Wrote static/images/${card.file(lang)}`);
  }
}
