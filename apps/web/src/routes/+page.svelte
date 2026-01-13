<script lang="ts">
  import { m } from '$lib/paraglide/messages';
  import { localizeHref } from '$lib/paraglide/runtime';

  const { data } = $props();
</script>

<svelte:head>
  <title>{m.site_name()}</title>
</svelte:head>

<main class="min-h-dvh px-6 py-12 sm:px-10 lg:px-16">
  <div class="mx-auto flex max-w-6xl flex-col gap-10">
    <section class="space-y-6 text-center">
      <h1 class="font-display text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
        {m.hero_title()}
      </h1>
      <p class="mx-auto max-w-2xl text-base text-slate-600">
        {m.hero_subtitle()}
      </p>
    </section>

    <section>
      <form class="mx-auto w-full lg:max-w-[75%]">
        <label class="sr-only" for="subscribe-email">{m.subscribe_title()}</label>
        <div class="relative">
          <input
            class="w-full border border-slate-900/15 bg-white/90 px-5 py-4 pr-36 text-lg text-slate-800 placeholder:text-slate-400 shadow-sm"
            id="subscribe-email"
            placeholder={m.subscribe_placeholder()}
            type="email"
          />
          <a
            class="absolute right-1 top-1/2 -translate-y-1/2 bg-fern-strong px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-fern"
            href={data.portal.upgradeUrl}
          >
            {m.subscribe_button()}
          </a>
        </div>
      </form>
    </section>

    <section class="space-y-16">
      {#if data.posts.length === 0}
        <div class="border border-dashed border-slate-900/20 bg-white/50 p-8">
          <p class="text-sm text-slate-600">{m.no_posts()}</p>
        </div>
      {:else}
        <ul class="grid gap-12">
          {#each data.posts as post}
            <li class="space-y-6">
              {#if post.feature_image}
                <a
                  class="mx-auto block max-w-xl"
                  href={localizeHref(`/writing/${post.slug}`)}
                >
                  <img
                    alt={post.title}
                    class="w-full"
                    loading="lazy"
                    src={post.feature_image}
                  />
                </a>
              {/if}
              <div class="mx-auto max-w-2xl space-y-3 text-center">
                <a
                  class="font-display text-3xl font-semibold tracking-tight text-slate-900 transition hover:text-slate-700"
                  href={localizeHref(`/writing/${post.slug}`)}
                >
                  {post.title}
                </a>
                {#if post.excerpt}
                  <p class="text-base text-slate-600">{post.excerpt}</p>
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
    </section>
  </div>
</main>
