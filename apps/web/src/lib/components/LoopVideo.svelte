<script lang="ts">
  import { onMount } from 'svelte';

  // A silent screencast loop: plays only while on screen, and holds on the
  // poster with controls for readers who ask for reduced motion.
  type LoopVideoProps = {
    src: string;
    poster?: string;
    label?: string;
    class?: string;
    figureClass?: string;
    captionClass?: string;
  };

  const {
    src,
    poster,
    label = '',
    class: classNameProp = '',
    figureClass = 'my-6',
    captionClass = 'mt-2 text-xs text-slate-500',
    children,
  } = $props<LoopVideoProps & { children?: import('svelte').Snippet }>();

  let video: HTMLVideoElement;
  let reducedMotion = $state(false);

  onMount(() => {
    reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) {
      video.pause();
      return;
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) video.play().catch(() => {});
      else video.pause();
    });
    observer.observe(video);
    return () => observer.disconnect();
  });
</script>

<figure class={`rf-loop-video mx-auto ${figureClass}`}>
  <video
    bind:this={video}
    {src}
    {poster}
    aria-label={label}
    autoplay
    muted
    loop
    playsinline
    preload="metadata"
    controls={reducedMotion}
    class={`w-full h-auto${classNameProp ? ` ${classNameProp}` : ''}`}
  ></video>
  {#if children}
    <figcaption class={`rf-image-caption ${captionClass}`}>
      {@render children()}
    </figcaption>
  {/if}
</figure>
