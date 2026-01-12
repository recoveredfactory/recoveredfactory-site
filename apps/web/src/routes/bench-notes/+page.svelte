<script lang="ts">
  import { m } from '$lib/paraglide/messages';

  const { data } = $props();
</script>

<svelte:head>
  <title>{m.bench_title()}</title>
</svelte:head>

<main class="min-h-dvh px-6 py-12 sm:px-10 lg:px-16">
  <div class="mx-auto max-w-3xl border border-slate-900/10 bg-white/80 p-8 shadow-sm">
    <div class="space-y-3">
      <p class="text-xs uppercase tracking-[0.35em] text-slate-500">
        {m.members_label()}
      </p>
      <h1 class="font-display text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
        {m.bench_title()}
      </h1>
      <p class="text-sm text-slate-600">{m.bench_subtitle()}</p>
      {#if data.member?.email}
        <p class="text-sm text-slate-600">
          {m.bench_signed_in({ email: data.member.email })}
        </p>
      {/if}
    </div>
  </div>
</main>
