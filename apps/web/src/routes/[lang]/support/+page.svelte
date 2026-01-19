<script lang="ts">
  import { SITE_URL } from '$lib/config';
  import { getResizedImageUrl } from '$lib/images';
  import SupportOptions from '$lib/components/SupportOptions.svelte';
  import { m } from '$lib/paraglide/messages';

  const { data } = $props();
  const canonical = $derived(new URL(`/${data.lang}/support`, SITE_URL).href);
  const description = $derived(m.support_subtitle());
  const pageTitle = $derived(`${m.site_name()} · ${m.nav_donate()}`);

  const formatDate = (value: string) =>
    new Date(value).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
</script>

<svelte:head>
  <title>{pageTitle}</title>
  <meta name="description" content={description} />
  <meta property="og:site_name" content={m.site_name()} />
  <meta property="og:title" content={pageTitle} />
  <meta property="og:description" content={description} />
  <meta property="og:type" content="website" />
  <meta property="og:url" content={canonical} />
  <meta name="twitter:card" content="summary" />
  <meta name="twitter:title" content={pageTitle} />
  <meta name="twitter:description" content={description} />
  <link rel="canonical" href={canonical} />
</svelte:head>

<main class="min-h-dvh px-6 py-12 sm:px-10 lg:px-16">
  <div class="mx-auto flex max-w-3xl flex-col gap-10">
    <section class="space-y-3 text-center">
      <h1 class="font-display text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
        Why support Recovered Factory?
      </h1>
      <p class="text-base text-slate-600">
        Placeholder copy goes here. We will explain why support matters and how it
        keeps the workshop going.
      </p>
    </section>

    <section>
      <SupportOptions source="page" variant="page" />
    </section>

    <section class="space-y-8">
      <p class="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
        {m.latest_heading()}
      </p>
      {#if data.posts.length === 0}
        <p class="text-sm text-slate-600">{m.no_posts()}</p>
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
                  class="font-display text-2xl font-semibold tracking-tight text-slate-900 transition hover:text-slate-700 sm:text-4xl lg:text-5xl"
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
