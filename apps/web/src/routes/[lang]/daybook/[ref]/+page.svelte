<script lang="ts">
  import { trackEvent } from '$lib/analytics';
  import DaybookSubscribe from '$lib/components/DaybookSubscribe.svelte';
  import DossierCarousel from '$lib/components/DossierCarousel.svelte';
  import ShareRow from '$lib/components/ShareRow.svelte';
  import UpcomingCalendar from '$lib/components/UpcomingCalendar.svelte';
  import { SITE_URL } from '$lib/config';
  import { formatEditionDate, formatMonth } from '$lib/daybook/format';
  import { archiveSchema, editionSchema } from '$lib/daybook/schema';
  import { getSocialImageUrl } from '$lib/images';
  import { m } from '$lib/paraglide/messages';
  import { setLocale } from '$lib/paraglide/runtime';

  const { data } = $props();

  // Editions are published in both languages on the same date, so the pair is
  // resolved server-side and there is at most one of these. Same treatment as
  // the cross-link on a post: the label is written in the language being
  // switched to, because it is addressed to a reader of that language.
  const otherLang = $derived(data.lang === 'en' ? 'es' : 'en');
  const translation = $derived(data.alternates[0] ?? null);
  const switchLabel = $derived(
    otherLang === 'es' ? 'Leer en español →' : 'Read in English →',
  );

  // An edition's own card carries that day's headline, which is the whole
  // reason anyone clicks a shared link. Editions pulled before the card step
  // existed, and any whose render failed, fall back to the wordmark plate.
  const ogImage = $derived(
    new URL(
      getSocialImageUrl(
        data.edition?.socialImage ?? `/images/immigration-daybook-og-${data.lang}.png`,
        1600,
      ),
      SITE_URL,
    ).href,
  );
  // Only an edition carries a socialImage, so its presence is the test — a
  // month roundup has no `edition` at all.
  const ogImageAlt = $derived(
    data.edition?.socialImage ? data.edition.title : 'Immigration Daybook',
  );

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

  // What rides into a chat app beside the link. The edition's own headline
  // rather than the page title — "Immigration Daybook, Aug. 13, 2026: …" reads
  // like a filename once it is sitting in a group thread.
  const shareTitle = $derived(isEdition ? data.edition!.title : pageTitle);

  // The calendar sits second to last, where the sent email puts it — after the
  // day's stories, before the closing round-up. An edition with a single
  // section has no "before the last" to speak of, so it goes after that one.
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
  <meta property="og:site_name" content={m.site_name()} />
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
    <!-- The crumb and the language switch are both letterspaced caps, which is
         wide: on a phone they run past the column and the switch wraps inside
         its own label. So they stack until there is room for the two of them on
         one line. -->
    <nav
      class="flex flex-col items-start gap-2 text-xs uppercase tracking-[0.2em] text-slate-500 sm:flex-row sm:items-baseline sm:gap-4"
    >
      <span>
        <a class="hover:underline" href={`/${data.lang}/daybook`}>Immigration Daybook</a>
        {#if isEdition}
          <span aria-hidden="true"> / </span>
          <a class="hover:underline" href={`/${data.lang}/daybook/${data.ref.slice(0, 7)}`}>
            {formatMonth(data.ref.slice(0, 7), data.lang)}
          </a>
        {/if}
      </span>
      {#if translation}
        <a
          class="inline-flex shrink-0 items-center text-xs font-semibold uppercase tracking-[0.25em] text-fern-strong transition hover:text-fern-strong/80"
          href={translation.href}
          onclick={() => {
            setLocale(translation.lang, { reload: false });
            trackEvent('language_switch', {
              from: data.lang,
              to: translation.lang,
              source: 'daybook',
              slug: data.ref,
            });
          }}
        >
          {switchLabel}
        </a>
      {/if}
    </nav>

    <!-- A month roundup has nowhere to put an ask except around the outside, so
         it keeps both. An edition now carries one after the lede, where the
         page has made its case — and three asks on one page is how you lose all
         three. The as-sent view has no sections to break, so it keeps the pair. -->
    {#if !isEdition || data.asSent}
      <DaybookSubscribe lang={data.lang} placement="archive-top" />
    {/if}

    <!-- Between the ask and the edition, and only on the editions that name a
         deck. An ad lands the reader here to read the day's edition; the deck
         is the thing we want them to carry back out, so it sits where they pass
         it on the way in rather than at the bottom, where a reader who is done
         has already left. -->
    {#if isEdition && data.dossier}
      <div class="flex flex-col gap-4">
        <DossierCarousel
          instagramPost={data.edition?.instagramPost}
          lang={data.lang}
          slides={data.dossier.slides}
        />
        <!-- Attached to the deck rather than floated at the very top of the
             page. Nobody forwards a thing they have not read — but the deck is
             self-contained and reads in twenty seconds, so by the bottom of it
             a reader has something to pass on. On editions with no deck the
             same row runs after the edition instead. -->
        <div class="flex justify-center">
          <ShareRow
            lang={data.lang}
            placement="dossier"
            title={shareTitle}
            url={canonical}
          />
        </div>
      </div>
    {/if}

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

          {#if edition.intro}
            <div class="rf-daybook prose prose-slate max-w-none">
              {@html edition.intro}
            </div>
          {/if}

          <!-- The edition arrives in pieces so two things can sit between them:
               the calendar, which lives in the pipeline's snapshot rather than
               in the markdown, and one subscribe ask placed after the lede has
               made its case instead of stacked in front of it. -->
          {#each edition.sections as section, i}
            <div class="rf-daybook prose prose-slate max-w-none">
              {@html section.html}
            </div>

            {#if i === 0 && edition.sections.length > 1}
              <DaybookSubscribe lang={data.lang} placement="edition-mid" />
            {/if}

            <!-- Second to last, where the email puts it: after the day's
                 stories, before the closing round-up. -->
            {#if data.upcoming && i === upcomingAfter}
              <UpcomingCalendar entries={data.upcoming.entries} lang={data.lang} />
            {/if}
          {/each}

          {#if data.upcoming && !edition.sections.length}
            <UpcomingCalendar entries={data.upcoming.entries} lang={data.lang} />
          {/if}
        {/if}

        <div class="flex flex-col gap-4 border-t border-slate-200 pt-6">
          {#if !data.dossier}
            <!-- No deck to hang it on, so the ask to pass it on waits until the
                 edition has been read. -->
            <ShareRow lang={data.lang} placement="edition-end" title={shareTitle} url={canonical} />
          {/if}

          <!-- The archive's record of what subscribers actually received. The
               page is not that any more, so it says where that version is
               rather than quietly replacing it. -->
          <p class="text-xs text-slate-500">
            <a
              class="underline underline-offset-2 hover:text-slate-700"
              href={asSent
                ? `/${data.lang}/daybook/${data.ref}`
                : `/${data.lang}/daybook/${data.ref}?sent`}
            >
              {asSent
                ? es
                  ? 'Volver a la versión web'
                  : 'Back to the web version'
                : es
                  ? 'Ver esta edición como se envió'
                  : 'View this edition as it was sent'}
            </a>
          </p>
        </div>

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
          <p class="text-sm text-slate-500">
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

    <DaybookSubscribe lang={data.lang} placement="archive-bottom" />
  </div>
</main>
