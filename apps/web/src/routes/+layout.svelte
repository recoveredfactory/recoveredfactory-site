<script lang="ts">
  import '../app.css';
  import { page } from '$app/stores';
  import { getResizedImageUrl } from '$lib/images';
  import { m } from '$lib/paraglide/messages';
  import { deLocalizeHref, getLocale, localizeHref } from '$lib/paraglide/runtime';
  import { getCrosswalkEntry, type CrosswalkLocale } from '$lib/postCrosswalk';
  import { fly } from 'svelte/transition';

  let { children } = $props();

  let menuOpen = $state(false);
  let headerHeight = $state(0);

  const homeHref = localizeHref('/');
  const donateHref = localizeHref('/donate');
  const subscribeHref = `${homeHref}#subscribe`;
  const signInHref = localizeHref('/signin');
  const manageHref = localizeHref('/manage');
  const currentLocale = getLocale();
  const currentYear = new Date().getFullYear();

  const getLocaleHref = (locale: CrosswalkLocale) => {
    const pathWithoutLang = $page.url.pathname.replace(/^\/(en|es)(?=\/|$)/, '');
    const basePath = deLocalizeHref(pathWithoutLang);
    const writingMatch = basePath.match(/^\/writing\/([^/]+)$/);
    if (writingMatch) {
      const entry = getCrosswalkEntry(writingMatch[1]);
      if (entry) {
        return localizeHref(`/writing/${entry[locale]}`, { locale });
      }
      return localizeHref('/', { locale });
    }
    return localizeHref(basePath || '/', { locale });
  };
</script>

<div class="min-h-dvh">
  <header
    bind:clientHeight={headerHeight}
    class="sticky top-0 z-40 border-b border-slate-900/10 bg-cream/80 backdrop-blur-md supports-[backdrop-filter]:bg-cream/70"
  >
    <div
      class="relative mx-auto flex max-w-6xl items-center px-6 pt-2 pb-1 sm:px-10 lg:px-16"
    >
      <div class="hidden items-center md:flex">
        <a
          class="border border-fern-strong/40 bg-fern-soft/70 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-fern-strong transition hover:border-fern-strong hover:bg-fern-soft"
          href={subscribeHref}
        >
          {m.nav_subscribe()}
        </a>
      </div>
      <a
        aria-label={m.site_name()}
        class="absolute left-1/2 -translate-x-1/2 text-slate-900"
        href={homeHref}
      >
        <img
          alt={m.site_name()}
          class="h-auto w-44 max-w-full sm:w-56"
          loading="eager"
          src={getResizedImageUrl('/images/site-logo-001.png', { width: 448 })}
        />
        <span class="sr-only">{m.site_name()}</span>
      </a>
      <div class="ml-auto flex items-center gap-3">
        <nav class="hidden items-center gap-6 text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-slate-600 lg:flex">
          <a class="transition hover:text-slate-900" href={donateHref}>
            {m.nav_donate()}
          </a>
        </nav>
        <button
          aria-controls="site-menu"
          aria-expanded={menuOpen}
          aria-label={menuOpen ? m.nav_menu_close_aria() : m.nav_menu_open_aria()}
          class="inline-flex h-10 w-10 items-center justify-center border border-slate-900/10 text-slate-700 transition hover:border-slate-900/40 hover:text-slate-900"
          onclick={() => (menuOpen = !menuOpen)}
          type="button"
        >
          <span class="sr-only">
            {menuOpen ? m.nav_menu_close_aria() : m.nav_menu_open_aria()}
          </span>
          <span class="relative h-4 w-5">
            <span
              class={`absolute left-0 top-0 h-0.5 w-5 origin-center bg-current transition duration-200 ${
                menuOpen ? 'translate-y-1.5 rotate-45' : ''
              }`}
            ></span>
            <span
              class={`absolute left-0 top-1.5 h-0.5 w-5 bg-current transition duration-200 ${
                menuOpen ? 'opacity-0' : 'opacity-100'
              }`}
            ></span>
            <span
              class={`absolute left-0 top-3 h-0.5 w-5 origin-center bg-current transition duration-200 ${
                menuOpen ? '-translate-y-1.5 -rotate-45' : ''
              }`}
            ></span>
          </span>
        </button>
      </div>
    </div>
    {#if menuOpen}
      <div
        class="fixed inset-x-0 z-50 overflow-y-auto border-t border-slate-900/10 bg-cream text-slate-900"
        id="site-menu"
        style={`top: ${headerHeight}px; height: calc(100dvh - ${headerHeight}px);`}
        transition:fly={{ y: -12, duration: 220 }}
      >
        <div class="mx-auto flex min-h-full max-w-6xl flex-col gap-12 px-6 py-10 sm:px-10 lg:px-16">
          <div class="flex flex-col gap-6 text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
            <a
              class="font-display transition hover:text-slate-600"
              href={donateHref}
              onclick={() => (menuOpen = false)}
            >
              {m.nav_donate()}
            </a>
            <a
              class="font-display text-fern-strong transition hover:text-fern"
              href={subscribeHref}
              onclick={() => (menuOpen = false)}
            >
              {m.nav_subscribe()}
            </a>
          </div>

          <div class="grid gap-8 border-t border-slate-900/10 pt-8 text-sm sm:grid-cols-2">
            <div class="space-y-3">
              <p class="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                {m.menu_members_title()}
              </p>
              <div class="flex flex-col gap-2 text-sm font-semibold uppercase tracking-[0.25em] text-slate-700">
                <a
                  class="transition hover:text-slate-900"
                  href={signInHref}
                  onclick={() => (menuOpen = false)}
                >
                  {m.nav_signin()}
                </a>
                <a
                  class="transition hover:text-slate-900"
                  href={manageHref}
                  onclick={() => (menuOpen = false)}
                >
                  {m.menu_manage_subscription()}
                </a>
              </div>
            </div>
            <div class="space-y-3">
              <p class="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                {m.menu_about_title()}
              </p>
              <p class="text-sm text-slate-600">{m.menu_about_blurb()}</p>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <a
              aria-label={m.locale_en_aria()}
              class={`border px-3 py-2 text-xs font-semibold uppercase tracking-[0.3em] transition hover:text-slate-900 ${
                currentLocale === 'en'
                  ? 'border-slate-900/40 text-slate-900'
                  : 'border-slate-900/15 text-slate-500'
              }`}
              data-sveltekit-reload
              href={getLocaleHref('en')}
              onclick={() => (menuOpen = false)}
            >
              {m.locale_en_short()}
            </a>
            <a
              aria-label={m.locale_es_aria()}
              class={`border px-3 py-2 text-xs font-semibold uppercase tracking-[0.3em] transition hover:text-slate-900 ${
                currentLocale === 'es'
                  ? 'border-slate-900/40 text-slate-900'
                  : 'border-slate-900/15 text-slate-500'
              }`}
              data-sveltekit-reload
              href={getLocaleHref('es')}
              onclick={() => (menuOpen = false)}
            >
              {m.locale_es_short()}
            </a>
          </div>
        </div>
      </div>
    {/if}
  </header>

  {@render children()}

  <footer class="border-t border-slate-900/10 bg-cream/80">
    <div class="mx-auto flex max-w-6xl flex-col gap-3 px-6 py-8 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:px-10 lg:px-16">
      <p>{m.footer_copyright({ year: currentYear, name: m.site_name() })}</p>
      <p>{m.footer_lettering_credit()}</p>
    </div>
  </footer>
</div>
