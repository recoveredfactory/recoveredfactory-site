<script lang="ts">
  import data from '$lib/data/287g-signings-chart-data.json';
  import type { Lang } from '$lib/i18n';
  import { BAR_COLOR, DEEMPHASIS, GRID_STROKE, AXIS_TEXT, fmt, monthLabel } from './chart-utils';

  const { lang = 'en' } = $props<{ lang?: Lang }>();

  // The surge window the piece is about: everything signed on/after this month
  // is drawn in the accent hue, everything before it in de-emphasis gray.
  const SURGE_FROM = '2026-04';
  // The trailing month is incomplete (roster snapshot mid-month); draw it faded.
  const partialMonth = data.partialMonth ?? '';

  const STRINGS = {
    en: {
      title: 'New 287(g) signings by month',
      subtitle: 'Local agencies entering an ICE 287(g) agreement, January 2025 – July 2026',
      before: 'Before April 2026',
      since: 'Since April 2026',
      surgeBegins: 'Pace picks up',
      partial: 'July (partial)',
      signings: 'signings',
      table: 'View the data',
      month: 'Month',
      source: 'Data: ICE 287(g) roster via appelson/Tracking_287g. Counts new agencies by signing date; the final bar (July 2026) is partial, through the July 21 snapshot.',
    },
    es: {
      title: 'Nuevas firmas de 287(g) por mes',
      subtitle: 'Agencias locales que firman un acuerdo 287(g) con ICE, enero 2025 – julio 2026',
      before: 'Antes de abril de 2026',
      since: 'Desde abril de 2026',
      surgeBegins: 'El ritmo sube',
      partial: 'julio (parcial)',
      signings: 'firmas',
      table: 'Ver los datos',
      month: 'Mes',
      source: 'Datos: registro 287(g) de ICE vía appelson/Tracking_287g. Cuenta nuevas agencias por fecha de firma; la última barra (julio 2026) es parcial, hasta la instantánea del 21 de julio.',
    },
  } as const;

  const t = $derived(STRINGS[lang]);

  const rows = data.monthly;
  const maxSignings = Math.max(...rows.map((r) => r.signings));
  const yMax = Math.ceil(maxSignings / 40) * 40;
  const yTicks = Array.from({ length: yMax / 40 + 1 }, (_, i) => i * 40);

  let width = $state(0);
  const height = 320;
  const m = { top: 34, right: 10, bottom: 26, left: 30 };

  const ih = height - m.top - m.bottom;
  const pitch = $derived(width > 0 ? (width - m.left - m.right) / rows.length : 0);
  const barW = $derived(Math.max(2, Math.min(30, pitch - 4)));
  const x = $derived((i: number) => m.left + i * pitch + (pitch - barW) / 2);
  const y = (v: number) => m.top + (1 - v / yMax) * ih;

  const firstSurge = rows.findIndex((r) => r.month >= SURGE_FROM);
  const boundaryX = $derived(m.left + firstSurge * pitch);

  // Label the first month of each quarter to keep the axis readable across 18 bars.
  const quarterTicks = rows
    .map((r, i) => ({ ...r, i }))
    .filter((r) => ['-01', '-04', '-07', '-10'].some((q) => r.month.endsWith(q)));

  let hover: number | null = $state(null);

  function onPointerMove(event: PointerEvent) {
    const svg = event.currentTarget as SVGSVGElement;
    const px = event.clientX - svg.getBoundingClientRect().left;
    const i = Math.floor((px - m.left) / Math.max(pitch, 1));
    hover = Math.max(0, Math.min(rows.length - 1, i));
  }

  const tooltipLeft = $derived(
    hover === null ? 0 : Math.max(4, Math.min(x(hover) - 70, width - 148)),
  );
</script>

<figure class="rf-chart my-8">
  <div class="font-display text-lg font-semibold leading-snug text-slate-800">{t.title}</div>
  <div class="mt-0.5 text-sm text-slate-500">{t.subtitle}</div>

  <div class="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
    <span class="inline-flex items-center gap-1.5">
      <span class="h-2.5 w-2.5 rounded-full" style="background: {DEEMPHASIS}"></span>
      {t.before}
    </span>
    <span class="inline-flex items-center gap-1.5">
      <span class="h-2.5 w-2.5 rounded-full" style="background: {BAR_COLOR}"></span>
      {t.since}
    </span>
    <span class="inline-flex items-center gap-1.5">
      <span class="h-2.5 w-2.5 rounded-full" style="background: {BAR_COLOR}; opacity: 0.45"></span>
      {t.partial}
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
          <line x1={m.left} x2={width - m.right} y1={y(tick)} y2={y(tick)} stroke={GRID_STROKE} />
          <text x={m.left - 6} y={y(tick) + 3.5} text-anchor="end" font-size="11" fill={AXIS_TEXT}>
            {tick}
          </text>
        {/each}

        {#each quarterTicks as tickRow}
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
          <rect
            x={x(i)}
            y={y(row.signings)}
            width={barW}
            height={y(0) - y(row.signings)}
            fill={row.month >= SURGE_FROM ? BAR_COLOR : DEEMPHASIS}
            opacity={row.month === partialMonth
              ? hover === null || hover === i
                ? 0.45
                : 0.3
              : hover === null || hover === i
                ? 1
                : 0.6}
          />
        {/each}

        <line x1={boundaryX} x2={boundaryX} y1={m.top - 4} y2={y(0)} stroke="rgba(15, 23, 42, 0.28)" />
        <text x={boundaryX + 5} y={m.top + 4} text-anchor="start" font-size="10.5" fill={AXIS_TEXT}>
          {t.surgeBegins}
        </text>
      </svg>

      {#if hover !== null}
        <div
          class="pointer-events-none absolute z-10 rounded border border-slate-200 bg-white/95 px-2.5 py-1.5 text-xs shadow-sm"
          style="left: {tooltipLeft}px; top: {m.top - 8}px; width: 140px"
        >
          <div class="font-semibold text-slate-800">{monthLabel(rows[hover].month, lang)}</div>
          <div class="mt-0.5 flex justify-between gap-3 text-slate-600">
            <span>{t.signings}</span><b>{fmt(rows[hover].signings)}</b>
          </div>
          {#if rows[hover].month === partialMonth}
            <div class="mt-0.5 text-[0.65rem] italic text-slate-400">{t.partial}</div>
          {/if}
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
            <th class="py-1 font-medium">{t.signings}</th>
          </tr>
        </thead>
        <tbody>
          {#each rows as row}
            <tr class="border-b border-slate-200/70">
              <td class="py-0.5 pr-2">{monthLabel(row.month, lang)}</td>
              <td class="py-0.5">{fmt(row.signings)}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </details>

  <figcaption class="mt-1 text-xs text-slate-500">{t.source}</figcaption>
</figure>
