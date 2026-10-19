<script lang="ts">
  import DossierCarousel from '$lib/components/DossierCarousel.svelte';
  import SubscribeBox from '$lib/components/SubscribeBox.svelte';
  import UpcomingCalendar from '$lib/components/UpcomingCalendar.svelte';
  import { SITE_URL } from '$lib/config';
  import { copy } from '$lib/copy';
  import { formatEditionDate, formatMonth } from '$lib/daybook/format';
  import { archiveSchema } from '$lib/daybook/schema';
  import { editionPath, feedPath, homePath } from '$lib/urls';

  const { data } = $props();

  const t = $derived(copy[data.lang]);
  const other = $derived(data.lang === 'en' ? 'es' : 'en');
  const canonical = $derived(new URL(homePath(data.lang), SITE_URL).href);
  const ogImage = $derived(new URL(`/images/immigration-daybook-og-${data.lang}.png`, SITE_URL).href);
  const editions = $derived(data.months.flatMap((month) => month.editions));
  const schema = $derived(archiveSchema(data.lang, editions));

  // The lede's headline is the edition's title, so "also in this edition" is
  // the section heads after it.
  const alsoIn = $derived(data.latest?.headings.slice(1) ?? []);
</script>

<svelte:head>
  <title>{t.ui.siteName}</title>
  <meta name="description" content={t.home.metaDescription} />
  <meta property="og:site_name" content={t.ui.siteName} />
  <meta property="og:title" content={t.ui.siteName} />
  <meta property="og:description" content={t.home.metaDescription} />
  <meta property="og:type" content="website" />
  <meta property="og:url" content={canonical} />
  <meta property="og:image" content={ogImage} />
  <meta property="og:image:alt" content={t.ui.siteName} />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content={t.ui.siteName} />
  <meta name="twitter:description" content={t.home.metaDescription} />
  <meta name="twitter:image" content={ogImage} />
  <link rel="canonical" href={canonical} />
  <link rel="alternate" hreflang={data.lang} href={canonical} />
  <link rel="alternate" hreflang={other} href={new URL(homePath(other), SITE_URL).href} />
  <link href={feedPath(data.lang)} rel="alternate" title={t.ui.siteName} type="application/rss+xml" />
  {#each schema as entry}
    {@html `<script type="application/ld+json">${JSON.stringify(entry)}<\/script>`}
  {/each}
</svelte:head>

<main>
  <!-- ── The plate ──────────────────────────────────────────────────────
       Ink, full width. The wordmark at poster scale, the deck, a crimson
       rule, and the ask — the whole pitch above the fold, and a reader who is
       already sold never scrolls to act. -->
  <section class="bg-ink text-cream">
    <div class="mx-auto max-w-5xl px-5 pb-14 pt-14 sm:px-8 sm:pb-20 sm:pt-20">
      <h1 class="db-wordmark">Immigration<br />Daybook</h1>
      <p class="db-deck mt-8 max-w-3xl text-cream/85">{t.home.deck}</p>
      <hr class="mt-10 border-0 border-t-4 border-fire" />
      <div class="mt-10">
        <SubscribeBox id="subscribe" lang={data.lang} placement="plate" tone="plate" />
      </div>
    </div>
  </section>

  <!-- ── The front page ─────────────────────────────────────────────────
       The newest edition, and beside it the deck it went out as: the same
       news as a reader meets it in a feed. Without a deck the lead takes the
       full width. -->
  {#if data.latest || data.deck}
    <section class="bg-paper">
      <div
        class={`mx-auto max-w-5xl px-5 py-14 sm:px-8 sm:py-20 ${
          data.deck ? 'grid gap-12 md:grid-cols-[minmax(0,1fr)_minmax(0,24rem)] md:items-start md:gap-10' : ''
        }`}
      >
        {#if data.latest}
          <div class="min-w-0">
            <p class="font-semibold text-fire">
              {t.home.latest.heading} · {formatEditionDate(data.latest.date, data.lang, { weekday: true })}
            </p>
            <h2 class="db-display mt-4 max-w-4xl">
              <a class="transition hover:text-fire-deep" href={editionPath(data.lang, data.latest.date)}>
                {data.latest.title}
              </a>
            </h2>
            {#if data.latest.dek}
              <p class="db-graf mt-6 max-w-3xl text-ink-soft">{data.latest.dek}</p>
            {/if}
            {#if alsoIn.length}
              <p class="mt-8 font-semibold">{t.home.latest.also}</p>
              <ul class="mt-2 max-w-3xl">
                {#each alsoIn as heading}
                  <li class="border-t border-ink/20 py-3">{heading}</li>
                {/each}
              </ul>
            {/if}
            <div class="mt-8 flex flex-wrap gap-3">
              <a class="db-button" href={editionPath(data.lang, data.latest.date)}>{t.home.latest.read} →</a>
              <a class="db-button db-button--ghost" href="#archive">{t.home.latest.all}</a>
            </div>
          </div>
        {/if}

        {#if data.deck}
          <div class="min-w-0">
            <DossierCarousel
              instagramPost={data.deck.instagramPost}
              lang={data.lang}
              placement="home"
              slides={data.deck.slides}
            />
            {#if data.deck.date !== data.latest?.date}
              <p class="db-links mt-3 text-center text-[1rem]">
                <a href={editionPath(data.lang, data.deck.date)}>
                  {formatEditionDate(data.deck.date, data.lang, { weekday: true })} →
                </a>
              </p>
            {/if}
          </div>
        {/if}
      </div>
    </section>
  {/if}

  <!-- ── What's coming ────────────────────────────────────────────────
       The standing Upcoming slate, the next four weeks of it: the calendar
       every edition runs, kept current between editions. -->
  {#if data.upcoming.length}
    <section class="border-t-2 border-ink" id="upcoming">
      <div class="mx-auto max-w-5xl px-5 py-14 sm:px-8 sm:py-20">
        <div class="max-w-3xl">
          <UpcomingCalendar display entries={data.upcoming} lang={data.lang} />
        </div>
      </div>
    </section>
  {/if}

  <!-- ── Every edition ────────────────────────────────────────────────── -->
  <section class="border-t-2 border-ink bg-paper" id="archive">
    <div class="mx-auto max-w-5xl px-5 py-14 sm:px-8 sm:py-20">
      <h2 class="db-display">{t.home.archive.heading}</h2>
      {#if editions.length === 0}
        <p class="db-graf mt-6">{t.home.archive.empty}</p>
      {:else}
        {#each data.months as month}
          <div class="mt-10 md:grid md:grid-cols-[14rem_minmax(0,1fr)] md:gap-8">
            <h3 class="db-hed md:pt-5">
              <a class="transition hover:text-fire-deep" href={editionPath(data.lang, month.month)}>
                {formatMonth(month.month, data.lang)}
              </a>
            </h3>
            <ul class="mt-4 md:mt-0">
              {#each month.editions as edition}
                <li class="border-t border-ink/20">
                  <a class="group block py-5" href={editionPath(data.lang, edition.date)}>
                    <p class="font-semibold text-fire">
                      {formatEditionDate(edition.date, data.lang, { weekday: true })}
                      {#if edition.pilot}
                        <span class="ml-2 text-smoke">pilot</span>
                      {/if}
                    </p>
                    <p class="db-hed mt-1 text-[1.25em] transition group-hover:text-fire-deep">
                      {edition.title}
                    </p>
                  </a>
                </li>
              {/each}
            </ul>
          </div>
        {/each}
      {/if}
    </div>
  </section>

  <!-- ── How it's made, and the closing ask ───────────────────────────── -->
  <section class="border-t-2 border-ink">
    <div class="mx-auto max-w-5xl px-5 py-14 sm:px-8 sm:py-20">
      <h2 class="db-display">{t.home.made.heading}</h2>
      <div class="mt-8 max-w-3xl">
        {#each t.home.made.grafs as graf}
          <p class="db-graf">{@html graf}</p>
        {/each}
      </div>

      <div class="mt-14">
        <SubscribeBox id="subscribe-foot" lang={data.lang} placement="foot" title={t.home.close.heading} />
        <p class="db-graf mt-6 max-w-3xl">{t.home.close.graf}</p>
        <p class="db-graf mt-4 font-display italic">{@html t.home.close.contact}</p>
      </div>
    </div>
  </section>
</main>
