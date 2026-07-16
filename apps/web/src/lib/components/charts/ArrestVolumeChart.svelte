<script lang="ts">
  import ddp from '$lib/data/ddp-chart-data.json';
  import type { Lang } from '$lib/i18n';
  import {
    ERA_COLORS,
    GRID_STROKE,
    AXIS_TEXT,
    SURFACE,
    fmt,
    fmtPct,
    monthLabel,
  } from './chart-utils';

  const { lang = 'en' } = $props<{ lang?: Lang }>();

  // Slate-400: light enough to read as context against the era hues; the
  // table view and tooltip carry exact values.
  const RELEASED_COLOR = '#94a3b8';

  const STRINGS = {
    en: {
      title: 'Monthly ICE interior arrests',
      subtitle: 'Stacked by whether the arrest led to detention, October 2022 – February 2026',
      detainedBiden: 'Detained (Biden era)',
      detainedTrump: 'Detained (Trump era)',
      released: 'Released without book-in',
      inauguration: 'Trump takes office',
      arrests: 'arrests',
      detained: 'detained',
      releasedShort: 'released',
      rate: 'detention rate',
      table: 'View the data',
      month: 'Month',
      source: 'Data: Deportation Data Project, joined arrests–detention stays.',
    },
    es: {
      title: 'Arrestos mensuales de ICE en el interior',
      subtitle: 'Apilados según si el arresto terminó en detención, octubre 2022 – febrero 2026',
      detainedBiden: 'Detenidos (era Biden)',
      detainedTrump: 'Detenidos (era Trump)',
      released: 'Liberados sin ingreso a detención',
      inauguration: 'Trump toma posesión',
      arrests: 'arrestos',
      detained: 'detenidos',
      releasedShort: 'liberados',
      rate: 'tasa de detención',
      table: 'Ver los datos',
      month: 'Mes',
      source: 'Datos: Deportation Data Project, arrestos vinculados a estancias de detención.',
    },
  } as const;

  const t = $derived(STRINGS[lang]);

  const rows = ddp.monthly;
  const maxArrests = Math.max(...rows.map((r) => r.arrests));
  const yMax = Math.ceil(maxArrests / 10000) * 10000;
  const yTicks = Array.from({ length: yMax / 10000 + 1 }, (_, i) => i * 10000);

  let width = $state(0);
  const height = 320;
  const m = { top: 34, right: 10, bottom: 26, left: 34 };

  const iw = $derived(Math.max(0, width - m.left - m.right));
  const ih = height - m.top - m.bottom;

  const pitch = $derived(iw / rows.length);
  const barW = $derived(Math.max(2, Math.min(24, pitch - 3.5)));
  const x = $derived((i: number) => m.left + i * pitch + (pitch - barW) / 2);
  const y = (v: number) => m.top + (1 - v / yMax) * ih;

  const firstTrump = rows.findIndex((r) => r.admin === 'Trump');
  const boundaryX = $derived(m.left + firstTrump * pitch);
  const janTicks = rows
    .map((r, i) => ({ ...r, i }))
    .filter((r) => r.month.endsWith('-01'));

  const compact = (v: number) => (v === 0 ? '0' : `${Math.round(v / 1000)}K`);

  let hover: number | null = $state(null);

  function onPointerMove(event: PointerEvent) {
    const svg = event.currentTarget as SVGSVGElement;
    const px = event.clientX - svg.getBoundingClientRect().left;
    const i = Math.floor((px - m.left) / Math.max(pitch, 1));
    hover = Math.max(0, Math.min(rows.length - 1, i));
  }

  const tooltipLeft = $derived(
    hover === null ? 0 : Math.max(4, Math.min(x(hover) - 80, width - 172)),
  );

</script>

