#!/usr/bin/env node
// Render a document-driven carousel — a dossier — from a spec directory.
//
// Usage: node scripts/daybook/dossier.mjs <dossier-dir> [--lang en,es]
//   <dossier-dir>  a directory under scripts/daybook/dossiers/ holding
//                  spec.json and the exhibit crops it references
//
// Where og.mjs renders the edition's own copy re-cut for a 4:5 frame, this
// renders slides *about documents*: each one is a claim over a cropped exhibit
// set on a paper panel, captioned like evidence, with the key line marked in
// crimson. The deck is hand-specced per story rather than derived from the
// edition, because a dossier is an editorial product — which documents, cut
// where, marked at what line — and none of those calls belong to a template.
//
// The frame, palette, type system and fitter are og.mjs's, copied rather than
// imported: og.mjs is a CLI, not a module, and a shared-machinery refactor is
// not worth entangling the daily deck with a special. If the two drift, the
// daily deck is the one that is right.
//
// Slides land in static/images/social/<slug>/<lang>/ — deliberately NOT the
// edition's own date directory, so a dossier and the daily deck never
// overwrite each other.

import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const webRoot = join(here, '..', '..');

const args = process.argv.slice(2);
const positional = args.filter((a) => !a.startsWith('--'));
const flag = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};

if (!positional[0]) {
  console.error('Usage: node scripts/daybook/dossier.mjs <dossier-dir> [--lang en,es]');
  process.exit(1);
}

const specDir = resolve(positional[0]);
const spec = JSON.parse(readFileSync(join(specDir, 'spec.json'), 'utf8'));
const langs = flag('lang', 'en,es').split(',');

const HOME_URL = 'immigrationdaybook.com';
const INK = '#12161d';
const CREAM = '#f3f1e9';
const CRIMSON = '#e8244f';
const PAPER = '#fdfcf9';

const FONTS =
  'https://fonts.googleapis.com/css2?family=Jost:wght@500;600;700&family=Lora:wght@400;500;600&display=swap';

const PORTRAIT = { width: 1080, height: 1350, padding: '92px 84px' };
const OUT_SIZE = '1080x1350';

const FIT_MIN = 0.62;
const FIT_MAX = 1.34;
const fitpx = (n) => `calc(var(--fit) * ${n}px)`;

// og.mjs's fitter, verbatim: binary-search the largest --fit whose content
// still fits the stage. The paper panels are excluded from scaling (a document
// has a natural size; the type fits around it), but their height still counts
// against the room, which is the point.
const FIT_SCRIPT = `
<script>
  (async () => {
    if (document.fonts) {
      try { await document.fonts.ready; } catch (err) {}
    }

    const root = document.documentElement;
    const stage = document.querySelector('.stage');
    if (!stage || !stage.firstElementChild) return;

    const room = () => {
      const style = getComputedStyle(stage);
      return (
        stage.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom)
      );
    };

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

const escapeHtml = (value) =>
  String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');

const hedSize = (text) => {
  const n = text.length;
  if (n <= 30) return 78;
  if (n <= 50) return 68;
  if (n <= 90) return 58;
  return 48;
};

const nutSize = (text) => {
  const n = text.length;
  if (n <= 140) return 34;
  if (n <= 220) return 31;
  return 28;
};

const dateSize = (text) => (text.length <= 8 ? 29 : text.length <= 16 ? 26 : 22);

/**
 * A paper panel: one or two document crops on a shared sheet, each optionally
 * carrying marks — crimson boxes and rules positioned as fractions of the crop
 * they annotate, so the same spec draws the same mark in both languages.
 *
 * The panel does not scale with --fit. Type negotiates for the space around a
 * document; the document does not shrink to flatter the type.
 */
const panelHtml = (panel) => {
  const strips = panel
    .map(({ img, width, marks = [] }) => {
      const overlays = marks
        .map(({ l, t, w, h, style }) => {
          const geom = `left:${l * 100}%;top:${t * 100}%;width:${w * 100}%;height:${h * 100}%;`;
          const cls =
            style === 'rule' ? 'rule-mark' : style === 'hl' ? 'hl-mark' : 'box-mark';
          return `<i class="mark ${cls}" style="${geom}"></i>`;
        })
        .join('');
      return `<figure class="strip"${width ? ` style="width:${width}"` : ''}>
        <div class="shot"><img src="${img}" />${overlays}</div>
      </figure>`;
    })
    .join('');
  return `<div class="panel">${strips}</div>`;
};

const frame = (body, { date, site = true }) => `
  <header class="masthead">
    <p class="lockup">Immigration Daybook</p>
    ${date ? `<p class="date">${escapeHtml(date)}</p>` : ''}
  </header>
  <div class="stage">${body}</div>
  ${site ? `<footer class="site">${HOME_URL}</footer>` : ''}
