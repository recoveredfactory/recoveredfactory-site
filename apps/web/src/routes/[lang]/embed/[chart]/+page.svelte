<script lang="ts">
  import { page } from '$app/stores';
  import type { Lang } from '$lib/i18n';
  import ArrestVolumeChart from '$lib/components/charts/ArrestVolumeChart.svelte';
  import DepartureCountriesChart from '$lib/components/charts/DepartureCountriesChart.svelte';
  import StayLengthChart from '$lib/components/charts/StayLengthChart.svelte';
  import SigningsChart from '$lib/components/charts/SigningsChart.svelte';
  import StateSigningsTable from '$lib/components/charts/StateSigningsTable.svelte';

  // Bare chart pages for newsletter/social screenshots (see scripts/*/screenshot.mjs).
  const CHARTS = {
    'ddp-arrest-volume': ArrestVolumeChart,
    'ddp-departure-countries': DepartureCountriesChart,
    'ddp-stay-length': StayLengthChart,
    '287g-signings': SigningsChart,
    '287g-state-table': StateSigningsTable,
  } as const;

  // Charts that shoot as a capped "preview" — the newsletter image is a teaser
  // that links out to the live, scrollable version (the state table is too long
  // to ship whole in an email).
  const PREVIEW_CHARTS = new Set(['287g-state-table']);

  const lang = $derived(($page.params.lang === 'es' ? 'es' : 'en') as Lang);
  const Chart = $derived(CHARTS[$page.params.chart as keyof typeof CHARTS]);
  const isPreview = $derived(PREVIEW_CHARTS.has($page.params.chart));
</script>

<svelte:head>
  <meta name="robots" content="noindex" />
</svelte:head>

<div class="mx-auto max-w-2xl px-5 py-2" data-embed-chart data-embed-preview={isPreview ? '' : undefined}>
  {#if Chart}
    <Chart {lang} />
  {:else}
    <p class="py-8 text-sm text-slate-500">
      Unknown chart. Available: {Object.keys(CHARTS).join(', ')}
    </p>
  {/if}
</div>

<style>
  /* The data-table toggle is for readers, not screenshots. */
  :global([data-embed-chart] details) {
    display: none;
  }

  /* Preview shots cap the scroll box to a few rows; the sticky header and totals
     footer stay, so the teaser reads as "top movers + total, see the rest." */
  :global([data-embed-preview] .rf-chart .overflow-y-auto) {
    max-height: 380px !important;
  }
</style>
