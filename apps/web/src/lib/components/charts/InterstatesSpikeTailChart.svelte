<script lang="ts">
  import data from '$lib/data/287g-interstates-chart-data.json';
  import type { Lang } from '$lib/i18n';
  import { GRID_STROKE, AXIS_TEXT, LABEL_TEXT, fmt, fmtPct, monthLabel } from './chart-utils';
  import { RED, BEFORE } from './interstates-colors';

  // Two panels on one timeline: the share of interstate miles covered by local
  // agencies (month-end), and the agencies signing each month. Coverage rose
  // fastest in 2025; signings peaked in 2026 but added less road.
  const { lang = 'en' } = $props<{ lang?: Lang }>();

  const SURGE_FROM = '2026-04';
  const partialFrom = data.partialFrom;

  const STRINGS = {
    en: {
      topTitle: 'Interstate miles covered by local agencies',
      topSub: 'Share of all interstate miles in the lower 48, any type of agreement',
      fast: 'Fast in the first year',
      slow: 'Slower in 2026, even as signings peaked',
      botTitle: 'Agencies signing each month',
      botSub: 'All 287(g) agreements, by signing date',
      before: 'Before April 2026',
      since: 'Since April 2026',
      partial: 'Still coming in: ICE posts agreements late',
      covered: 'covered',
      signed: 'signed',
      coveredCol: 'Miles covered, month end',
      table: 'View the data',
      month: 'Month',
      source: "Data: ICE's 287(g) list as of Nov. 16, 2026, via 287(g) Watch; Census TIGER/Line roads. Coverage counts county and town agencies only, not state patrols; November runs through Nov. 16.",
    },
    es: {
      topTitle: 'Millas interestatales cubiertas por agencias locales',
      topSub: 'Porcentaje de todas las millas interestatales en los 48 estados contiguos, cualquier tipo de acuerdo',
      fast: 'Rápido el primer año',
      slow: 'Más lento en 2026, aunque las firmas llegaron a su máximo',
      botTitle: 'Agencias que firman cada mes',
      botSub: 'Todos los acuerdos 287(g), por fecha de firma',
      before: 'Antes de abril de 2026',
      since: 'Desde abril de 2026',
      partial: 'Aún llegando: ICE publica los acuerdos con retraso',
      covered: 'cubierto',
      signed: 'firmas',
      coveredCol: 'Millas cubiertas, fin de mes',
      table: 'Ver los datos',
      month: 'Mes',
      source: 'Datos: lista 287(g) de ICE al 16 de noviembre de 2026, vía 287(g) Watch; carreteras TIGER/Line del Censo. La cobertura cuenta solo agencias de condado y municipio, no las patrullas estatales; noviembre llega hasta el 16.',
    },
  } as const;

  const t = $derived(STRINGS[lang]);
  const rows = data.months;
  const n = rows.length;

  let width = $state(0);
  const m = { left: 34, right: 12 };
  const step = $derived(width > 0 ? (width - m.left - m.right) / n : 0);
  const xc = (i: number) => m.left + step * (i + 0.5);

  // ---- top: coverage line, a point at each month's end
  const topH = 190;
  const t0 = 28;
  const t1 = topH - 6;
  const vmax = 40;
  const yv = (v: number) => t1 - ((t1 - t0) * v) / vmax;
  // November is half a month (the list is from Nov. 16).
  const xEnd = (i: number) => m.left + step * (i === n - 1 ? i + 16 / 30 : i + 1);
  const pts = $derived([
    [m.left, yv(data.start)],
    ...rows.map((r, i) => [xEnd(i), yv(r.local)]),
  ]);
  const linePath = $derived(pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x},${y}`).join(''));
  const areaPath = $derived(`${linePath}L${pts[pts.length - 1][0]},${t1}L${m.left},${t1}Z`);
  const iDec = rows.findIndex((r) => r.month === '2025-12');
  const marks = $derived([
    { x: pts[0][0], y: pts[0][1], v: data.start, anchor: 'start', dx: 4 },
    { x: pts[iDec + 1][0], y: pts[iDec + 1][1], v: rows[iDec].local, anchor: 'middle', dx: 0 },
    { x: pts[n][0], y: pts[n][1], v: rows[n - 1].local, anchor: 'end', dx: 2 },
  ]);

  // ---- bottom: signings bars
  const botH = 170;
  const b0 = 18;
  const b1 = botH - 26;
  const cmax = Math.max(...rows.map((r) => r.signings));
  const yb = (v: number) => b1 - ((b1 - b0) * v) / (cmax * 1.05);
  const barW = $derived(Math.max(2, step - 4));
  const xTicks = rows
    .map((r, i) => ({ ...r, i }))
    .filter((r) => r.month.endsWith('-01') || r.month.endsWith('-07') || r.i === n - 1);

  const barColor = (month: string) => (month >= SURGE_FROM ? RED : BEFORE);

  let hover: number | null = $state(null);
  function onPointerMove(event: PointerEvent) {
    const svg = event.currentTarget as SVGSVGElement;
    const px = event.clientX - svg.getBoundingClientRect().left;
    hover = Math.max(0, Math.min(n - 1, Math.floor((px - m.left) / Math.max(step, 1))));
  }
  const tipLeft = $derived(hover === null ? 0 : Math.max(0, Math.min(xc(hover) - 75, width - 150)));
</script>

<figure class="rf-chart my-8">
  <svg width="0" height="0" class="absolute" aria-hidden="true">
    <defs>
      <pattern id="rf-hatch-red" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <rect width="6" height="6" fill={RED} fill-opacity="0.28" />
        <rect width="2" height="6" fill={RED} />
      </pattern>
    </defs>
  </svg>

  <div class="font-display text-lg font-semibold leading-snug text-slate-800">{t.topTitle}</div>
  <div class="mt-0.5 text-sm text-slate-500">{t.topSub}</div>

  <div class="relative mt-1" bind:clientWidth={width}>
    {#if width > 0}
      <svg
        {width}
        height={topH}
        role="img"
        aria-label={t.topTitle}
        onpointermove={onPointerMove}
        onpointerleave={() => (hover = null)}
      >
        {#each [10, 20, 30] as v}
          <line x1={m.left} x2={width - m.right} y1={yv(v)} y2={yv(v)} stroke={GRID_STROKE} />
          <text x={m.left - 6} y={yv(v) + 3.5} text-anchor="end" font-size="11" fill={AXIS_TEXT}>{v}%</text>
        {/each}
        <line x1={m.left} x2={width - m.right} y1={t1} y2={t1} stroke="rgba(15, 23, 42, 0.25)" />
        <path d={areaPath} fill={RED} fill-opacity="0.12" />
        <path d={linePath} fill="none" stroke={RED} stroke-width="2.5" stroke-linejoin="round" />
        {#if hover !== null}
          <line x1={xEnd(hover)} x2={xEnd(hover)} y1={t0 - 6} y2={t1} stroke="rgba(15, 23, 42, 0.25)" />
          <circle cx={xEnd(hover)} cy={yv(rows[hover].local)} r="4" fill={RED} />
        {/if}
        {#each marks as mk}
          <circle cx={mk.x} cy={mk.y} r="4" fill={RED} />
          <text
            x={mk.x + (mk.anchor === 'start' ? mk.dx : mk.anchor === 'end' ? -mk.dx : 0)}
            y={mk.y - 9}
            text-anchor={mk.anchor}
            font-size="15"
            font-weight="700"
            fill="#0f172a">{Math.round(mk.v)}%</text
          >
        {/each}
        <text x={m.left + 4} y={yv(27)} font-size="11.5" fill={LABEL_TEXT}>{t.fast}</text>
        {#if width >= 380}
          <text x={width - m.right} y={yv(38.5)} text-anchor="end" font-size="11.5" fill={LABEL_TEXT}>{t.slow}</text>
        {/if}
      </svg>
    {/if}
  </div>

  <div class="mt-5 font-display text-lg font-semibold leading-snug text-slate-800">{t.botTitle}</div>
  <div class="mt-0.5 text-sm text-slate-500">{t.botSub}</div>

  <div class="relative mt-1">
    {#if width > 0}
      <svg
        {width}
        height={botH}
        role="img"
        aria-label={t.botTitle}
        onpointermove={onPointerMove}
        onpointerleave={() => (hover = null)}
      >
        {#each rows as r, i}
          <rect
            x={xc(i) - barW / 2}
            y={yb(r.signings)}
            width={barW}
            height={b1 - yb(r.signings)}
            fill={r.month >= partialFrom ? 'url(#rf-hatch-red)' : barColor(r.month)}
            opacity={hover === null || hover === i ? 1 : 0.55}
          />
          {#if r.signings === cmax}
            <text x={xc(i)} y={yb(r.signings) - 5} text-anchor="middle" font-size="12" font-weight="700" fill="#0f172a">{r.signings}</text>
          {/if}
        {/each}
        <line x1={m.left} x2={width - m.right} y1={b1} y2={b1} stroke="rgba(15, 23, 42, 0.25)" />
        {#each xTicks as tk}
          <text x={xc(tk.i)} y={botH - 8} text-anchor="middle" font-size="11" fill={AXIS_TEXT}>{monthLabel(tk.month, lang)}</text>
        {/each}
      </svg>

      {#if hover !== null}
        <div
          class="pointer-events-none absolute z-10 border border-slate-300 bg-white/95 px-2.5 py-1.5 text-xs"
          style="left: {tipLeft}px; top: -8px; width: 150px"
        >
          <div class="font-semibold text-slate-800">{monthLabel(rows[hover].month, lang)}</div>
          <div class="mt-0.5 flex justify-between gap-3 text-slate-600">
            <span>{t.signed}</span><b>{fmt(rows[hover].signings)}</b>
          </div>
          <div class="flex justify-between gap-3 text-slate-600">
            <span>{t.covered}</span><b>{fmtPct(rows[hover].local)}</b>
          </div>
        </div>
      {/if}
    {/if}
  </div>

  <div class="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
    <span class="inline-flex items-center gap-1.5">
      <span class="h-2.5 w-2.5" style="background: {BEFORE}"></span>{t.before}
    </span>
    <span class="inline-flex items-center gap-1.5">
      <span class="h-2.5 w-2.5" style="background: {RED}"></span>{t.since}
    </span>
    <span class="inline-flex items-center gap-1.5">
      <svg width="10" height="10" aria-hidden="true"><rect width="10" height="10" fill="url(#rf-hatch-red)" /></svg>{t.partial}
    </span>
  </div>

  <details class="mt-2 text-xs text-slate-500">
    <summary class="cursor-pointer select-none">{t.table}</summary>
    <div class="mt-2 max-h-64 overflow-y-auto">
      <table class="w-full text-left tabular-nums">
        <thead>
          <tr class="border-b border-slate-300 text-slate-600">
            <th class="py-1 pr-2 font-medium">{t.month}</th>
            <th class="py-1 pr-2 font-medium">{t.coveredCol}</th>
            <th class="py-1 font-medium">{t.signed}</th>
          </tr>
        </thead>
        <tbody>
          {#each rows as r}
            <tr class="border-b border-slate-200/70">
              <td class="py-0.5 pr-2">{monthLabel(r.month, lang)}</td>
              <td class="py-0.5 pr-2">{fmtPct(r.local)}</td>
              <td class="py-0.5">{fmt(r.signings)}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </details>

  <figcaption class="mt-1 text-xs text-slate-500">{t.source}</figcaption>
</figure>
