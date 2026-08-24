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
// The sheet an exhibit is set on. See exhibitSlide.
const PAPER = '#fdfcf9';

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


// ── Filling the frame ─────────────────────────────────────────────────────
// Every type size on a portrait slide is `calc(var(--fit) * Npx)`, and the
// script below searches for the largest --fit whose content still fits the
// stage. One multiplier scales a whole slide, line wrapping included, so the
// search is monotonic and a binary one lands in a dozen steps.
//
// This exists because stepping type by character count can only ever be
// conservative: the step that keeps a 140-character headline inside the frame
// is the step a 60-character one also gets, and the difference came out as dead
// space — better than half the card on the editions this was set against. The
// step functions below still set the *ratio* between a hed and the prose under
// it, which is a typographic judgement and not something a fitter can make.
// They are now a starting point rather than a final size.
//
// The bounds are the honest limits of that judgement. Below FIT_MIN the prose
// is too small to read on a phone, so an overlong slide is clipped instead —
// which is loud, and meant to be: it is a copy problem, not a layout one. Above
// FIT_MAX a thin slide starts shouting, and a headline set at poster size to
// use up space reads as having nothing to say.
const FIT_MIN = 0.62;
const FIT_MAX = 1.34;

const fitpx = (n) => `calc(var(--fit) * ${n}px)`;

// Runs before the screenshot: Chrome's virtual clock does not advance past the
// screenshot until the page is quiet, so the await and the layout reads here
// resolve first. Fonts are awaited because a fit measured in the fallback face
// is a fit for the wrong metrics.
const FIT_SCRIPT = `
<script>
  (async () => {
    if (document.fonts) {
      try { await document.fonts.ready; } catch (err) {}
    }

    const root = document.documentElement;
    const stage = document.querySelector('.stage');
    if (!stage || !stage.firstElementChild) return;

    // Padding is deliberately not scaled — it is the slide's margin against the
    // masthead and the bottom of the card, and it should not breathe with the type.
    const room = () => {
      const style = getComputedStyle(stage);
      return (
        stage.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom)
      );
    };

    // Measured off rendered geometry rather than scrollHeight, which drops a
    // last child's margin and a container's bottom padding.
    const used = () =>
      stage.lastElementChild.getBoundingClientRect().bottom -
      stage.firstElementChild.getBoundingClientRect().top;

    const fits = (k) => {
      root.style.setProperty('--fit', String(k));
      return used() <= room();
    };

    if (!fits(${FIT_MIN})) return;
    if (fits(${FIT_MAX})) return;

    let lo = ${FIT_MIN};
    let hi = ${FIT_MAX};
    for (let i = 0; i < 16; i += 1) {
      const mid = (lo + hi) / 2;
      if (fits(mid)) lo = mid;
      else hi = mid;
    }
    fits(lo);
  })();
</script>`;

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

// Shared chrome: wordmark and date on one line at the top, the domain centred
// at the foot. Three fixed points, and everything between them is the slide.
//
// Every slide is dated, not just the cover — a slide screenshotted out of a
// deck travels alone, and one about a system that changes weekly needs to say
// when it was true. "7 de agosto de 2026" is half again the width of "Aug. 7,
// 2026", and the wordmark has first claim on the line: it must never break to
// two, which reads as a broken masthead, so the date sizes to what is left.
const dateSize = (text) => (text.length <= 8 ? 29 : text.length <= 16 ? 26 : 22);

const portraitFrame = (body, { date = '', site = true }) => `
  <header class="masthead">
    <p class="lockup">Immigration Daybook</p>
    ${date ? `<p class="date">${escapeHtml(date)}</p>` : ''}
  </header>
  <div class="stage">${body}</div>
  ${site ? `<footer class="site">${HOME_URL}</footer>` : ''}
${FIT_SCRIPT}`;

// Publications whose own mark is mixed case, and which the house all-caps would
// otherwise misspell. LAist is LAist: the lowercase "ist" is the mark, and
// LAIST reads as an outlet that does not exist. The uppercase is CSS, not the
// string, so the exception has to ride in a span that turns it back off.
//
// Keyed on what the edition's link text says and matched case-insensitively, so
// an upstream "LAIST" is corrected here too rather than passed through. Anything
// not on this list takes the all-caps, which is nearly everything — this is a
// list of marks, not a list of preferences.
const VERBATIM_SOURCES = new Map([['laist', 'LAist']]);

