<script lang="ts">
  import ddp from '$lib/data/ddp-chart-data.json';
  import type { Lang } from '$lib/i18n';
  import {
    ERA_COLORS,
    DEEMPHASIS,
    GRID_STROKE,
    AXIS_TEXT,
    LABEL_TEXT,
    fmt,
    fmtPct,
  } from './chart-utils';

  const { lang = 'en' } = $props<{ lang?: Lang }>();

  const STRINGS = {
    en: {
      title: 'How long completed detention stays lasted',
      subtitle: 'Share of each era’s completed stays by length',
      biden: 'Biden era',
      trump: 'Trump era',
      bucket: 'Stay length',
      table: 'View the data',
      note: () => 'Median completed stay is similar in both eras (about 22 days).',
      source: 'Data: Deportation Data Project, joined arrests–detention stays.',
    },
    es: {
      title: 'Cuánto duraron las estancias de detención completadas',
      subtitle: 'Porcentaje de las estancias completadas de cada era según su duración',
      biden: 'era Biden',
      trump: 'era Trump',
      bucket: 'Duración',
      table: 'Ver los datos',
      note: () => 'La mediana de la estancia completada es similar en ambas eras (unos 22 días).',
      source: 'Datos: Deportation Data Project, arrestos vinculados a estancias de detención.',
    },
  } as const;

  const BUCKET_ES: Record<string, string> = {
    '<1 day': '<1 día',
    '1–3 days': '1–3 días',
    '3–7 days': '3–7 días',
    '1–2 weeks': '1–2 semanas',
    '2–4 weeks': '2–4 semanas',
    '1–2 months': '1–2 meses',
    '2–3 months': '2–3 meses',
    '3+ months': '3+ meses',
  };

  const t = $derived(STRINGS[lang]);

  const trumpTotal = ddp.stay_length_hist.trump.reduce((s, b) => s + b.arrests, 0);
  const bidenTotal = ddp.stay_length_hist.biden.reduce((s, b) => s + b.arrests, 0);

  const buckets = ddp.stay_length_hist.trump.map((b, i) => ({
    bucket: b.bucket,
    trump: b.arrests,
    biden: ddp.stay_length_hist.biden[i]?.arrests ?? 0,
    trumpPct: (100 * b.arrests) / trumpTotal,
    bidenPct: (100 * (ddp.stay_length_hist.biden[i]?.arrests ?? 0)) / bidenTotal,
  }));

  const maxPct = Math.max(...buckets.flatMap((b) => [b.trumpPct, b.bidenPct]));

  const bucketLabel = (bucket: string) => (lang === 'es' ? (BUCKET_ES[bucket] ?? bucket) : bucket);
  const pctLabel = (pct: number) => fmtPct(Math.round(pct * 10) / 10);
  const tooltip = (b: (typeof buckets)[number]) =>
    `${bucketLabel(b.bucket)}\n${t.biden}: ${pctLabel(b.bidenPct)} (${fmt(b.biden)})\n${t.trump}: ${pctLabel(b.trumpPct)} (${fmt(b.trump)})`;

  let width = $state(0);
  // Columns read better for a distribution; below this width the bucket
  // labels stop fitting, so fall back to horizontal rows.
  const columns = $derived(width >= 560);

  // Column layout
  const cm = { top: 18, right: 8, bottom: 34, left: 34 };
  const colChartH = 300;
  const yMax = Math.ceil(maxPct / 5) * 5;
  const colY = (pct: number) => cm.top + (1 - pct / yMax) * (colChartH - cm.top - cm.bottom);
  const groupW = $derived((width - cm.left - cm.right) / buckets.length);
  const colW = $derived(Math.min(16, (groupW - 18) / 2));
  const yTicks = $derived(Array.from({ length: yMax / 5 + 1 }, (_, i) => i * 5));

  // Row layout (mobile)
  const gutter = 92;
  const barH = 13;
  const pairGap = 2;
  const rowPad = 22;
  const rowH = barH * 2 + pairGap + rowPad;

  const rowBarW = $derived((pct: number) =>
    Math.max(2, (pct / maxPct) * Math.max(0, width - gutter - 52)),
  );

</script>

