<script lang="ts">
  import { page } from '$app/stores';
  import SubscribeForm from '$lib/components/SubscribeForm.svelte';
  import { SITE_URL } from '$lib/config';
  import { getResizedImageUrl } from '$lib/images';
  import { m } from '$lib/paraglide/messages';
  import { getLocale } from '$lib/paraglide/runtime';

  const { data } = $props();
  const currentLocale = getLocale();
  const redirectTo = $derived($page.url.pathname);
  const toAbsoluteUrl = (value: string) =>
    /^https?:\/\//i.test(value) ? value : new URL(value, SITE_URL).href;
  const canonical = new URL($page.url.pathname, SITE_URL).href;
  const ogTitle = data.post.title;
  const ogDescription = data.post.excerpt || m.hero_subtitle();
  const ogImage = toAbsoluteUrl(
    getResizedImageUrl(
      data.post.feature_image || '/images/factory-share--white-bg.png',
      {
        width: 1600,
      },
    ),
  );
</script>

<svelte:head>
  <title>{ogTitle}</title>
  <meta name="description" content={ogDescription} />
  <meta property="og:site_name" content={m.site_name()} />
  <meta property="og:title" content={ogTitle} />
  <meta property="og:description" content={ogDescription} />
  <meta property="og:type" content="article" />
  <meta property="og:url" content={canonical} />
  <meta property="og:image" content={ogImage} />
  <meta property="og:image:alt" content={ogTitle} />
  {#if data.post.published_at}
    <meta
      property="article:published_time"
      content={new Date(data.post.published_at).toISOString()}
    />
  {/if}
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content={ogTitle} />
  <meta name="twitter:description" content={ogDescription} />
  <meta name="twitter:image" content={ogImage} />
  <link rel="canonical" href={canonical} />
</svelte:head>

<main class="min-h-dvh px-6 py-12 sm:px-10 lg:px-16">
  <article class="mx-auto max-w-3xl space-y-8">
    <header class="space-y-4">
      {#if data.alternate}
        <a
          class="text-xs font-semibold uppercase tracking-[0.3em] text-link transition hover:text-link/80"
          href={data.alternate.href}
        >
          {data.alternate.locale === 'es'
            ? m.post_read_in_spanish()
            : m.post_read_in_english()}
        </a>
      {/if}
      <p class="text-xs uppercase tracking-[0.35em] text-slate-500">
        {m.writing_label()}
      </p>
      <h1 class="text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
        {data.post.title}
      </h1>
      {#if data.post.excerpt}
        <p class="text-lg text-slate-600">{data.post.excerpt}</p>
      {/if}
      {#if data.post.published_at}
        <p class="text-xs uppercase tracking-[0.2em] text-slate-500">
          {new Date(data.post.published_at).toLocaleDateString(currentLocale, {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
          {#if data.post.reading_time}
            · {m.reading_time({ minutes: data.post.reading_time })}
          {/if}
        </p>
      {/if}
    </header>

    <div
      class="space-y-6 text-base leading-relaxed text-slate-700 [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:tracking-tight [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:tracking-tight [&_p]:text-slate-700 [&_a]:font-medium [&_a]:text-link [&_a]:underline [&_a]:underline-offset-4 [&_a:hover]:text-link/80 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_blockquote]:border-l-2 [&_blockquote]:border-slate-300 [&_blockquote]:pl-4"
    >
      {@html data.post.html ?? ''}
    </div>
  </article>

  <section class="mx-auto mt-16 w-full max-w-3xl pb-8">
    <SubscribeForm
      formClass="mx-auto w-full lg:max-w-[75%]"
      id="signup"
      lang={currentLocale}
      layoutClass="relative"
      inputClass="w-full border border-slate-900/15 bg-white/90 px-5 py-4 pr-36 text-lg text-slate-800 placeholder:text-slate-400 shadow-sm"
      buttonClass="absolute right-1 top-1/2 -translate-y-1/2 bg-fern-strong px-4 py-3.5 text-sm font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-fern"
      redirectTo={redirectTo}
      source="writing"
    />
  </section>
</main>
