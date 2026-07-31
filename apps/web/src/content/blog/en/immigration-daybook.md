---
id: "immigration-daybook"
title: "Immigration Daybook"
date: "2026-07-31"
type: "page"
hideTitle: true
description: "The most lovingly crafted algorithmic newsletter you'll read. Immigration enforcement in all 53 jurisdictions, Monday through Friday, in English and Spanish."
byline: "Recovered Factory"
hidePreview: true
lang: "en"
---

<div class="rf-hero not-prose">
  <div class="rf-hero__inner">
    <p class="rf-eyebrow">Coming soon from Recovered Factory</p>
    <h1 class="rf-wordmark">Immigration<br />Daybook</h1>
    <p class="rf-deck">The most lovingly crafted algorithmic newsletter you'll ever read.</p>
    <ul class="rf-facts">
      <li>Monday–Friday</li>
      <li>All 53 jurisdictions</li>
      <li>English &amp; Spanish</li>
      <li>Free</li>
    </ul>
    <div class="rf-hero__cta">
      <SubscribeForm
        buttonClass="bg-fern-strong px-6 py-4 text-sm font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-fern sm:shrink-0"
        id="daybook-subscribe-top"
        inputClass="w-full border border-white/25 bg-white px-5 py-4 text-lg text-slate-800 placeholder:text-slate-400 sm:max-w-[24rem] sm:flex-none"
        lang="en"
        layoutClass="flex flex-col gap-3 sm:flex-row sm:items-stretch sm:gap-2"
        source="immigration-daybook"
        successClass="mt-6 border border-white/20 bg-cream p-6 text-center sm:p-8"
        tag="newsletter:immigration-daybook"
      />
      <p class="rf-hero__note">No spam. Unsubscribe anytime.</p>
    </div>
  </div>
</div>

<div class="rf-body not-prose">

<p class="rf-lede">Immigration enforcement isn't one national story. It's fifty-three of them — 50 states, two territories, and D.C. — each moving at its own pace, most of them covered by local outlets nobody outside the state is reading. No newsroom in the country is staffed to follow all of it.</p>

<p class="rf-graf">So we built a system that can. It reads in English and Spanish, grounds every brief in the underlying government records instead of whatever a national roundup said six months ago, and links back to the reporters who did the work. Then a person edits it. That person is <a href="/en/introducing-recovered-factory">David Eads</a>, an immigrant himself.</p>

<p class="rf-graf">The machinery matters right now, and we're not coy about it: the full method is <a href="/en/one-story-two-languages">written up here</a>, including the parts we're still unsure about.</p>

<section class="rf-section">
  <LatestEdition
    blurb="TK — a sentence or two of what the edition covered, so a reader can judge the thing before handing over an email address."
    dateline="TK · Edition of ——"
    kicker="The latest edition"
    note="Design TK · first edition pending"
    title="TK — the headline of the most recent edition"
  />
</section>

<section class="rf-section">
  <p class="rf-kicker">What's in it</p>
  <div class="rf-spec">
    <div class="rf-spec__row">
      <p class="rf-spec__num">01</p>
      <div class="rf-spec__text">
        <p class="rf-spec__label">What changed, and where</p>
        <p class="rf-spec__body">New agreements, rescinded ones, council votes, lawsuits, and state laws that override local choices in either direction. The record first — who signed, under which model, as of when. Then the coverage.</p>
      </div>
    </div>
    <div class="rf-spec__row">
      <p class="rf-spec__num">02</p>
      <div class="rf-spec__text">
        <p class="rf-spec__label">What English-language search missed</p>
        <p class="rf-spec__body">Spanish is a search leg, not a translation step. A development covered mostly by Spanish-language outlets earns its place on equal footing, so readers of both editions get stories they would otherwise never have seen.</p>
      </div>
    </div>
    <div class="rf-spec__row">
      <p class="rf-spec__num">03</p>
      <div class="rf-spec__text">
        <p class="rf-spec__label">Links to the people who reported it</p>
        <p class="rf-spec__body">We follow a news ecosystem; we don't replace it. Every beat carries citations out to the local newsroom that broke it. Many of them need your support.</p>
      </div>
    </div>
  </div>
</section>

<section class="rf-section">
  <p class="rf-kicker">How it's made</p>
  <p class="rf-graf">Broad multilingual search into a persistent archive, then a separate composer that builds a language-neutral outline — grounded in authoritative records before it touches a headline — and writes it out natively in each language. Neither edition is a translation of the other.</p>
  <p class="rf-graf">Nothing reaches a reader without a human deciding it's right.</p>
</section>

<section class="rf-section rf-section--cta">
  <p class="rf-subscribe__lead">Start Monday.</p>
  <SubscribeForm
    buttonClass="bg-fern-strong px-6 py-4 text-sm font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-fern sm:shrink-0"
    id="daybook-subscribe-foot"
    inputClass="w-full border border-slate-900/20 bg-white px-5 py-4 text-lg text-slate-800 placeholder:text-slate-400 sm:max-w-[24rem] sm:flex-none"
    lang="en"
    layoutClass="flex flex-col gap-3 sm:flex-row sm:items-stretch sm:gap-2"
    source="immigration-daybook"
    tag="newsletter:immigration-daybook"
  />
  <p class="rf-fineprint">Questions, corrections, or a story we're missing? <a href="mailto:davideads@recoveredfactory.net?subject=Immigration%20Daybook">Tell us.</a></p>
</section>

</div>

<script>
  import LatestEdition from '$lib/components/LatestEdition.svelte';
  import SubscribeForm from '$lib/components/SubscribeForm.svelte';
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

  .rf-eyebrow {
    margin: 0 0 1.75rem;
    font-family: "Jost", sans-serif;
    font-size: 0.78rem;
    font-weight: 600;
    letter-spacing: 0.28em;
    text-transform: uppercase;
    color: var(--color-fern-strong);
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

  /* The ask lives in the plate — a reader who is already sold
     never has to scroll to act. */
  .rf-hero__cta { margin-top: 2.25rem; }

  .rf-hero__note {
    margin: 1rem 0 0;
    font-family: "Jost", sans-serif;
    font-size: 0.74rem;
    font-weight: 500;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: rgba(243, 241, 233, 0.5);
  }

  /* ── Body ─────────────────────────────────────────────────
     One wrapper owns every gap below the hero. The route puts the
     page inside `.dropcap-prose space-y-6`, which was adding a
     1.5rem top margin to each top-level block and fighting the
     margins set here — the result read as sloppy. With a single
     child, space-y has nothing to act on and the rhythm below is
     entirely the scale in this block. */
  .rf-body { display: flow-root; }

  .rf-lede {
    margin: 0;
    font-family: var(--font-body);
    font-size: clamp(1.2rem, 2.2vw, 1.38rem);
    line-height: 1.5;
    font-weight: 500;
    color: rgb(15 23 42);
    text-wrap: pretty;
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

  .rf-fineprint {
    margin: 2rem 0 0;
    font-family: var(--font-display);
    font-style: italic;
    color: rgb(71 85 105);
  }
</style>