const sourceName = (name) => {
  const verbatim = VERBATIM_SOURCES.get(String(name).trim().toLowerCase());
  return verbatim ? `<span class="asis">${escapeHtml(verbatim)}</span>` : escapeHtml(name);
};

// The publications a story slide was built from, named under a hairline.
//
// Not favicons. They arrive at 16-32px and would have to be blown up four times
// to sit beside 40px type; fetching them at render time makes the deck depend
// on a dozen third-party servers being up, and the failure is silent, which is
// the one thing a card must never be. And a row of brand-coloured squares
// across an ink-and-crimson card reads as an aggregator's link farm. The names
// are the thing the favicon was standing in for anyway, and they are legible at
// a thumb's distance.
const creditLine = (sources) =>
  sources?.length
    ? `<p class="credit">${sources
        .map((s) => sourceName(s))
        .join('<span class="sep">·</span>')}</p>`
    : '';

const portraitCss = (date) => `
  :root { --fit: 1; }
  body { justify-content: flex-start; }
  /* No rule under the wordmark. There was a 4px crimson bar here doing two jobs
     badly at once: branding a masthead that is already crimson and already the
     loudest thing on the card, and dividing it. The wordmark and the spacing
     hold the top without it, and the hairlines between calendar entries are now
     the only rule system on the deck. */
  .masthead {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 24px;
  }
  .lockup {
    font-family: "Jost", sans-serif;
    font-size: 34px;
    font-weight: 700;
    letter-spacing: 0.13em;
    text-transform: uppercase;
    white-space: nowrap;
    color: ${CRIMSON};
  }
  /* Furniture rather than argument, so it takes the quiet value and lets the
     crimson wordmark lead. */
  .date {
    font-family: "Jost", sans-serif;
    font-size: ${dateSize(date)}px;
    font-weight: 600;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    white-space: nowrap;
    color: rgba(243, 241, 233, 0.58);
  }
  /* Centred at the foot, and the only centred thing on the deck — which is the
     point: it is not part of the reading, it is where to go afterwards. */
  .site {
    padding-top: 30px;
    text-align: center;
    font-family: "Jost", sans-serif;
    font-size: 26px;
    font-weight: 600;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: rgba(243, 241, 233, 0.5);
  }
  /* Top-anchored under the masthead, so every slide starts at the same height
     and grows downward. */
  .stage {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    min-height: 0;
    padding: 52px 0 16px;
    /* The fitter's floor is a real floor: a slide whose copy will not come down
       to a readable size is cropped here rather than allowed off the card. */
    overflow: hidden;
  }
  .hed {
    font-family: "Lora", serif;
    font-weight: 600;
    line-height: 1.12;
    letter-spacing: -0.02em;
    color: ${CREAM};
    text-wrap: balance;
  }
  /* Three tiers of prose, and they have to rank without changing typeface:
     the nut is the claim (heavier, brighter), the detail is the evidence for it
     (lighter, quieter), the credit is who reported it. Two Jost paragraphs at
     the same weight and value read as one long paragraph broken in half. */
  /* text-wrap: pretty is for the widow. A nut ending "…orders on Aug. 6."
     breaks after the abbreviation and leaves "6." alone on a line of its own,
     which at this size is a hole in the middle of the card. */
  .nut {
    font-family: "Jost", sans-serif;
    font-weight: 500;
    line-height: 1.4;
    color: rgba(243, 241, 233, 0.92);
    margin-top: ${fitpx(30)};
    text-wrap: pretty;
  }
  .detail {
    font-family: "Jost", sans-serif;
    font-weight: 400;
    line-height: 1.44;
    color: rgba(243, 241, 233, 0.62);
    margin-top: ${fitpx(24)};
    text-wrap: pretty;
  }
  .credit {
    margin-top: ${fitpx(34)};
    padding-top: ${fitpx(20)};
    border-top: 2px solid rgba(243, 241, 233, 0.22);
    font-family: "Jost", sans-serif;
    font-size: ${fitpx(24)};
    font-weight: 600;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: ${CRIMSON};
  }
  .credit .sep {
    color: rgba(243, 241, 233, 0.34);
    padding: 0 0.55em;
  }
  /* The one opt-out of the house all-caps. See VERBATIM_SOURCES.
     The tracking goes with it: 0.15em is set for capitals, and on mixed case it
     pulls the word apart into "L A i s t" — which is not the mark either. */
  .asis {
    text-transform: none;
    letter-spacing: 0.02em;
  }`;

