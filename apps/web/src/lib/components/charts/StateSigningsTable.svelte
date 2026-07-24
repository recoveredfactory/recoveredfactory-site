<script lang="ts">
  import data from '$lib/data/287g-state-table-data.json';
  import type { Lang } from '$lib/i18n';
  import { fmt } from './chart-utils';

  const { lang = 'en' } = $props<{ lang?: Lang }>();

  const STRINGS = {
    en: {
      state: 'State',
      now: 'Agencies now',
      signed: 'Signed since April',
      pctSmall: '% of new signers under 10 officers',
      totalLabel: `${data.rows.length} states`,
      source:
        "Current agencies as of the July 21, 2026 roster snapshot. “Signed since April” counts agencies whose signing date is on or after April 1, 2026 (July is partial, through the snapshot). Each “% under 10 officers” is the share of that state’s new signers (the adjacent column) with fewer than ten sworn officers in the FBI’s Law Enforcement Employees data; agencies not yet matched to that file aren’t counted as small, so the shares are floors — among only the new signers whose staffing is known, the share is closer to half. These states hold 1,804 of the 1,846 agencies nationwide.",
    },
    es: {
      state: 'Estado',
      now: 'Agencias ahora',
      signed: 'Firmaron desde abril',
      pctSmall: '% de nuevas agencias con menos de 10 oficiales',
      totalLabel: `${data.rows.length} estados`,
      source:
        'Agencias actuales según la instantánea del registro del 21 de julio de 2026. «Firmaron desde abril» cuenta las agencias cuya fecha de firma es a partir del 1 de abril de 2026 (julio es parcial, hasta la instantánea). Cada «% con menos de 10 oficiales» es la proporción de las nuevas agencias de ese estado (la columna contigua) con menos de diez oficiales juramentados según los datos de Law Enforcement Employees del FBI; las agencias aún no vinculadas a ese archivo no se cuentan como pequeñas, así que las proporciones son mínimos — entre las nuevas agencias con dotación conocida, la proporción se acerca a la mitad. Estos estados concentran 1.804 de las 1.846 agencias del país.',
    },
  } as const;

  const t = $derived(STRINGS[lang]);
  const stateHref = (abbr: string) =>
    `https://287g.recoveredfactory.net/${lang}/state/${abbr.toLowerCase()}`;
  const pctLabel = (small: number, denom: number) =>
    `${denom > 0 ? Math.round((100 * small) / denom) : 0}% (${small})`;
</script>

<figure class="rf-chart my-8">
  <div class="overflow-hidden rounded-lg border border-slate-300 shadow-sm">
    <div class="max-h-[65vh] overflow-y-auto [scrollbar-gutter:stable] sm:max-h-[28rem]">
      <table class="w-full border-collapse text-left text-sm tabular-nums">
      <thead>
        <tr class="text-xs text-slate-600">
          <th class="sticky top-0 z-10 bg-cream px-4 py-2.5 font-semibold shadow-[inset_0_-1px_0_#cbd5e1]">{t.state}</th>
          <th class="sticky top-0 z-10 bg-cream px-4 py-2.5 text-right font-semibold shadow-[inset_0_-1px_0_#cbd5e1]">{t.now}</th>
          <th class="sticky top-0 z-10 bg-cream px-4 py-2.5 text-right font-semibold shadow-[inset_0_-1px_0_#cbd5e1]">{t.signed}</th>
          <th class="sticky top-0 z-10 bg-cream px-4 py-2.5 text-right font-semibold shadow-[inset_0_-1px_0_#cbd5e1]">{t.pctSmall}</th>
        </tr>
      </thead>
      <tbody>
        {#each data.rows as row}
          <tr class="border-t border-slate-200/70">
            <td class="px-4 py-1.5">
              <a
                class="text-link transition hover:text-link/80 hover:underline"
                href={stateHref(row.abbr)}
                rel="noopener noreferrer"
                target="_blank"
              >
                {row.name}
              </a>
            </td>
            <td class="px-4 py-1.5 text-right">{fmt(row.now)}</td>
            <td class="px-4 py-1.5 text-right">{fmt(row.since)}</td>
            <td class="px-4 py-1.5 text-right">{pctLabel(row.small, row.since)}</td>
          </tr>
        {/each}
      </tbody>
      <tfoot>
        <tr class="text-xs font-semibold text-slate-800">
          <td class="sticky bottom-0 z-10 bg-cream px-4 py-2.5 shadow-[inset_0_2px_0_#cbd5e1]">
            {t.totalLabel}
          </td>
          <td class="sticky bottom-0 z-10 bg-cream px-4 py-2.5 text-right shadow-[inset_0_2px_0_#cbd5e1]">
            {fmt(data.totals.now)}
          </td>
          <td class="sticky bottom-0 z-10 bg-cream px-4 py-2.5 text-right shadow-[inset_0_2px_0_#cbd5e1]">
            {fmt(data.totals.since)}
          </td>
          <td class="sticky bottom-0 z-10 bg-cream px-4 py-2.5 text-right shadow-[inset_0_2px_0_#cbd5e1]">
            {pctLabel(data.totals.small, data.totals.since)}
          </td>
        </tr>
      </tfoot>
      </table>
    </div>
  </div>
  <figcaption class="mt-1 text-xs text-slate-500">{t.source}</figcaption>
</figure>

<style>
  /* This is a custom scroll-box table dropped into the post's `.dropcap-prose`,
     whose book-style table rules (in app.css) fight it: heavy 2px dark top/bottom
     borders that peek past the scroll box at the scroll extremities, and a
     forced padding-left/right of 0 on the first/last cell. Those rules outrank
     the utility classes, so neutralize exactly them here (the wrapper supplies
     the frame; the utilities supply the cell padding and row rules). */
  :global(.dropcap-prose .rf-chart table) {
    border-top: 0;
    border-bottom: 0;
  }
  :global(.dropcap-prose .rf-chart :is(th, td)) {
    padding-left: 1rem;
    padding-right: 1rem;
  }
  :global(.dropcap-prose .rf-chart :is(th, td):last-child) {
    padding-right: 1rem;
  }
</style>
