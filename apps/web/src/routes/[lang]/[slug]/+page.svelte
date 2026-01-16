<script lang="ts">
  import { getEntry } from '$lib/blog/loader';
  import { SITE_URL } from '$lib/config';
  import { getResizedImageUrl } from '$lib/images';
  import { m } from '$lib/paraglide/messages';
  import { getLocale } from '$lib/paraglide/runtime';

  const { data } = $props();
  const currentLocale = getLocale();

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
    otherLang === 'es' ? 'Leer en espanol →' : 'Read in English →',
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
  <main class="min-h-dvh mt-12 px-6 py-12 sm:px-10 lg:px-16">
    <article class="mx-auto max-w-2xl space-y-8">
      <header class="space-y-4">
        <h1 class="font-display text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
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
        {#if data.switchTo}
          <a
            class="inline-flex items-center text-xs font-semibold uppercase tracking-[0.25em] text-fern-strong transition hover:text-fern-strong/80"
            href={data.switchTo}
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
        <p class="text-sm font-semibold uppercase tracking-[0.2em] text-slate-600">
          {m.post_subscribe_heading()}
        </p>
        <form
          action="https://app.kit.com/forms/8972189/subscriptions"
          class="w-full"
          id="post-subscribe"
          method="post"
        >
          <label class="sr-only" for="post-subscribe-email">{m.subscribe_title()}</label>
          <div class="flex flex-col gap-3 sm:flex-row sm:items-stretch sm:justify-center sm:gap-2">
            <input
              class="w-full border border-slate-900/15 bg-white/90 px-5 py-4 text-lg text-slate-800 placeholder:text-slate-400 shadow-sm sm:max-w-[28rem] sm:flex-none"
              id="post-subscribe-email"
              name="email_address"
              placeholder={m.subscribe_placeholder()}
              type="email"
            />
            <input name="fields[lang]" type="hidden" value={currentLocale} />
            <button
              class="bg-fern-strong px-5 py-4 text-sm font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-fern sm:shrink-0"
              type="submit"
            >
              {m.subscribe_button()}
            </button>
          </div>
        </form>
      </section>
    </article>
  </main>
{:else}
  <main class="min-h-dvh px-6 py-12 sm:px-10 lg:px-16">
    <p class="text-sm text-slate-600">Page not found.</p>
  </main>
{/if}