// The cover: the lede, cut the same way every other story on the deck is cut.
//
// It used to stop after the claim, on the argument that a cover is a poster and
// a second sentence is just more of one story. That made the cover the one
// slide with a different shape, which a reader reads as a different kind of
// thing — and the lede is not a different kind of thing, it is the day's best
// story. Same three tiers, same credit line.
//
// The hed steps down a size when prose rides with it: at full display size the
// two compete instead of ranking.
const coverSlide = ({ hed, nut, detail, sources, date }) =>
  shell(
    portraitCss(date) +
      `\n  .hed { font-size: ${fitpx(nut ? Math.round(coverHedSize(hed) * 0.82) : coverHedSize(hed))}; }` +
      (nut ? `\n  .nut { font-size: ${fitpx(nutSize(nut))}; }` : '') +
      (detail ? `\n  .detail { font-size: ${fitpx(Math.round(nutSize(detail) * 0.92))}; }` : ''),
    portraitFrame(
      `<h1 class="hed">${escapeHtml(hed)}</h1>` +
        (nut ? `<p class="nut">${escapeHtml(nut)}</p>` : '') +
        (detail ? `<p class="detail">${escapeHtml(detail)}</p>` : '') +
        creditLine(sources),
      { date },
    ),
    PORTRAIT,
  );

// A story slide: one of the edition's other beats — headline, the bolded claim,
// the sentence the edition offers in support of it, and who reported it. The
// lede is not among them (it is on the cover), so these are what a reader has
// not already been told.
//
// The claim used to stand alone here, which made the slide a headline followed
// by the same headline in longer words. The supporting sentence is what turns
// it into a story; the credit line is what makes it checkable.
//
// No rubric. The calendar slide has one because "What's coming" names a kind of
// thing; a story slide would want a word for what this particular story is, and
// the words here are David's. A slide index is the other obvious candidate and
// is worse — the deck is not all stories, so "2/2" would count something a
// reader cannot see the whole of.
const beatSlide = ({ headline, nut, detail, sources, date }) =>
  shell(
    portraitCss(date) +
      `\n  .hed { font-size: ${fitpx(beatHedSize(headline))}; }` +
      (nut ? `\n  .nut { font-size: ${fitpx(nutSize(nut))}; }` : '') +
      // A step under the claim, before opacity is counted. Ranked by size and
      // value together, because either alone is a difference a thumb misses.
      (detail ? `\n  .detail { font-size: ${fitpx(Math.round(nutSize(detail) * 0.92))}; }` : ''),
    portraitFrame(
      `<h2 class="hed">${escapeHtml(headline)}</h2>` +
        (nut ? `<p class="nut">${escapeHtml(nut)}</p>` : '') +
        (detail ? `<p class="detail">${escapeHtml(detail)}</p>` : '') +
        creditLine(sources),
      { date },
    ),
    PORTRAIT,
  );

// The calendar board: every deadline the edition published, on one card, with
// how far off each one is.
//
// This is the slide the deck exists for. A headline tells someone what happened;
// a date with a deadline attached tells them what to do about it, and it is the
// one thing here worth screenshotting and keeping.
//
// It was two slides of two until 2026-08-18, and the problem with that was not
// the layout. Deadlines are standing: the N-400 comment period closed on Aug. 24
// whether the edition was the 7th, the 11th, the 13th or the 17th, so four
// decks running carried the same three entries and the calendar slides came out
// byte-identical. Two sixths of a deck, identical to last week's.
//
// The countdown is the answer to that, and it is not a trick — it is the fact a
// reader wants. The date says when; "in six days" says whether there is still
// time, which is the question someone reads a deadline to ask. It is true on the
// morning it is posted and different the next morning, off the same row.
//
// So: one board, four entries, and the countdowns running down the right edge in
// the deck's one accent colour. The crimson on this card belongs to time — the
// date on the left, what is left of it on the right — and the publisher goes
// quiet between them.
const UPCOMING_LABEL = { en: 'What’s coming', es: 'Lo que viene' };

