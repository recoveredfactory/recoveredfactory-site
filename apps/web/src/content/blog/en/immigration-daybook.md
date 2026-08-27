---
id: "immigration-daybook"
title: "Immigration Daybook"
date: "2026-07-31"
type: "page"
hideTitle: true
description: "A weekday rundown of the immigration system — and a calendar of what's coming. Effective dates, comment deadlines, court dates. Every edition online."
byline: "Recovered Factory"
previewImage: "/images/immigration-daybook-og-en.png"
hidePreview: true
lang: "en"
---

<div class="rf-hero not-prose">
  <div class="rf-hero__inner">
    <h1 class="rf-wordmark">Immigration<br />Daybook</h1>
    <p class="rf-deck">{DECKS[ACTIVE_DECK]}</p>
    <ul class="rf-facts">
      <li>Monday–Friday</li>
      <li>English &amp; Spanish</li>
      <li><a href="/en/daybook">Every edition online →</a></li>
    </ul>
    <div class="rf-hero__cta">
      <SubscribeForm
        buttonClass="bg-fern-strong px-6 py-4 text-sm font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-fern sm:shrink-0"
        id="daybook-subscribe-top"
        inputClass="w-full border border-white/25 bg-white px-5 py-4 text-lg text-slate-800 placeholder:text-slate-400 sm:max-w-[24rem] sm:flex-none"
        lang="en"
        layoutClass="flex flex-col gap-3 sm:flex-row sm:items-stretch sm:gap-2"
        meta={{ deck: ACTIVE_DECK, placement: 'hero' }}
        source="immigration-daybook"
        successClass="mt-6 border border-white/20 bg-cream p-6 text-center sm:p-8"
        tag="newsletter:immigration-daybook"
      />
      <ul class="rf-hero__meta">
        <li>Started Aug. 5</li>
        <li>Edited by David Eads</li>
      </ul>
    </div>
  </div>
</div>

<div class="rf-body not-prose">

<p class="rf-lede">On Sept. 18, <a href="https://www.federalregister.gov/documents/2026/07/20/2026-14539/public-charge-ground-of-inadmissibility">a DHS rule</a> widens the public charge test for anyone applying for a green card or for admission to the U.S. — whether an officer thinks you are likely to end up depending on government support. If you're applying, that's a standard you have to prepare for. If you're a lawyer, that's a week of phone calls you'd rather schedule than receive. If you're a reporter, that's a story you want to file on the 17th, not the 19th.</p>

<p class="rf-graf">Maybe you already knew, because you track this stuff yourself. A lot of people don't, and shouldn't have to.</p>

<p class="rf-graf">That's what we built Immigration Daybook to solve: a broad, daily view of news about U.S. immigration with the key upcoming events front and center.</p>

<p class="rf-graf">There's a lot of metaphorical fire in the U.S. immigration system right now, but there's even more smoke: thousands of articles, videos, threads, and posts a day, often covering actions that seem designed to create confusion, chaos, and spectacle. We're using algorithms to show where the smoke is thickest and using our judgment and expertise to reveal what really matters.</p>

