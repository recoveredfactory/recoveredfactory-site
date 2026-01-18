<script lang="ts">
  import { trackEvent } from '$lib/analytics';
  import { SUPPORT_CONTACT_URL, SUPPORT_LINKS } from '$lib/support';
  import { m } from '$lib/paraglide/messages';

  type SupportOptionsProps = {
    source?: string;
    variant?: 'modal' | 'inline' | 'page';
  };

  const { source = 'modal', variant = 'modal' } = $props<SupportOptionsProps>();

  const options = [
    {
      id: 'monthly_12',
      label: m.support_option_monthly_12(),
      perk: m.support_perk_monthly_12(),
      href: SUPPORT_LINKS.monthly12,
    },
    {
      id: 'monthly_75',
      label: m.support_option_monthly_75(),
      perk: m.support_perk_monthly_75(),
      href: SUPPORT_LINKS.monthly75,
    },
    {
      id: 'one_time',
      label: m.support_option_once(),
      perk: m.support_perk_once(),
      href: SUPPORT_LINKS.oneTime,
    },
  ];

  const isInline = variant === 'inline';
  const isPage = variant === 'page';

  const handleClick = (id: string) => {
    trackEvent('support_click', { level: id, source });
  };
</script>

<div class="space-y-6">
  {#if isInline || variant === 'modal'}
    <div class="space-y-2 text-center">
      <h2 class="font-display text-xl font-semibold text-slate-900 sm:text-2xl">
        {m.support_prompt()}
      </h2>
      {#if variant === 'modal'}
        <p class="text-sm text-slate-600">{m.support_subtitle()}</p>
      {/if}
    </div>
  {:else}
    <div class="space-y-2 text-center">
      <h2 class="font-display text-3xl font-semibold text-slate-900 sm:text-4xl">
        {m.support_title()}
      </h2>
      <p class="text-sm text-slate-600">{m.support_subtitle()}</p>
    </div>
  {/if}

  <div class={`grid gap-3 ${isInline ? 'sm:grid-cols-3' : 'sm:grid-cols-3'}`}>
    {#each options as option}
      <a
        class="rounded border border-slate-900/10 bg-white px-4 py-4 text-center transition hover:border-slate-900/30 hover:bg-white/90"
        href={option.href}
        onclick={() => handleClick(option.id)}
        rel="noopener noreferrer"
        target="_blank"
      >
        <p
          class={`text-sm font-semibold uppercase tracking-[0.2em] text-slate-900 ${
            isInline ? 'text-[0.7rem]' : ''
          }`}
        >
          {option.label}
        </p>
        <p class="mt-2 text-xs text-slate-600">{option.perk}</p>
      </a>
    {/each}
  </div>

  {#if SUPPORT_CONTACT_URL}
    <p class={`text-sm text-slate-600 ${isPage ? 'text-center' : 'text-center'}`}>
      <a
        class="font-semibold text-link transition hover:text-link/80"
        href={SUPPORT_CONTACT_URL}
        onclick={() => handleClick('institutional')}
      >
        {m.support_institutional()}
      </a>
    </p>
  {/if}
</div>
