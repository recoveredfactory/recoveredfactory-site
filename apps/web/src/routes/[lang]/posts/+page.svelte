<script lang="ts">
  import { SITE_URL } from '$lib/config';
  import { getResizedImageUrl } from '$lib/images';
  import { m } from '$lib/paraglide/messages';

  const { data } = $props();

  const toAbsoluteUrl = (value: string) =>
    /^https?:\/\//i.test(value) ? value : new URL(value, SITE_URL).href;
  const canonical = new URL(`/${data.lang}/posts`, SITE_URL).href;
  const description = 'Full archive';
  const ogImage = toAbsoluteUrl(
    getResizedImageUrl('/images/factory-share--white-bg.png', { width: 1200 }),
  );
  const pageTitle = `${m.site_name()} · Posts`;
</script>

<svelte:head>
  <title>{pageTitle}</title>
  <meta name="description" content={description} />
  <meta property="og:site_name" content={m.site_name()} />
  <meta property="og:title" content={pageTitle} />
  <meta property="og:description" content={description} />
  <meta property="og:type" content="website" />
  <meta property="og:url" content={canonical} />
  <meta property="og:image" content={ogImage} />
  <meta property="og:image:alt" content={m.site_name()} />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content={pageTitle} />
  <meta name="twitter:description" content={description} />
  <meta name="twitter:image" content={ogImage} />
  <link rel="canonical" href={canonical} />
</svelte:head>

<main class="min-h-dvh px-6 py-12 sm:px-10 lg:px-16">
  <div class="mx-auto flex max-w-4xl flex-col gap-10">
    <header class="space-y-3">
      <p class="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
        Posts
      </p>
      <h1 class="font-display text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
        Full archive
      </h1>
    </header>

    {#if data.posts.length === 0}
      <p class="text-sm text-slate-600">No posts yet.</p>
    {:else}
      <ul class="space-y-12">
        {#each data.posts as post}
          <li
            class={`space-y-2 ${
              post.meta.previewImage && !post.meta.hidePreview ? '' : 'md:text-center'
            }`}
          >
            {#if post.meta.previewImage && !post.meta.hidePreview}
              <a class="block" href={`/${data.lang}/${post.slug}`}>
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
              href={`/${data.lang}/${post.slug}`}
            >
              {post.meta.title}
            </a>
            <p class="text-xs uppercase tracking-[0.2em] text-slate-500">
              {new Date(post.meta.date).toLocaleDateString(data.lang, {
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
