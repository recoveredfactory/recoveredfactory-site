<script lang="ts">
  import { SITE_URL } from '$lib/config';
  import { formatEditionDate, formatMonth } from '$lib/daybook/format';
  import { archiveSchema } from '$lib/daybook/schema';
  import { m } from '$lib/paraglide/messages';

  const { data } = $props();

  const canonical = $derived(new URL(`/${data.lang}/daybook`, SITE_URL).href);
  const otherLang = $derived(data.lang === 'en' ? 'es' : 'en');
  const alternate = $derived(new URL(`/${otherLang}/daybook`, SITE_URL).href);
  const editions = $derived(data.months.flatMap((month) => month.editions));
  const pageTitle = $derived(
    data.lang === 'es' ? 'Immigration Daybook · Archivo' : 'Immigration Daybook · Archive',
  );
  // The newest edition's dek, used for the meta description only. It reads as a
  // contents line in a search result, which is what an archive index wants, but
  // it is visibly a machine-joined list of headlines — so it does not go on the
  // page. Falls back to a plain line before the first edition ships.
  const description = $derived(
    data.dek ??
      (data.lang === 'es'
        ? 'Ediciones anteriores de Immigration Daybook.'
        : 'Past editions of Immigration Daybook.'),
  );
  const schema = $derived(archiveSchema(data.lang, editions));
</script>

<svelte:head>
  <title>{pageTitle}</title>
  <meta name="description" content={description} />
  <meta property="og:site_name" content={m.site_name()} />
  <meta property="og:title" content={pageTitle} />
  <meta property="og:description" content={description} />
  <meta property="og:type" content="website" />
  <meta property="og:url" content={canonical} />
  <link rel="canonical" href={canonical} />
  <link rel="alternate" hreflang={data.lang} href={canonical} />
  <link rel="alternate" hreflang={otherLang} href={alternate} />
  <link
    href={`/${data.lang}/daybook/rss.xml`}
    rel="alternate"
    title="Immigration Daybook"
    type="application/rss+xml"
  />
  {#each schema as entry}
    {@html `<script type="application/ld+json">${JSON.stringify(entry)}<\/script>`}
  {/each}
</svelte:head>

<main class="min-h-dvh px-6 py-12 sm:px-10 lg:px-16">
  <div class="mx-auto flex max-w-3xl flex-col gap-12">
    <header class="space-y-3">
      <h1 class="font-display text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
        {data.lang === 'es' ? 'Archivo de Immigration Daybook' : 'Immigration Daybook Archive'}
      </h1>
      <p class="text-sm text-slate-600">
        <a class="underline" href={`/${data.lang}/immigration-daybook`}>
          {data.lang === 'es' ? 'Sobre el boletín' : 'About the newsletter'}
        </a>
        ·
        <a class="underline" href={`/${data.lang}/daybook/rss.xml`}>RSS</a>
      </p>
    </header>

    {#if editions.length === 0}
      <p class="text-sm text-slate-600">
        {data.lang === 'es' ? 'Aún no hay ediciones.' : 'No editions yet.'}
      </p>
    {:else}
      {#each data.months as month}
        <section class="space-y-6">
          <h2 class="font-display text-xl font-semibold text-slate-900">
            <a class="hover:underline" href={`/${data.lang}/daybook/${month.month}`}>
              {formatMonth(month.month, data.lang)}
            </a>
          </h2>
          <ul class="space-y-8">
            {#each month.editions as edition}
              <li>
                <a class="group block space-y-1" href={`/${data.lang}/daybook/${edition.date}`}>
                  <p class="text-sm text-slate-500">
                    {formatEditionDate(edition.date, data.lang, { weekday: true })}
                    {#if edition.pilot}
                      <span class="ml-2 text-amber-700">
                        {data.lang === 'es' ? 'piloto' : 'pilot'}
                      </span>
                    {/if}
                  </p>
                  <!-- Date and headline, nothing else. The dek is a list of an
                       edition's section headlines joined with middots — it
                       opens by repeating the headline directly above it, and a
                       column of those reads like machine output rather than an
                       index. It stays in the meta description, where a contents
                       line is the right thing. -->
                  <h3
                    class="font-display text-lg font-semibold text-slate-900 transition group-hover:text-slate-700"
                  >
                    {edition.title}
                  </h3>
                </a>
              </li>
            {/each}
          </ul>
        </section>
      {/each}
    {/if}
  </div>
</main>
