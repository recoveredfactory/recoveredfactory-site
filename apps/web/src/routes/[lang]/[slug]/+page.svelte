<script lang="ts">
  import { page } from '$app/stores';
  import { trackEvent } from '$lib/analytics';
  import { getEntry } from '$lib/blog/loader';
  import SubscribeForm from '$lib/components/SubscribeForm.svelte';
  import { SITE_URL } from '$lib/config';
  import { formatDate, parseDate } from '$lib/dates';
  import { getResizedImageUrl } from '$lib/images';
  import { m } from '$lib/paraglide/messages';
  import { setLocale } from '$lib/paraglide/runtime';

  const { data } = $props();

  const toAbsoluteUrl = (value: string) =>
    /^https?:\/\//i.test(value) ? value : new URL(value, SITE_URL).href;
  const redirectTo = $derived($page.url.pathname);

  const entry = $derived(getEntry(data.lang, data.slug));
  const isPost = $derived(entry?.meta.type !== 'page');
  const byline = $derived(entry?.meta.byline || m.site_name());
  const editedLabel = $derived(data.lang === 'es' ? 'Editado por' : 'Edited by');
  const editorsLine = $derived(
    entry?.meta.editors?.length
      ? `${editedLabel} ${entry.meta.editors.join(', ')}`
      : '',
  );
  const defaultOgImage = $derived(
    toAbsoluteUrl(
      getResizedImageUrl('/images/factory-share--white-bg.png', { width: 1200 }),
    ),
  );
  const previewImageUrl = $derived(
    entry?.meta.previewImage
      ? toAbsoluteUrl(getResizedImageUrl(entry.meta.previewImage, { width: 1600 }))
      : null,
  );
  const canonical = $derived(new URL(`/${data.lang}/${data.slug}`, SITE_URL).href);
  const translationUrl = $derived(
    data.switchTo ? new URL(data.switchTo, SITE_URL).href : null,
  );
  const otherLang = $derived(data.lang === 'en' ? 'es' : 'en');
  const switchLabel = $derived(
    otherLang === 'es' ? 'Leer en español →' : 'Read in English →',
  );
  const EntryComponent = $derived(entry?.component);
  const ogTitle = $derived(entry?.meta.title || m.site_name());
  const ogDescription = $derived(entry?.meta.description || m.hero_subtitle());
  const ogImage = $derived(previewImageUrl || defaultOgImage);
</script>

<svelte:head>
  {#if entry}
    <title>{entry.meta.title}</title>
    <meta name="description" content={ogDescription} />
    <meta property="og:site_name" content={m.site_name()} />
    <meta property="og:title" content={ogTitle} />
    <meta property="og:description" content={ogDescription} />
    <meta property="og:type" content={isPost ? 'article' : 'website'} />
    <meta property="og:url" content={canonical} />
    <meta property="og:image" content={ogImage} />
    <meta property="og:image:alt" content={ogTitle} />
    {#if isPost}
      <meta
        property="article:published_time"
        content={parseDate(entry.meta.date).toISOString()}
      />
      <meta property="article:author" content={byline} />
    {/if}
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content={ogTitle} />
    <meta name="twitter:description" content={ogDescription} />
    <meta name="twitter:image" content={ogImage} />
  {/if}
  <link rel="canonical" href={canonical} />
  <link rel="alternate" hreflang={data.lang} href={canonical} />
  {#if translationUrl}
    <link rel="alternate" hreflang={otherLang} href={translationUrl} />
  {/if}
</svelte:head>

{#if entry && EntryComponent}
  <main class="min-h-dvh mt-3 px-6 sm:px-10 lg:px-16">
    <article class="mx-auto max-w-2xl space-y-8 pt-3 pb-12">
      {#if isPost}
        <section class="mb-16 w-full rounded border border-slate-900/10 bg-white/60 p-4 sm:p-5">
          <p class="mb-3 text-center text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            {m.post_subscribe_heading()}
          </p>
          <SubscribeForm
            buttonClass="bg-fern-strong px-4 py-2 text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-fern sm:shrink-0"
            formClass="w-full"
            id="post-signup-compact"
            inputClass="w-full border border-slate-900/15 bg-white/90 px-4 py-2 text-sm text-slate-800 placeholder:text-slate-400 shadow-sm sm:max-w-[22rem] sm:flex-none"
            lang={data.lang}
            meta={{ slug: data.slug, placement: 'compact' }}
            redirectTo={redirectTo}
            source="post"
          />
        </section>
      {/if}

      <header class="space-y-4">
        <h1 class="font-display text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
          {entry.meta.title}
        </h1>
        {#if isPost}
          {#if entry.meta.description}
            <p class="text-lg text-slate-600">{entry.meta.description}</p>
          {/if}
          <p class="text-xs uppercase tracking-[0.2em] text-slate-500">
            {formatDate(entry.meta.date, data.lang, {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
            · {byline}
            {#if editorsLine}
              · {editorsLine}
            {/if}
          </p>
        {/if}
        {#if data.switchTo}
          <a
            class="inline-flex items-center text-xs font-semibold uppercase tracking-[0.25em] text-fern-strong transition hover:text-fern-strong/80"
            href={data.switchTo}
            onclick={() => {
              setLocale(otherLang, { reload: false });
              trackEvent('language_switch', {
                from: data.lang,
                to: otherLang,
                source: 'post',
                slug: data.slug,
              });
            }}
          >
            {switchLabel}
          </a>
        {/if}
      </header>

      <div
        class="space-y-6 text-base leading-relaxed text-slate-700 [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:tracking-tight [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:tracking-tight [&_p]:text-slate-700 [&_a]:font-medium [&_a]:text-link [&_a]:underline [&_a]:underline-offset-4 [&_a:hover]:text-link/80 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_blockquote]:border-l-2 [&_blockquote]:border-slate-300 [&_blockquote]:pl-4"
      >
        <EntryComponent />
      </div>

      <section class="mt-12 w-full space-y-5">
        <hr class="border-slate-900/10" />
        <p class="text-center text-sm font-semibold uppercase tracking-[0.2em] text-slate-600">
          {m.post_subscribe_heading()}
        </p>
        <SubscribeForm
          buttonClass="bg-fern-strong px-5 py-4 text-sm font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-fern sm:shrink-0"
          formClass="w-full"
          id="post-signup"
          inputClass="w-full border border-slate-900/15 bg-white/90 px-5 py-4 text-lg text-slate-800 placeholder:text-slate-400 shadow-sm sm:max-w-[28rem] sm:flex-none"
          lang={data.lang}
          meta={{ slug: data.slug }}
          redirectTo={redirectTo}
          source="post"
        />
      </section>
    </article>
  </main>
{:else}
  <main class="min-h-dvh px-6 py-12 sm:px-10 lg:px-16">
    <p class="text-sm text-slate-600">Page not found.</p>
  </main>
{/if}
