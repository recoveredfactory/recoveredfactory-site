<script lang="ts">
  import { getResizedImageUrl } from '$lib/images';
  import { m } from '$lib/paraglide/messages';

  const { data } = $props();

  const formatDate = (value: string) =>
    new Date(value).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
</script>

<svelte:head>
  <title>{m.site_name()}</title>
</svelte:head>

<main class="min-h-dvh mt-8 px-6 py-10 sm:mt-12 sm:py-12 sm:px-10 lg:px-16">
  <div class="mx-auto flex max-w-6xl flex-col gap-8 sm:gap-10">
    <section class="space-y-4 pb-6 text-center sm:pb-8">
      <h1 class="font-display text-3xl font-semibold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
        {m.hero_title()}
      </h1>
      <p class="mx-auto max-w-2xl text-base text-slate-600">
        {m.hero_subtitle()}
      </p>
    </section>

    <section>
      <form
        action="https://app.kit.com/forms/8972189/subscriptions"
        class="mx-auto w-full lg:max-w-[75%]"
        id="subscribe"
        method="post"
      >
        <label class="sr-only" for="subscribe-email">{m.subscribe_title()}</label>
        <div class="flex flex-col gap-3 sm:flex-row sm:items-stretch sm:justify-center sm:gap-2">
          <input
            class="w-full border border-slate-900/15 bg-white/90 px-4 py-3 text-base text-slate-800 placeholder:text-slate-400 shadow-sm sm:max-w-[28rem] sm:flex-none"
            id="subscribe-email"
            name="email_address"
            placeholder={m.subscribe_placeholder()}
            type="email"
          />
          <input name="fields[lang]" type="hidden" value={data.lang} />
          <button
            class="bg-fern-strong px-5 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-fern sm:shrink-0"
            type="submit"
          >
            {m.subscribe_button()}
          </button>
        </div>
      </form>
    </section>

    <section class="mx-auto mt-10 w-full max-w-5xl space-y-16 sm:mt-12">
      {#if data.posts.length === 0}
        <div class="border border-dashed border-slate-900/20 bg-white/50 p-8">
          <p class="text-sm text-slate-600">{m.no_posts()}</p>
        </div>
      {:else}
        <ul class="grid gap-12">
          {#each data.posts as post}
            <li class="grid gap-4 md:grid-cols-[minmax(0,0.7fr)_minmax(0,1fr)] md:items-center md:gap-6">
              {#if post.meta.previewImage}
                <a class="block w-full" href={`/${data.lang}/${post.slug}`}>
                  <img
                    alt={post.meta.title}
                    class="w-full h-auto"
                    loading="lazy"
                    src={getResizedImageUrl(post.meta.previewImage, { width: 720 })}
                  />
                </a>
              {:else}
                <div></div>
              {/if}
              <div class="max-w-xl space-y-4 text-center md:text-left">
                <a
                  class="font-display text-3xl font-semibold tracking-tight text-slate-900 transition hover:text-slate-700 sm:text-5xl lg:text-6xl"
                  href={`/${data.lang}/${post.slug}`}
                >
                  {post.meta.title}
                </a>
                <p class="pt-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  By {post.meta.byline || m.site_name()} · {formatDate(post.meta.date)}
                </p>
                {#if post.meta.description}
                  <p class="text-lg text-slate-600">{post.meta.description}</p>
                {/if}
              </div>
            </li>
          {/each}
        </ul>
      {/if}
    </section>
  </div>
</main>
