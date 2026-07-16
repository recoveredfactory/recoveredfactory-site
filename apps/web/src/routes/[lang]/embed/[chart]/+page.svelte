<script lang="ts">
  import { page } from '$app/stores';
  import type { Lang } from '$lib/i18n';
  import ArrestVolumeChart from '$lib/components/charts/ArrestVolumeChart.svelte';
  import DepartureCountriesChart from '$lib/components/charts/DepartureCountriesChart.svelte';
  import StayLengthChart from '$lib/components/charts/StayLengthChart.svelte';

  // Bare chart pages for newsletter/social screenshots (see scripts/ddp/screenshot.mjs).
  const CHARTS = {
    'ddp-arrest-volume': ArrestVolumeChart,
    'ddp-departure-countries': DepartureCountriesChart,
    'ddp-stay-length': StayLengthChart,
  } as const;

  const lang = $derived(($page.params.lang === 'es' ? 'es' : 'en') as Lang);
  const Chart = $derived(CHARTS[$page.params.chart as keyof typeof CHARTS]);
</script>

<svelte:head>
  <meta name="robots" content="noindex" />
</svelte:head>

<div class="mx-auto max-w-2xl px-5 py-2" data-embed-chart>
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
</style>
