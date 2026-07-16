#!/usr/bin/env node
// Pull the DDP drop (EN/ES post + chart data) from the PromptQL automation:
// writes mdsvex posts into src/content/blog/{en,es}, the chart data JSON
// into src/lib/data/ddp-chart-data.json (the chart components import it),
// and foldout artifacts (numbers ledger, DHS response, …) into
// src/lib/content/ (appended to both posts as <Foldout> disclosures).
//
// Usage: node scripts/ddp/pull.mjs [--raw-only] [--offline]   (from apps/web)
//   --raw-only   fetch and save scripts/ddp/out/response.json, don't write posts
//   --offline    re-template from the saved scripts/ddp/out/response.json
//                instead of hitting the API (deterministic re-runs)
//
// Reads PQL_DDP_POST_URL / PQL_DDP_POST_KEY from apps/web/.env.
// To independently verify the chart data against the raw DDP release:
//   cd scripts/ddp/repro && uv run python download_data.py && uv run python export_chart_data.py

import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const webRoot = join(here, '..', '..');

// ---------------------------------------------------------------------------
// Post config — slugs/frontmatter are editorial choices; adjust before running.
// ---------------------------------------------------------------------------
const CONFIG = {
  canonicalId: 'ice-jails-nearly-everyone',
  date: '2026-07-15',
  tags: ['field-notes', 'immigration'],
  byline: 'David Eads and PromptQL',
  previewImage: '/images/ddp-arrest-volume.png',
  en: {
    artifact: 'ddp_rhetoric_vs_numbers_en',
    slug: 'ice-jails-nearly-everyone',
    description:
      'New data shows ICE now jails 90% of the people it arrests — and that deportation is the most common outcome.',
  },
  es: {
    artifact: 'ddp_rhetoric_vs_numbers_es',
    slug: 'ice-encarcela-a-casi-todos',
    description:
      'Nuevos datos muestran que ICE ahora encarcela al 90% de las personas que arresta — y que la deportación es el desenlace más común.',
  },
  chartData: 'ddp_rhetoric_chart_data',
  // Foldouts — appendix disclosures at the end of each post, in this order.
  // `artifact` is per-lang; a lang whose artifact is missing falls back to
  // the EN artifact (label gets an '(en inglés)' suffix), and a foldout with
  // no artifact at all is omitted from the post with a warning. 'TK …'
  // names are placeholders for artifacts that don't exist upstream yet —
  // replace them when the drop grows them.
  foldouts: [
    {
      component: 'NumbersLedger',
      artifact: { en: 'ddp_numbers_ledger', es: 'ddp_numbers_ledger_es' },
      label: { en: 'How we did this', es: 'Cómo lo hicimos' },
    },
    {
      // No ES variant upstream yet; ES falls back to the EN artifact.
      component: 'DhsResponse',
      artifact: { en: 'ddp_dhs_response' },
      label: { en: 'Response from DHS, 7/16/2026', es: 'Respuesta del DHS, 16/7/2026' },
    },
  ],
};

// TK CHART markers are matched to components by caption keywords (EN + ES);
// an unmatched marker is left in place so it's visible in review.
const CHART_MATCHERS = [
  {
    component: 'ArrestVolumeChart',
    pattern: /interior arrests|stacked by detained|arrestos.*interior|apilad/i,
  },
  { component: 'DepartureCountriesChart', pattern: /departure countries|países de salida/i },
  { component: 'StayLengthChart', pattern: /stay[ -]lengths?|duraciones de las estancias/i },
];

// ---------------------------------------------------------------------------

const env = Object.fromEntries(
  readFileSync(join(webRoot, '.env'), 'utf8')
    .split('\n')
    .filter((line) => line.includes('=') && !line.startsWith('#'))
    .map((line) => [line.slice(0, line.indexOf('=')), line.slice(line.indexOf('=') + 1)]),
);

const url = env.PQL_DDP_POST_URL;
const key = env.PQL_DDP_POST_KEY;
if (!url || !key) {
  console.error('Missing PQL_DDP_POST_URL / PQL_DDP_POST_KEY in apps/web/.env');
  process.exit(1);
}

const outDir = join(here, 'out');
mkdirSync(outDir, { recursive: true });