<figure class="rf-chart my-8">
  <div class="font-display text-lg font-semibold leading-snug text-slate-800">{t.title}</div>
  <div class="mt-0.5 text-sm text-slate-500">{t.subtitle}</div>

  <div class="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
    <span class="inline-flex items-center gap-1.5">
      <span class="h-2.5 w-2.5 rounded-full" style="background: {ERA_COLORS.biden}"></span>
      {t.detainedBiden}
    </span>
    <span class="inline-flex items-center gap-1.5">
      <span class="h-2.5 w-2.5 rounded-full" style="background: {ERA_COLORS.trump}"></span>
      {t.detainedTrump}
    </span>
    <span class="inline-flex items-center gap-1.5">
      <span class="h-2.5 w-2.5 rounded-full" style="background: {RELEASED_COLOR}"></span>
      {t.released}
    </span>
  </div>

  <div class="relative mt-1" bind:clientWidth={width}>
    {#if width > 0}
      <svg
        {width}
        {height}
        role="img"
        aria-label={t.title}
        onpointermove={onPointerMove}
        onpointerleave={() => (hover = null)}
      >
        {#each yTicks as tick}
          <line
            x1={m.left}
            x2={width - m.right}
            y1={y(tick)}
            y2={y(tick)}
            stroke={GRID_STROKE}
          />
          <text x={m.left - 6} y={y(tick) + 3.5} text-anchor="end" font-size="11" fill={AXIS_TEXT}>
            {compact(tick)}
          </text>
        {/each}

        {#each janTicks as tickRow}
          <text
            x={m.left + tickRow.i * pitch + pitch / 2}
            y={height - 8}
            text-anchor="middle"
            font-size="11"
            fill={AXIS_TEXT}
          >
            {monthLabel(tickRow.month, lang)}
          </text>
        {/each}

        {#each rows as row, i}
          {@const released = row.arrests - row.detained}
          <g opacity={hover === null || hover === i ? 1 : 0.6}>
            <rect
              x={x(i)}
              y={y(row.detained)}
              width={barW}
              height={y(0) - y(row.detained)}
              fill={row.admin === 'Trump' ? ERA_COLORS.trump : ERA_COLORS.biden}
            />
            {#if released > 0}
              <rect
                x={x(i)}
                y={y(row.arrests)}
                width={barW}
                height={Math.max(0, y(row.detained) - 2 - y(row.arrests))}
                fill={RELEASED_COLOR}
              />
            {/if}
          </g>
        {/each}

        <line
          x1={boundaryX}
          x2={boundaryX}
          y1={m.top - 4}
          y2={y(0)}
          stroke="rgba(15, 23, 42, 0.28)"
        />
        <text
          x={boundaryX - 6}
          y={m.top + 4}
          text-anchor="end"
          font-size="10.5"
          fill={AXIS_TEXT}
        >
          {t.inauguration}
        </text>
      </svg>

      {#if hover !== null}
        <div
          class="pointer-events-none absolute z-10 w-42 rounded border border-slate-200 bg-white/95 px-2.5 py-1.5 text-xs shadow-sm"
          style="left: {tooltipLeft}px; top: {m.top - 8}px"
        >
          <div class="font-semibold text-slate-800">{monthLabel(rows[hover].month, lang)}</div>
          <div class="mt-0.5 flex justify-between gap-3 text-slate-600">
            <span>{t.arrests}</span><b>{fmt(rows[hover].arrests)}</b>
          </div>
          <div class="flex justify-between gap-3 text-slate-600">
            <span>{t.detained}</span><b>{fmt(rows[hover].detained)}</b>
          </div>
          <div class="flex justify-between gap-3 text-slate-600">
            <span>{t.releasedShort}</span><b>{fmt(rows[hover].arrests - rows[hover].detained)}</b>
          </div>
          <div class="flex justify-between gap-3 text-slate-600">
            <span>{t.rate}</span><b>{fmtPct(rows[hover].detention_rate_pct)}</b>
          </div>
        </div>
      {/if}
    {/if}
  </div>

  <details class="mt-2 text-xs text-slate-500">
    <summary class="cursor-pointer select-none">{t.table}</summary>
    <div class="mt-2 max-h-64 overflow-y-auto">
      <table class="w-full text-left tabular-nums">
        <thead>
          <tr class="border-b border-slate-300 text-slate-600">
            <th class="py-1 pr-2 font-medium">{t.month}</th>
            <th class="py-1 pr-2 font-medium">{t.arrests}</th>
            <th class="py-1 pr-2 font-medium">{t.detained}</th>
            <th class="py-1 pr-2 font-medium">{t.releasedShort}</th>
            <th class="py-1 font-medium">{t.rate}</th>
          </tr>
        </thead>
        <tbody>
          {#each rows as row}
            <tr class="border-b border-slate-200/70">
              <td class="py-0.5 pr-2">{monthLabel(row.month, lang)}</td>
              <td class="py-0.5 pr-2">{fmt(row.arrests)}</td>
              <td class="py-0.5 pr-2">{fmt(row.detained)}</td>
              <td class="py-0.5 pr-2">{fmt(row.arrests - row.detained)}</td>
              <td class="py-0.5">{fmtPct(row.detention_rate_pct)}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </details>

  <figcaption class="mt-1 text-xs text-slate-500">{t.source}</figcaption>
</figure>
