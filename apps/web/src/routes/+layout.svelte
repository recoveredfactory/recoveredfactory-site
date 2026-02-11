<script lang="ts">
  import '../app.css';
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { trackEvent } from '$lib/analytics';
  import { getResizedImageUrl } from '$lib/images';
  import { m } from '$lib/paraglide/messages';
  import { deLocalizeHref, getLocale, localizeHref } from '$lib/paraglide/runtime';
  import { getEntry, findTranslationSlug } from '$lib/blog/loader';
  import type { Lang } from '$lib/i18n';
  import { fly } from 'svelte/transition';

  let { children } = $props();

  let menuOpen = $state(false);
  let headerHeight = $state(0);

  const ensureLocalePrefix = (href: string, locale: Lang) => {
    if (!href.startsWith('/')) return href;
    const url = new URL(href, 'https://example.com');
    const path = url.pathname;
    if (path.startsWith(`/${locale}/`) || path === `/${locale}`) {
      return `${path}${url.search}${url.hash}`;
    }
    if (path.startsWith('/en/') || path.startsWith('/es/')) {
      return `${path}${url.search}${url.hash}`;
    }
    const suffix = path === '/' ? '' : path;
    return `/${locale}${suffix}${url.search}${url.hash}`;
  };

  const localizeWithPrefix = (href: string, locale: Lang) =>
    ensureLocalePrefix(localizeHref(href, { locale }), locale);

  const currentLocale = $derived((() => {
    const match = $page.url.pathname.match(/^\/(en|es)(?=\/|$)/);
    if (match) return match[1] as Lang;
    return getLocale() as Lang;
  })());
  const homeHref = $derived(localizeWithPrefix('/', currentLocale));
  const supportHref = $derived(`/${currentLocale}/support`);
  const signupHref = $derived(`${homeHref}#signup`);
  const manageHref = 'https://app.kit.com/users/login';
  const currentYear = new Date().getFullYear();
  const scrollMarks = [25, 50, 75, 100];
  const projects = [
    {
      name: 'Annual Survey of Public Employment and Payroll Explorer',
      url: 'https://aspep.grupovisual.org',
    },
    {
      name: 'Missouri Vehicle Stops',
      url: 'https://vsr.recoveredfactory.net',
    },
    {
      name: 'Lunalimón',
      url: 'https://lunalimon.co.com',
    },
  ];

  let lastPath = $state('');
  let seenScrollMarks = $state(new Set<number>());
  let scrollTicking = $state(false);

  const getScrollPercent = () => {
    if (typeof window === 'undefined') return 0;
    const doc = document.documentElement;
    const scrollTop = window.scrollY + window.innerHeight;
    const scrollHeight = Math.max(doc.scrollHeight, window.innerHeight);
    return Math.min(100, Math.round((scrollTop / scrollHeight) * 100));
  };

  const trackScrollDepth = () => {
    if (typeof window === 'undefined') return;
    const percent = getScrollPercent();
    scrollMarks.forEach((mark) => {
      if (percent >= mark && !seenScrollMarks.has(mark)) {
        seenScrollMarks.add(mark);
        trackEvent('scroll_depth', { percent: mark, path: lastPath });
      }
    });
  };

  const onScroll = () => {
    if (scrollTicking) return;
    scrollTicking = true;
    requestAnimationFrame(() => {
      scrollTicking = false;
      trackScrollDepth();
    });
  };

  const toggleMenu = () => {
    menuOpen = !menuOpen;
    trackEvent(menuOpen ? 'menu_open' : 'menu_close', { path: $page.url.pathname });
  };

  const closeMenu = (source?: string) => {
    if (!menuOpen) return;
    menuOpen = false;
    trackEvent('menu_close', { path: $page.url.pathname, source });
  };

  const trackLanguageSwitch = (locale: string, source: string) => {
    trackEvent('language_switch', {
      from: currentLocale,
      to: locale,
      source,
      path: $page.url.pathname,
    });
  };

  const getLocaleHref = (locale: Lang) => {
    const pathWithoutLang = $page.url.pathname.replace(/^\/(en|es)(?=\/|$)/, '');
    const basePath = deLocalizeHref(pathWithoutLang);
    if (locale === currentLocale) {
      return localizeWithPrefix(basePath || '/', locale);
    }
    const rootMatch = basePath.match(/^\/([^/]+)$/);
    if (rootMatch) {
      const slug = rootMatch[1];
      const staticRoutes = new Set(['support', 'posts', 'rss.xml']);
      if (!staticRoutes.has(slug)) {
        const entry = getEntry(currentLocale, slug);
        if (entry) {
          const translatedSlug = findTranslationSlug(currentLocale, slug, locale);
          if (translatedSlug) {
            return localizeWithPrefix(`/${translatedSlug}`, locale);
          }
        }
        return localizeWithPrefix('/', locale);
      }
    }
    return localizeWithPrefix(basePath || '/', locale);
  };

  $effect(() => {
    if (typeof window === 'undefined') return;
    const path = $page.url.pathname;
    if (path !== lastPath) {
      lastPath = path;
      seenScrollMarks = new Set();
      requestAnimationFrame(trackScrollDepth);
    }
  });

  onMount(() => {
    lastPath = $page.url.pathname;
    seenScrollMarks = new Set();
    trackScrollDepth();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
    };
  });