// One size for every entry on a slide, and the fitter takes the whole slide
// down together. Stepping each entry by its own length was the old behaviour
// and it set two paragraphs of the same kind at two different sizes, which
// reads as one of them mattering more. In a calendar none of them does — the
// dates rank the entries, not the type.
//
// Down from 36 with the move to four entries a card. The board is read by
// scanning dates and stopping at one, not by reading top to bottom, and the
// size that serves that is the size that fits four.
const ENTRY_TEXT_SIZE = 30;

const upcomingSlide = ({ entries, lang, date }) =>
  shell(
    portraitCss(date) +
      `
  .stage { gap: ${fitpx(32)}; }
  /* The rubric came off the wordmark's line, where it sat at caption size and
     read as a footnote to the masthead rather than as the name of what follows.
     Down here at the head of the stage, in the deck's one accent colour, it is
     doing the job it was put there to do. */
  .rubric {
    font-family: "Jost", sans-serif;
    font-size: ${fitpx(38)};
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: ${CRIMSON};
    margin-bottom: ${fitpx(-6)};
  }
  .entry {
    display: flex;
    gap: ${fitpx(32)};
    align-items: flex-start;
  }
  /* The rule goes between entries and nowhere else. Set on every entry it also
     landed above the first one too, where it separates the entry from nothing.
     A separator that separates nothing is just another line. */
  .entry + .entry {
    border-top: 2px solid rgba(243, 241, 233, 0.24);
    padding-top: ${fitpx(32)};
  }
  /* Fixed width so the prose of every entry starts on the same left edge —
     a ragged text column is the fastest way to make a list look unconsidered.
     It scales with the type, or a grown numeral outruns its column. */
  .chip {
    flex: 0 0 ${fitpx(124)};
    border-top: 5px solid ${CRIMSON};
    padding-top: ${fitpx(14)};
  }
  .chip .month {
    font-family: "Jost", sans-serif;
    font-size: ${fitpx(26)};
    font-weight: 700;
    letter-spacing: 0.14em;
    color: ${CRIMSON};
  }
  .chip .day {
    font-family: "Lora", serif;
    font-size: ${fitpx(68)};
    font-weight: 600;
    line-height: 0.98;
    letter-spacing: -0.03em;
    color: ${CREAM};
  }
  /* The weekday is the one thing the snapshot knows that a reader has to work
     out for themselves otherwise, and "a week Monday" is how people actually
     hold a deadline. It closes the chip, so the date reads as a block rather
     than as a numeral with a label stuck above it. */
  .chip .dow {
    font-family: "Jost", sans-serif;
    font-size: ${fitpx(21)};
    font-weight: 600;
    letter-spacing: 0.16em;
    color: rgba(243, 241, 233, 0.5);
    margin-top: ${fitpx(6)};
  }
  .entry .body {
    flex: 1;
    min-width: 0;
    padding-top: ${fitpx(12)};
  }
  .entry .text {
    font-family: "Jost", sans-serif;
    font-size: ${fitpx(ENTRY_TEXT_SIZE)};
    font-weight: 400;
    line-height: 1.4;
    color: rgba(243, 241, 233, 0.88);
    text-wrap: pretty;
  }
  /* The foot of an entry: who says so on the left, how long is left on the
     right. Both are set as furniture, and only one of them is crimson.

     The publisher is the authority behind the deadline, not a gloss on it, so it
     stays quiet — a source line set as loudly as the date competes with the one
     thing on this card worth acting on. The countdown gets the accent because it
     is the other half of the date, and because ranged down the right edge of
     four entries it is what makes this a board rather than a list. */
  .entry .meta {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: ${fitpx(20)};
    margin-top: ${fitpx(16)};
    font-family: "Jost", sans-serif;
    font-size: ${fitpx(22)};
    font-weight: 600;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: rgba(243, 241, 233, 0.5);
  }
  .entry .meta .left {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .entry .meta .countdown {
    flex: none;
    color: ${CRIMSON};
  }`,
    portraitFrame(
      `<p class="rubric">${escapeHtml(UPCOMING_LABEL[lang] ?? UPCOMING_LABEL.en)}</p>` +
        entries.map(upcomingEntry).join(''),
      { date },
    ),
    PORTRAIT,
  );

