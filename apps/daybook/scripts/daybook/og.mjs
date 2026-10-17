#!/usr/bin/env node
// Render the Immigration Daybook social cards, per language, per card type.
//
// Usage: node scripts/daybook/og.mjs [--lang en,es] [--card landing,announcement]
//                                    [--out ../../static/images]
//
// Needs Chrome and ImageMagick's `convert` on the PATH, and network access the
// first time so Chrome can fetch Lora + Jost from Google Fonts. See chrome()
// below for which binary names count as Chrome.
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

import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// Chrome's binary name is not portable. Debian and Fedora ship `google-chrome`;
// the Arch AUR package installs only `google-chrome-stable`; the distro repos
// call their build `chromium`. Take the first one that answers, and let $CHROME
// name a binary none of these guesses would find.
// ImageMagick 7 renamed the tool `magick` and prints a deprecation line on
// every `convert` call — thirteen of them on a full edition, enough to bury a
// real warning. Prefer `magick` and fall back to `convert` for IMv6.
let convertBin;
function convert() {
  if (convertBin) return convertBin;
  for (const bin of ['magick', 'convert']) {
    if (!spawnSync(bin, ['-version'], { stdio: 'ignore' }).error) return (convertBin = bin);
  }
  throw new Error('no ImageMagick on the PATH: tried magick, convert.');
}

let chromeBin;
function chrome() {
  if (chromeBin) return chromeBin;
  const tried = [process.env.CHROME, 'google-chrome', 'google-chrome-stable', 'chromium'].filter(Boolean);
  for (const bin of tried) {
    if (!spawnSync(bin, ['--version'], { stdio: 'ignore' }).error) return (chromeBin = bin);
  }
  throw new Error(`no Chrome on the PATH: tried ${tried.join(', ')}. Install one, or set CHROME.`);
}

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
// The carousel's ground: the cool-gray ramp off 287(g) Watch (Tory's, 287g-explorer
// 27a0a96), so the two projects' social posts read as one shop's. Light paper and
// blue-gray ink where the cards above are ink and cream. The landing and
// announcement cards keep the page's own colours; only the portrait deck moved.
// `rule` is the map's county gray, which holds a hairline on paper-100 where
// paper-200 vanishes; `header` is the gray the 287(g) video headers are set on.
const GRAY = {
  paper100: '#F8F8F9',
  ink900: '#191D21',
  ink700: '#393F46',
  ink500: '#656C75',
  rule: '#DADEE2',
  header: '#BFC6CF',
};

// Jost 400 is for the slide's line. Without it in the request, a weight-400
// rule silently renders at 500, the nearest weight loaded.
const FONTS =
  'https://fonts.googleapis.com/css2?family=Jost:wght@400;500;600;700&family=Lora:wght@400;500;600&display=swap';

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
//
// With two levels instead of three (2026-10-16, see beatSlide) a story slide has
// room to spare, the fitter spent it on the headline, and David found the
// headlines too big. So a headline now has a ceiling of its own (fitcap): the
// fit still grows the line under it into the room, and the headline stops at
// HED_GROWTH over its step. What neither can use sits above the cite.
//
// The line got a ceiling too (2026-10-17): grown to fill the room, a 44px line
// came out near 59px, which is the "too big" David meant in the body copy. It
// stops at LINE_GROWTH over its step, and the block centres in what's left.
const FIT_MIN = 0.62;
const FIT_MAX = 1.34;
const HED_GROWTH = 1.08;
const LINE_GROWTH = 1.04;

const fitpx = (n) => `calc(var(--fit) * ${n}px)`;
// Fitted, but never past `cap` px. Still monotonic in --fit, so the search holds.
const fitcap = (n, cap) => `min(calc(var(--fit) * ${n}px), ${Math.round(cap)}px)`;

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
//
// Reset 2026-10-16 for two levels: the line under the headline is the only prose
// on a story slide now, so it is set larger than any nut was, and the headline a
// little under where the fitter used to take it.
const coverHedSize = (text) => {
  const n = text.length;
  if (n <= 40) return 80;
  if (n <= 70) return 74;
  if (n <= 100) return 66;
  if (n <= 140) return 58;
  return 50;
};

const beatHedSize = (text) => {
  const n = text.length;
  if (n <= 50) return 70;
  if (n <= 90) return 64;
  if (n <= 130) return 56;
  return 50;
};

// The line is about two sentences now (deck.mjs storyLine), in the regular
// weight (David, 2026-10-17: "lower the size and weight of the content font").
// 40-44px: he tried 36-40 and 48 and settled between. On a phone the canvas
// shows at about a third of its size, so 44px is about 16pt. Readers over 40 at
// arm's length need about 17pt, and the August ads found that audience.
const nutSize = (text) => {
  const n = text.length;
  if (n <= 240) return 44;
  if (n <= 340) return 42;
  return 40;
};
const lineFont = (text) => fitcap(nutSize(text), nutSize(text) * LINE_GROWTH);

// Shared chrome: wordmark and date on one line at the top, the domain centred
// at the foot. Three fixed points, and everything between them is the slide.
//
// Every slide is dated, not just the cover — a slide screenshotted out of a
// deck travels alone, and one about a system that changes weekly needs to say
// when it was true. "7 de agosto de 2026" is half again the width of "Aug. 7,
// 2026", and the wordmark has first claim on the line: it must never break to
// two, which reads as a broken masthead, so the date sizes to what is left.
const dateSize = (text) => (text.length <= 8 ? 29 : text.length <= 16 ? 26 : 22);

