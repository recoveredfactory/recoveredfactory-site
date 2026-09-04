<script lang="ts">
  /**
   * A dossier deck, shown on the page as a swipeable card.
   *
   * Deliberately not an Instagram embed: that loads Meta's script and hands
   * every reader an iframe that sets Meta's cookies, which on a page about
   * surveillance means asking readers to accept being tracked to look at our
   * reporting about tracking. The slides are on our own origin, so the card is
   * built here. Without JavaScript it is a horizontally scrollable strip of
   * images with captions; JavaScript adds the paddles and the dots.
   */
  import { onMount } from 'svelte';
  import { trackEvent } from '$lib/analytics';
  import { copy } from '$lib/copy';
  import type { DossierSlide } from '$lib/daybook/dossier';
  import type { Lang } from '$lib/i18n';

  type DossierCarouselProps = {
    slides: DossierSlide[];
    lang: Lang;
    /** Shortcode of the post this deck went out as, if it ran on Instagram. */
    instagramPost?: string;
    placement?: string;
  };

  let { slides, lang, instagramPost, placement = 'edition' }: DossierCarouselProps = $props();

  const HANDLE = 'recoveredfactory';
  const PROFILE_URL = `https://www.instagram.com/${HANDLE}/`;

  const t = $derived(copy[lang].ui.dossier);
  const postUrl = $derived(instagramPost ? `https://www.instagram.com/p/${instagramPost}/` : '');

  let track = $state<HTMLDivElement | null>(null);
  let index = $state(0);
  // The paddles and dots do nothing without a script running, so they are not
  // drawn in the server render at all rather than shown dead.
  let enhanced = $state(false);

  onMount(() => {
    enhanced = true;
  });

  const clamp = (i: number) => Math.max(0, Math.min(slides.length - 1, i));

  const onScroll = () => {
    if (!track) return;
    const width = track.clientWidth;
    if (width > 0) index = clamp(Math.round(track.scrollLeft / width));
  };

  const goTo = (next: number, source: 'paddle' | 'dot' | 'key') => {
    if (!track) return;
    const target = clamp(next);
    track.scrollTo({ left: target * track.clientWidth, behavior: 'smooth' });
    index = target;
    trackEvent('dossier_slide', { slide: target + 1, of: slides.length, source, lang, placement });
  };

  const onKeydown = (event: KeyboardEvent) => {
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      goTo(index + 1, 'key');
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      goTo(index - 1, 'key');
    }
  };

  // Centred on the slide, not the scroller: the slides are 4:5, so half an
  // image is 62.5% of the card's width, read off the card with a container query.
  const paddleClass =
    'absolute top-[62.5cqw] flex size-10 -translate-y-1/2 items-center justify-center ' +
    'bg-cream/85 text-ink ring-1 ring-ink/10 transition hover:bg-cream disabled:pointer-events-none disabled:opacity-0';
</script>

{#if slides.length}
  <section class="mx-auto w-full max-w-[560px]">
    <div class="border-2 border-ink bg-paper">
      <a
        class="flex items-center gap-3 border-b border-ink/15 px-4 py-3 text-[1rem] transition hover:bg-cream"
        href={PROFILE_URL}
        onclick={() => trackEvent('instagram_click', { target: 'profile', placement, lang })}
        rel="noopener noreferrer"
        target="_blank"
      >
        <span class="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-cream ring-1 ring-ink/10">
          <img
            alt=""
            class="size-5 object-contain"
            decoding="async"
            loading="lazy"
            src="/images/factory-default--white-bg--square.png"
          />
        </span>
        <span>{t.follow}</span>
      </a>

      <div class="@container relative">
        <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
        <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
        <div
          aria-label={t.follow}
          aria-roledescription="carousel"
          bind:this={track}
          class="db-dossier-track flex snap-x snap-mandatory overflow-x-auto scroll-smooth"
          onkeydown={onKeydown}
          onscroll={onScroll}
          role="group"
          tabindex="0"
        >
          {#each slides as slide, i}
            <figure
              aria-label={t.slide(i + 1, slides.length)}
              aria-roledescription="slide"
              class="w-full shrink-0 snap-center"
              role="group"
            >
              <img
                alt={slide.alt}
                class="aspect-4/5 w-full bg-cream object-cover"
                decoding="async"
                height="1350"
                loading={i === 0 ? 'eager' : 'lazy'}
                src={slide.src}
                width="1080"
              />
              {#if slide.caption}
                <figcaption class="min-h-[3.5rem] border-t border-ink/15 px-4 py-3 text-[1rem] leading-snug text-ink-soft">
                  {slide.caption}
                </figcaption>
              {/if}
            </figure>
          {/each}
        </div>

        {#if enhanced && slides.length > 1}
          <button
            aria-label={t.previous}
            class={`${paddleClass} left-2`}
            disabled={index === 0}
            onclick={() => goTo(index - 1, 'paddle')}
            type="button"
          >
            <svg aria-hidden="true" class="size-4" fill="none" viewBox="0 0 16 16">
              <path d="M10 3 5 8l5 5" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" />
            </svg>
          </button>
          <button
            aria-label={t.next}
            class={`${paddleClass} right-2`}
            disabled={index === slides.length - 1}
            onclick={() => goTo(index + 1, 'paddle')}
            type="button"
          >
            <svg aria-hidden="true" class="size-4" fill="none" viewBox="0 0 16 16">
              <path d="m6 3 5 5-5 5" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" />
            </svg>
          </button>
        {/if}
      </div>

      {#if slides.length > 1}
        <div class="flex items-center justify-center border-t border-ink/15 px-4 py-3">
          {#if enhanced}
            <div class="flex items-center gap-2.5">
              {#each slides as _slide, i}
                <button
                  aria-current={i === index}
                  aria-label={t.goTo(i + 1)}
                  class={`size-2.5 transition ${i === index ? 'bg-fire' : 'bg-ink/20 hover:bg-ink/40'}`}
                  onclick={() => goTo(i, 'dot')}
                  type="button"
                ></button>
              {/each}
            </div>
            <p class="sr-only" aria-live="polite">{t.slide(index + 1, slides.length)}</p>
          {:else}
            <p class="text-[1rem] text-ink-soft">{t.swipe} →</p>
          {/if}
        </div>
      {/if}
    </div>

    {#if postUrl}
      <p class="db-links mt-3 text-center text-[1rem]">
        <a
          href={postUrl}
          onclick={() => trackEvent('instagram_click', { target: 'post', placement, lang })}
          rel="noopener noreferrer"
          target="_blank"
        >
          {t.seePost} →
        </a>
      </p>
    {/if}
  </section>
{/if}

<style>
  .db-dossier-track {
    scrollbar-width: none;
  }

  .db-dossier-track::-webkit-scrollbar {
    display: none;
  }

  @media (prefers-reduced-motion: reduce) {
    .db-dossier-track {
      scroll-behavior: auto;
    }
  }
</style>
