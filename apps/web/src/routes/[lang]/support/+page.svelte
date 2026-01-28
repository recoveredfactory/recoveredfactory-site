<script lang="ts">
  import { SITE_URL } from '$lib/config';
  import { formatDate } from '$lib/dates';
  import { getResizedImageUrl } from '$lib/images';
  import SupportOptions from '$lib/components/SupportOptions.svelte';
  import { m } from '$lib/paraglide/messages';

  const { data } = $props();
  const toAbsoluteUrl = (value: string) =>
    /^https?:\/\//i.test(value) ? value : new URL(value, SITE_URL).href;
  const canonical = $derived(new URL(`/${data.lang}/support`, SITE_URL).href);
  const description = $derived(m.support_subtitle());
  const pageTitle = $derived(`${m.site_name()} · ${m.nav_donate()}`);
  const ogImage = toAbsoluteUrl(
    getResizedImageUrl('/images/factory-share--white-bg.png', { width: 1200 }),
  );

  const editedLabel = $derived(data.lang === 'es' ? 'Editado por' : 'Edited by');
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
  <meta property="og:image:alt" content={pageTitle} />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content={pageTitle} />
  <meta name="twitter:description" content={description} />
  <meta name="twitter:image" content={ogImage} />
  <link rel="canonical" href={canonical} />
</svelte:head>

<main class="min-h-dvh px-6 py-12 sm:px-10 lg:px-16">
  <div class="mx-auto flex max-w-3xl flex-col gap-10">
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
        <ul class="grid gap-16">
          {#each data.posts as post}
            <li
              class={`grid gap-4 md:items-center md:gap-6 ${
                post.meta.previewImage && !post.meta.hidePreview
                  ? 'md:grid-cols-[minmax(0,0.7fr)_minmax(0,1fr)]'
                  : 'md:grid-cols-1'
              }`}
            >
              {#if post.meta.previewImage && !post.meta.hidePreview}
                <a class="block w-full" href={`/${data.lang}/${post.slug}`}>
                  <img
                    alt={post.meta.title}
                    class="w-full h-auto"
                    loading="lazy"
                    src={getResizedImageUrl(post.meta.previewImage, { width: 720 })}
                  />
                </a>
              {/if}
              <div
                class={`max-w-xl space-y-4 text-center ${
                  post.meta.previewImage && !post.meta.hidePreview
                    ? 'md:text-left'
                    : 'md:text-center md:mx-auto'
                }`}
              >
                <a
                  class="font-display text-2xl font-semibold tracking-tight text-slate-900 transition hover:text-slate-700 sm:text-4xl lg:text-5xl"
                  href={`/${data.lang}/${post.slug}`}
                >
                  {post.meta.title}
                </a>
                <p class="pt-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  By {post.meta.byline || m.site_name()} ·{' '}
                  {formatDate(post.meta.date, data.lang, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                  {#if post.meta.editors?.length}
                    · {editedLabel} {post.meta.editors.join(', ')}
                  {/if}
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