${FIT_SCRIPT}`;

const css = (date) => `
  :root { --fit: 1; }
  body { justify-content: flex-start; }
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
  .date {
    font-family: "Jost", sans-serif;
    font-size: ${dateSize(date)}px;
    font-weight: 600;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    white-space: nowrap;
    color: rgba(243, 241, 233, 0.58);
  }
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
  .stage {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    min-height: 0;
    padding: 46px 0 16px;
    overflow: hidden;
  }
  /* The exhibit letter: the deck's one piece of furniture, naming the slide
     the way a filing names an attachment. Crimson because it is the reading
     order; small because it is not the point. */
  .rubric {
    font-family: "Jost", sans-serif;
    font-size: ${fitpx(25)};
    font-weight: 700;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: ${CRIMSON};
    margin-bottom: ${fitpx(22)};
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
    font-weight: 500;
    line-height: 1.4;
    color: rgba(243, 241, 233, 0.92);
    margin-top: ${fitpx(24)};
    text-wrap: pretty;
  }
  /* The sheet. Flat, like everything else on the deck — the value jump off the
     ink is all the lift a document needs. */
  .panel {
    background: ${PAPER};
    padding: 24px;
    margin-top: ${fitpx(30)};
  }
  .strip {
    width: 100%;
    margin: 0 auto;
  }
  /* Marks anchor to the image, not the figure: a second strip carries the
     divider's padding-top, and a percentage top measured against the padding
     box lands every mark high by that padding. */
  .shot { position: relative; }
  .strip + .strip {
    margin-top: 22px;
    padding-top: 22px;
    border-top: 1px solid #d9d5c9;
  }
  .strip img {
    display: block;
    width: 100%;
    height: auto;
  }
  .mark { position: absolute; display: block; }
  .box-mark {
    border: 5px solid ${CRIMSON};
    border-radius: 6px;
    opacity: 0.85;
  }
  .rule-mark {
    background: ${CRIMSON};
    border-radius: 3px;
    opacity: 0.8;
  }
  /* Marker over the text rather than a rule under it: at phone scale a thin
     rule reads as underlined furniture, a swipe of highlighter reads as a
     human having marked the operative words. Multiply keeps the type legible
     through the wash. */
  .hl-mark {
    background: ${CRIMSON};
    mix-blend-mode: multiply;
    opacity: 0.33;
    border-radius: 5px;
  }
  /* Who this document is and when we looked at it — the checkable line. */
  .caption {
    font-family: "Jost", sans-serif;
    font-size: ${fitpx(22)};
    font-weight: 600;
    letter-spacing: 0.05em;
    color: rgba(243, 241, 233, 0.55);
    margin-top: ${fitpx(18)};
    text-wrap: pretty;
  }
  /* The footer's exact type — face, weight, tracking — scaled up and set in
     crimson, so the deck writes its URL one way everywhere and the closer only
     turns up the volume. Sized to the string, not fitted: the fitter measures
     height, and a no-wrap line overflows sideways where it cannot see. */
  .closer-url {
    font-family: "Jost", sans-serif;
    font-size: 48px;
    font-weight: 600;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: ${CRIMSON};
    margin-top: ${fitpx(56)};
  }
  .closer .stage { justify-content: center; }
  .facts {
    font-family: "Jost", sans-serif;
    font-size: ${fitpx(26)};
    font-weight: 600;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: rgba(243, 241, 233, 0.58);
    margin-top: ${fitpx(30)};
  }`;

const shell = (extraCss, body) => `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="${FONTS}" rel="stylesheet" />
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: ${PORTRAIT.width}px; height: ${PORTRAIT.height}px; }
  body {
    background: ${INK};
    color: ${CREAM};
    display: flex;
    flex-direction: column;
    padding: ${PORTRAIT.padding};
    -webkit-font-smoothing: antialiased;
  }
${extraCss}
</style>
</head>
<body>
${body}
</body>
</html>`;

const slideHtml = (slide, lang, date) => {
  const copy = slide[lang];
  const rubric = slide.rubric?.[lang];
  const body =
    (rubric ? `<p class="rubric">${escapeHtml(rubric)}</p>` : '') +
    `<h1 class="hed">${escapeHtml(copy.hed)}</h1>` +
    (copy.nut ? `<p class="nut">${escapeHtml(copy.nut)}</p>` : '') +
    (slide.panel ? panelHtml(slide.panel) : '') +
    (copy.caption ? `<p class="caption">${escapeHtml(copy.caption)}</p>` : '') +
    (slide.type === 'closer'
      ? `<p class="closer-url">${HOME_URL}</p>` +
        (copy.facts ? `<p class="facts">${escapeHtml(copy.facts)}</p>` : '')
      : '');

  const page = shell(
    css(date) +
      `\n  .hed { font-size: ${fitpx(hedSize(copy.hed))}; }` +
      (copy.nut ? `\n  .nut { font-size: ${fitpx(nutSize(copy.nut))}; }` : ''),
    frame(body, { date, site: slide.type !== 'closer' }),
  );
  return slide.type === 'closer' ? page.replace('<body>', '<body class="closer">') : page;
};

// ── Render ────────────────────────────────────────────────────────────────

const outRoot = join(webRoot, 'static', 'images', 'social', spec.slug);
const workDir = join(here, 'out');
mkdirSync(workDir, { recursive: true });

for (const lang of langs) {
  const dir = join(outRoot, lang);
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });

  spec.slides.forEach((slide, i) => {
    const name = slide.name ?? slide.type;
    const out = join(dir, `${String(i + 1).padStart(2, '0')}-${name}.png`);
    const html = slideHtml(slide, lang, spec.date[lang]);

    // The html sits in the spec directory so the exhibit <img> paths resolve
    // relative to the documents they name.
    const page = join(specDir, `.render-${lang}-${i}.html`);
    const raw = join(workDir, `.dossier-${lang}-${i}-2x.png`);
    writeFileSync(page, html);

    execFileSync(
      'google-chrome',
      [
        '--headless=new',
        '--disable-gpu',
        '--hide-scrollbars',
        '--force-device-scale-factor=2',
        '--virtual-time-budget=20000',
        `--window-size=${PORTRAIT.width},${PORTRAIT.height}`,
        `--screenshot=${raw}`,
        `file://${page}`,
      ],
      { stdio: ['ignore', 'ignore', 'ignore'] },
    );

    execFileSync('convert', [raw, '-resize', OUT_SIZE, '-strip', out]);
    rmSync(raw, { force: true });
    rmSync(page, { force: true });
    console.log(`Wrote ${out.replace(webRoot + '/', '')}`);
  });
}
