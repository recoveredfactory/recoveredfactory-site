<script lang="ts">
  import { trackEvent } from '$lib/analytics';
  import { SUPPORT_CONTACT_URL, SUPPORT_LINKS } from '$lib/support';
  import { m } from '$lib/paraglide/messages';

  type SupportOptionsProps = {
    source?: string;
    variant?: 'modal' | 'inline' | 'page';
    prefillEmail?: string;
  };

  const { source = 'modal', variant = 'modal', prefillEmail } = $props<SupportOptionsProps>();

  const options = [
    {
      id: 'monthly_12',
      label: m.support_option_monthly_12(),
      price: m.support_price_monthly_12(),
      perk: m.support_perk_monthly_12(),
      href: SUPPORT_LINKS.monthly12,
    },
    {
      id: 'monthly_75',
      label: m.support_option_monthly_75(),
      price: m.support_price_monthly_75(),
      perk: m.support_perk_monthly_75(),
      href: SUPPORT_LINKS.monthly75,
    },
    {
      id: 'one_time',
      label: m.support_option_once(),
      price: m.support_price_once(),
      perk: m.support_perk_once(),
      href: SUPPORT_LINKS.oneTime,
    },
  ];

  const isInline = $derived(variant === 'inline');
  const isPage = $derived(variant === 'page');

  const buildSupportHref = (href: string) => {
    const trimmed = prefillEmail?.trim();
    if (!trimmed) return href;
    try {
      const url = new URL(href);
      url.searchParams.set('prefilled_email', trimmed);
      return url.toString();
    } catch {
      return href;
    }
  };

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

  <div class={`grid gap-4 ${isInline ? 'sm:grid-cols-3' : 'sm:grid-cols-3'}`}>
    {#each options as option}
      <a
        class="rounded border border-slate-900/10 bg-white px-6 py-6 text-center transition hover:border-slate-900/30 hover:bg-white/90"
        href={buildSupportHref(option.href)}
        onclick={() => handleClick(option.id)}
        rel="noopener noreferrer"
        target="_blank"
      >
        <p class="min-h-[3rem] font-display text-lg font-semibold leading-snug text-slate-900 sm:min-h-[3.5rem] sm:text-xl">
          {option.label}
        </p>
        {#if option.price}
          <p class="mt-0.5 text-base font-semibold text-slate-800 sm:mt-1">{option.price}</p>
        {/if}
        <p class="mt-3 text-sm text-slate-600">{option.perk}</p>
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
