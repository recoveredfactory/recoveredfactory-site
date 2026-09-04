<script lang="ts">
  import DossierCarousel from '$lib/components/DossierCarousel.svelte';
  import ShareRow from '$lib/components/ShareRow.svelte';
  import SubscribeBox from '$lib/components/SubscribeBox.svelte';
  import UpcomingCalendar from '$lib/components/UpcomingCalendar.svelte';
  import { SITE_URL } from '$lib/config';
  import { copy } from '$lib/copy';
  import { formatEditionDate, formatMonth } from '$lib/daybook/format';
  import { archiveSchema, editionSchema } from '$lib/daybook/schema';
  import { editionPath, homePath } from '$lib/urls';

  const { data } = $props();

  const t = $derived(copy[data.lang].ui);
  const isEdition = $derived(data.kind === 'edition');

  // An edition's own card carries that day's headline. Editions pulled before
  // the card step existed fall back to the wordmark plate.
  const ogImage = $derived(
    new URL(
      data.edition?.socialImage ?? `/images/immigration-daybook-og-${data.lang}.png`,
      SITE_URL,
    ).href,
  );
  const ogImageAlt = $derived(data.edition?.socialImage ? data.edition.title : t.siteName);

  const canonical = $derived(new URL(editionPath(data.lang, data.ref), SITE_URL).href);

  const dateLabel = $derived(
    isEdition
      ? formatEditionDate(data.ref, data.lang, { weekday: true })
      : formatMonth(data.ref, data.lang),
  );

  const pageTitle = $derived(
    isEdition
      ? `${t.siteName}, ${formatEditionDate(data.ref, data.lang)}: ${data.edition!.title}`
      : `${t.siteName} · ${dateLabel}`,
  );

  const description = $derived(
    isEdition
      ? data.edition!.description
      : data.lang === 'es'
        ? `Todas las ediciones de ${dateLabel}.`
        : `Every edition from ${dateLabel}.`,
  );

  // What rides into a chat app beside the link: the headline, not the page title.
  const shareTitle = $derived(isEdition ? data.edition!.title : pageTitle);

  // The calendar sits second to last, where the sent email puts it.
  const upcomingAfter = $derived(
    (data.edition?.sections.length ?? 0) >= 2
      ? data.edition!.sections.length - 2
      : (data.edition?.sections.length ?? 0) - 1,
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
  <meta property="og:site_name" content={t.siteName} />
  <meta property="og:title" content={pageTitle} />
  <meta property="og:description" content={description} />
  <meta property="og:type" content={isEdition ? 'article' : 'website'} />
  <meta property="og:url" content={canonical} />
  <meta property="og:image" content={ogImage} />
  <meta property="og:image:alt" content={ogImageAlt} />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content={pageTitle} />
  <meta name="twitter:description" content={description} />
  <meta name="twitter:image" content={ogImage} />
  {#if isEdition}
    <meta property="article:published_time" content={`${data.ref}T00:00:00Z`} />
    <meta property="article:section" content="Immigration" />
  {/if}
  <link rel="canonical" href={canonical} />
  <link rel="alternate" hreflang={data.lang} href={canonical} />
  {#if data.switchTo}
    <link
      href={new URL(data.switchTo, SITE_URL).href}
      hreflang={data.lang === 'en' ? 'es' : 'en'}
      rel="alternate"
    />
  {/if}
  {#each schema as entry}
    {@html `<script type="application/ld+json">${JSON.stringify(entry)}<\/script>`}
  {/each}
</svelte:head>

<main class="mx-auto max-w-3xl px-5 py-10 sm:px-8 sm:py-14">
  {#if isEdition && data.edition}
    {@const edition = data.edition}
    {@const asSent = Boolean(edition.emailHtml)}
    <article class="flex flex-col gap-8">
      <!-- The masthead line: the date is what an edition is called. The lede's
           own headline is the h1, set by the loader; the page adds none. -->
      <header class="flex flex-col gap-3">
        <p class="font-semibold text-fire">
          <a class="hover:underline" href={editionPath(data.lang, data.ref.slice(0, 7))}>{dateLabel}</a>
        </p>
        {#if edition.translationEditor}
          <p class="text-[1rem] text-ink-soft">
            {t.edition.translationEditedBy}
            {edition.translationEditor}
          </p>
        {/if}
        {#if !asSent}
          <ShareRow lang={data.lang} placement="edition-top" title={shareTitle} url={canonical} variant="compact" />
        {/if}
      </header>

      {#if edition.pilot}
        <p class="border-2 border-fire px-4 py-3">{t.edition.pilot}</p>
      {/if}

      {#if data.dossier}
        <DossierCarousel instagramPost={edition.instagramPost} lang={data.lang} slides={data.dossier.slides} />
      {/if}

      {#if asSent}
        <h1 class="sr-only">{edition.title}</h1>
        <div class="db-email overflow-x-auto">
          {@html edition.emailHtml}
        </div>
      {:else}
        {#if edition.standingHtml}
          <p class="db-standing">{@html edition.standingHtml}</p>
        {/if}

        {#if edition.intro}
          <div class="db-prose">{@html edition.intro}</div>
        {/if}

        {#each edition.sections as section, i}
          <div class="db-prose">{@html section.html}</div>

          <!-- One ask, after the lede has made its case. -->
          {#if i === 0 && edition.sections.length > 1}
            <SubscribeBox lang={data.lang} placement="edition-mid" size="inline" />
          {/if}

          {#if data.upcoming && i === upcomingAfter}
            <UpcomingCalendar entries={data.upcoming.entries} lang={data.lang} />
            <ShareRow lang={data.lang} placement="edition-upcoming" title={shareTitle} url={canonical} />
          {/if}
        {/each}

        {#if data.upcoming && !edition.sections.length}
          <UpcomingCalendar entries={data.upcoming.entries} lang={data.lang} />
          <ShareRow lang={data.lang} placement="edition-upcoming" title={shareTitle} url={canonical} />
        {/if}
      {/if}

      <div class="flex flex-col gap-6 border-t-2 border-ink pt-6">
        {#if !data.upcoming || asSent}
          <ShareRow lang={data.lang} placement="edition-end" title={shareTitle} url={canonical} />
        {/if}
        <p class="db-links flex flex-wrap gap-x-6 gap-y-2 text-[1rem]">
          <a href={asSent ? editionPath(data.lang, data.ref) : `${editionPath(data.lang, data.ref)}?sent`}>
            {asSent ? t.edition.backToWeb : t.edition.asSent}
          </a>
          <a href={`${editionPath(data.lang, data.ref)}.md`}>{t.edition.plainText}</a>
        </p>
      </div>

      <!-- Older and newer, by headline: a date alone says nothing about
           whether the next edition is worth the click. -->
      <footer class="grid gap-6 border-t-2 border-ink pt-6 sm:grid-cols-2">
        {#if data.older}
          <a class="group block" href={editionPath(data.lang, data.older.date)}>
            <p class="font-semibold text-fire">← {formatEditionDate(data.older.date, data.lang)}</p>
            <p class="mt-1 font-display font-semibold leading-tight transition group-hover:text-fire-deep">
              {data.older.title}
            </p>
          </a>
        {:else}
          <span></span>
        {/if}
        {#if data.newer}
          <a class="group block sm:text-right" href={editionPath(data.lang, data.newer.date)}>
            <p class="font-semibold text-fire">{formatEditionDate(data.newer.date, data.lang)} →</p>
            <p class="mt-1 font-display font-semibold leading-tight transition group-hover:text-fire-deep">
              {data.newer.title}
            </p>
          </a>
        {/if}
      </footer>
    </article>
  {:else if data.editions}
    <header class="flex flex-col gap-2">
      <h1 class="db-display">{dateLabel}</h1>
      <p class="text-ink-soft">{t.edition.editions(data.editions.length)}</p>
    </header>

    {#each data.editions as edition}
      <article class="mt-10 border-t-2 border-ink pt-8">
        <p class="font-semibold text-fire">
          <a class="hover:underline" href={editionPath(data.lang, edition.date)}>
            {formatEditionDate(edition.date, data.lang, { weekday: true })}
          </a>
        </p>
        <h2 class="db-hed mt-2">
          <a class="transition hover:text-fire-deep" href={editionPath(data.lang, edition.date)}>{edition.title}</a>
        </h2>
        <div class="db-prose db-prose--nested mt-5">{@html edition.html}</div>
      </article>
    {/each}

    <div class="mt-12">
      <SubscribeBox lang={data.lang} placement="month-bottom" />
    </div>
  {/if}

  <p class="db-links mt-12 text-[1rem]">
    <a href={homePath(data.lang)}>← {t.siteName}</a>
  </p>
</main>
