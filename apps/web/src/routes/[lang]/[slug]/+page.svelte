<script lang="ts">
  import { getEntry } from '$lib/blog/loader';
  import { SITE_URL } from '$lib/config';
  import { getResizedImageUrl } from '$lib/images';
  import { m } from '$lib/paraglide/messages';

  const { data } = $props();

  const entry = $derived(getEntry(data.lang, data.slug));
  const isPost = $derived(entry?.meta.type !== 'page');
  const byline = $derived(entry?.meta.byline || m.site_name());
  const previewImageUrl = $derived(
    entry?.meta.previewImage
      ? getResizedImageUrl(entry.meta.previewImage, { width: 1600 })
      : null,
  );
  const canonical = $derived(new URL(`/${data.lang}/${data.slug}`, SITE_URL).href);
  const translationUrl = $derived(
    data.switchTo ? new URL(data.switchTo, SITE_URL).href : null,
  );
  const otherLang = $derived(data.lang === 'en' ? 'es' : 'en');
  const switchLabel = $derived(
    otherLang === 'es' ? 'Leer en espanol' : 'Read in English',
  );
  const EntryComponent = $derived(entry?.component);
</script>

<svelte:head>
  {#if entry}
    <title>{entry.meta.title}</title>
    {#if entry.meta.description}
      <meta name="description" content={entry.meta.description} />
    {/if}
    {#if previewImageUrl}
      <meta property="og:image" content={previewImageUrl} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:image" content={previewImageUrl} />
    {/if}
  {/if}
  <link rel="canonical" href={canonical} />
  <link rel="alternate" hreflang={data.lang} href={canonical} />
  {#if translationUrl}
    <link rel="alternate" hreflang={otherLang} href={translationUrl} />
  {/if}
</svelte:head>

{#if entry && EntryComponent}
  <main class="min-h-dvh px-6 py-12 sm:px-10 lg:px-16">
    <article class="mx-auto max-w-3xl space-y-8">
      <header class="space-y-4">
        {#if data.switchTo}
          <a
            class="text-xs font-semibold uppercase tracking-[0.3em] text-fern-strong transition hover:text-fern-strong/80"
            href={data.switchTo}
          >
            {switchLabel}
          </a>
        {/if}
        <h1 class="text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
          {entry.meta.title}
        </h1>
        {#if isPost}
          {#if entry.meta.description}
            <p class="text-lg text-slate-600">{entry.meta.description}</p>
          {/if}
          <p class="text-xs uppercase tracking-[0.2em] text-slate-500">
            {new Date(entry.meta.date).toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
            · {byline}
          </p>
        {/if}
      </header>

      <div
        class="space-y-6 text-base leading-relaxed text-slate-700 [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:tracking-tight [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:tracking-tight [&_p]:text-slate-700 [&_a]:font-medium [&_a]:text-slate-900 [&_a]:underline [&_a]:underline-offset-4 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_blockquote]:border-l-2 [&_blockquote]:border-slate-300 [&_blockquote]:pl-4"
      >
        <EntryComponent />
      </div>
    </article>
  </main>
{:else}
  <main class="min-h-dvh px-6 py-12 sm:px-10 lg:px-16">
    <p class="text-sm text-slate-600">Page not found.</p>
  </main>
{/if}