let response;
if (process.argv.includes('--offline')) {
  response = JSON.parse(readFileSync(join(outDir, 'response.json'), 'utf8'));
  console.log('Offline: re-templating from saved scripts/ddp/out/response.json');
} else {
  // The run endpoint expects multipart/form-data with 'manifest' as the first field.
  const form = new FormData();
  form.append('manifest', '{}');

  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `pat ${key}` },
    body: form,
  });

  const text = await res.text();
  if (!res.ok) {
    console.error(`PromptQL request failed: HTTP ${res.status}`);
    console.error(text.slice(0, 2000));
    process.exit(1);
  }

  response = JSON.parse(text);
  writeFileSync(join(outDir, 'response.json'), JSON.stringify(response, null, 2));
  console.log(`Saved raw response (${text.length} bytes) to scripts/ddp/out/response.json`);
}
if (response.error) {
  console.error(`Automation reported error: ${JSON.stringify(response.error)}`);
  process.exit(1);
}

if (process.argv.includes('--raw-only')) process.exit(0);

// Large artifacts (like the reference chart html) come back by reference only;
// fetch their bytes for inspection via GET <base>/artifacts/<id>/data.
const base = url.replace(/\/execute_program\/.*$/, '');
for (const artifact of response.artifacts) {
  if (artifact.data !== undefined || !artifact.metadata?.artifact_id) continue;
  const dataUrl = `${base}/artifacts/${artifact.metadata.artifact_id}/data`;
  const r = await fetch(dataUrl, { headers: { Authorization: `pat ${key}` } });
  if (!r.ok) {
    console.warn(`Could not fetch '${artifact.name}' by reference: HTTP ${r.status}`);
    continue;
  }
  const ext = artifact.metadata.artifact_type === 'html' ? 'html' : 'bin';
  const path = join(outDir, `${artifact.name}.${ext}`);
  writeFileSync(path, Buffer.from(await r.arrayBuffer()));
  console.log(`Fetched referenced artifact '${artifact.name}' to scripts/ddp/out/`);
}

const chartArtifact = response.artifacts.find((a) => a.name === CONFIG.chartData);
if (chartArtifact?.data) {
  const dataPath = join(webRoot, 'src', 'lib', 'data', 'ddp-chart-data.json');
  mkdirSync(dirname(dataPath), { recursive: true });
  writeFileSync(dataPath, JSON.stringify(JSON.parse(chartArtifact.data), null, 2));
  console.log('Wrote src/lib/data/ddp-chart-data.json');
} else {
  console.warn(`Artifact '${CONFIG.chartData}' missing; chart data left untouched.`);
}

// Resolve foldouts first: write each artifact's include file once (keyed by
// artifact name, so an ES fallback reuses the EN file) and collect per-lang
// {component, file, label} lists for toPost().
const foldoutsByLang = { en: [], es: [] };
const writtenIncludes = new Map();
for (const foldout of CONFIG.foldouts) {
  for (const lang of ['en', 'es']) {
    let artifactName = foldout.artifact[lang];
    let artifact = response.artifacts.find((a) => a.name === artifactName);
    let fellBack = false;
    if (!artifact?.data && lang !== 'en') {
      artifactName = foldout.artifact.en;
      artifact = response.artifacts.find((a) => a.name === artifactName);
      fellBack = true;
    }
    if (!artifact?.data) {
      console.warn(
        `Foldout '${foldout.component}' (${lang}): artifact '${foldout.artifact[lang]}' missing; omitted.`,
      );
      continue;
    }
    if (!writtenIncludes.has(artifactName)) {
      const file = `${artifactName.replace(/_/g, '-')}.md`;
      const path = join(webRoot, 'src', 'lib', 'content', file);
      mkdirSync(dirname(path), { recursive: true });
      writeFileSync(path, toInclude(artifact.data));
      console.log(`Wrote src/lib/content/${file}`);
      writtenIncludes.set(artifactName, file);
    }
    foldoutsByLang[lang].push({
      component: foldout.component,
      file: writtenIncludes.get(artifactName),
      label: foldout.label[lang] + (fellBack ? ' (en inglés)' : ''),
    });
  }
}

