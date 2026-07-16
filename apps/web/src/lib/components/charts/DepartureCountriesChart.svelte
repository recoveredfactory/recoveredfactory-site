<script lang="ts">
  import ddp from '$lib/data/ddp-chart-data.json';
  import type { Lang } from '$lib/i18n';
  import { BAR_COLOR, AXIS_TEXT, LABEL_TEXT, fmt, titleCase } from './chart-utils';

  const { lang = 'en' } = $props<{ lang?: Lang }>();

  const STRINGS = {
    en: {
      title: 'Where people deported after a Trump-era ICE arrest were sent',
      subtitle: 'Departures with a recorded destination, January 2025 – February 2026',
      departures: 'departures',
      table: 'View the data',
      country: 'Country',
      source: 'Data: Deportation Data Project, joined arrests–detention stays.',
    },
    es: {
      title: 'A dónde fueron enviadas las personas deportadas tras un arresto de ICE en la era Trump',
      subtitle: 'Salidas con destino registrado, enero 2025 – febrero 2026',
      departures: 'salidas',
      table: 'Ver los datos',
      country: 'País',
      source: 'Datos: Deportation Data Project, arrestos vinculados a estancias de detención.',
    },
  } as const;

  // Country display names; anything not listed falls back to title-cased English.
  const COUNTRY_ES: Record<string, string> = {
    MEXICO: 'México',
    GUATEMALA: 'Guatemala',
    HONDURAS: 'Honduras',
    VENEZUELA: 'Venezuela',
    'EL SALVADOR': 'El Salvador',
    ECUADOR: 'Ecuador',
    NICARAGUA: 'Nicaragua',
    COLOMBIA: 'Colombia',
  };

  const t = $derived(STRINGS[lang]);

  const countries = ddp.removal_signal.top_departure_countries;
  const max = Math.max(...countries.map((c) => c.n));

  const countryName = (name: string) =>
    lang === 'es' ? (COUNTRY_ES[name.toUpperCase()] ?? titleCase(name)) : titleCase(name);

  let width = $state(0);
  const rowH = 42;
  const barH = 18;

  let hover: number | null = $state(null);
</script>

<figure class="rf-chart my-8">
  <div class="font-display text-lg font-semibold leading-snug text-slate-800">{t.title}</div>
  <div class="mt-0.5 text-sm text-slate-500">{t.subtitle}</div>

  <div class="relative mt-3 max-w-md" bind:clientWidth={width}>
    {#if width > 0}
      <svg
        {width}
        height={countries.length * rowH}
        role="img"
        aria-label={t.title}
        onpointerleave={() => (hover = null)}
      >
        {#each countries as c, i}
          {@const barW = Math.max(2, (c.n / max) * (width - 76))}
          <g
            onpointerenter={() => (hover = i)}
            opacity={hover === null || hover === i ? 1 : 0.55}
          >
            <rect x="0" y={i * rowH} width={width} height={rowH} fill="transparent" />
            <text x="0" y={i * rowH + 12} font-size="12" fill={LABEL_TEXT}>
              {countryName(c.country)}
            </text>
            <rect x="0" y={i * rowH + 17} width={barW} height={barH} fill={BAR_COLOR} />
            <text
              x={barW + 7}
              y={i * rowH + 17 + barH / 2 + 4}
              font-size="11.5"
              fill={AXIS_TEXT}
            >
              {fmt(c.n)}
            </text>
          </g>
        {/each}
      </svg>
    {/if}
  </div>

  <details class="mt-2 text-xs text-slate-500">
    <summary class="cursor-pointer select-none">{t.table}</summary>
    <table class="mt-2 w-full text-left tabular-nums">
      <thead>
        <tr class="border-b border-slate-300 text-slate-600">
          <th class="py-1 pr-2 font-medium">{t.country}</th>
          <th class="py-1 font-medium">{t.departures}</th>
        </tr>
      </thead>
      <tbody>
        {#each countries as c}
          <tr class="border-b border-slate-200/70">
            <td class="py-0.5 pr-2">{countryName(c.country)}</td>
            <td class="py-0.5">{fmt(c.n)}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </details>

  <figcaption class="mt-1 text-xs text-slate-500">{t.source}</figcaption>
</figure>