{#if latestEdition}
<section class="rf-section">
  <LatestEdition
    archiveHref="/en/daybook"
    archiveLabel="All editions →"
    blurb={latestEdition.description}
    dateline={latestEdition.dateline}
    href={latestEdition.href}
    kicker="Latest edition"
    title={latestEdition.title}
  />
</section>
{/if}

<section class="rf-section">
  <p class="rf-kicker">What's in it</p>
  <div class="rf-spec">
    <div class="rf-spec__row">
      <p class="rf-spec__num">01</p>
      <div class="rf-spec__text">
        <p class="rf-spec__label">A calendar of what's coming</p>
        <p class="rf-spec__body">Effective dates, comment deadlines, court dates — all backed by primary sources and links to expert analysis. The rules that quietly take force while everyone's arguing about the outrage of the day.</p>
      </div>
    </div>
    <div class="rf-spec__row">
      <p class="rf-spec__num">02</p>
      <div class="rf-spec__text">
        <p class="rf-spec__label">The day's rundown, grounded in reporting and evidence</p>
        <p class="rf-spec__body">When we cite links about deportation, we check them against the <a href="https://deportationdata.org">Deportation Data Project</a>. A reported rule change is checked against the <a href="https://www.federalregister.gov">Federal Register</a> and <a href="https://www.uscis.gov/policy-manual">USCIS Policy Manual</a>.</p>
      </div>
    </div>
    <div class="rf-spec__row">
      <p class="rf-spec__num">03</p>
      <div class="rf-spec__text">
        <p class="rf-spec__label">The headlines… from English <em>and</em> Spanish media</p>
        <p class="rf-spec__body">Our innovative technology goes beyond the big stories and prestige investigations you probably saw. Spanish language TV news, deeply technical policy blogs, Substack newsletters, social video — from nerdy law blogs to YouTube coverage of ICE raids, we're watching and bringing you what's relevant.</p>
      </div>
    </div>
  </div>

  <div class="rf-shots-wrap">
    <div class="rf-shots">
      <figure class="rf-shots__item">
        <img
          src="/images/immigration-daybook-edition-en.png"
          alt="The top of an Immigration Daybook edition dated August 3, 2026, a Recovered Factory project. The lead story reports that a federal contract funding legal aid for unaccompanied migrant children has expired, leaving tens of thousands of minors facing immigration court without attorneys. Two bolded follow-up items each end in source links: NBC Chicago and Telemundo Washington DC, then El Paso Matters, Los Angeles Times, and Univision."
          loading="lazy"
          decoding="async"
        />
        <figcaption class="rf-shots__cap">The rundown: what happened, what it means, and who reported it. (Screenshots taken from a recent prototype.)</figcaption>
      </figure>
      <figure class="rf-shots__item">
        <img
          src="/images/immigration-daybook-upcoming-en.png"
          alt="The Upcoming section of the same edition, a dated calendar split into TODAY and THIS WEEK. Two Aug. 3 entries cover new H-2A wage rates and a proposed visa bond rule; an Aug. 4 entry covers a court decision on Temporary Protected Status renewals; an Aug. 5 entry covers a decision on shortened work permits for asylum seekers. Each carries a source link to the Federal Register or WR Immigration."
          loading="lazy"
          decoding="async"
        />
        <figcaption class="rf-shots__cap">The calendar: What's coming, with the primary source or expert citation for each date.</figcaption>
      </figure>
    </div>
  </div>
</section>

<section class="rf-section">
  <p class="rf-kicker">How it's made</p>
  <p class="rf-graf">This newsletter is proudly algorithmic, and we intend to make it the most carefully crafted algorithmic writing you've ever read. The bet isn't "AI reads the news" — lots of people are doing that, and a lot of it is slop. The bet is that a newsroom can have a brain: something you can actually <em>query</em> about everything it knows, that shows its work instead of asking you to trust it.</p>
  <p class="rf-graf">The system reads the day's news and surfaces the patterns it finds. Then a person edits — what it means, whether it's accurate, and who covered it best. That person is <a href="/en/introducing-recovered-factory">David Eads</a>, a data journalist with years of experience covering immigration for publications including NPR and The Marshall Project.</p>
</section>

<section class="rf-section rf-section--cta">
  <p class="rf-subscribe__lead">Start today.</p>
  <p class="rf-graf rf-pilot">August was a free pilot; we're still figuring out what this should be and how to sustain it. We'd rather have you in the room for the early version than polish it in a vacuum.</p>
  <SubscribeForm
    buttonClass="bg-fern-strong px-6 py-4 text-sm font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-fern sm:shrink-0"
    id="daybook-subscribe-foot"
    inputClass="w-full border border-slate-900/20 bg-white px-5 py-4 text-lg text-slate-800 placeholder:text-slate-400 sm:max-w-[24rem] sm:flex-none"
    lang="en"
    layoutClass="flex flex-col gap-3 sm:flex-row sm:items-stretch sm:gap-2"
    meta={{ deck: ACTIVE_DECK, placement: 'foot' }}
    source="immigration-daybook"
    tag="newsletter:immigration-daybook"
  />
  <p class="rf-fineprint">Questions, corrections, or a story we're missing? <a href="mailto:davideads@recoveredfactory.net?subject=Immigration%20Daybook">Tell us.</a></p>
</section>

</div>

<script>
  import LatestEdition from '$lib/components/LatestEdition.svelte';
  import SubscribeForm from '$lib/components/SubscribeForm.svelte';

  /**
   * The newest published edition, resolved server-side in
   * [lang]/[slug]/+page.server.ts. Null until the first one ships — and in
   * production it stays null through the pilot, so the plate simply is not
   * there rather than standing empty.
   */
  let { latestEdition = null } = $props();

  /**
   * Deck variants under test. One runs at a time — rotating per reload would
   * show the same visitor different lines and make a signup impossible to
   * attribute. Change ACTIVE_DECK to run a different message; the id rides
   * along on every subscribe event so the result can be read back.
   *
   * Keep the ids in step with the Spanish page so a test spans both editions.
   */
  const DECKS = {
    evidence:
      'We turn the spectacle of the immigration system into evidence, every weekday.',
    raids:
      'The raids — and the policies that authorized them. Every weekday, in English and Spanish.',
    weekday:
      'Every weekday we read the immigration news in two languages — the procedure, the litigation, and the enforcement everyone’s bracing for.',
    rule:
      'For people who need to know what the rule says, not just what happened. The day’s immigration news in English and Spanish.',
    thesis:
      'Immigration enforcement makes the headlines. The procedure decides the outcome. We follow both, every weekday, in two languages.',
    machine:
      'A machine reads hundreds of stories in two languages. We decide what matters. You get it every weekday.',
    // From the announcement draft — these say what the thing actually is.
    calendar:
      'A rundown of what happened in the immigration system — and a calendar of what’s coming.',
    dates:
      'Effective dates, comment deadlines, court dates — before they land, not after.',
  };

  const ACTIVE_DECK = 'evidence';
</script>

<style>
  /* ════════════════════════════════════════════════════════
     Immigration Daybook — loud end of the house style. Full-bleed
     ink plate, wordmark at poster scale, hard edges, one crimson.
     Bauhaus / 1980s-Apple vocabulary rather than a soft SaaS hero:
     no rounded corners, no gradients, no drop shadows.

     Deliberately still on the Recovered Factory faces (Lora +
     Jost). The newsletter itself is expected to anchor on Futura;
     this page stays in house style until that call is made.
     ════════════════════════════════════════════════════════ */

  /* ── Hero ─────────────────────────────────────────────────
     Breaks the article column to full width (same trick as the
     Data Elixir project strip), then re-establishes the text
     measure inside so the wordmark's left edge lines up with the
     body copy below it. */
  .rf-hero {
    position: relative;
    left: 50%;
    right: 50%;
    width: 100vw;
    margin-left: -50vw;
    margin-right: -50vw;
    margin-top: -0.75rem;
    margin-bottom: 3.5rem;
    background: #12161d;
    color: var(--color-cream);
  }

  .rf-hero__inner {
    max-width: 42rem;
    margin: 0 auto;
    padding: 3.5rem 1.5rem 3.25rem;
  }

  @media (min-width: 640px) {
    .rf-hero__inner { padding: 5rem 2.5rem 4.25rem; }
  }

  @media (min-width: 1024px) {
    .rf-hero__inner { padding: 6.5rem 4rem 5rem; }
    .rf-hero { margin-bottom: 4.5rem; }
  }

  /* Poster scale. The line break is authored in the markup so the
     two words stack deliberately rather than wrapping wherever the
     viewport happens to put them. */
  .rf-wordmark {
    margin: 0;
    font-family: var(--font-display);
    font-weight: 600;
    font-size: clamp(3rem, 12vw, 6rem);
    line-height: 0.94;
    letter-spacing: -0.035em;
    color: var(--color-cream);
  }

  .rf-deck {
    margin: 2rem 0 0;
    max-width: 30rem;
    font-family: var(--font-display);
    font-size: clamp(1.25rem, 3vw, 1.7rem);
    font-weight: 400;
    font-style: italic;
    line-height: 1.35;
    color: rgba(243, 241, 233, 0.82);
    text-wrap: pretty;
  }

  /* Fact strip — the terms of the deal, stated flatly, sitting
     between the pitch and the ask. Crimson rule instead of
     bullets. */
  .rf-facts {
    display: flex;
    flex-wrap: wrap;
    gap: 0.6rem 1.4rem;
    margin: 2.25rem 0 0;
    padding: 1.4rem 0 0;
    border-top: 2px solid var(--color-fern-strong);
    list-style: none;
    font-family: "Jost", sans-serif;
    font-size: 0.82rem;
    font-weight: 600;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: rgba(243, 241, 233, 0.72);
  }
  .rf-facts li { margin: 0; }

  /* The last fact is a destination rather than a term: every edition is on the
     site, so it links there. Set brighter than the two beside it — a fact you
     can act on should not be the same weight as one you can only read. */
  .rf-facts a {
    color: rgba(243, 241, 233, 0.95);
    text-decoration: none;
    border-bottom: 1px solid rgba(243, 241, 233, 0.45);
    padding-bottom: 0.15rem;
    transition: border-color 0.15s;
  }
  .rf-facts a:hover {
    border-bottom-color: rgba(243, 241, 233, 0.95);
  }

  /* The ask lives in the plate — a reader who is already sold
     never has to scroll to act. */
  .rf-hero__cta { margin-top: 2.25rem; }

  /* Terms that belong to the ask rather than the pitch — the launch date and
     the byline — set under the form instead of above the headline. */
  .rf-hero__meta {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem 1.5rem;
    margin: 1.15rem 0 0;
    padding: 0;
    list-style: none;
    font-family: "Jost", sans-serif;
    font-size: 0.74rem;
    font-weight: 600;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: rgba(243, 241, 233, 0.52);
  }
  .rf-hero__meta li { margin: 0; }

  /* ── Body ─────────────────────────────────────────────────
     One wrapper owns every gap below the hero. The route puts the
     page inside `.dropcap-prose space-y-6`, which was adding a
     1.5rem top margin to each top-level block and fighting the
     margins set here — the result read as sloppy. With a single
     child, space-y has nothing to act on and the rhythm below is
     entirely the scale in this block. */
  .rf-body { display: flow-root; }

  /* Sized as body copy, not as a standfirst — the dropcap does the work of
     marking the opening, so the type does not also have to. */
  .rf-lede {
    margin: 0;
    font-family: var(--font-body);
    font-size: 1.05rem;
    line-height: 1.68;
    font-weight: 400;
    color: rgb(15 23 42);
    text-wrap: pretty;
  }

  /* Follows the house dropcap in app.css — Lora against the Inter body, with
     `initial-letter` where it lands and a float fallback where it does not.
     Sized to this lede rather than reusing the prose values, and defined here
     because .rf-body is `not-prose` and never sees .dropcap-prose. */
  .rf-lede::first-letter {
    font-family: var(--font-display);
    font-style: normal;
    font-weight: 500;
    color: rgb(51 65 85);
    float: left;
    font-size: 2.5rem;
    line-height: 0.9;
    padding: 0.2rem 0.4rem 0 0;
  }

  @supports (initial-letter: 2) or (-webkit-initial-letter: 2) {
    .rf-lede::first-letter {
      float: none;
      font-size: inherit;
      line-height: inherit;
      padding: 0;
      margin-right: 0.4rem;
      initial-letter: 2;
      -webkit-initial-letter: 2;
    }
  }

  .rf-graf {
    margin: 0;
    font-family: var(--font-body);
    font-size: 1.05rem;
    line-height: 1.68;
    color: rgb(51 65 85);
    text-wrap: pretty;
  }

  .rf-lede + .rf-graf { margin-top: 1.5rem; }
  .rf-graf + .rf-graf { margin-top: 1.25rem; }

  .rf-body a {
    color: var(--color-link);
    text-decoration: underline;
    text-underline-offset: 3px;
  }
  .rf-body a:hover { color: var(--color-fern); }

  /* ── Sections ─────────────────────────────────────────────
     One divider treatment for the whole page. The rule belongs to
     the section it opens, so a section can never end up with a
     stray line above and a different gap below. */
  .rf-section {
    margin-top: 3.25rem;
    padding-top: 3.25rem;
    border-top: 1px solid rgba(15, 23, 42, 0.2);
  }

  @media (min-width: 640px) {
    .rf-section {
      margin-top: 3.75rem;
      padding-top: 3.75rem;
    }
  }

  .rf-kicker {
    margin: 0 0 1.1rem;
    font-family: "Jost", sans-serif;
    font-size: 1rem;
    font-weight: 700;
    letter-spacing: 0.2em;
    line-height: 1.3;
    text-transform: uppercase;
    color: rgb(15 23 42);
  }

  /* ── Spec list ────────────────────────────────────────────
     Numbered rows, label in display serif, body alongside. Uses
     the horizontal space instead of stacking three headed
     sections with two lines of body under each. No border on the
     top or the last row — the section rule above already closes
     the block, and doubling them was part of the mess. */
  .rf-spec { margin: 0; }

  .rf-spec__row {
    display: grid;
    grid-template-columns: 2.25rem minmax(0, 1fr);
    gap: 0 1.25rem;
    padding: 1.5rem 0;
    border-bottom: 1px solid rgba(15, 23, 42, 0.14);
  }
  .rf-spec__row:first-child { padding-top: 0; }
  .rf-spec__row:last-child { border-bottom: 0; padding-bottom: 0; }

  @media (min-width: 640px) {
    .rf-spec__row {
      grid-template-columns: 3.25rem minmax(0, 1fr);
      gap: 0 2rem;
      padding: 1.85rem 0;
    }
  }

  .rf-spec__num {
    margin: 0;
    font-family: "Jost", sans-serif;
    font-size: 1rem;
    font-weight: 700;
    line-height: 1.5;
    letter-spacing: 0.04em;
    color: var(--color-fern);
    font-variant-numeric: tabular-nums;
  }

  .rf-spec__text { min-width: 0; }

  .rf-spec__label {
    margin: 0 0 0.5rem;
    font-family: var(--font-display);
    font-size: clamp(1.12rem, 2.4vw, 1.3rem);
    font-weight: 600;
    line-height: 1.28;
    letter-spacing: -0.01em;
    color: rgb(15 23 42);
    text-wrap: balance;
  }

  .rf-spec__body {
    margin: 0;
    font-family: var(--font-body);
    font-size: 0.98rem;
    line-height: 1.62;
    color: rgb(71 85 105);
    text-wrap: pretty;
  }

  /* ── Closing ask ──────────────────────────────────────── */
  .rf-subscribe__lead {
    margin: 0 0 1.25rem;
    font-family: var(--font-display);
    font-size: clamp(1.6rem, 3.6vw, 2.1rem);
    font-weight: 600;
    line-height: 1.18;
    letter-spacing: -0.02em;
    color: rgb(15 23 42);
  }

  /* Sits between the closing headline and the form, so it reads as terms
     rather than as another paragraph of pitch. */
  .rf-pilot {
    margin: 0 0 1.5rem;
    font-size: 1rem;
    color: rgb(71 85 105);
  }

  .rf-fineprint {
    margin: 2rem 0 0;
    font-family: var(--font-display);
    font-style: italic;
    color: rgb(71 85 105);
  }

  /* ── Edition screenshots ──────────────────────────────────
     Two shots of the same edition side by side, widened past the
     text column. Negative margins are measured from the column
     itself rather than the viewport, so the pair cannot drift off
     centre. Both files share one canvas, so the columns match
     height without a rule forcing it. */
  .rf-shots-wrap {
    margin: 2.75rem 0 0;
  }
  @media (min-width: 1024px) {
    .rf-shots-wrap { margin-left: -6rem; margin-right: -6rem; }
  }
  @media (min-width: 1280px) {
    .rf-shots-wrap { margin-left: -10rem; margin-right: -10rem; }
  }
  .rf-shots {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1.75rem;
    max-width: 34rem;
    margin: 0 auto;
  }
  @media (min-width: 900px) {
    .rf-shots {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 2rem;
      max-width: none;
    }
  }
  .rf-shots__item { margin: 0; display: flex; flex-direction: column; }
  .rf-shots__item img {
    display: block;
    width: 100%;
    height: auto;
    /* White shots on a cream page need an edge or they bleed into it. */
    border: 1px solid rgba(15, 23, 42, 0.15);
  }
  .rf-shots__cap {
    margin-top: 0.65rem;
    font-family: var(--font-body);
    font-size: 0.78rem;
    line-height: 1.5;
    color: rgb(100 116 139);
  }
</style>
