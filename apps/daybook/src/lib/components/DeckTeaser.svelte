<script lang="ts">
  /**
   * A published edition's deck, folded up at the top of the page.
   *
   * On an edition page the deck is a taste of what follows, not the story
   * itself, so it starts as a line: the cover as a small stacked card, how many
   * slides, and an offer to flip through. Open, it is the same card the home page
   * shows. A `<details>` does the folding, so it opens without JavaScript too.
   * A dossier is different: there the deck is the reporting, and it runs open.
   */
  import DossierCarousel from '$lib/components/DossierCarousel.svelte';
  import { trackEvent } from '$lib/analytics';
  import { copy } from '$lib/copy';
  import type { DossierSlide } from '$lib/daybook/dossier';
  import type { Lang } from '$lib/i18n';

  type DeckTeaserProps = {
    slides: DossierSlide[];
    lang: Lang;
    instagramPost?: string;
    placement?: string;
  };

  let { slides, lang, instagramPost, placement = 'edition-deck' }: DeckTeaserProps = $props();

  const t = $derived(copy[lang].ui.dossier);
  let open = $state(false);

  const onToggle = () => {
    if (open) trackEvent('deck_open', { of: slides.length, lang, placement });
  };
</script>

{#if slides.length}
  <details bind:open class="border-y border-ink/15 py-4" ontoggle={onToggle}>
    <summary class="group flex cursor-pointer list-none items-center gap-5 [&::-webkit-details-marker]:hidden">
      <!-- The cover on top of two blank cards: a deck, at a glance. -->
      <span aria-hidden="true" class="relative mr-2 mt-2 block w-[4.5rem] shrink-0">
        <span class="absolute inset-0 -translate-y-2 translate-x-2 border border-ink/20 bg-cream"></span>
        <span class="absolute inset-0 -translate-y-1 translate-x-1 border border-ink/25 bg-paper"></span>
        <img
          alt=""
          class="relative block aspect-4/5 w-full border border-ink/40 bg-cream object-cover"
          decoding="async"
          height="1350"
          src={slides[0].src}
          width="1080"
        />
      </span>
      <span class="min-w-0">
        <span class="block font-semibold">{t.inSlides(slides.length)}</span>
        <span
          class="mt-1 block text-[1rem] text-cite underline decoration-from-font underline-offset-[0.16em] transition group-hover:text-fire-deep"
        >
          {open ? `${t.fold} ↑` : `${t.flip} ↓`}
        </span>
      </span>
    </summary>

    <div class="mt-5 max-w-[26rem]">
      <DossierCarousel {instagramPost} {lang} {placement} {slides} />
    </div>
  </details>
{/if}
