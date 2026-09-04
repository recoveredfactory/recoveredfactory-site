#!/usr/bin/env node
// Render a locator map PNG for a dossier slide.
//
// Usage: node scripts/daybook/map.mjs --out <file.png> [--width 1400] [--height 900]
//        [--geo <dir holding us-inset.geojson + us-inset-counties.geojson>]
//
// Draws one state, one county inside it, and a marked place — the three things a
// locator needs and nothing else. Written for Adelanto (San Bernardino County,
// California) and parameterised rather than hardcoded, because the next facility
// in the news will want the same picture somewhere else.
//
// The geometry comes from the sibling 287(g) project rather than from this repo:
// the two files are 3.5MB and would be dead weight here for one PNG a month. The
// committed artifact is the rendered map, the same way a dossier commits document
// crops rather than the PDFs they came out of. Pass --geo to point elsewhere.
//
// County features carry only a name, so the county is matched by name AND by
// falling inside the state's bounding box — "Los Angeles" and "San Bernardino"
// happen to be unique, and the next one will not be.

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

const GEO = flag('geo', join(process.env.HOME, 'projects/287g-explorer/packages/web/static'));
const out = resolve(flag('out', 'map.png'));
const W = Number(flag('width', 1400));
const H = Number(flag('height', 900));

const STATE = flag('state', 'California');
const COUNTY = flag('county', 'San Bernardino');
// name:lat:lon, marked in order; the first is the subject and gets the crimson dot.
const PLACES = flag('places', 'Adelanto:34.5828:-117.4092|Los Angeles:34.0522:-118.2437')
  .split('|')
  .map((p) => {
    const [name, lat, lon] = p.split(':');
    return { name, lat: Number(lat), lon: Number(lon) };
  });

// The site's palette, not the deck's — this map is for the paper-ground dossier.
const CREAM = flag('bg', '#fdfcf9');
const INK = '#252525';
const CRIMSON = '#d81f48';
const LAND = '#e2ded1';
const COUNTY_FILL = '#cdc7b4';

const states = JSON.parse(readFileSync(join(GEO, 'us-inset.geojson'), 'utf8'));
const counties = JSON.parse(readFileSync(join(GEO, 'us-inset-counties.geojson'), 'utf8'));

const state = states.features.find((f) => f.properties.name === STATE);
if (!state) throw new Error(`No state "${STATE}" in us-inset.geojson`);

const rings = (geom) =>
  geom.type === 'Polygon' ? geom.coordinates : geom.coordinates.flat();

const bbox = (feature) => {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const ring of rings(feature.geometry))
    for (const [lon, lat] of ring) {
      if (lon < x0) x0 = lon;
      if (lon > x1) x1 = lon;
      if (lat < y0) y0 = lat;
      if (lat > y1) y1 = lat;
    }
  return [x0, y0, x1, y1];
};

const [sx0, sy0, sx1, sy1] = bbox(state);
const inState = (f) => {
  const [x0, y0, x1, y1] = bbox(f);
  return x0 >= sx0 - 0.5 && x1 <= sx1 + 0.5 && y0 >= sy0 - 0.5 && y1 <= sy1 + 0.5;
};
const county = counties.features.find(
  (f) => f.properties.name === COUNTY && inState(f),
);
if (!county) throw new Error(`No county "${COUNTY}" inside ${STATE}`);

// What the frame fits. `state` shows the whole silhouette, which orients a reader
// who does not know the state; `focus` fits the county and the marked places
// instead, which fills a wide frame and makes the subject big. California is
// tall and a wide frame full of empty Pacific tells nobody anything, so focus is
// the default and the silhouette still runs off the edges behind it.
const FOCUS = flag('focus', 'focus') === 'state' ? 'state' : 'focus';

let [fx0, fy0, fx1, fy1] = FOCUS === 'state' ? [sx0, sy0, sx1, sy1] : bbox(county);
if (FOCUS !== 'state')
  for (const p of PLACES) {
    fx0 = Math.min(fx0, p.lon);
    fx1 = Math.max(fx1, p.lon);
    fy0 = Math.min(fy0, p.lat);
    fy1 = Math.max(fy1, p.lat);
  }

