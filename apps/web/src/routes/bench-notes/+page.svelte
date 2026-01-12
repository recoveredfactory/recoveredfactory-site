<script lang="ts">
  const { data } = $props();
</script>

<svelte:head>
  <title>Bench Notes</title>
</svelte:head>

<main class="min-h-dvh px-6 py-12 sm:px-10 lg:px-16">
  <div class="mx-auto max-w-3xl rounded-2xl border border-slate-900/10 bg-white/80 p-8 shadow-sm">
    <div class="space-y-3">
      <p class="text-xs uppercase tracking-[0.35em] text-slate-500">Members</p>
      <h1 class="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
        Bench Notes
      </h1>
      <p class="text-sm text-slate-600">Paid member access confirmed.</p>
      {#if data.member?.email}
        <p class="text-sm text-slate-600">Signed in as {data.member.email}.</p>
      {/if}
    </div>
  </div>
</main>