// A snapshot with no publisher leaves the entry as it was before any of this,
// and an entry the countdown cannot place keeps its meta row without one.
// Nothing here is invented to fill the row.
const upcomingEntry = (entry) => `
    <div class="entry">
      <div class="chip">
        <div class="month">${escapeHtml(entry.month)}</div>
        <div class="day">${escapeHtml(entry.day)}</div>
        ${entry.weekday ? `<div class="dow">${escapeHtml(entry.weekday)}</div>` : ''}
      </div>
      <div class="body">
        <p class="text">${escapeHtml(entry.text)}</p>
        ${
          entry.publisher || entry.countdown
            ? `<div class="meta">
          <span class="left">${escapeHtml(entry.publisher ?? '')}</span>
          ${entry.countdown ? `<span class="countdown">${escapeHtml(entry.countdown)}</span>` : ''}
        </div>`
            : ''
        }
      </div>
    </div>`;

// An exhibit slide: the daily deck holding up a document.
//
// dossier.mjs already renders slides about documents, but a dossier is a whole
// separate deck, hand-built for a story big enough to carry seven slides of its
// own. Most days there is one document worth showing and no case for a second
// deck nobody will find. This is that middle: the daily carousel, which people
// already swipe, with the primary source set into it beside the story it backs.
//
// The form is dossier.mjs's and is deliberately identical — paper panel, crimson
// marks over the operative words, a caption naming the document. The two files
// carry it twice for the reason dossier.mjs's header gives: og.mjs is a CLI, not
// a module, and entangling the daily deck with a special is worse than the
// duplication. If they drift, this one is right.
//
// Which document, cropped where, marked at which line: none of that is derivable
// from the edition, so none of it is derived. It is hand-authored per edition in
// scripts/daybook/exhibits/<date>/exhibits.json and read at pull time.
//
// The crop is inlined as a data URI rather than referenced by path. The slide
// HTML is written to scripts/daybook/out/ and the crops live two directories up,
// so a relative src would resolve to nothing — and a missing document that
// renders as an empty panel is exactly the silent failure the credit line's
// comment refuses. Inlining makes an unreadable file throw at build time.
const exhibitPanel = (panel, specDir) =>
  `<div class="panel">${panel
    .map(({ img, width, marks = [] }) => {
      const data = readFileSync(join(specDir, img)).toString('base64');
      const overlays = marks
        .map(
          ({ l, t, w, h, style }) =>
            `<i class="mark ${style === 'rule' ? 'rule-mark' : style === 'hl' ? 'hl-mark' : 'box-mark'}" style="left:${l * 100}%;top:${t * 100}%;width:${w * 100}%;height:${h * 100}%;"></i>`,
        )
        .join('');
      return `<figure class="strip"${width ? ` style="width:${width}"` : ''}>
        <div class="shot"><img src="data:image/png;base64,${data}" />${overlays}</div>
      </figure>`;
    })
    .join('')}</div>`;

