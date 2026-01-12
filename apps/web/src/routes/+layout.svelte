<script lang="ts">
  import '../app.css';
  import { m } from '$lib/paraglide/messages';
  import { localizeHref } from '$lib/paraglide/runtime';

  let { children } = $props();

  const homeHref = localizeHref('/');
  const enHref = localizeHref('/', { locale: 'en' });
  const esHref = localizeHref('/', { locale: 'es' });
</script>

<div class="min-h-dvh">
  <header class="border-b border-slate-900/10 bg-cream/80">
    <div
      class="mx-auto flex max-w-5xl items-center justify-between px-6 py-5 sm:px-10"
    >
      <a
        class="font-display text-2xl font-semibold tracking-tight text-slate-900"
        href={homeHref}
      >
        {m.site_name()}
      </a>
      <nav class="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-slate-600">
        <a
          aria-label={m.locale_en_aria()}
          class="border border-slate-900/10 bg-white/70 px-3 py-1 text-[0.65rem] font-semibold text-slate-700 shadow-sm transition hover:bg-white hover:text-slate-900"
          href={enHref}
        >
          {m.locale_en_short()}
        </a>
        <a
          aria-label={m.locale_es_aria()}
          class="border border-slate-900/10 bg-white/70 px-3 py-1 text-[0.65rem] font-semibold text-slate-700 shadow-sm transition hover:bg-white hover:text-slate-900"
          href={esHref}
        >
          {m.locale_es_short()}
        </a>
      </nav>
    </div>
  </header>

  {@render children()}
</div>
