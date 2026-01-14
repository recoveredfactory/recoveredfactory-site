<script lang="ts">
  import { getResizedImageUrl } from '$lib/images';

  const { data } = $props();
</script>

<svelte:head>
  <title>Blog</title>
</svelte:head>

<main class="min-h-dvh px-6 py-12 sm:px-10 lg:px-16">
  <div class="mx-auto flex max-w-4xl flex-col gap-10">
    <header class="space-y-3">
      <p class="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
        Blog
      </p>
      <h1 class="font-display text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
        Notes and updates
      </h1>
    </header>

    {#if data.posts.length === 0}
      <p class="text-sm text-slate-600">No posts yet.</p>
    {:else}
      <ul class="space-y-8">
        {#each data.posts as post}
          <li class="space-y-2">
            {#if post.meta.previewImage}
              <a class="block" href={`/${data.lang}/blog/${post.slug}`}>
                <img
                  alt={post.meta.title}
                  class="w-full"
                  loading="lazy"
                  src={getResizedImageUrl(post.meta.previewImage, { width: 1200 })}
                />
              </a>
            {/if}
            <a
              class="font-display text-2xl font-semibold text-slate-900 transition hover:text-slate-700"
              href={`/${data.lang}/blog/${post.slug}`}
            >
              {post.meta.title}
            </a>
            <p class="text-xs uppercase tracking-[0.2em] text-slate-500">
              {new Date(post.meta.date).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </p>
            {#if post.meta.description}
              <p class="text-sm text-slate-600">{post.meta.description}</p>
            {/if}
          </li>
        {/each}
      </ul>
    {/if}
  </div>
</main>
