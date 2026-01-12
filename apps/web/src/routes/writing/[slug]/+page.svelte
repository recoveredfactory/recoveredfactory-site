<script lang="ts">
  const { data } = $props();
</script>

<svelte:head>
  <title>{data.post.title}</title>
</svelte:head>

<main class="min-h-dvh px-6 py-12 sm:px-10 lg:px-16">
  <article class="mx-auto max-w-3xl space-y-8">
    <header class="space-y-4">
      <p class="text-xs uppercase tracking-[0.35em] text-slate-500">Writing</p>
      <h1 class="text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
        {data.post.title}
      </h1>
      {#if data.post.excerpt}
        <p class="text-lg text-slate-600">{data.post.excerpt}</p>
      {/if}
      {#if data.post.published_at}
        <p class="text-xs uppercase tracking-[0.2em] text-slate-500">
          {new Date(data.post.published_at).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
          {#if data.post.reading_time}
            · {data.post.reading_time} min read
          {/if}
        </p>
      {/if}
    </header>

    <div
      class="space-y-6 text-base leading-relaxed text-slate-700 [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:tracking-tight [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:tracking-tight [&_p]:text-slate-700 [&_a]:font-medium [&_a]:text-slate-900 [&_a]:underline [&_a]:underline-offset-4 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_blockquote]:border-l-2 [&_blockquote]:border-slate-300 [&_blockquote]:pl-4"
    >
      {@html data.post.html ?? ''}
    </div>
  </article>
</main>
