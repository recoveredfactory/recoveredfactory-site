<script lang="ts">
  import { SITE_URL } from '$lib/config';
  import SupportOptions from '$lib/components/SupportOptions.svelte';
  import { m } from '$lib/paraglide/messages';

  const { data } = $props();
  const canonical = new URL(`/${data.lang}/support`, SITE_URL).href;
  const description = m.support_subtitle();
  const pageTitle = `${m.site_name()} · ${m.nav_donate()}`;
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

    <section class="space-y-4">
      <h2 class="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
        {m.latest_heading()}
      </h2>
      {#if data.posts.length === 0}
        <p class="text-sm text-slate-600">{m.no_posts()}</p>
      {:else}
        <ul class="space-y-4">
          {#each data.posts as post}
            <li class="space-y-1">
              <a
                class="font-display text-xl font-semibold text-slate-900 transition hover:text-slate-700"
                href={`/${data.lang}/${post.slug}`}
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
            </li>
          {/each}
        </ul>
      {/if}
    </section>
  </div>
</main>
