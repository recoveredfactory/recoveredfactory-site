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
    placement: 'archive-top' | 'archive-bottom' | 'edition-mid';
  };

  let { lang, placement }: DaybookSubscribeProps = $props();

  const es = $derived(lang === 'es');
  // What the thing is, then the terms. The same sentence the dossier decks
  // close on and the ads run — a reader who arrives from one of those should
  // meet the words they were promised, not a paraphrase.
  // Split so the offer can carry weight the description does not. Emphasis is
  // the one way to make this louder that costs no height, which is the whole
  // constraint: the ask runs twice on every archive page and sits above the
  // edition on the page the ads point at.
  const pitch = $derived(
    es
      ? 'Noticias curadas, contexto de fuentes primarias, datos utilizables y un calendario de lo que viene en el sistema migratorio.'
      : 'Curated news, primary source context, useable data, and a calendar of what’s coming in the immigration system.',
  );
  const offer = $derived(es ? 'Gratis cada día hábil en agosto.' : 'Free every weekday in August.');

  /**
   * What we do and don't do with the address.
   *
   * This is a newsletter about immigration enforcement, so the ask is not the
   * ordinary one: a reader deciding whether to hand over an email is running a
   * real risk calculation about themselves or their family, and silence on the
   * question reads as an answer. It sits nearest the input because that is
   * where the hesitation happens.
   *
   * TODO(david): stub copy, both languages. This is the line most worth getting
   * exactly right and least worth having me guess at — say only what is true of
   * how the Kit list is actually run.
   */
  const privacy = $derived(
    es
      ? 'Nunca vendemos ni compartimos tu correo. Cancela cuando quieras.'
      : 'We never sell or share your email. Unsubscribe any time.',
  );
</script>

<!-- A panel rather than a pair of rules. On cream, white with a hairline reads
     as a thing to act on instead of a caption, and it costs nothing vertically —
     the padding is the padding the rules already had. -->
<section class="not-prose border border-slate-900/15 bg-white px-4 py-4">
  <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
    <div class="sm:flex-1">
      <p class="text-sm leading-snug text-slate-700 sm:text-base sm:leading-normal">
        {pitch}
        <span class="font-semibold text-slate-900">{offer}</span>
      </p>
      <!-- Desktop keeps it under the pitch, where there is room in the column.
           On a phone the pitch already runs several lines, so it moves below the
           input instead — nearer the thing it is reassuring you about, and it
           does not push the form further down the screen. -->
      <p class="mt-1.5 hidden text-xs text-slate-500 sm:block">{privacy}</p>
    </div>
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
  <p class="mt-2 text-xs text-slate-500 sm:hidden">{privacy}</p>
</section>
