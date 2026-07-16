<script lang="ts">
  import { onMount } from 'svelte';

  let { id, label, children } = $props();
  let el: HTMLDetailsElement | undefined = $state();

  // Deep links (e.g. #dhs-response from the newsletter) should land on the
  // foldout with it open; <details> doesn't do that on its own.
  function openIfTargeted() {
    if (el && id && location.hash === `#${id}`) {
      el.open = true;
      el.scrollIntoView();
    }
  }

  onMount(openIfTargeted);
</script>

<svelte:window onhashchange={openIfTargeted} />

<details class="foldout" {id} bind:this={el}>
  <summary>
    <span class="foldout-label">{label}</span>
    <span class="foldout-marker" aria-hidden="true"></span>
  </summary>
  <div class="foldout-body">
    {@render children?.()}
  </div>
</details>

<style>
  .foldout {
    margin-top: 3rem;
    border-top: 2px solid rgb(15 23 42 / 0.55);
    border-bottom: 2px solid rgb(15 23 42 / 0.55);
  }

  /* Consecutive foldouts share a rule instead of doubling up. */
  .foldout + .foldout {
    margin-top: 0;
    border-top: none;
  }

  summary {
    cursor: pointer;
    list-style: none;
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 1rem;
    padding: 0.875rem 0;
  }

  summary::-webkit-details-marker {
    display: none;
  }

  .foldout-label {
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: rgb(51 65 85);
    line-height: 1.6;
  }

  .foldout-marker {
    flex-shrink: 0;
    font-size: 1rem;
    line-height: 1;
    color: rgb(100 116 139);
  }

  .foldout-marker::before {
    content: '+';
  }

  .foldout[open] .foldout-marker::before {
    content: '−';
  }

  .foldout-body {
    padding-bottom: 1.75rem;
  }

  /* The post prose wrapper spaces only its direct children; re-create
     the rhythm here, and scale headings down to appendix size (the
     wrapper's h2/h3 display sizes are too loud in a foldout). */
  .foldout-body > :global(* + *) {
    margin-top: 1.25rem;
  }

  .foldout-body :global(h2) {
    font-size: 1.0625rem;
    margin-top: 2.25rem;
  }

  .foldout-body :global(h3) {
    font-size: 0.9375rem;
  }

  .foldout-body :global(p),
  .foldout-body :global(li) {
    font-size: 0.9375rem;
  }
</style>
