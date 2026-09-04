<script lang="ts">
  /**
   * The ask. One box, two sizes.
   *
   * `big` is the whole reason the page exists: the title at display size, the
   * input and button a step up from body, the terms and the privacy line under
   * them at full size. It runs on the plate at the top of the home page and
   * again at the bottom.
   *
   * `inline` sits between an edition's stories, after the lede has made its
   * case. Same words, same shape, no display title.
   */
  import SubscribeForm from '$lib/components/SubscribeForm.svelte';
  import { copy } from '$lib/copy';
  import type { Lang } from '$lib/i18n';

  type SubscribeBoxProps = {
    lang: Lang;
    placement: string;
    size?: 'big' | 'inline';
    /** `plate` sits on the ink; `paper` on the cream. */
    tone?: 'plate' | 'paper';
    id?: string;
    /** Replaces the standard title — the closing ask says "Start today." */
    title?: string;
  };

  let { lang, placement, size = 'big', tone = 'paper', id, title }: SubscribeBoxProps = $props();

  const t = $derived(copy[lang].ui.subscribe);
</script>

<!-- Cream on the plate, paper on the cream: the box is always the brightest
     thing on the screen it is on. A 2px ink edge, no radius, no shadow. -->
<section
  class={`border-2 border-ink text-ink ${tone === 'plate' ? 'bg-cream' : 'bg-paper'} ${
    size === 'big' ? 'px-6 py-7 sm:px-10 sm:py-10' : 'px-5 py-5 sm:px-7 sm:py-6'
  }`}
  {id}
>
  {#if size === 'big'}
    <h2 class="db-display mb-6">{title ?? t.title}</h2>
  {:else}
    <p class="mb-4 font-semibold">{title ?? t.title}</p>
  {/if}

  <SubscribeForm id={id ? `${id}-form` : `subscribe-${placement}`} {lang} {placement} {size} />

  <p class={`${size === 'big' ? 'mt-5' : 'mt-4 text-[1rem]'} font-semibold`}>{t.terms}</p>
  <p class={`mt-1 text-ink-soft ${size === 'big' ? '' : 'text-[1rem]'}`}>{t.privacy}</p>
</section>
