<script lang="ts">
  import { trackEvent } from '$lib/analytics';
  import { page } from '$app/stores';
  import SubscribeForm from '$lib/components/SubscribeForm.svelte';
  import { SITE_URL } from '$lib/config';
  import { getResizedImageUrl } from '$lib/images';
  import { m } from '$lib/paraglide/messages';

  const { data } = $props();

  const toAbsoluteUrl = (value: string) =>
    /^https?:\/\//i.test(value) ? value : new URL(value, SITE_URL).href;
  const canonical = new URL(`/${data.lang}`, SITE_URL).href;
  const description = m.hero_subtitle();
  const ogImage = toAbsoluteUrl(
    getResizedImageUrl('/images/site-logo-001.png', { width: 1200 }),
  );

  const redirectTo = $derived($page.url.pathname);

  const formatDate = (value: string) =>
    new Date(value).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
</script>

<svelte:head>
  <title>{m.site_name()}</title>
  <meta name="description" content={description} />
  <meta property="og:site_name" content={m.site_name()} />
  <meta property="og:title" content={m.site_name()} />
  <meta property="og:description" content={description} />
  <meta property="og:type" content="website" />
  <meta property="og:url" content={canonical} />
  <meta property="og:image" content={ogImage} />
  <meta property="og:image:alt" content={m.site_name()} />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content={m.site_name()} />
  <meta name="twitter:description" content={description} />
  <meta name="twitter:image" content={ogImage} />
  <link rel="canonical" href={canonical} />
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
      <SubscribeForm
        formClass="mx-auto w-full lg:max-w-[75%]"
        id="signup"
        lang={data.lang}
        redirectTo={redirectTo}
        source="home"
      />
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
