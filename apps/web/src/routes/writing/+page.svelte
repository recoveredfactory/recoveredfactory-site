<script lang="ts">
  import { m } from '$lib/paraglide/messages';
  import { localizeHref } from '$lib/paraglide/runtime';

  const { data } = $props();
</script>

<svelte:head>
  <title>{m.writing_title()}</title>
</svelte:head>

<main class="min-h-dvh px-6 py-12 sm:px-10 lg:px-16">
  <div class="mx-auto flex max-w-5xl flex-col gap-10">
    <header class="flex items-center justify-between">
      <div class="space-y-2">
        <p class="text-xs uppercase tracking-[0.35em] text-slate-500">
          {m.writing_title()}
        </p>
        <h1 class="font-display text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
          {m.writing_subtitle()}
        </h1>
      </div>
      <a
        class="inline-flex items-center justify-center border border-slate-900/10 bg-white/70 px-4 py-2 text-sm font-medium text-slate-900 shadow-sm transition hover:bg-white"
        href={localizeHref('/')}
      >
        {m.back_home()}
      </a>
    </header>

    {#if data.posts.length === 0}
      <div class="border border-dashed border-slate-900/20 bg-white/50 p-8">
        <p class="text-sm text-slate-600">{m.no_posts()}</p>
      </div>
    {:else}
      <ul class="grid gap-8 md:grid-cols-2">
        {#each data.posts as post}
          <li
            class="overflow-hidden border border-slate-900/10 bg-white/70 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            {#if post.feature_image}
              <a href={localizeHref(`/writing/${post.slug}`)}>
                <img
                  alt={post.title}
                  class="h-48 w-full object-cover"
                  loading="lazy"
                  src={post.feature_image}
                />
              </a>
            {/if}
            <div class="flex flex-col gap-3 p-6">
              <a
                class="font-display text-2xl font-semibold tracking-tight text-slate-900 transition hover:text-slate-700"
                href={localizeHref(`/writing/${post.slug}`)}
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
                    · {m.reading_time({ minutes: post.reading_time })}
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
