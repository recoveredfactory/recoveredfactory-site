<script lang="ts">
  const { data } = $props();
</script>

<svelte:head>
  <title>Recovered Factory</title>
</svelte:head>

<main class="min-h-dvh px-6 py-12 sm:px-10 lg:px-16">
  <div class="mx-auto flex max-w-4xl flex-col gap-10">
    <header class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div class="space-y-2">
        <p class="text-xs uppercase tracking-[0.35em] text-slate-500">
          Recovered Factory
        </p>
        <h1 class="text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
          Latest writing
        </h1>
        <p class="max-w-2xl text-sm text-slate-600">
          A quick feed of the newest posts from Ghost.
        </p>
      </div>
      <a
        class="inline-flex items-center justify-center rounded-full border border-slate-900/10 bg-white/70 px-4 py-2 text-sm font-medium text-slate-900 shadow-sm transition hover:bg-white"
        href="/bench-notes"
      >
        Bench notes
      </a>
    </header>

    {#if data.posts.length === 0}
      <div class="rounded-2xl border border-dashed border-slate-900/20 bg-white/50 p-8">
        <p class="text-sm text-slate-600">No posts yet.</p>
      </div>
    {:else}
      <ul class="grid gap-6">
        {#each data.posts as post}
          <li
            class="rounded-2xl border border-slate-900/10 bg-white/70 p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div class="flex flex-col gap-3">
              <a
                class="text-2xl font-semibold tracking-tight text-slate-900 transition hover:text-slate-700"
                href={`/writing/${post.slug}`}
              >
                {post.title}
              </a>
              {#if post.excerpt}
                <p class="text-sm text-slate-600">{post.excerpt}</p>
              {/if}
              {#if post.published_at}
                <p class="text-xs uppercase tracking-[0.2em] text-slate-500">
                  {new Date(post.published_at).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                  {#if post.reading_time}
                    · {post.reading_time} min read
                  {/if}
                </p>
              {/if}
            </div>
          </li>
        {/each}
      </ul>
    {/if}
  </div>
</main>
