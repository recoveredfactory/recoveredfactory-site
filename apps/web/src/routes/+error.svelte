<script lang="ts">
  import { m } from '$lib/paraglide/messages';

  const { status, error } = $props();

  const headline = $derived(status === 404 ? m.post_not_found() : m.subscribe_error());
  const details = $derived(error?.message || '');
</script>

<main class="min-h-dvh px-6 py-12 sm:px-10 lg:px-16">
  <div class="mx-auto max-w-2xl space-y-3 text-slate-700">
    <p class="text-xs uppercase tracking-[0.2em] text-slate-500">Error {status}</p>
    <h1 class="font-display text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
      {headline}
    </h1>
    {#if details}
      <p class="text-sm text-slate-600">{details}</p>
    {/if}
  </div>
</main>