const exhibitSlide = ({ hed, nut, caption, panel, specDir, date }) =>
  shell(
    portraitCss(date) +
      `
  .hed { font-size: ${fitpx(Math.round(coverHedSize(hed) * 0.78))}; }
  ${nut ? `.nut { font-size: ${fitpx(Math.round(nutSize(nut) * 0.94))}; }` : ''}
  /* The sheet. Flat, like everything else on the deck — the value jump off the
     ink is all the lift a document needs. The panel does not scale with --fit:
     type negotiates for the space around a document, and the document does not
     shrink to flatter the type. */
  .panel {
    background: ${PAPER};
    padding: 24px;
    margin-top: ${fitpx(30)};
  }
  .strip { width: 100%; margin: 0 auto; }
  /* Marks anchor to the image, not the figure: a second strip carries the
     divider's padding-top, and a percentage top measured against the padding
     box lands every mark high by that padding. */
  .shot { position: relative; }
  .strip + .strip {
    margin-top: 22px;
    padding-top: 22px;
    border-top: 1px solid #d9d5c9;
  }
  .strip img { display: block; width: 100%; height: auto; }
  .mark { position: absolute; display: block; }
  .box-mark { border: 5px solid ${CRIMSON}; border-radius: 6px; opacity: 0.85; }
  .rule-mark { background: ${CRIMSON}; border-radius: 3px; opacity: 0.8; }
  /* Marker over the text rather than a rule under it: at phone scale a thin rule
     reads as underlined furniture, a swipe of highlighter reads as a human
     having marked the operative words. Multiply keeps the type legible through
     the wash. */
  .hl-mark {
    background: ${CRIMSON};
    mix-blend-mode: multiply;
    opacity: 0.33;
    border-radius: 5px;
  }
  /* Who this document is — the checkable line, and the reason the slide is not
     just a screenshot. */
  .caption {
    font-family: "Jost", sans-serif;
    font-size: ${fitpx(22)};
    font-weight: 600;
    letter-spacing: 0.05em;
    color: rgba(243, 241, 233, 0.55);
    margin-top: ${fitpx(18)};
    text-wrap: pretty;
  }`,
    portraitFrame(
      `<h1 class="hed">${escapeHtml(hed)}</h1>` +
        (nut ? `<p class="nut">${escapeHtml(nut)}</p>` : '') +
        exhibitPanel(panel, specDir) +
        (caption ? `<p class="caption">${escapeHtml(caption)}</p>` : ''),
      { date },
    ),
    PORTRAIT,
  );

// The round-up slide: the edition's closing briefs, three of them.
//
// An edition runs three or four stories and then six or seven one-line items,
// and until now the deck read the stories and stopped — a reader who swiped the
// whole thing saw a third of the day. This is the cheapest breadth in the
// newsletter and it was going nowhere.
//
// The credit runs above the brief rather than under it, which is the one place
// on the deck it does. On a story slide the credit is a footer under a hairline:
// the claim is the thing and the publications are what it rests on. Here there
// is no claim, just news in a line, and a slug over each item does two jobs at
// once — it gives the eye somewhere to enter three stacked paragraphs, and it
// says who reported this before the reader has read it rather than after.
//
// Crimson for the same reason it is crimson on the calendar: it marks whatever
// on the card is the checkable thing. There it is the date. Here it is the byline.
const briefsSlide = ({ rubric, items, date }) =>
  shell(
    portraitCss(date) +
      `
  .stage { gap: ${fitpx(34)}; }
  .rubric {
    font-family: "Jost", sans-serif;
    font-size: ${fitpx(38)};
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: ${CRIMSON};
    margin-bottom: ${fitpx(-8)};
  }
  /* Same rule system as the calendar board: hairlines between items, never
     above the first one. */
  .brief + .brief {
    border-top: 2px solid rgba(243, 241, 233, 0.24);
    padding-top: ${fitpx(34)};
  }
  .brief .slug {
    font-family: "Jost", sans-serif;
    font-size: ${fitpx(23)};
    font-weight: 600;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: ${CRIMSON};
    margin-bottom: ${fitpx(12)};
  }
  .brief .text {
    font-family: "Jost", sans-serif;
    font-size: ${fitpx(32)};
    font-weight: 400;
    line-height: 1.4;
    color: rgba(243, 241, 233, 0.88);
    text-wrap: pretty;
  }`,
    portraitFrame(
      `<p class="rubric">${escapeHtml(rubric)}</p>` +
        items
          .map(
            (item) => `
    <div class="brief">
      ${item.sources?.length ? `<p class="slug">${sourceName(item.sources[0])}</p>` : ''}
      <p class="text">${escapeHtml(item.text)}</p>
    </div>`,
          )
          .join(''),
      { date },
    ),
    PORTRAIT,
  );

// The one slide that centres rather than hanging off the masthead.
//
// Every other slide starts at the same height so the deck holds still under a
// thumb, and that rule is worth keeping where the slides carry news of
// different lengths. This one carries an offer of fixed length, and the fitter
// has nothing to fill with — six words will not reach the strip at any size a
// closing plate should be set in. Top-anchored it reads as a slide missing its
// second half; centred it reads as a plate, which is what it is.
const closingSlide = ({ call, url, date }) =>
  shell(
    portraitCss(date) + `\n  .stage { justify-content: center; }
  .hed { font-size: ${fitpx(coverHedSize(call))}; }
  .url {
    font-family: "Jost", sans-serif;
    font-size: ${fitpx(46)};
    font-weight: 600;
    letter-spacing: 0.04em;
    color: ${CRIMSON};
    margin-top: ${fitpx(34)};
  }`,
    portraitFrame(
      `<h2 class="hed">${escapeHtml(call)}</h2><p class="url">${escapeHtml(url)}</p>`,
      // The one slide that drops the domain out of the chrome: it is the whole
      // point of this slide, set at display size, and printing it twice on one
      // card makes the big one look like a caption for the small one.
      { date, site: false },
    ),
    PORTRAIT,
  );