</script>

<div class="min-h-dvh">
  <header
    bind:clientHeight={headerHeight}
    class="sticky top-0 z-40 border-b border-slate-900/10 bg-cream/80 backdrop-blur-md supports-[backdrop-filter]:bg-cream/70"
  >
    <div class="mx-auto flex max-w-6xl items-center px-6 py-3 sm:py-4 sm:px-10 lg:px-16">
      <a aria-label={m.site_name()} class="text-slate-900" href={homeHref}>
        <img
          alt={m.site_name()}
          class="h-auto w-54 max-w-full sm:w-64"
          loading="eager"
          src={getResizedImageUrl('/images/site-logo-002.png', { width: 320 })}
        />
        <span class="sr-only">{m.site_name()}</span>
      </a>
      <div class="ml-auto flex items-center gap-3">
        <a
          class="hidden bg-fern-strong px-2.5 py-2 text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-fern md:inline-flex"
          href={signupHref}
        >
          {m.nav_subscribe()}
        </a>
        <a
          class="hidden bg-donate px-2.5 py-2 text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-donate/90 md:inline-flex"
          href={supportHref}
        >
          {m.nav_donate()}
        </a>
        <button
          aria-controls="site-menu"
          aria-expanded={menuOpen}
          aria-label={menuOpen ? m.nav_menu_close_aria() : m.nav_menu_open_aria()}
          class="inline-flex h-10 w-10 items-center justify-center border border-slate-900/10 text-slate-700 transition hover:border-slate-900/40 hover:text-slate-900"
          onclick={toggleMenu}
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
          <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-3">
            <a
              class="inline-flex items-center justify-center bg-fern-strong px-4 py-3 text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-fern sm:text-sm"
              href={signupHref}
              onclick={() => closeMenu('nav')}
            >
              {m.nav_subscribe()}
            </a>
            <a
              class="inline-flex items-center justify-center bg-donate px-4 py-3 text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-donate/90 sm:text-sm"
              href={supportHref}
              onclick={() => closeMenu('nav')}
            >
              {m.nav_donate()}
            </a>
          </div>

          <div class="grid gap-0 border-t border-slate-900/10 pt-0 text-sm divide-y divide-slate-900/10 sm:grid-cols-2 sm:gap-8 sm:divide-y-0 sm:pt-8">
            <div class="space-y-3 py-6 sm:py-0">
              <p class="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                {m.menu_about_title()}
              </p>
              <p class="text-sm text-slate-600 [&_a]:text-link [&_a:hover]:text-link/80">
                {@html m.menu_about_blurb()}
              </p>
              <p class="text-sm text-slate-600">
                Logo by <a
                  class="text-link transition hover:text-link/80"
                  href="https://www.instagram.com/suku_mix/"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  @suku_mix
                </a>.
              </p>
            </div>
            <div class="space-y-3 py-6 sm:py-0">
              <p class="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                {m.menu_projects_title()}
              </p>
              <div class="space-y-3">
                {#each projects as project}
                  <a
                    class="block space-y-1 transition hover:text-slate-900"
                    href={project.url}
                    onclick={() => closeMenu('nav')}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    <p class="text-sm font-semibold text-slate-900">{project.name}</p>
                    <p class="text-xs text-slate-500">{project.url}</p>
                  </a>
                {/each}
              </div>
            </div>
            <div class="space-y-3 py-6 sm:py-0">
              <p class="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                {m.menu_members_title()}
              </p>
              <div class="flex flex-col gap-2 text-sm font-semibold uppercase tracking-[0.25em] text-slate-700">
                <a
                  class="transition hover:text-slate-900"
                  href={manageHref}
                  onclick={() => closeMenu('nav')}
                >
                  {m.menu_manage_subscription()}
                </a>
              </div>
            </div>
            <div class="space-y-3 py-6 sm:py-0">
              <p class="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                {m.menu_language_title()}
              </p>
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
                  onclick={() => {
                    trackLanguageSwitch('en', 'menu');
                    closeMenu('language');
                  }}
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
                  onclick={() => {
                    trackLanguageSwitch('es', 'menu');
                    closeMenu('language');
                  }}
                >
                  {m.locale_es_short()}
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    {/if}

  </header>

  {@render children()}

  <footer class="border-t border-slate-900/10 bg-cream/80">
    <div class="mx-auto flex max-w-6xl flex-col gap-3 px-6 py-8 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:px-10 lg:px-16">
      <p>{m.footer_copyright({ year: currentYear, name: m.site_name() })}</p>
      <p class="text-slate-500 [&_a]:text-link [&_a:hover]:text-link/80">
        {@html m.footer_lettering_credit()}
      </p>
    </div>
  </footer>
</div>
