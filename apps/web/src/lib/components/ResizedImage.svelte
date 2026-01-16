<script lang="ts">
  import { getResizedImageUrl } from '$lib/images';

  type ResizedImageProps = {
    src: string;
    alt?: string;
    width?: number;
    quality?: number;
    loading?: 'lazy' | 'eager';
    decoding?: 'async' | 'sync' | 'auto';
    class?: string;
    figureClass?: string;
    caption?: string;
    captionClass?: string;
  };

  const {
    src = '',
    alt = '',
    width,
    quality,
    loading = 'lazy',
    decoding = 'async',
    class: className = 'w-full h-auto',
    figureClass: figureClassProp,
    caption,
    captionClass = 'mt-2 text-xs text-slate-500',
    ...rest
  } = $props<ResizedImageProps>();

  const figureClass = $derived(
    `mx-auto max-w-md${figureClassProp ? ` ${figureClassProp}` : ''}`,
  );
</script>

{#if src}
  <figure class={figureClass}>
    <img
      {...rest}
      src={getResizedImageUrl(src, { width, quality })}
      alt={alt}
      loading={loading}
      decoding={decoding}
      class={className}
    />
    {#if caption}
      <figcaption class={captionClass}>{caption}</figcaption>
    {/if}
  </figure>
{/if}