<figure class="rf-chart my-8">
  <div class="font-display text-lg font-semibold leading-snug text-slate-800">{t.title}</div>
  <div class="mt-0.5 text-sm text-slate-500">{t.subtitle}</div>

  <div class="mt-2 flex gap-4 text-xs text-slate-600">
    <span class="inline-flex items-center gap-1.5">
      <span class="h-2.5 w-2.5 rounded-full" style="background: {DEEMPHASIS}"></span>
      {t.biden}
    </span>
    <span class="inline-flex items-center gap-1.5">
      <span class="h-2.5 w-2.5 rounded-full" style="background: {ERA_COLORS.trump}"></span>
      {t.trump}
    </span>
  </div>

  <div class="relative mt-3" bind:clientWidth={width}>
    {#if width > 0 && columns}
      <svg {width} height={colChartH} role="img" aria-label={t.title}>
        {#each yTicks as tick}
          <line
            x1={cm.left}
            x2={width - cm.right}
            y1={colY(tick)}
            y2={colY(tick)}
            stroke={GRID_STROKE}
          />
          <text
            x={cm.left - 6}
            y={colY(tick) + 3.5}
            text-anchor="end"
            font-size="11"
            fill={AXIS_TEXT}
          >
            {tick}%
          </text>
        {/each}

        {#each buckets as b, i}
          {@const gx = cm.left + i * groupW}
          {@const pairX = gx + (groupW - (2 * colW + 2)) / 2}
          {@const dodge = 6}
          <g>
            <title>{tooltip(b)}</title>
            <rect
              x={pairX}
              y={colY(b.bidenPct)}
              width={colW}
              height={colY(0) - colY(b.bidenPct)}
              fill={DEEMPHASIS}
            />
            <rect
              x={pairX + colW + 2}
              y={colY(b.trumpPct)}
              width={colW}
              height={colY(0) - colY(b.trumpPct)}
              fill={ERA_COLORS.trump}
            />
            <text
              x={pairX + colW / 2 - dodge}
              y={colY(b.bidenPct) - 5}
              text-anchor="middle"
              font-size="9.5"
              fill={AXIS_TEXT}
            >
              {pctLabel(b.bidenPct)}
            </text>
            <text
              x={pairX + colW + 2 + colW / 2 + dodge}
              y={colY(b.trumpPct) - 5}
              text-anchor="middle"
              font-size="9.5"
              font-weight="600"
              fill={LABEL_TEXT}
            >
              {pctLabel(b.trumpPct)}
            </text>
            <text
              x={gx + groupW / 2}
              y={colChartH - 12}
              text-anchor="middle"
              font-size="11"
              fill={AXIS_TEXT}
            >
              {bucketLabel(b.bucket)}
            </text>
          </g>
        {/each}
      </svg>
    {:else if width > 0}
      <svg {width} height={buckets.length * rowH} role="img" aria-label={t.title}>
        {#each buckets as b, i}
          {@const top = i * rowH}
          <g>
            <title>{tooltip(b)}</title>
            <text
              x={gutter - 10}
              y={top + barH + pairGap / 2 + 4}
              text-anchor="end"
              font-size="12"
              fill={LABEL_TEXT}
            >
              {bucketLabel(b.bucket)}
            </text>
            <rect x={gutter} y={top} width={rowBarW(b.bidenPct)} height={barH} fill={DEEMPHASIS} />
            <text
              x={gutter + rowBarW(b.bidenPct) + 6}
              y={top + barH / 2 + 4}
              font-size="10.5"
              fill={AXIS_TEXT}
            >
              {pctLabel(b.bidenPct)}
            </text>
            <rect
              x={gutter}
              y={top + barH + pairGap}
              width={rowBarW(b.trumpPct)}
              height={barH}
              fill={ERA_COLORS.trump}
            />
            <text
              x={gutter + rowBarW(b.trumpPct) + 6}
              y={top + barH + pairGap + barH / 2 + 4}
              font-size="10.5"
              fill={AXIS_TEXT}
            >
              {pctLabel(b.trumpPct)}
            </text>
          </g>
        {/each}
      </svg>
    {/if}
  </div>

  <p class="mt-2 text-xs leading-relaxed text-slate-500">{t.note()}</p>

  <details class="mt-1 text-xs text-slate-500">
    <summary class="cursor-pointer select-none">{t.table}</summary>
    <table class="mt-2 w-full text-left tabular-nums">
      <thead>
        <tr class="border-b border-slate-300 text-slate-600">
          <th class="py-1 pr-2 font-medium">{t.bucket}</th>
          <th class="py-1 pr-2 font-medium">{t.biden}</th>
          <th class="py-1 font-medium">{t.trump}</th>
        </tr>
      </thead>
      <tbody>
        {#each buckets as b}
          <tr class="border-b border-slate-200/70">
            <td class="py-0.5 pr-2">{bucketLabel(b.bucket)}</td>
            <td class="py-0.5 pr-2">{fmt(b.biden)} ({pctLabel(b.bidenPct)})</td>
            <td class="py-0.5">{fmt(b.trump)} ({pctLabel(b.trumpPct)})</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </details>

  <figcaption class="mt-1 text-xs text-slate-500">{t.source}</figcaption>
</figure>