for (const lang of ['en', 'es']) {
  const { artifact: artifactName, slug } = CONFIG[lang];
  const artifact = response.artifacts.find((a) => a.name === artifactName);
  if (!artifact?.data) {
    console.error(`Artifact '${artifactName}' missing from response; skipping ${lang} post.`);
    continue;
  }
  const path = join(webRoot, 'src', 'content', 'blog', lang, `${slug}.md`);
  writeFileSync(path, toPost(artifact.data, lang));
  console.log(`Wrote src/content/blog/${lang}/${slug}.md`);
}

// Convert PromptQL post markdown into an mdsvex post: H1 → frontmatter title,
// first italic paragraph → description, TK CHART markers → chart components.
function toPost(markdown, lang) {
  let body = markdown.trim();

  const h1 = body.match(/^# (.+)\n/);
  const title = h1 ? h1[1].trim() : 'TK title';
  if (h1) body = body.slice(h1[0].length).trim();

  const description = CONFIG[lang].description ?? 'TK description';

  // Horizontal rules become the site's section-break treatment; the CSS in
  // app.css dropcaps the paragraph that follows a .section-break.
  // The trailing newline guarantees a blank line after the html block, so the
  // next paragraph stays markdown (and takes the dropcap) instead of being
  // swallowed into the block.
  body = body.replace(/^(?:---|\*\*\*|___)[ \t]*$/gm, '<p class="section-break">⁘ ⁘ ⁘</p>\n');

  const used = new Set();
  body = body.replace(/^\*\*TK CHART:\*\* (.+)$/gm, (line, caption) => {
    const match = CHART_MATCHERS.find((m) => m.pattern.test(caption));
    if (!match) {
      console.warn(`Unmatched TK CHART marker (${lang}): ${caption.slice(0, 60)}…`);
      return line;
    }
    used.add(match.component);
    return `<!-- chart: ${caption.trim()} -->\n<${match.component} lang="${lang}" />`;
  });

  const frontmatter = [
    '---',
    `id: "${CONFIG.canonicalId}"`,
    `title: "${escapeYaml(title)}"`,
    `date: "${CONFIG.date}"`,
    `description: "${escapeYaml(description)}"`,
    'type: "post"',
    `byline: "${CONFIG.byline}"`,
    'tags:',
    ...CONFIG.tags.map((t) => `  - "${t}"`),
    `lang: "${lang}"`,
    `previewImage: "${CONFIG.previewImage}"`,
    '---',
  ].join('\n');

  const foldouts = foldoutsByLang[lang];
  const script = [
    '<script>',
    ...[...used].map((c) => `  import ${c} from '$lib/components/charts/${c}.svelte';`),
    ...(foldouts.length ? ["  import Foldout from '$lib/components/Foldout.svelte';"] : []),
    ...foldouts.map((f) => `  import ${f.component} from '$lib/content/${f.file}';`),
    '</script>',
    '',
    '',
  ].join('\n');

  const foldoutBlocks = foldouts
    .map((f) => `<Foldout label="${f.label.replace(/"/g, '&quot;')}">\n  <${f.component} />\n</Foldout>`)
    .join('\n');

  return `${frontmatter}\n\n${script}${body}${foldoutBlocks ? `\n\n${foldoutBlocks}` : ''}\n`;
}

// mdsvex hands markdown to the Svelte parser, which rejects stray `<` (e.g.
// "arrests < 0.6") as a malformed tag. Escape them outside code spans/fences;
// code content is escaped by the markdown compiler itself.
function escapeAngles(md) {
  let inFence = false;
  return md
    .split('\n')
    .map((line) => {
      if (/^\s*```/.test(line)) {
        inFence = !inFence;
        return line;
      }
      if (inFence) return line;
      return line
        .split('`')
        .map((seg, i) => (i % 2 === 0 ? seg.replaceAll('<', '&lt;') : seg))
        .join('`');
    })
    .join('\n');
}

// Foldout artifacts compile as bare mdsvex includes (no frontmatter, no
// route); the posts import them inside <Foldout> disclosures. The upstream
// H1 is dropped — the disclosure's summary is the heading.
function toInclude(markdown) {
  let body = escapeAngles(markdown.trim());

  const h1 = body.match(/^# (.+)\n/);
  if (h1) body = body.slice(h1[0].length).trim();

  return `${body}\n`;
}

function escapeYaml(s) {
  return s.replace(/"/g, '\\"');
}
