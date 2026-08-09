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
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
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

// Carousel decks only: a JSON file keyed by language, written by pull.mjs.
const deckPath = flag('deck', '');

// Every slide carries the domain, because the alternative is asking people to
// go and find a link in a bio.
const HOME_URL = 'immigrationdaybook.com';

const OUT_SIZE = '1600x840';

// Straight off the page's style block — see the .rf-hero rules in
// src/content/blog/{en,es}/immigration-daybook.md.
const INK = '#12161d';
const CREAM = '#f3f1e9';
const CRIMSON = '#e8244f';

const FONTS =
  'https://fonts.googleapis.com/css2?family=Jost:wght@500;600;700&family=Lora:wght@400;500;600&display=swap';

// The open-graph frame. Portrait cards pass their own — see PORTRAIT.
const LANDSCAPE = { width: 1200, height: 630, padding: '0 86px' };

const shell = (css, body, frame = LANDSCAPE) => `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="${FONTS}" rel="stylesheet" />
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: ${frame.width}px; height: ${frame.height}px; }
  body {
    background: ${INK};
    color: ${CREAM};
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: ${frame.padding};
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

// ── Carousel slides ───────────────────────────────────────────────────────
// A 4:5 deck for Instagram, one per edition per language: cover, a slide per
// story beat, and a closing plate with the terms.
//
// 4:5 rather than square because it is the tallest frame the feed will show
// without cropping, and the whole asset here is words — vertical room is the
// only thing that buys a readable size. Rendered at 1080x1350, which is what
// the platforms downsample to anyway.
//
// The deck arrives as JSON from pull.mjs rather than as flags: the slides carry
// full sentences, and a dozen of those on a command line is how quoting bugs
// happen. It is also the same derivation the archive already did, so the cards
// and the page cannot drift.
const PORTRAIT = { width: 1080, height: 1350, padding: '92px 84px' };
const PORTRAIT_SIZE = '1080x1350';

// Portrait gives about 900px of usable width and 1150 of height. These steps
// were set against the first week of real editions, whose headlines run 27 to
// 125 characters and whose nut sentences run 120 to 320.
//
// Sized for a phone held at arm's length, not for a 1080px PNG on a desktop
// monitor — which is how the first pass got set, and why it read small on the
// only screen that matters.
const coverHedSize = (text) => {
  const n = text.length;
  if (n <= 40) return 104;
  if (n <= 70) return 88;
  if (n <= 100) return 74;
  if (n <= 140) return 60;
  return 50;
};

const beatHedSize = (text) => {
  const n = text.length;
  if (n <= 50) return 72;
  if (n <= 90) return 62;
  if (n <= 130) return 52;
  return 44;
};

const nutSize = (text) => {
  const n = text.length;
  if (n <= 140) return 40;
  if (n <= 220) return 36;
  if (n <= 320) return 32;
  return 29;
};

// Shared chrome: the wordmark sits top-left on every slide and the strip runs
// along the bottom, so a slide saved out of context still says what it is.
// "7 de agosto de 2026" is twice the width of "Aug. 7, 2026", and a slide index
// ("2/3") is shorter still. The wordmark has first claim on the row, so the
// kicker sizes to whatever is left.
const kickerSize = (text) => (text.length <= 8 ? 29 : text.length <= 16 ? 26 : 22);

const portraitFrame = (body, { footer = '', kicker = '' }) => `
  <header class="chrome">
    <p class="lockup">Immigration Daybook</p>
    ${kicker ? `<p class="kicker">${kicker}</p>` : ''}
  </header>
  <div class="stage">${body}</div>
  <footer class="strip">${footer}</footer>`;

const portraitCss = (kicker) => `
  body { justify-content: flex-start; }
  .chrome {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 24px;
    padding-bottom: 26px;
    border-bottom: 4px solid ${CRIMSON};
  }
  /* The wordmark never breaks. At this size a long Spanish date in the kicker
     was enough to wrap it to two lines, which reads as a broken masthead — so
     the wordmark holds and the kicker gives way instead (see kickerSize). */
  .lockup {
    font-family: "Jost", sans-serif;
    font-size: 34px;
    font-weight: 700;
    letter-spacing: 0.13em;
    text-transform: uppercase;
    white-space: nowrap;
    color: ${CRIMSON};
  }
  .kicker {
    font-family: "Jost", sans-serif;
    font-size: ${kickerSize(kicker)}px;
    font-weight: 600;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: rgba(243, 241, 233, 0.62);
    white-space: nowrap;
  }
  /* Top-anchored, under the masthead rule. The bottom of a feed image is where
     the app's own furniture lands, so anything put down there is being handed to
     the caption row and the action buttons. Every slide therefore starts at the
     same height and grows downward into the space that is cheapest to lose. */
  .stage {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    min-height: 0;
    padding: 56px 0 12px;
  }
  .hed {
    font-family: "Lora", serif;
    font-weight: 600;
    line-height: 1.12;
    letter-spacing: -0.02em;
    color: ${CREAM};
    text-wrap: balance;
  }
  .nut {
    font-family: "Jost", sans-serif;
    font-weight: 400;
    line-height: 1.42;
    color: rgba(243, 241, 233, 0.82);
    margin-top: 30px;
  }
  .strip {
    display: flex;
    justify-content: space-between;
    gap: 24px;
    padding-top: 26px;
    border-top: 3px solid rgba(243, 241, 233, 0.22);
    font-family: "Jost", sans-serif;
    font-size: 27px;
    font-weight: 600;
    letter-spacing: 0.13em;
    text-transform: uppercase;
    color: rgba(243, 241, 233, 0.62);
  }`;

const coverSlide = ({ hed, date, terms }) =>
  shell(
    portraitCss(date) + `\n  .hed { font-size: ${coverHedSize(hed)}px; }`,
    portraitFrame(`<h1 class="hed">${escapeHtml(hed)}</h1>`, {
      kicker: date,
      // The domain and the bilingual fact. All three terms would overrun the
      // strip at this size, and "which languages" is the one that earns its
      // place on a cover shown to people who have never seen the thing.
      footer: `<span>${HOME_URL}</span><span>${escapeHtml(terms[terms.length - 1])}</span>`,
    }),
    PORTRAIT,
  );

const beatSlide = ({ headline, nut, index, total }) =>
  shell(
    portraitCss(`${index}/${total}`) +
      `\n  .hed { font-size: ${beatHedSize(headline)}px; }` +
      (nut ? `\n  .nut { font-size: ${nutSize(nut)}px; }` : ''),
    portraitFrame(
      `<h2 class="hed">${escapeHtml(headline)}</h2>` +
        (nut ? `<p class="nut">${escapeHtml(nut)}</p>` : ''),
      {
        kicker: `${index}/${total}`,
        footer: `<span>${HOME_URL}</span>`,
      },
    ),
    PORTRAIT,
  );

// The calendar slide: dated entries, biggest thing on the card being the date.
//
// This is the slide the deck exists for. A headline tells someone what happened;
// a date with a deadline attached tells them what to do about it, and it is the
// one thing here worth screenshotting and keeping.
const UPCOMING_LABEL = { en: 'What’s coming', es: 'Lo que viene' };

// Two entries share the height, so the prose sizes down as it runs long. These
// are set against real summaries, which run 120 to 240 characters after the
// trim in pull.mjs.
const entryTextSize = (text) => {
  const n = text.length;
  if (n <= 140) return 38;
  if (n <= 220) return 34;
  return 31;
};

const upcomingSlide = ({ entries, lang }) =>
  shell(
    portraitCss(UPCOMING_LABEL[lang] ?? UPCOMING_LABEL.en) +
      `
  .stage { gap: 58px; }
  .entry { display: flex; gap: 30px; align-items: flex-start; }
  /* Fixed width so the prose of every entry starts on the same left edge —
     a ragged text column is the fastest way to make a list look unconsidered. */
  .chip {
    flex: 0 0 148px;
    border-top: 4px solid ${CRIMSON};
    padding-top: 14px;
  }
  .chip .month {
    font-family: "Jost", sans-serif;
    font-size: 30px;
    font-weight: 700;
    letter-spacing: 0.14em;
    color: ${CRIMSON};
  }
  .chip .day {
    font-family: "Lora", serif;
    font-size: 84px;
    font-weight: 600;
    line-height: 1;
    letter-spacing: -0.03em;
    color: ${CREAM};
  }
  .entry p {
    font-family: "Jost", sans-serif;
    font-weight: 400;
    line-height: 1.4;
    color: rgba(243, 241, 233, 0.86);
    padding-top: 10px;
  }`,
    portraitFrame(
      entries
        .map(
          (entry) => `
    <div class="entry">
      <div class="chip">
        <div class="month">${escapeHtml(entry.month)}</div>
        <div class="day">${escapeHtml(entry.day)}</div>
      </div>
      <p style="font-size: ${entryTextSize(entry.text)}px;">${escapeHtml(entry.text)}</p>
    </div>`,
        )
        .join(''),
      {
        kicker: UPCOMING_LABEL[lang] ?? UPCOMING_LABEL.en,
        footer: `<span>${HOME_URL}</span>`,
      },
    ),
    PORTRAIT,
  );

const closingSlide = ({ call, url, terms }) =>
  shell(
    portraitCss('') + `\n  .hed { font-size: ${coverHedSize(call)}px; }
  .url {
    font-family: "Jost", sans-serif;
    font-size: 46px;
    font-weight: 600;
    letter-spacing: 0.04em;
    color: ${CRIMSON};
    margin-top: 34px;
  }`,
    portraitFrame(
      `<h2 class="hed">${escapeHtml(call)}</h2><p class="url">${escapeHtml(url)}</p>`,
      { footer: terms.map((t) => `<span>${escapeHtml(t)}</span>`).join('') },
    ),
    PORTRAIT,
  );

// The closing plate's copy. `terms` is lifted from the landing card rather than
// rewritten so the two plates cannot drift apart, and the call is the plainest
// statement of the offer — this slide exists to be acted on, not admired.
const CLOSING = {
  en: { call: 'Free, every weekday morning.', url: HOME_URL },
  es: { call: 'Gratis, cada mañana entre semana.', url: HOME_URL },
};

// Build a language's carousel from the deck JSON that pull.mjs wrote.
//
// Numbered filenames because the only thing standing between a correct deck and
// a shuffled one is upload order, and every picker sorts by name.
const carouselSlides = (lang) => {
  if (!deckPath) return null;

  const deck = JSON.parse(readFileSync(deckPath, 'utf8'))[lang];
  if (!deck) return null;

  const terms = LANDING[lang].facts;
  const beats = deck.beats ?? [];
  const upcoming = deck.upcoming ?? [];
  const dir = `social/${deck.date}/${lang}`;

  // Cover, story, calendar, terms — in that order because the headline is what
  // stops the scroll and the dates are what earn the follow. A deck that puts
  // the payoff last is a deck most people never reach the payoff of.
  const slides = [
    coverSlide({ hed: deck.hed, date: formatCardDate(deck.date, lang), terms }),
    ...beats.map((beat, i) => beatSlide({ ...beat, index: i + 1, total: beats.length })),
    ...upcoming.map((slide) => upcomingSlide({ entries: slide.entries, lang })),
    closingSlide({ ...CLOSING[lang], terms }),
  ];

  const names = [
    'cover',
    ...beats.map(() => 'story'),
    ...upcoming.map(() => 'upcoming'),
    'subscribe',
  ];

  return slides.map((html, i) => ({
    file: `${dir}/${String(i + 1).padStart(2, '0')}-${names[i]}.png`,
    html,
  }));
};

// Every card resolves to a list of {file, html}. Most produce one; the carousel
// produces a deck, which is the only reason this is a list at all.
const one = (file, html) => (html ? [{ file, html }] : null);

const CARDS = {
  landing: {
    slides: (lang) => one(`immigration-daybook-og-${lang}.png`, landingCard(LANDING[lang])),
  },
  announcement: {
    slides: (lang) =>
      one(`immigration-daybook-announce-og-${lang}.png`, announcementCard(ANNOUNCEMENT[lang])),
    },
  edition: {
    slides: (lang) => {
      const copy = editionCopy(lang);
      return copy
        ? one(`immigration-daybook-og-${editionDate}-${lang}.png`, announcementCard(copy))
        : null;
    },
    needs: 'the edition card needs --edition <YYYY-MM-DD> and --headline <text>',
  },
  carousel: {
    slides: carouselSlides,
    frame: PORTRAIT,
    outSize: PORTRAIT_SIZE,
    needs: 'the carousel needs --deck <path to deck.json>',
    // The deck's length and its slide names both change with the edition, so a
    // re-render leaves the previous run's files behind under names the new run
    // never writes. That matters more here than anywhere else in this script:
    // the workflow is "save every image in this folder", and a stale slide is
    // one that gets posted.
    clean: true,
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

  const frame = card.frame ?? LANDSCAPE;
  const outSize = card.outSize ?? OUT_SIZE;

  for (const lang of langs) {
    const slides = card.slides(lang);
    if (!slides?.length) {
      console.error(card.needs ?? `No ${cardName} copy for lang "${lang}".`);
      process.exitCode = 1;
      continue;
    }

    if (card.clean) {
      for (const dir of new Set(slides.map((slide) => dirname(join(outDir, slide.file))))) {
        rmSync(dir, { recursive: true, force: true });
      }
    }

    for (const slide of slides) {
      renderSlide({ slide, cardName, lang, frame, outSize });
    }
  }
}

function renderSlide({ slide, cardName, lang, frame, outSize }) {
  const stem = `${cardName}-${slide.file.replace(/[/\\]/g, '-').replace(/\.png$/, '')}-${lang}`;
    const html = join(workDir, `.${stem}.html`);
    const raw = join(workDir, `.${stem}-2x.png`);
  const out = join(outDir, slide.file);
  mkdirSync(dirname(out), { recursive: true });

  writeFileSync(html, slide.html);

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
      `--window-size=${frame.width},${frame.height}`,
      `--screenshot=${raw}`,
      `file://${html}`,
    ],
    // stderr is dropped: headless Chrome spews harmless dbus/UPower noise here.
    { stdio: ['ignore', 'ignore', 'ignore'] },
  );

  execFileSync('convert', [raw, '-resize', outSize, '-strip', out]);
  rmSync(raw, { force: true });
  rmSync(html, { force: true });

  console.log(`Wrote static/images/${slide.file}`);
}
