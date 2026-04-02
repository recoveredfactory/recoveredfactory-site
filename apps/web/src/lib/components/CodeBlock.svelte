<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    filename?: string;
    children: Snippet;
  }

  let { filename, children } = $props();
</script>

{#if filename}
  <div class="rf-code-filename">{filename}</div>
{/if}
{@render children()}
