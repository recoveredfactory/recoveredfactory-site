<script lang="ts">
  /**
   * A dossier deck, shown on the page as a swipeable card.
   *
   * This is deliberately not an Instagram embed. Embedding the post means
   * loading Meta's `embed.js` and handing every reader an iframe that sets
   * Meta's cookies — which on this site would mean a cookie banner, and on a
   * page about surveillance would mean asking readers to accept being tracked
   * to look at our reporting about tracking. The deck is ours and the slides
   * are already on our own origin, so the card is built here: same reading
   * experience, nothing leaves the page, no consent to collect.
   *
   * It borrows the *shape* of a post card — masthead row, square-ish media,
   * swipe between slides, links out at the bottom — because that shape is
   * legible and tells the reader "there are more of these, keep going." It does
   * not borrow Instagram's chrome: no Instagram logo, no invented like or
   * comment counts, nothing that would read as Instagram's own UI rather than
   * as a link to it. The mark in the masthead is ours and the row it sits in
   * says where the link goes.
   *
   * Without JavaScript this is a horizontally scrollable strip of images with
   * their captions, which is a working carousel. JavaScript adds the paddles
   * and the dots.
   */
  import { onMount } from 'svelte';
  import { trackEvent } from '$lib/analytics';
  import { getResizedImageUrl } from '$lib/images';
  import type { DossierSlide } from '$lib/daybook/dossier';
  import type { Lang } from '$lib/i18n';

  type DossierCarouselProps = {
    slides: DossierSlide[];
    lang: Lang;
    /** Shortcode of the post this deck went out as, if it ran on Instagram. */
    instagramPost?: string;
    /** Rides along on click events so slots can be told apart. */
    placement?: string;
  };

  let {
    slides,
    lang,
    instagramPost,
    placement = 'daybook-edition',
  }: DossierCarouselProps = $props();

  const HANDLE = 'recoveredfactory';
  const PROFILE_URL = `https://www.instagram.com/${HANDLE}/`;

  const es = $derived(lang === 'es');
  const postUrl = $derived(instagramPost ? `https://www.instagram.com/p/${instagramPost}/` : '');

  const followLabel = $derived(
    es ? `Sigue a @${HANDLE} en Instagram` : `Follow @${HANDLE} on Instagram`,
  );
  // TODO(david): stub copy, these two.
  const seePost = $derived(es ? 'Ver la publicación' : 'See the post');
  const swipeHint = $derived(es ? 'Desliza para ver más' : 'Swipe for more');

  let track = $state<HTMLDivElement | null>(null);
  let index = $state(0);
  // Only true once the component mounts, which is what gates the controls: the
  // paddles and dots do nothing without a script running, so they are not drawn
  // in the server render at all rather than shown dead.
  let enhanced = $state(false);

  onMount(() => {
    enhanced = true;
  });

  const clamp = (i: number) => Math.max(0, Math.min(slides.length - 1, i));

  // Read the position back off the scroller rather than tracking it ourselves,
  // so a swipe, a scrollbar drag and a paddle press all agree.
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

  const label = $derived(
    es ? `Diapositiva ${index + 1} de ${slides.length}` : `Slide ${index + 1} of ${slides.length}`,
  );

  // Centred on the *slide*, not on the scroller — the scroller is as tall as
  // the image plus its caption bar, so `top-1/2` would sit the paddles below
  // the middle of the picture. The slides are 4:5, so half an image is 62.5% of
  // the card's width, read off the card with a container query.
  const paddleClass =
    'absolute top-[62.5cqw] flex size-9 -translate-y-1/2 items-center justify-center rounded-full ' +
    'bg-white/70 text-slate-700 shadow-sm ring-1 ring-slate-900/5 backdrop-blur-sm transition ' +
    'hover:bg-white hover:text-slate-900 disabled:pointer-events-none disabled:opacity-0';
</script>