// The wordmark is the domain (David, 2026-10-16). The domain used to sit centred
// at the foot of every slide as well, where it fought the cite row for the same
// strip of card; set as the masthead, the address is still on every slide and
// the foot belongs to the sources. `site` survives for the cards that still want
// a footer, and is off by default.
const portraitFrame = (body, { date = '', site = false, tally = '' }) => `
  <header class="masthead">
    <p class="lockup">${HOME_URL}</p>
    ${date ? `<p class="date">${escapeHtml(date)}</p>` : ''}
  </header>
  <div class="stage">${body}</div>${tally ? `\n  <p class="tally">${escapeHtml(tally)}</p>` : ''}
  ${site ? `<footer class="site">${HOME_URL}</footer>` : ''}
${FIT_SCRIPT}`;

// Publications as the cite row names them, keyed on the edition's link text and
// matched case-insensitively. Two kinds of fix:
// - Shorthand spelled out (David, 2026-10-17): "AP should be Associated Press,
//   looks weird in this venue as the acronym". Initials that are the name
//   itself stay: NPR, CNN, KPBS, and groups known by them, like the ACLU and
//   USCIS ("could be broken eg. for ACLU"). The expansions are proper names,
//   so they serve the Spanish deck as they are.
// - Marks that are mixed case: LAist is LAist, and an upstream "LAIST" reads as
//   an outlet that does not exist.
// Anything not listed prints as the edition gave it.
const SOURCE_NAMES = new Map([
  ['ap', 'Associated Press'],
  ['afp', 'Agence France-Presse'],
  ['wsj', 'The Wall Street Journal'],
  ['nyt', 'The New York Times'],
  ['wapo', 'The Washington Post'],
  ['lat', 'Los Angeles Times'],
  ['ajc', 'The Atlanta Journal-Constitution'],
  ['laist', 'LAist'],
  // The other way round: NPR's name is just NPR now, not National Public Radio.
  ['national public radio', 'NPR'],
]);

const sourceName = (name) => escapeHtml(SOURCE_NAMES.get(String(name).trim().toLowerCase()) ?? name);

// The cite: who reported a story, each by the publication's own mark beside its
// name (David, 2026-10-16).
//
// Until then this was a line of names under a hairline, and favicons were ruled
// out on three counts: they arrive at 16-32px and would be blown up four times;
// fetching them makes the deck depend on a dozen servers, silently; and a row of
// brand squares reads as a link farm. The marks are back on those terms. They
// come from Google's favicon service at 128px and are used only when one comes
// back at ICON_MIN or larger. A fetch that fails, times out or returns a small
// icon falls back to the name alone, which is what every slide had before. And
// the names stay beside the marks, so the row reads as credit.
// Fetched once per render, before any slide is drawn (see loadIcons below).
const ICON_MIN = 64;
let ICONS = new Map();

