<script lang="ts">
  let { label, children } = $props();
</script>

<details class="foldout">
  <summary>{label}</summary>
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
    padding: 0.875rem 0;
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: rgb(51 65 85);
  }

  summary::-webkit-details-marker {
    display: none;
  }

  summary::after {
    content: '+';
    float: right;
    font-size: 1rem;
    line-height: 1;
    color: rgb(100 116 139);
  }

  .foldout[open] summary::after {
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
