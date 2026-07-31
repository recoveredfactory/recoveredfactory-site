---
id: "immigration-daybook"
title: "Immigration Daybook"
date: "2026-07-31"
type: "page"
hideTitle: true
description: "A data-driven national immigration newsletter. Every state, both languages, grounded in the records — not just the headlines."
byline: "Recovered Factory"
hidePreview: true
lang: "en"
---

<div class="rf-hero not-prose">
  <div class="rf-hero__inner">
    <p class="rf-eyebrow">Coming soon from Recovered Factory</p>
    <h1 class="rf-headline">
      Immigration Daybook
      <span class="rf-headline__turn">The enforcement story, in all 53 jurisdictions and two languages.</span>
    </h1>
  </div>
</div>

<p class="rf-lede">Immigration enforcement isn't one national story. It's fifty-three of them — 50 states, two territories, and D.C. — each moving at its own pace, most of them covered by local outlets nobody outside the state is reading.</p>

<p class="rf-lede">Immigration Daybook follows all of them. We search in English and Spanish, ground every brief in the underlying records rather than in whatever a national roundup said six months ago, and link back to the reporters who did the work.</p>

<p class="rf-lede">It's built on the same pipeline behind <a href="https://287g.recoveredfactory.net">287(g) Watch</a>, which we <a href="/en/one-story-two-languages">described in detail here</a>. Free, and edited by a person before it goes out.</p>

<div class="rf-subscribe not-prose">
  <SubscribeForm
    buttonClass="bg-fern-strong px-5 py-4 text-sm font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-fern sm:shrink-0"
    id="daybook-subscribe-top"
    inputClass="w-full border border-slate-900/15 bg-white/90 px-5 py-4 text-lg text-slate-800 placeholder:text-slate-400 shadow-sm sm:max-w-[28rem] sm:flex-none"
    lang="en"
    source="immigration-daybook"
    tag="newsletter:immigration-daybook"
  />
  <p class="rf-subscribe__note">Free · English and Spanish editions</p>
</div>

---

<p class="rf-kicker">What's in it</p>

<h2 class="rf-q">What actually changed, and where</h2>

New agreements, rescinded ones, council votes, lawsuits, state laws that override local choices in either direction. The record first: who signed, under which model, as of when. Then the coverage.

<h2 class="rf-q">The stories English-language search missed</h2>

Spanish is a search leg, not a translation step. A development covered mostly by Spanish-language outlets earns its place on equal footing — which means readers of both editions get stories they would otherwise never have seen.

<h2 class="rf-q">Links to the people who reported it</h2>

We follow a news ecosystem; we don't replace it. Every beat carries citations out to the local newsroom that broke it. Many of them need your support.

---

<p class="rf-kicker">How it's made</p>

Broad multilingual search into a persistent archive, then a separate composer that builds a language-neutral outline — grounded in authoritative records before it touches a headline — and writes it out natively in each language. Neither edition is a translation of the other.

Nothing reaches a reader without a human deciding it's right. The full method is [written up here](/en/one-story-two-languages), including the parts we're still unsure about.

<div class="rf-subscribe rf-subscribe--foot not-prose">
  <p class="rf-subscribe__lead">Get the first issue.</p>
  <SubscribeForm
    buttonClass="bg-fern-strong px-5 py-4 text-sm font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-fern sm:shrink-0"
    id="daybook-subscribe-foot"
    inputClass="w-full border border-slate-900/15 bg-white/90 px-5 py-4 text-lg text-slate-800 placeholder:text-slate-400 shadow-sm sm:max-w-[28rem] sm:flex-none"
    lang="en"
    source="immigration-daybook"
    tag="newsletter:immigration-daybook"
  />
</div>

<p class="rf-fineprint">Questions, corrections, or a story we're missing? <a href="mailto:davideads@recoveredfactory.net?subject=Immigration%20Daybook">Tell us.</a></p>

<script>
  import SubscribeForm from '$lib/components/SubscribeForm.svelte';
</script>

<style>
  /* ════════════════════════════════════════════════════════
     Immigration Daybook — same 1980s Apple / magazine-spread
     vocabulary as the Data Elixir page: serif display voice,
     geometric caps for labels, hairline rules, one accent.
     ════════════════════════════════════════════════════════ */

  hr {
    border: 0;
    border-top: 1px solid rgba(15, 23, 42, 0.16);
    margin: 3.5rem 0;
  }

  .rf-hero { padding: 0; margin: 0.25rem 0 2.75rem; }
  .rf-hero__inner { margin: 0; }

  @media (min-width: 860px) {
    .rf-hero { margin-top: 0.75rem; }
  }

  /* Kicker above the headline — names the thing before it sells it. */
  .rf-eyebrow {
    margin: 0 0 1.1rem;
    font-family: "Jost", sans-serif;
    font-size: 0.85rem;
    font-weight: 600;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: var(--color-fern);
  }

  .rf-headline {
    margin: 0;
    font-family: var(--font-display);
    font-weight: 400;
    font-size: clamp(2.4rem, 7vw, 4rem);
    line-height: 1.03;
    letter-spacing: -0.02em;
    color: rgb(15 24 42);
    text-wrap: balance;
  }
  /* The turn line carries the argument, so it sits smaller and lighter
     than the wordmark it follows. */
  .rf-headline__turn {
    display: block;
    margin-top: 0.55em;
    font-size: 0.44em;
    line-height: 1.25;
    letter-spacing: -0.005em;
    color: rgb(48 56 75);
  }

  .rf-lede {
    margin: 0 0 1.75rem;
    font-family: var(--font-body);
    font-size: 1.15rem;
    line-height: 1.6;
    color: rgb(48 56 75);
    text-wrap: pretty;
  }

  .rf-kicker {
    margin: 0 0 1.7rem;
    padding: 0;
    font-family: "Jost", sans-serif;
    font-size: 0.98rem;
    font-weight: 600;
    letter-spacing: 0.17em;
    line-height: 1.3;
    text-transform: uppercase;
    color: rgb(15 23 42);
  }

  /* Two classes beat the route's `.dropcap-prose h2` utilities. */
  .rf-q {
    margin: 2.75rem 0 1.1rem;
    padding: 0.1rem 0 0.1rem 0.95rem;
    border-left: 3px solid var(--color-fern);
    font-family: var(--font-display);
    font-size: clamp(1.35rem, 3.2vw, 1.8rem);
    font-weight: 600;
    line-height: 1.18;
    letter-spacing: -0.01em;
    color: rgb(15 23 42);
    text-wrap: balance;
  }

  .rf-subscribe { margin: 2rem 0 0; }
  .rf-subscribe--foot { margin-top: 2.5rem; }
  .rf-subscribe__lead {
    margin: 0 0 1rem;
    font-family: var(--font-display);
    font-style: italic;
    font-size: 1.05rem;
    line-height: 1.5;
    color: rgb(51 65 85);
  }
  .rf-subscribe__note {
    margin: 1rem 0 0;
    font-family: "Jost", sans-serif;
    font-size: 0.8rem;
    font-weight: 600;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: rgb(71 85 105);
  }

  .rf-fineprint {
    margin: 2.75rem 0 0;
    font-family: var(--font-display);
    font-style: italic;
  }
  .rf-fineprint a { color: var(--color-fern); text-decoration: none; }
  .rf-fineprint a:hover { text-decoration: underline; text-underline-offset: 4px; }
</style>