{#if slides.length}
  <section class="not-prose mx-auto w-full max-w-[540px]">
    <div class="border border-slate-900/15 bg-white">
      <!-- Masthead row. The whole row is the follow link — the mark is ours,
           and the words say where it goes, so nothing here has to pretend to be
           Instagram's own header to be understood. -->
      <a
        class="group flex items-center gap-2.5 border-b border-slate-900/10 px-4 py-3 transition hover:bg-slate-50"
        href={PROFILE_URL}
        onclick={() => trackEvent('instagram_click', { target: 'profile', placement, lang })}
        rel="noopener noreferrer"
        target="_blank"
      >
        <span
          class="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-cream ring-1 ring-slate-900/10"
        >
          <img
            alt=""
            class="size-5 object-contain"
            decoding="async"
            loading="lazy"
            src={getResizedImageUrl('/images/factory-default--white-bg--square.png', {
              width: 96,
            })}
          />
        </span>
        <span
          class="text-sm text-slate-600 transition group-hover:text-slate-900"
        >
          {followLabel}
        </span>
      </a>

      <div class="@container relative">
        <!-- The scroller is the carousel: focusable so it can be driven from
             the keyboard, and left arrow / right arrow step a slide rather than
             nudging the scroll position between two of them. This is the shape
             the ARIA authoring practices give a carousel; the two rules below
             are written for buttons and menus and do not have a reading of it.
        -->
        <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
        <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
        <div
          aria-label={followLabel}
          aria-roledescription="carousel"
          bind:this={track}
          class="rf-dossier-track flex snap-x snap-mandatory overflow-x-auto scroll-smooth"
          onkeydown={onKeydown}
          onscroll={onScroll}
          role="group"
          tabindex="0"
        >
          {#each slides as slide, i}
            <figure
              aria-label={es ? `${i + 1} de ${slides.length}` : `${i + 1} of ${slides.length}`}
              aria-roledescription="slide"
              class="w-full shrink-0 snap-center"
              role="group"
            >
              <img
                alt={slide.alt}
                class="aspect-4/5 w-full bg-slate-100 object-cover"
                decoding="async"
                height="1350"
                loading={i === 0 ? 'eager' : 'lazy'}
                src={getResizedImageUrl(slide.src, { width: 720, quality: 82 })}
                width="1080"
              />
              {#if slide.caption}
                <figcaption
                  class="min-h-[3.25rem] border-t border-slate-900/10 px-4 py-3 text-xs leading-relaxed text-slate-500"
                >
                  {slide.caption}
                </figcaption>
              {/if}
            </figure>
          {/each}
        </div>

        {#if enhanced && slides.length > 1}
          <button
            aria-label={es ? 'Anterior' : 'Previous'}
            class={`${paddleClass} left-2`}
            disabled={index === 0}
            onclick={() => goTo(index - 1, 'paddle')}
            type="button"
          >
            <svg aria-hidden="true" class="size-4" fill="none" viewBox="0 0 16 16">
              <path
                d="M10 3 5 8l5 5"
                stroke="currentColor"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="1.5"
              />
            </svg>
          </button>
          <button
            aria-label={es ? 'Siguiente' : 'Next'}
            class={`${paddleClass} right-2`}
            disabled={index === slides.length - 1}
            onclick={() => goTo(index + 1, 'paddle')}
            type="button"
          >
            <svg aria-hidden="true" class="size-4" fill="none" viewBox="0 0 16 16">
              <path
                d="m6 3 5 5-5 5"
                stroke="currentColor"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="1.5"
              />
            </svg>
          </button>
        {/if}
      </div>

      <!-- Footer row: where you are in the deck. -->
      {#if slides.length > 1}
        <div class="flex items-center justify-center border-t border-slate-900/10 px-4 py-3">
          {#if enhanced}
            <div class="flex items-center gap-2">
              {#each slides as _slide, i}
                <button
                  aria-current={i === index}
                  aria-label={es ? `Ir a ${i + 1}` : `Go to ${i + 1}`}
                  class={`size-1.5 rounded-full transition ${i === index ? 'bg-slate-800' : 'bg-slate-900/20 hover:bg-slate-900/40'}`}
                  onclick={() => goTo(i, 'dot')}
                  type="button"
                ></button>
              {/each}
            </div>
            <p class="sr-only" aria-live="polite">{label}</p>
          {:else}
            <p class="text-xs text-slate-500">{swipeHint} →</p>
          {/if}
        </div>
      {/if}
    </div>

    {#if postUrl}
      <p class="mt-3 text-center text-sm">
        <a
          class="font-semibold text-link transition hover:text-link/80"
          href={postUrl}
          onclick={() => trackEvent('instagram_click', { target: 'post', placement, lang })}
          rel="noopener noreferrer"
          target="_blank"
        >
          {seePost} →
        </a>
      </p>
    {/if}
  </section>
{/if}

<style>
  /* The strip scrolls; its scrollbar is noise under a card this small, and the
     dots already say where you are. */
  .rf-dossier-track {
    scrollbar-width: none;
  }

  .rf-dossier-track::-webkit-scrollbar {
    display: none;
  }

  @media (prefers-reduced-motion: reduce) {
    .rf-dossier-track {
      scroll-behavior: auto;
    }
  }
</style>
