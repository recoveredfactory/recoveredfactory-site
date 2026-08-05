<script lang="ts">
  import { SITE_URL } from '$lib/config';
  import { formatEditionDate, formatMonth } from '$lib/daybook/format';
  import { archiveSchema, editionSchema } from '$lib/daybook/schema';
  import { m } from '$lib/paraglide/messages';

  const { data } = $props();

  const canonical = $derived(new URL(`/${data.lang}/daybook/${data.ref}`, SITE_URL).href);
  const isEdition = $derived(data.kind === 'edition');
  const es = $derived(data.lang === 'es');

  const dateLabel = $derived(
    isEdition
      ? formatEditionDate(data.ref, data.lang, { weekday: true })
      : formatMonth(data.ref, data.lang),
  );

  // The date brands the page, but the lede story's headline is what anyone
  // actually searches for, so the title carries both.
  const pageTitle = $derived(
    isEdition
      ? `Immigration Daybook, ${formatEditionDate(data.ref, data.lang)}: ${data.edition!.title}`
      : `Immigration Daybook · ${dateLabel}`,
  );

  const description = $derived(
    isEdition
      ? data.edition!.description
      : es
        ? `Todas las ediciones de ${dateLabel}.`
        : `Every edition from ${dateLabel}.`,
  );

  const schema = $derived(
    isEdition
      ? editionSchema(data.edition!)
      : archiveSchema(
          data.lang,
          data.editions!.map((edition) => ({ date: edition.date, title: edition.title })),
          data.ref,
        ),
  );
</script>

<svelte:head>
  <title>{pageTitle}</title>
  <meta name="description" content={description} />
  <meta property="og:site_name" content={m.site_name()} />
  <meta property="og:title" content={pageTitle} />
  <meta property="og:description" content={description} />
  <meta property="og:type" content={isEdition ? 'article' : 'website'} />
  <meta property="og:url" content={canonical} />
  {#if isEdition}
    <meta property="article:published_time" content={`${data.ref}T00:00:00Z`} />
    <meta property="article:section" content="Immigration" />
  {/if}
  <link rel="canonical" href={canonical} />
  <link rel="alternate" hreflang={data.lang} href={canonical} />
  {#each data.alternates as alternate}
    <link
      href={new URL(alternate.href, SITE_URL).href}
      hreflang={alternate.lang}
      rel="alternate"
    />
  {/each}
  {#each schema as entry}
    {@html `<script type="application/ld+json">${JSON.stringify(entry)}<\/script>`}
  {/each}
</svelte:head>

<main class="min-h-dvh px-6 py-12 sm:px-10 lg:px-16">
  <div class="mx-auto flex max-w-2xl flex-col gap-8">
    <nav class="text-xs uppercase tracking-[0.2em] text-slate-500">
      <a class="hover:underline" href={`/${data.lang}/daybook`}>Immigration Daybook</a>
      {#if isEdition}
        <span aria-hidden="true"> / </span>
        <a class="hover:underline" href={`/${data.lang}/daybook/${data.ref.slice(0, 7)}`}>
          {formatMonth(data.ref.slice(0, 7), data.lang)}
        </a>
      {/if}
    </nav>

    {#if isEdition && data.edition}
      {@const edition = data.edition}
      {@const asSent = Boolean(edition.emailHtml)}
      <article class="space-y-6">
        {#if asSent}
          <!-- The sent email opens with its own masthead and headline, and the
               point of showing it is that it looks the way it looked in the
               inbox — so the page does not print a second header over it. The
               heading stays in the document for structure and for anyone
               reading by outline; it is just not drawn twice. -->
          <h1 class="sr-only">{edition.title}</h1>
        {:else}
          <header class="space-y-2">
            <p class="text-sm text-slate-500">{dateLabel}</p>
            <h1
              class="font-display text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl"
            >
              {edition.title}
            </h1>
          </header>
        {/if}

        {#if edition.pilot}
          <p class="border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {es
              ? 'Edición piloto previa al lanzamiento. Visible solo fuera de producción.'
              : 'Pre-launch pilot edition. Visible outside production only.'}
          </p>
        {/if}

        {#if asSent}
          <div class="rf-daybook-email not-prose overflow-x-auto">
            {@html edition.emailHtml}
          </div>
        {:else}
          {#if edition.standing}
            <p class="border-l-2 border-slate-300 pl-4 text-sm italic text-slate-600">
              {edition.standing}
            </p>
          {/if}

          <div class="rf-daybook prose prose-slate max-w-none">
            {@html edition.html}
          </div>
        {/if}

        <footer class="flex justify-between gap-4 border-t border-slate-200 pt-6 text-sm">
          {#if data.older}
            <a class="underline" href={`/${data.lang}/daybook/${data.older.date}`}>
              ← {formatEditionDate(data.older.date, data.lang)}
            </a>
          {:else}
            <span></span>
          {/if}
          {#if data.newer}
            <a class="underline" href={`/${data.lang}/daybook/${data.newer.date}`}>
              {formatEditionDate(data.newer.date, data.lang)} →
            </a>
          {/if}
        </footer>
      </article>
    {:else if data.editions}
      <header class="space-y-2">
        <h1 class="font-display text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
          {dateLabel}
        </h1>
        <p class="text-sm text-slate-600">
          {data.editions.length}
          {es
            ? data.editions.length === 1
              ? 'edición'
              : 'ediciones'
            : data.editions.length === 1
              ? 'edition'
              : 'editions'}
        </p>
      </header>

      {#each data.editions as edition}
        <article class="space-y-4 border-t border-slate-200 pt-8">
          <p class="text-xs uppercase tracking-[0.2em] text-slate-500">
            <a class="hover:underline" href={`/${data.lang}/daybook/${edition.date}`}>
              {formatEditionDate(edition.date, data.lang, { weekday: true })}
            </a>
          </p>
          <h2 class="font-display text-2xl font-semibold text-slate-900">
            {edition.title}
          </h2>
          <div class="rf-daybook rf-daybook--nested prose prose-slate max-w-none">
            {@html edition.html}
          </div>
        </article>
      {/each}
    {/if}
  </div>
</main>