// The closing plate's copy: the plainest statement of the offer, since this
// slide exists to be acted on rather than admired.
//
// It used to carry the terms off the landing card — "Monday–Friday", "English &
// Spanish" — along the bottom. The languages came off because a deck is posted
// per language, to an account that is already in that language, where the fact
// answers a question nobody in the audience is asking.
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

  const beats = deck.beats ?? [];
  const briefs = deck.briefs ?? null;
  const upcoming = deck.upcoming ?? [];
  const dir = `social/${deck.date}/${lang}`;

  // Every slide is dated, not just the cover: a slide screenshotted out of a
  // deck travels on its own, and an undated one about a system that changes
  // weekly is worse than no slide.
  const date = formatCardDate(deck.date, lang);

  // Cover, the day's other stories, the round-up, the calendar, the offer. The
  // news earns the swipe and the dates earn the follow, so the calendar sits
  // after the stories but well before the end — a deck that puts the payoff last
  // is a deck most people never reach the payoff of.
  //
  // The round-up goes between them because it is still news, and because it
  // widens the deck at exactly the point where a reader who came for one story
  // has finished it: three more places the same system turned up this morning,
  // and then the dates.
  // Exhibits sit immediately after the story they back, not in a block of their
  // own: a document is evidence for a claim, and a reader who has just been told
  // the claim is the only reader it means anything to. `afterBeat` names the
  // beat by a fragment of its headline rather than by index, because the beat
  // order is derived from the edition and can change under a re-pull — an index
  // would silently file the Adelanto order behind the Haiti flight.
  //
  // An exhibit whose beat is not on the deck is dropped with a warning rather
  // than appended somewhere plausible. The alternative is a document held up
  // beside a story the deck never told.
  const exhibits = deck.exhibits ?? [];
  // The crops live beside the spec that names them, keyed by edition date, so
  // og.mjs resolves them from the date it was handed rather than from a path
  // baked into the deck JSON.
  const specDir = join(here, 'exhibits', deck.date);
  const beatKey = (headline) => String(headline ?? '').toLowerCase();
  const placed = new Set();
  const exhibitsFor = (headline) =>
    exhibits.filter((exhibit) => {
      const hit = beatKey(headline).includes(String(exhibit.afterBeat ?? '').toLowerCase());
      if (hit) placed.add(exhibit);
      return hit;
    });

  const stories = beats.flatMap((beat) => [
    { name: 'story', html: beatSlide({ ...beat, date }) },
    ...exhibitsFor(beat.headline).map((exhibit) => ({
      name: 'exhibit',
      html: exhibitSlide({ ...exhibit, ...(exhibit[lang] ?? {}), specDir, date }),
    })),
  ]);

  for (const exhibit of exhibits) {
    if (!placed.has(exhibit)) {
      console.warn(
        `WARNING: ${deck.date} ${lang}: exhibit "${exhibit.name ?? exhibit.afterBeat}" matches no beat on the deck — dropped.`,
      );
    }
  }

  const slides = [
    { name: 'cover', html: coverSlide({ hed: deck.hed, nut: deck.nut, detail: deck.detail, sources: deck.sources, date }) },
    ...stories,
    ...(briefs ? [{ name: 'roundup', html: briefsSlide({ ...briefs, date }) }] : []),
    ...upcoming.map((slide) => ({
      name: 'upcoming',
      html: upcomingSlide({ entries: slide.entries, lang, date }),
    })),
    { name: 'subscribe', html: closingSlide({ ...CLOSING[lang], date }) },
  ];

  return slides.map((slide, i) => ({
    file: `${dir}/${String(i + 1).padStart(2, '0')}-${slide.name}.png`,
    html: slide.html,
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