// Equirectangular with the x axis squeezed by the mid-latitude cosine. A conic
// would be more correct and, at one state across, indistinguishable.
const lat0 = (fy0 + fy1) / 2;
const k = Math.cos((lat0 * Math.PI) / 180);
// Room for the label that rides beside the subject dot, which the geometry knows
// nothing about — without it the frame fits the shape and clips the word.
const pad = Number(flag('pad', 120));
const spanX = (fx1 - fx0) * k;
const spanY = fy1 - fy0;
const scale = Math.min((W - pad * 2) / spanX, (H - pad * 2) / spanY);
const offX = (W - spanX * scale) / 2;
const offY = (H - spanY * scale) / 2;
const px = ([lon, lat]) => [
  offX + (lon - fx0) * k * scale,
  offY + (fy1 - lat) * scale,
];

const path = (feature) =>
  rings(feature.geometry)
    .map((ring) => `M${ring.map((c) => px(c).map((n) => n.toFixed(1)).join(',')).join('L')}Z`)
    .join('');

// A label sits to the right of its dot unless that would run it out of the
// frame, in which case it flips and anchors from the other side. Cheap, and it
// is the difference between a locator and a clipped word.
const dots = PLACES.map((p, i) => {
  const [x, y] = px([p.lon, p.lat]);
  const subject = i === 0;
  const r = subject ? 15 : 8;
  const size = subject ? 42 : 30;
  const gap = r + (subject ? 16 : 12);
  // The subject's label rides beside its dot, flipping to the other side rather
  // than running out of the frame. A reference label sits *below* its dot and
  // centred: set beside, it lies along the same horizontal as whatever boundary
  // the place happens to sit on, and a county line through a word is the one
  // collision a locator cannot afford.
  const flip = x + gap + p.name.length * size * 0.55 > W - 20;
  const label = subject
    ? `<text x="${flip ? x - gap : x + gap}" y="${y + size * 0.3}" class="lbl subject"${
        flip ? ' text-anchor="end"' : ''
      }>${p.name}</text>`
    : `<text x="${x}" y="${y + r + size}" class="lbl" text-anchor="middle">${p.name}</text>`;
  return `${subject ? `<circle cx="${x}" cy="${y}" r="${r + 13}" class="halo"/>` : ''}
    <circle cx="${x}" cy="${y}" r="${r}" class="${subject ? 'subject-dot' : 'ref-dot'}"/>${label}`;
}).join('');

const svg = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${W}" height="${H}" fill="${CREAM}"/>
  <path d="${path(state)}" fill="${LAND}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
  <path d="${path(county)}" fill="${COUNTY_FILL}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
  ${dots}
</svg>`;

const html = `<!doctype html><meta charset="utf-8">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Jost:wght@500;600;700&display=swap" rel="stylesheet">
<style>
  html,body{margin:0;padding:0;background:${CREAM};}
  svg{display:block;}
  .halo{fill:${CRIMSON};opacity:0.18;}
  .subject-dot{fill:${CRIMSON};stroke:${CREAM};stroke-width:4;}
  .ref-dot{fill:${INK};opacity:0.5;}
  .lbl{font-family:"Jost",sans-serif;font-weight:600;font-size:30px;fill:${INK};letter-spacing:0.06em;}
  .lbl.subject{font-weight:700;font-size:42px;fill:${CRIMSON};letter-spacing:0.04em;}
</style>${svg}`;

const workDir = join(here, 'out');
mkdirSync(workDir, { recursive: true });
mkdirSync(dirname(out), { recursive: true });
const htmlFile = join(workDir, '.map.html');
const raw = join(workDir, '.map-2x.png');
writeFileSync(htmlFile, html);

execFileSync(
  'google-chrome',
  [
    '--headless=new',
    '--disable-gpu',
    '--hide-scrollbars',
    '--force-device-scale-factor=2',
    '--virtual-time-budget=20000',
    `--window-size=${W},${H}`,
    `--screenshot=${raw}`,
    `file://${htmlFile}`,
  ],
  { stdio: ['ignore', 'ignore', 'ignore'] },
);
execFileSync('convert', [raw, '-resize', `${W}x${H}`, '-strip', out]);
rmSync(raw, { force: true });
rmSync(htmlFile, { force: true });
console.log(`Wrote ${out}`);
