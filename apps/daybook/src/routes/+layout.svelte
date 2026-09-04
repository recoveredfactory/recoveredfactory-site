<script lang="ts">
  import '../app.css';
  import { dev } from '$app/environment';
  import { page } from '$app/stores';
  import { env } from '$env/dynamic/public';
  import { trackEvent } from '$lib/analytics';
  import { copy } from '$lib/copy';
  import type { Lang } from '$lib/i18n';
  import { feedPath, homePath } from '$lib/urls';

  let { children } = $props();

  // Every page under /[lang] returns its language and, when the same page
  // exists in the other one, where that is. The root redirect returns nothing
  // and never renders this far.
  const lang = $derived(($page.data.lang as Lang | undefined) ?? 'en');
  const other = $derived<Lang>(lang === 'en' ? 'es' : 'en');
  const switchTo = $derived(($page.data.switchTo as string | undefined) ?? homePath(other));
  const t = $derived(copy[lang].ui);
  const isPreview = dev || env.PUBLIC_STAGE !== 'prod';
</script>

<div class="flex min-h-dvh flex-col">
  {#if isPreview}
    <div class="bg-fire px-4 py-2 text-center font-semibold text-cream">Preview — do not share</div>
  {/if}

  <!-- The masthead: the name, and the other language. Nothing else — the ask
       is on the page, at size, where it belongs. -->
  <header class="border-b-2 border-ink bg-cream">
    <div class="mx-auto flex max-w-5xl items-baseline justify-between gap-6 px-5 py-4 sm:px-8">
      <a class="font-display text-[1.375em] font-semibold leading-none tracking-tight" href={homePath(lang)}>
        {t.siteName}
      </a>
      <a
        class="shrink-0 font-semibold underline decoration-ink/30 underline-offset-4 transition hover:decoration-fire"
        data-sveltekit-reload
        href={switchTo}
        onclick={() => trackEvent('language_switch', { from: lang, to: other, path: $page.url.pathname })}
        hreflang={other}
        lang={other}
      >
        {t.otherLang}
      </a>
    </div>
  </header>

  <div class="flex-1">
    {@render children()}
  </div>

  <footer class="border-t-2 border-ink bg-cream">
    <div class="db-links mx-auto flex max-w-5xl flex-col gap-4 px-5 py-8 sm:px-8">
      <p class="text-ink-soft">{@html t.footer.project}</p>
      <ul class="flex flex-wrap gap-x-6 gap-y-2 font-semibold">
        <li><a href="https://app.kit.com/users/login" rel="noopener" target="_blank">{t.footer.manage}</a></li>
        <li><a href={t.footer.contactHref}>{t.footer.contact}</a></li>
        <li><a href={feedPath(lang)}>{t.footer.rss}</a></li>
        <li><a data-sveltekit-reload href={switchTo} hreflang={other} lang={other}>{t.otherLang}</a></li>
      </ul>
    </div>
  </footer>
</div>