// The publication's registrable domain: the mark for news.bloomberglaw.com is
// Bloomberg Law's. A Google News redirect names no publication, so it gets no
// mark and keeps its name.
const iconDomain = (url) => {
  let host;
  try {
    host = new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
  if (host === 'news.google.com') return null;
  const parts = host.split('.');
  const country = parts.length > 2 && parts.at(-1).length === 2 && ['co', 'com', 'org', 'gov', 'gob', 'ac', 'net'].includes(parts.at(-2));
  return parts.slice(country ? -3 : -2).join('.');
};

async function fetchIcon(domain) {
  try {
    const res = await fetch(`https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128`, {
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const png = Buffer.from(await res.arrayBuffer());
    // The width is in the PNG's IHDR chunk, bytes 16-19.
    if (png.length < 24 || png.readUInt32BE(0) !== 0x89504e47 || png.readUInt32BE(16) < ICON_MIN) return null;
    return `data:image/png;base64,${png.toString('base64')}`;
  } catch {
    return null;
  }
}

async function loadIcons(urls) {
  const domains = [...new Set(urls.map(iconDomain).filter(Boolean))];
  const icons = await Promise.all(domains.map(fetchIcon));
  return new Map(domains.map((d, i) => [d, icons[i]]));
}

const citeRow = (links, sources) => {
  const items = links?.length ? links : (sources ?? []).map((name) => ({ name }));
  if (!items.length) return '';
  return `<div class="cite">${items
    .map((item) => {
      const icon = item.url ? ICONS.get(iconDomain(item.url)) : null;
      return `<span class="src">${icon ? `<img src="${icon}" alt="" />` : ''}<span>${sourceName(item.name)}</span></span>`;
    })
    .join('')}</div>`;
};

// The one picked image (David, 2026-10-16): at most one per edition, a crop of
// a source document showing the change itself, chosen in compose. The crop
// comes with its highlights and dimmed context as fractions of the image (see
// record-deck.mjs --pick). Words outside the quote are dimmed, never hidden, so
// the crop still shows the document as printed.
const pickBox = (m) => `left:${m.l * 100}%;top:${m.t * 100}%;width:${m.w * 100}%;height:${m.h * 100}%`;
const pickFigure = (pick) =>
  pick?.src
    ? `<figure class="pick"><div class="paper"><div class="crop"><img src="${pick.src}" alt="" />` +
      (pick.dims ?? []).map((m) => `<i class="dim" style="${pickBox(m)}"></i>`).join('') +
      (pick.marks ?? []).map((m) => `<i class="mark" style="${pickBox(m)}"></i>`).join('') +
      `</div></div>${pick.caption ? `<figcaption>${escapeHtml(pick.caption)}</figcaption>` : ''}</figure>`
    : '';

// Under the headline, the line and its cite travel as one block. With a picked
// image the order is headline, image, then this block; without one, the block
// sits centred in the room under the headline (David, 2026-10-16), so a short
// story doesn't leave a hole between its prose and its sources.
const storyBody = (nut, links, sources) =>
  `<div class="body">${nut ? `<p class="nut">${keepForms(escapeHtml(nut))}</p>` : ''}${citeRow(links, sources)}</div>`;

const portraitCss = (date) => `
  :root { --fit: 1; }
  body { justify-content: flex-start; background: ${GRAY.paper100}; color: ${GRAY.ink900}; }
  /* No rule under the wordmark. There was a 4px crimson bar here doing two jobs
     badly at once: branding a masthead that was already the loudest thing on
     the card, and dividing it. The band below ends the masthead on its own, and
     the hairlines between calendar entries and briefs are the only rule system
     on the deck. */
  /* The masthead is a band in the header gray, edge to edge: the negative
     margins undo PORTRAIT's padding (92px 84px), so the band meets the top and
     both sides of the card and the stage keeps its margins. It is the one
     block of tone on the deck, and it holds the top of every slide the same way
     the 287(g) video headers hold theirs. */
  .masthead {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 24px;
    margin: -92px -84px 0;
    padding: 40px 84px 34px;
    background: ${GRAY.header};
  }
  /* No capitals anywhere on the deck since 2026-10-17. Tracked, heavy caps were
     what made Jost read as Gill Sans and the deck as a cliché (David). Jost is
     kept for Renner. Set lower case and a weight lighter, it reads like Futura
     as the Bauhaus used it. The domain is set as it's typed. */
  .lockup {
    font-family: "Jost", sans-serif;
    font-size: 34px;
    font-weight: 500;
    letter-spacing: -0.005em;
    white-space: nowrap;
    color: ${GRAY.ink900};
  }
  /* Furniture rather than argument, so it takes the quieter value and lets the
     wordmark lead. */
  .date {
    font-family: "Jost", sans-serif;
    font-size: ${dateSize(date) + 2}px;
    font-weight: 400;
    white-space: nowrap;
    color: ${GRAY.ink700};
  }
  /* Centred at the foot, and the only centred thing on the deck — which is the
     point: it is not part of the reading, it is where to go afterwards. */
  .site {
    padding-top: 30px;
    text-align: center;
    font-family: "Jost", sans-serif;
    font-size: 28px;
    font-weight: 500;
    color: ${GRAY.ink500};
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
    color: ${GRAY.ink900};
    text-wrap: balance;
  }
  /* Story slides are two levels since 2026-10-16: the serif headline and the
     line under it, in the quieter value. One level of prose, about two sentences,
     in the regular weight (2026-10-17). */
  /* text-wrap: pretty is for the widow. A nut ending "…orders on Aug. 6."
     breaks after the abbreviation and leaves "6." alone on a line of its own,
     which at this size is a hole in the middle of the card. */
  .nut {
    font-family: "Jost", sans-serif;
    font-weight: 400;
    line-height: 1.4;
    color: ${GRAY.ink700};
    margin-top: ${fitpx(30)};
    text-wrap: pretty;
  }
  /* See storyBody. margin-block: auto centres the block in whatever room the
     headline leaves; after a picked image it follows straight on.
     The padding sets it at the optical centre rather than the measured one,
     about 36px high: a block centred exactly reads as sitting low, and the
     story's slides looked like they had slumped. */
  .body {
    margin-block: auto;
    padding-bottom: 72px;
  }
  .pick + .body {
    margin-block: ${fitpx(46)} 0;
    padding-bottom: 0;
  }
  .body .nut {
    margin-top: 0;
  }
  .pick {
    margin-top: ${fitpx(38)};
  }
  /* A sheet of paper, edged by the deck's one rule colour. The hard 2px shadow
     under it read as a heavier bottom edge, not as depth. */
  .pick .paper {
    background: #fff;
    border: 2px solid ${GRAY.rule};
    padding: 22px 26px;
  }
  .pick .crop {
    position: relative;
    line-height: 0;
  }
  .pick img {
    width: 100%;
    display: block;
  }
  .pick .dim {
    position: absolute;
    background: #fff;
    opacity: 0.7;
  }
  /* A highlighter, not a box: it wraps across a line break the way a box can't. */
  .pick .mark {
    position: absolute;
    background: ${CRIMSON};
    opacity: 0.24;
    mix-blend-mode: multiply;
    border-radius: 5px;
  }
  /* The caption names the document, so it reads with the sheet above it: close
     under it, and further from the line below (.pick + .body). At 22px it was
     the squint on the cover. */
  .pick figcaption {
    margin-top: 12px;
    font-family: "Jost", sans-serif;
    font-size: 27px;
    font-weight: 400;
    line-height: 1.3;
    color: ${GRAY.ink500};
  }
  /* Directly under the line it credits. Fixed sizes, outside the fit, like the
     masthead. */
  .cite {
    margin-top: 34px;
    display: flex;
    flex-wrap: wrap;
    gap: 14px 30px;
  }
  .cite .src {
    display: flex;
    align-items: center;
    gap: 12px;
    font-family: "Jost", sans-serif;
    font-size: 30px;
    font-weight: 500;
    color: ${GRAY.ink700};
  }
  .cite img {
    width: 44px;
    height: 44px;
    border-radius: 10px;
  }
  .nb {
    white-space: nowrap;
  }`;

// The cover: the lede, cut the same way every other story on the deck is cut.
//
// It used to stop after the claim, on the argument that a cover is a poster and
// a second sentence is just more of one story. That made the cover the one
// slide with a different shape, which a reader reads as a different kind of
// thing — and the lede is not a different kind of thing, it is the day's best
// story. Same two levels, same cite.
//
// The hed has a ceiling of its own (fitcap, HED_GROWTH): at full display size it
// and the line under it compete instead of ranking.
//
// Two levels since 2026-10-16, on every story slide and the cover alike: the
// headline and the line under it. The supporting sentence was the third tier
// that answered "feels thin" in August; David, two months on: "three levels when
// it should be two". The credit is no longer a tier of prose either — it is the
// cite row, publication marks at the foot.
const coverSlide = ({ hed, nut, sources, links, pick, date, kicker = null }) =>
  shell(
    portraitCss(date) +
      `\n  .hed { font-size: ${fitcap(coverHedSize(hed), coverHedSize(hed) * HED_GROWTH)}; }` +
      (nut ? `\n  .nut { font-size: ${lineFont(nut)}; }` : '') +
      (kicker ? KICKER_CSS : ''),
    portraitFrame(
      (kicker ? `<p class="kicker">${escapeHtml(kicker.label)}</p>` : '') +
        `<h1 class="hed">${escapeHtml(hed)}</h1>` +
        pickFigure(pick) +
        storyBody(nut, links, sources),
      { date, tally: kicker?.tally ?? '' },
    ),
    PORTRAIT,
  );

// The cover as a rundown's front page rather than the first story: a kicker
// over the hed saying what the deck is, and a tally above the domain saying how
// much is behind it. Off by default — the cover dives straight into the lede —
// and switched on per deck with `coverKicker` (record-deck.mjs --cover-kicker),
// so the two can be put side by side.
//
// Both stay under the hed. The kicker is set like the rubrics but smaller and
// in the quiet value, so it labels the cover instead of heading it; the tally is
// chrome, like the domain under it, at a fixed size outside the fitted stage —
// so the fitter sees the room it takes and sizes the story to what is left.
//
// A full cover has no slack, so anything added costs the hed some size: on the
// 10-14 cover the fit went 1.27 -> 1.17 with the kicker set at rubric size. Both
// were cut down until the cost was under a step of coverHedSize — at these
// sizes it is 1.27 -> 1.23, a 91px hed set at 88px. The kicker gives, not the hed.
const COVER_KICKER = {
  en: {
    label: 'Today’s rundown',
    stories: (n) => `${n} more ${n === 1 ? 'story' : 'stories'}`,
    dates: (n) => `${n} ${n === 1 ? 'date' : 'dates'} ahead`,
  },
  es: {
    label: 'El resumen de hoy',
    stories: (n) => `${n} ${n === 1 ? 'historia' : 'historias'} más`,
    dates: (n) => `${n} ${n === 1 ? 'fecha' : 'fechas'} por delante`,
  },
};

const coverKicker = (lang, stories, dates) => {
  const copy = COVER_KICKER[lang] ?? COVER_KICKER.en;
  const tally = [stories ? copy.stories(stories) : '', dates ? copy.dates(dates) : '']
    .filter(Boolean)
    .join(' · ');
  return { label: copy.label, tally };
};

const KICKER_CSS = `
  .kicker {
    font-family: "Jost", sans-serif;
    font-size: ${fitpx(24)};
    font-weight: 500;
    color: ${GRAY.ink500};
    margin-bottom: ${fitpx(10)};
  }
  .tally {
    padding-top: 12px;
    font-family: "Jost", sans-serif;
    font-size: 24px;
    font-weight: 500;
    color: ${GRAY.ink700};
  }`;

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
const beatSlide = ({ headline, nut, sources, links, pick, date }) =>
  shell(
    portraitCss(date) +
      `\n  .hed { font-size: ${fitcap(beatHedSize(headline), beatHedSize(headline) * HED_GROWTH)}; }` +
      (nut ? `\n  .nut { font-size: ${lineFont(nut)}; }` : ''),
    portraitFrame(
      `<h2 class="hed">${escapeHtml(headline)}</h2>` +
        pickFigure(pick) +
        storyBody(nut, links, sources),
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
//
// Up to 40 on 2026-10-16: the boards fitted down to 23-27px, which David found
// too small on a phone. Then 36-40 (David, 2026-10-17), three short calendar
// lines to a board (record-deck.mjs). 38 is the step, and the fit may grow it to
// 40 and no further.
const ENTRY_TEXT_SIZE = 38;
const ENTRY_TEXT_MAX = 40;

const upcomingSlide = ({ entries, lang, date, page = 1, pages = 1 }) =>
  shell(
    portraitCss(date) +
      `
  .stage { gap: ${fitpx(32)}; }
  /* The rubric came off the wordmark's line, where it sat at caption size and
     read as a footnote to the masthead rather than as the name of what follows.
     Down here at the head of the stage, at the size of a heading, it is doing
     the job it was put there to do. */
  /* Set as a headline since 2026-10-17, in the serif every other slide leads
     with, rather than as tracked capitals in the sans. */
  .rubric {
    font-family: "Lora", serif;
    font-size: ${fitcap(54, 54 * HED_GROWTH)};
    font-weight: 600;
    line-height: 1.12;
    letter-spacing: -0.02em;
    color: ${GRAY.ink900};
    margin-bottom: ${fitpx(-4)};
  }
  /* A rundown's calendar can run to a second board. The count sits at the end
     of the rubric's line in the quiet value, set like the date in the masthead:
     furniture that says there is more, not a heading of its own. A single
     board carries none. */
  .rubric.paged {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
  }
  .rubric .page {
    font-family: "Jost", sans-serif;
    font-size: ${fitpx(28)};
    font-weight: 400;
    letter-spacing: 0;
    color: ${GRAY.ink500};
  }
  /* Set like a printed datebook (2026-10-17, after three rounds of "still
     weird"). Each entry is two columns on one baseline: the date, then the
     line. The date is set at the line's size, in the serif, with the weekday
     written out under it. There is no big numeral over small labels, the same
     "big number, squinty text, red" that came off the 287(g) slide. Entries on
     the same day share one date, and a hairline marks each new day. The rhythm
     runs from the top, not in stretched rows, so the space between a rule and
     its entry is the same everywhere. What's left at the foot, the fit takes
     into the spacing. */
  .entry {
    display: grid;
    /* Fixed, not fitted: the dates are capped at 40px, so a column that grew
       with the fit opened a gutter wider than the dates. 200px holds "Sept. 30",
       "Wednesday" and "miércoles". */
    grid-template-columns: 200px 1fr;
    column-gap: 36px;
    align-items: baseline;
    padding-block: ${fitpx(28)};
  }
  .entry:first-child {
    padding-top: ${fitpx(10)};
  }
  .entry.same {
    padding-top: 0;
  }
  /* The rule goes between days and nowhere else. One rule: the crimson bar
     that once topped each date came off (David, 2026-10-17). */
  .entry + .entry:not(.same) {
    border-top: 2px solid ${GRAY.rule};
  }
  .when .date {
    font-family: "Lora", serif;
    font-size: ${fitcap(ENTRY_TEXT_SIZE, ENTRY_TEXT_MAX)};
    font-weight: 600;
    line-height: 1.34;
    letter-spacing: -0.01em;
    color: ${GRAY.ink900};
  }
  /* The weekday is the one thing the snapshot knows that a reader has to work
     out for themselves otherwise, and "a week Monday" is how people actually
     hold a deadline. On the day itself it gives way to "Today", the one
     countdown kept ("only TODAY matters", David) and the only red on the board. */
  .when .dow {
    font-family: "Jost", sans-serif;
    font-size: ${fitcap(32, 34)};
    font-weight: 400;
    line-height: 1.3;
    color: ${GRAY.ink500};
  }
  .when .dow.today {
    font-weight: 500;
    color: ${CRIMSON};
  }
  .entry .text {
    font-family: "Jost", sans-serif;
    font-size: ${fitcap(ENTRY_TEXT_SIZE, ENTRY_TEXT_MAX)};
    font-weight: 400;
    line-height: 1.34;
    color: ${GRAY.ink900};
    text-wrap: pretty;
  }`,
    portraitFrame(
      (pages > 1
        ? `<p class="rubric paged"><span>${escapeHtml(UPCOMING_LABEL[lang] ?? UPCOMING_LABEL.en)}</span>` +
          `<span class="page">${page}/${pages}</span></p>`
        : `<p class="rubric">${escapeHtml(UPCOMING_LABEL[lang] ?? UPCOMING_LABEL.en)}</p>`) +
        `<div class="entries">${entries.map((entry, i) => upcomingEntry(entry, lang, i > 0 && entries[i - 1].iso === entry.iso)).join('')}</div>`,
      { date },
    ),
    PORTRAIT,
  );

// Form and document numbers stay on one line: "EOIR-42A" broke after the hyphen,
// leaving "42A" to start a line on its own. Applied to escaped text.
const keepForms = (html) => html.replace(/\b([A-Z]{1,5}-\d[\dA-Z-]*)/g, '<span class="nb">$1</span>');

// The date as the house writes it (AP: "Oct. 14", "Sept. 30", "March 3"; in
// Spanish "14 oct."), and the weekday written out. upcoming.mjs's own labels
// are capital abbreviations for pull.mjs; the deck sets its own from the ISO
// date.
const calendarDate = (iso, lang) => {
  const [, m, d] = iso.split('-').map(Number);
  return lang === 'es' ? `${d} ${MONTHS_SHORT.es[m - 1]}` : `${MONTHS_SHORT.en[m - 1]} ${d}`;
};
const weekdayName = (iso, lang) =>
  new Date(`${iso}T12:00:00Z`).toLocaleDateString(lang === 'es' ? 'es-ES' : 'en-US', { weekday: 'long', timeZone: 'UTC' });
const TODAY_WORD = { en: 'Today', es: 'Hoy' };

// upcoming.mjs labels the day of as "TODAY" / "HOY". That's the one countdown
// the deck keeps.
const isToday = (entry) => /^(today|hoy)$/i.test(entry.countdown ?? '');

// `same`: the entry falls on the same day as the one before it on the board,
// so it carries no date of its own and no rule above it.
const upcomingEntry = (entry, lang, same) => `
    <div class="entry${same ? ' same' : ''}">
      <div class="when">${
        same
          ? ''
          : `<div class="date">${escapeHtml(calendarDate(entry.iso, lang))}</div>` +
            (isToday(entry)
              ? `<div class="dow today">${TODAY_WORD[lang] ?? TODAY_WORD.en}</div>`
              : `<div class="dow">${escapeHtml(weekdayName(entry.iso, lang))}</div>`)
      }</div>
      <p class="text">${keepForms(escapeHtml(entry.text))}</p>
    </div>`;

// The 287(g) map: every day, between the stories and the calendar (David,
// 2026-10-16). Crimson dots are the agencies ICE added to its published list in
// the two weeks up to its last change; gray ones were already on it. When ICE
// goes a week or more without a change, the count line says how long. The
// numbers come from record-deck.mjs
// (tracker287g.mjs), and nothing on this slide is a judgment call.
//
// Albers equal-area on the lower 48, drawn as plain SVG from 287(g) Watch's own
// state outlines: no tiles, no WebGL, nothing for a runner to need but Chrome.
const STATES_GEOJSON = 'https://287g.recoveredfactory.net/us-inset.geojson';
const OUTSIDE_STATES = new Set([
  'Alaska', 'Hawaii', 'Puerto Rico', 'United States Virgin Islands', 'Guam', 'American Samoa',
  'Commonwealth of the Northern Mariana Islands',
]);
let STATE_RINGS = null; // projected outlines, loaded with the icons below

const albers = ([lon, lat]) => {
  const r = Math.PI / 180;
  const p1 = 29.5 * r, p2 = 45.5 * r, p0 = 37.5 * r, l0 = -96 * r;
  const n = (Math.sin(p1) + Math.sin(p2)) / 2;
  const c = Math.cos(p1) ** 2 + 2 * n * Math.sin(p1);
  const rho = (p) => Math.sqrt(c - 2 * n * Math.sin(p)) / n;
  const theta = n * (lon * r - l0);
  return [rho(lat * r) * Math.sin(theta), -(rho(p0) - rho(lat * r) * Math.cos(theta))];
};

async function loadStates() {
  const res = await fetch(STATES_GEOJSON, { signal: AbortSignal.timeout(30000) });
  if (!res.ok) throw new Error(`${res.status} from ${STATES_GEOJSON}`);
  const rings = [];
  for (const f of (await res.json()).features) {
    if (OUTSIDE_STATES.has(f.properties?.name)) continue;
    const polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates;
    for (const poly of polys) rings.push(poly[0].map(albers));
  }
  return rings;
}

const STATE_NAMES = {
  AL: 'Alabama', AZ: 'Arizona', AR: 'Arkansas', CA: 'California', CO: 'Colorado', CT: 'Connecticut',
  DE: 'Delaware', DC: 'D.C.', FL: 'Florida', GA: 'Georgia', ID: 'Idaho', IL: 'Illinois', IN: 'Indiana',
  IA: 'Iowa', KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine', MD: 'Maryland',
  MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota', MS: 'Mississippi', MO: 'Missouri', MT: 'Montana',
  NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire', NJ: 'New Jersey', NM: 'New Mexico', NY: 'New York',
  NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio', OK: 'Oklahoma', OR: 'Oregon', PA: 'Pennsylvania',
  RI: 'Rhode Island', SC: 'South Carolina', SD: 'South Dakota', TN: 'Tennessee', TX: 'Texas', UT: 'Utah',
  VT: 'Vermont', VA: 'Virginia', WA: 'Washington', WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming',
  AK: 'Alaska', HI: 'Hawaii', PR: 'Puerto Rico',
};
const STATE_NAMES_ES = {
  ...STATE_NAMES, DC: 'D.C.', LA: 'Luisiana', MS: 'Misisipi', MO: 'Misuri', NJ: 'Nueva Jersey',
  NM: 'Nuevo México', NY: 'Nueva York', NC: 'Carolina del Norte', ND: 'Dakota del Norte',
  PA: 'Pensilvania', SC: 'Carolina del Sur', SD: 'Dakota del Sur', WV: 'Virginia Occidental', HI: 'Hawái',
};

const MONTHS_SHORT = {
  en: ['Jan.', 'Feb.', 'March', 'April', 'May', 'June', 'July', 'Aug.', 'Sept.', 'Oct.', 'Nov.', 'Dec.'],
  es: ['ene.', 'feb.', 'mar.', 'abr.', 'may.', 'jun.', 'jul.', 'ago.', 'sept.', 'oct.', 'nov.', 'dic.'],
};
const shortDay = (iso, lang) => {
  const [, m, d] = iso.split('-').map(Number);
  return lang === 'es' ? `${d} de ${MONTHS_SHORT.es[m - 1]}` : `${MONTHS_SHORT.en[m - 1]} ${d}`;
};
const dayAfter = (iso) => new Date(Date.parse(iso) + 864e5).toISOString().slice(0, 10);

// The slide is named for the tracker, like a column, and under the name sits a
// short list, every item at one size with its lead in bold (David,
// 2026-10-17): how many agencies, how long since ICE last changed its list, and
// where. The days-since counter is the daily drama: ICE's list can go quiet
// for weeks while agencies keep signing. It began as a big crimson numeral
// beside small text ("big number, squinty text, red"), and is a list item now.
const TRACKER_STATES_SHOWN = 4;
const TRACKER_COPY = {
  en: {
    title: '287(g) Watch',
    count: (n, a, b) => `<b>${n} new ${n === 1 ? 'agency' : 'agencies'}</b> from ${a} to ${b}`,
    since: (d) => (d === 0 ? '<b>Updated today</b> by ICE' : `<b>${d} ${d === 1 ? 'day' : 'days'} since</b> last ICE update`),
    state: (name, n) => `<span class="nb"><b>${name}</b> +${n}</span>`,
    more: (n) => ` and ${n} more`,
    fresh: 'New agreement',
    old: 'Existing agreement',
    caption: 'ICE’s public 287(g) list as tracked daily by 287(g) Watch. Agencies sit at their county or town. Lower 48 shown.',
  },
  es: {
    title: '287(g) Watch',
    count: (n, a, b) => `<b>${n} ${n === 1 ? 'agencia nueva' : 'agencias nuevas'}</b> del ${a} al ${b}`,
    since: (d) =>
      d === 0 ? '<b>Actualizada hoy</b> por ICE' : `<b>${d} ${d === 1 ? 'día' : 'días'} desde</b> la última actualización de ICE`,
    state: (name, n) => `<span class="nb"><b>${name}</b> +${n}</span>`,
    more: (n) => ` y ${n} más`,
    fresh: 'Acuerdo nuevo',
    old: 'Acuerdo existente',
    caption: 'La lista pública de 287(g) de ICE, seguida a diario por 287(g) Watch. Cada agencia aparece en su condado o ciudad. Se muestran los 48 estados contiguos.',
  },
};

const MAP_W = 912;
const MAP_H = 540;

const trackerMap = (tracker) => {
  const rings = STATE_RINGS ?? [];
  let [x0, y0, x1, y1] = [Infinity, Infinity, -Infinity, -Infinity];
  for (const ring of rings) for (const [x, y] of ring) {
    x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
  }
  const pad = 8;
  const k = Math.min((MAP_W - 2 * pad) / (x1 - x0), (MAP_H - 2 * pad) / (y1 - y0));
  const ox = (MAP_W - k * (x1 - x0)) / 2;
  const oy = (MAP_H - k * (y1 - y0)) / 2;
  const at = ([x, y]) => [ox + k * (x - x0), oy + k * (y - y0)];
  const path = rings.map((ring) => `M${ring.map((p) => at(p).map((v) => v.toFixed(1)).join(',')).join('L')}Z`).join('');
  const dots = (points, r) =>
    points.map((p) => { const [x, y] = at(albers(p)); return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r}"/>`; }).join('');
  return `<svg class="map" viewBox="0 0 ${MAP_W} ${MAP_H}" preserveAspectRatio="xMinYMin meet">
    <path d="${path}" fill="#E6E9ED" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/>
    <g fill="#9AA3AD" fill-opacity="0.55">${dots(tracker.old, 2.6)}</g>
    <g fill="${CRIMSON}" stroke="#fff" stroke-width="2.2">${dots(tracker.fresh, 8)}</g>
  </svg>`;
};

const trackerSlide = ({ tracker, lang, date }) => {
  const copy = TRACKER_COPY[lang] ?? TRACKER_COPY.en;
  const names = lang === 'es' ? STATE_NAMES_ES : STATE_NAMES;
  const states = tracker.states ?? tracker.top;
  const shown = states.slice(0, TRACKER_STATES_SHOWN);
  const rest = states.length - shown.length;
  const items = [
    copy.count(tracker.added, escapeHtml(shortDay(dayAfter(tracker.start), lang)), escapeHtml(shortDay(tracker.last, lang))),
    copy.since(tracker.since),
    shown.map(([st, n]) => copy.state(escapeHtml(names[st] ?? st), n)).join(', ') + (rest > 0 ? copy.more(rest) : '') + '.',
  ];
  return shell(
    portraitCss(date) +
      `
  /* Fixed sizes, not fitted: the words hold their size and the map gives. A
     fitted slide shrank everything together, the list to about 34px, to make
     room for a map that can lose 15% of its height without anyone missing it.
     The map's box starts at its full 540px and shrinks into whatever height
     the words leave. */
  .hed { font-size: 58px; flex-shrink: 0; }
  /* One size for the whole list, the lead of each item in bold, a hairline
     between items: the calendar's system, so the two data slides read as a
     pair. */
  .facts {
    flex-shrink: 0;
    margin-top: 22px;
    list-style: none;
    font-family: "Jost", sans-serif;
    font-size: 40px;
    font-weight: 400;
    line-height: 1.3;
    color: ${GRAY.ink700};
  }
  .facts li {
    padding-block: 16px;
    text-wrap: pretty;
  }
  .facts li + li {
    border-top: 2px solid ${GRAY.rule};
  }
  .facts b {
    font-weight: 600;
    color: ${GRAY.ink900};
  }
  .figure {
    flex: 0 1 auto;
    min-height: 0;
    display: flex;
    flex-direction: column;
    margin-top: 22px;
  }
  .mapbox {
    flex: 0 1 ${MAP_H}px;
    min-height: 0;
    position: relative;
  }
  .mapbox svg {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
  }
  .legend {
    flex-shrink: 0;
    display: flex;
    flex-wrap: wrap;
    gap: 8px 40px;
    margin-top: 16px;
    font-family: "Jost", sans-serif;
    font-size: 30px;
    font-weight: 400;
    color: ${GRAY.ink700};
  }
  .legend i {
    display: inline-block;
    width: 24px;
    height: 24px;
    margin-right: 12px;
    border-radius: 50%;
    vertical-align: -3px;
  }
  .legend i.old {
    width: 13px;
    height: 13px;
    margin: 0 17px 0 6px;
    vertical-align: 2px;
  }
  .caption {
    flex-shrink: 0;
    margin-top: 12px;
    font-family: "Jost", sans-serif;
    font-size: 26px;
    font-weight: 400;
    line-height: 1.3;
    color: ${GRAY.ink500};
  }`,
    portraitFrame(
      `<h2 class="hed">${escapeHtml(copy.title)}</h2>` +
        `<ul class="facts">${items.map((item) => `<li>${item}</li>`).join('')}</ul>` +
        `<div class="figure">` +
        `<div class="mapbox">${trackerMap(tracker)}</div>` +
        `<div class="legend"><span><i style="background:${CRIMSON}"></i>${escapeHtml(copy.fresh)}</span>` +
        `<span><i class="old" style="background:#9AA3AD"></i>${escapeHtml(copy.old)}</span></div>` +
        `<p class="caption">${escapeHtml(copy.caption)}</p>` +
        `</div>`,
      { date },
    ),
    PORTRAIT,
  );
};

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
  /* The sheet. Flat, like everything else on the deck — white with a hairline,
     which on paper gray is all the lift a document needs. The marks over it stay
     crimson: they are a highlighter on the operative words, not a colour scheme,
     and gray ones would not mark anything. The panel does not scale with --fit:
     type negotiates for the space around a document, and the document does not
     shrink to flatter the type. */
  .panel {
    background: #fff;
    border: 2px solid ${GRAY.rule};
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
    border-top: 1px solid ${GRAY.rule};
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
    color: ${GRAY.ink500};
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
// Ink rather than crimson. Crimson on the deck means time — the calendar's
// dates and countdowns — and a byline is not a date.
const briefsSlide = ({ rubric, items, date }) =>
  shell(
    portraitCss(date) +
      `
  .stage { gap: ${fitpx(34)}; }
  /* A headline, like the calendar's (2026-10-17). */
  .rubric {
    font-family: "Lora", serif;
    font-size: ${fitcap(54, 54 * HED_GROWTH)};
    font-weight: 600;
    line-height: 1.12;
    letter-spacing: -0.02em;
    color: ${GRAY.ink900};
    margin-bottom: ${fitpx(-6)};
  }
  /* Same rule system as the calendar board: hairlines between items, never
     above the first one. */
  .brief + .brief {
    border-top: 2px solid ${GRAY.rule};
    padding-top: ${fitpx(34)};
  }
  .brief .slug {
    font-family: "Jost", sans-serif;
    font-size: ${fitpx(26)};
    font-weight: 500;
    color: ${GRAY.ink700};
    margin-bottom: ${fitpx(10)};
  }
  .brief .text {
    font-family: "Jost", sans-serif;
    font-size: ${fitpx(32)};
    font-weight: 400;
    line-height: 1.4;
    color: ${GRAY.ink900};
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
// The maker's mark under the link: the Recovered Factory factory, set the way
// the cite row sets a publication's mark beside its name. Committed beside this
// file at 128px, cut from the site's factory drawing, because the site's own
// images are gitignored and the deck renders on GitHub from a bare checkout.
const RF_MARK = `data:image/png;base64,${readFileSync(join(here, 'rf-mark.png')).toString('base64')}`;

const closingSlide = ({ tagline, url, made, date }) =>
  shell(
    // Centred on the optical centre, like a story's line: the extra foot
    // padding lifts the plate about 36px.
    portraitCss(date) + `\n  .stage { justify-content: center; padding-bottom: 88px; }
  .hed { font-size: ${fitpx(coverHedSize(tagline))}; }
  .made {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-top: ${fitpx(64)};
    font-family: "Jost", sans-serif;
    font-size: 34px;
    font-weight: 500;
    color: ${GRAY.ink700};
  }
  .made img { width: 64px; height: 64px; }
  .url {
    font-family: "Jost", sans-serif;
    font-size: ${fitpx(46)};
    font-weight: 500;
    color: ${GRAY.ink900};
    margin-top: ${fitpx(34)};
  }`,
    portraitFrame(
      `<h2 class="hed">${escapeHtml(tagline)}</h2><p class="url">${escapeHtml(url)}</p>` +
        `<p class="made"><img src="${RF_MARK}" alt="" /><span>${escapeHtml(made)}</span></p>`,
      // The one slide that drops the domain out of the chrome: it is the whole
      // point of this slide, set at display size, and printing it twice on one
      // card makes the big one look like a caption for the small one.
      { date, site: false },
    ),
    PORTRAIT,
  );

// The closing plate's copy: the tagline, the link, and who makes it (David,
// 2026-10-17: no "free, every weekday morning", "just the link", and under it
// "(icon) A Recovered Factory project").
//
// The tagline is "Making sense of the spectacle." It replaces "We turn the
// spectacle … into evidence" here and on the site's front page
// (src/lib/copy.ts). The Spanish is a draft awaiting David's approval.
//
// It used to carry the terms off the landing card — "Monday–Friday", "English &
// Spanish" — along the bottom. The languages came off because a deck is posted
// per language, to an account that is already in that language, where the fact
// answers a question nobody in the audience is asking.
const CLOSING = {
  en: { tagline: 'Making sense of the spectacle.', url: HOME_URL, made: 'A Recovered Factory project' },
  es: { tagline: 'Para entender el espectáculo.', url: HOME_URL, made: 'Un proyecto de Recovered Factory' },
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
  // One round-up slide off a pull; a rundown (record-deck.mjs) carries every
  // brief, four to a slide, as a list of them.
  const briefs = [deck.briefs ?? []].flat();
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
    { name: 'story', html: beatSlide({ ...beat, nut: beat.line || beat.nut, date }) },
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
    {
      name: 'cover',
      html: coverSlide({
        hed: deck.hed,
        nut: deck.line || deck.nut,
        sources: deck.sources,
        links: deck.links,
        pick: deck.pick,
        date,
        kicker: deck.coverKicker
          ? coverKicker(lang, beats.length, upcoming.reduce((n, slide) => n + slide.entries.length, 0))
          : null,
      }),
    },
    ...stories,
    ...briefs.map((slide) => ({ name: 'roundup', html: briefsSlide({ ...slide, date }) })),
    ...(deck.tracker && STATE_RINGS ? [{ name: '287g', html: trackerSlide({ tracker: deck.tracker, lang, date }) }] : []),
    ...upcoming.map((slide, i) => ({
      name: 'upcoming',
      html: upcomingSlide({ entries: slide.entries, lang, date, page: i + 1, pages: upcoming.length }),
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

// Every publication mark the carousel cites, fetched before the first slide is
// drawn: from here on the slides are built synchronously.
if (deckPath && cards.includes('carousel')) {
  const decks = Object.values(JSON.parse(readFileSync(deckPath, 'utf8')));
  const links = decks.flatMap((deck) => [...(deck.links ?? []), ...(deck.beats ?? []).flatMap((beat) => beat.links ?? [])]);
  ICONS = await loadIcons(links.map((link) => link.url));
  // The 287(g) map's state outlines. Without them the slide is left off with a
  // warning rather than drawn as dots in a void.
  if (decks.some((deck) => deck.tracker)) {
    STATE_RINGS = await loadStates().catch((err) => {
      console.warn(`WARNING: no 287(g) map: state outlines didn't load (${err.message}).`);
      return null;
    });
  }
}

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
    chrome(),
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

  execFileSync(convert(), [raw, '-resize', outSize, '-strip', out]);
  rmSync(raw, { force: true });
  rmSync(html, { force: true });

  console.log(`Wrote static/images/${slide.file}`);
}
