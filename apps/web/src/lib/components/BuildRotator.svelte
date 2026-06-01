<script lang="ts">
  import { onMount } from 'svelte';

  let {
    items = [],
    hold = 1500,
    fade = 420,
  }: { items?: string[]; hold?: number; fade?: number } = $props();

  let idx = $state(0);
  let visible = $state(false);
  let rotorOn = $state(false);

  function shuffle<T>(a: T[]): T[] {
    for (let i = a.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  onMount(() => {
    if (!items.length) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let order = shuffle([...items.keys()]);
    let pos = 0;
    idx = order[0];
    rotorOn = true;
    const intro = setTimeout(() => {
      visible = true;
    }, 60); // initial ease-in

    let swapTimer: ReturnType<typeof setTimeout>;
    const loop = setInterval(() => {
      visible = false; // ease out
      swapTimer = setTimeout(() => {
        pos += 1;
        if (pos >= order.length) {
          order = shuffle(order);
          pos = 0;
        }
        idx = order[pos];
        visible = true; // ease in
      }, fade);
    }, hold + fade);

    return () => {
      clearTimeout(intro);
      clearTimeout(swapTimer);
      clearInterval(loop);
    };
  });
</script>

<!-- One item at a time, randomized, easing in and out. SSR, no-JS,
     and reduced-motion get the full static list. -->
<div class="rotor">
  {#if rotorOn}
    <span class="rotor__item" class:is-visible={visible} style="--fade:{fade}ms" aria-hidden="true"
      >{items[idx]}</span
    >
  {/if}
  <ul class="rotor__list" class:rotor__list--sr={rotorOn}>
    {#each items as item}
      <li>{item}</li>
    {/each}
  </ul>
</div>

<style>
  .rotor {
    display: flex;
    align-items: center;
    min-height: 6.5rem;
    margin-top: 0.5rem;
  }
  .rotor__item {
    font-family: var(--font-display);
    font-size: clamp(1.3rem, 4.2vw, 1.7rem);
    line-height: 1.3;
    color: rgb(15 23 42);
    opacity: 0;
    transform: translateY(7px);
    transition:
      opacity var(--fade, 420ms) ease-in-out,
      transform var(--fade, 420ms) ease-in-out;
  }
  .rotor__item.is-visible {
    opacity: 1;
    transform: none;
  }
  .rotor__list {
    margin: 0;
    padding-left: 1.2rem;
  }
  .rotor__list li {
    margin: 0.2rem 0;
  }
  /* Visually hidden but available to assistive tech while rotating */
  .rotor__list--sr {
    position: absolute;
    width: 1px;
    height: 1px;
    margin: -1px;
    padding: 0;
    border: 0;
    overflow: hidden;
    clip: rect(0 0 0 0);
    clip-path: inset(50%);
    white-space: nowrap;
  }
</style>
