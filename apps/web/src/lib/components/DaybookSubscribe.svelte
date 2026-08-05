<script lang="ts">
  /**
   * The subscribe ask on the Daybook archive pages.
   *
   * Deliberately tight — one line of terms and a single row of input and
   * button. It runs at the top and the bottom of every archive page, so it has
   * to be small enough that seeing it twice is not an imposition, and it sits
   * around an edition rather than in front of it.
   *
   * It carries the Daybook tag rather than the house list, which is the reason
   * the nav's own sign-up button is suppressed on these paths: two asks going
   * to two different lists on one page is a way to lose both.
   */
  import SubscribeForm from '$lib/components/SubscribeForm.svelte';
  import type { Lang } from '$lib/i18n';

  type DaybookSubscribeProps = {
    lang: Lang;
    /** Rides along on the signup event so the two slots can be told apart. */
    placement: 'archive-top' | 'archive-bottom';
  };

  let { lang, placement }: DaybookSubscribeProps = $props();

  const es = $derived(lang === 'es');
  // The terms, not a pitch — the reader is already looking at the thing. Same
  // three facts the landing page hero states.
  const terms = $derived(
    es
      ? 'De lunes a viernes, en español e inglés. Gratis en agosto.'
      : 'Every weekday, in English and Spanish. Free in August.',
  );
</script>

<section class="not-prose border-y border-slate-900/10 py-4">
  <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
    <p class="text-sm text-slate-600 sm:flex-1">{terms}</p>
    <SubscribeForm
      buttonClass="bg-fern-strong px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-fern sm:shrink-0"
      id={`daybook-${placement}`}
      inputClass="w-full border border-slate-900/15 bg-white px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 sm:w-64 sm:flex-none"
      {lang}
      layoutClass="flex flex-col gap-2 sm:flex-row sm:items-stretch sm:gap-2"
      meta={{ placement }}
      source="daybook-archive"
      successClass="mt-3 border border-slate-900/10 bg-white/70 p-4 text-center text-sm"
      tag="newsletter:immigration-daybook"
    />
  </div>
</section>
