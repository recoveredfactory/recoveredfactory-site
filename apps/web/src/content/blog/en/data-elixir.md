---
id: "data-elixir"
title: "Our public-interest data is free. Our expertise is for hire."
date: "2026-05-30"
type: "page"
hideTitle: true
description: "A landing page for Recovered Factory readers arriving from Data Elixir."
byline: "Recovered Factory"
hidePreview: true
lang: "en"
---

<h1 class="rf-headline">
  Our public‑interest <b>data</b> is free.
  <span class="rf-headline__turn">Our <b>expertise</b> is for hire.</span>
</h1>

---

<p id="work" class="rf-kicker no-drop">What we'll build for you</p>

<BuildRotator items={buildItems} />

Your data. Your tools. Your terms. We open-source *our* work; what we build for you is forever yours.

<div class="rf-badge-wrap not-prose">
  <a class="rf-badge" href="mailto:davideads@recoveredfactory.net?subject=Work%20with%20Recovered%20Factory">Work with us →</a>
  <span class="rf-badge-note">Tell us what you need built.</span>
</div>

<!--
<div class="rf-strip not-prose">
  <div class="rf-strip__track">
    <img class="rf-strip__tile" src="/images/vsr.recoveredfactory.net_en-home.png" alt="" />
    <img class="rf-strip__tile" src="/images/287g-loop-poster.jpg" alt="" />
    <img class="rf-strip__tile" src="/images/vsr-screenshot-agencies.png" alt="" />
    <img class="rf-strip__tile" src="/images/pando_forest_01.jpg" alt="" />
    <img class="rf-strip__tile" src="/images/rf_25years_homepage.png" alt="" />
  </div>
</div>
//-->
---

<p class="rf-kicker">Support the future of data journalism</p>

We offer our services commercially so that our journalism stays free. We want to answer to the people who use the work, whether that's a client or the audiences using our public tools. It's an old-fashioned approach to distinctly modern needs: while the old industry waits for a savior to rescue it at the last minute, we serve real needs for a fair price.

We're not the next nonprofit newsroom. We're what comes after it.

---

<p class="rf-kicker">Don't have a project? You can still support Recovered Factory</p>

Some people simply believe public data should stay public, and want to help sustain this kind of work rather than see it chronically overlooked by traditional journalism and civil society funders.

We think you're out there, because we know the type — we *are* the type. You read the methodology. You download the data. You open a notebook and start exploring. Maybe you've given to newsrooms before, not because of a high-minded email guilting you into it, but because you saw open, rigorous, public-interest work and wanted more of it to exist.

Every publication is accountable to someone. We want to be accountable to you, not a foundation named for some Gilded Age industrialist with priorities that will change next year, because we think it's better to answer to the people who use the work and understand its value.


_buttons go here_

---

<p class="rf-kicker">Our projects (and skills)</p>

Our project's aren't charity, they're proof. Proof you can trust us. Proof you can criticize us. Proof we can build and maintain tools that work. It shows what a demo can't. When we build an MCP server, user privacy is handled from the start, because we've been down this road before. When we ship a feature, we test whether it did what we hoped. We may be new to your problem, but we know exactly what to ask.

<div class="rf-cards-wrap not-prose relative left-1/2 right-1/2 -mx-[50vw] w-screen">
  <div class="rf-cards">
    <article class="rf-card">
      <a class="rf-card__media" href="https://recoveredfactory.net/en/announcing-287g-explorer">
        <img class="rf-card__poster" src="/images/287g-loop-poster.jpg" alt="" />
        <video class="rf-card__video" autoplay muted loop playsinline poster="/images/287g-loop-poster.jpg">
          <source src="/videos/287g-loop.mp4" type="video/mp4" />
        </video>
      </a>
      <h3 class="rf-card__name"><a href="https://recoveredfactory.net/en/announcing-287g-explorer">287(g) Watch</a></h3>
      <p class="rf-card__deck">A living national map of which sheriffs deputized themselves for federal immigration enforcement. English and Spanish.</p>
      <p class="rf-card__craft">We use Sveltekit to power the site and generate video and still assets under a Creative Commons license to embed, broadcast, and print. We tapped an active but scattered ecosystem and gave it the sweeping national view it was missing. MCP capabilities, including the ability to generate public-records requests for any agency, are coming soon.</p>
      <a class="rf-card__link" href="https://recoveredfactory.net/en/announcing-287g-explorer">Explore →</a>
    </article>
    <article class="rf-card">
      <a class="rf-card__media" href="https://recoveredfactory.net/en/announcing-missouri-vehicle-stops">
        <img class="rf-card__img" src="/images/vsr.recoveredfactory.net_en-stl-scatter.png" alt="A disparity chart pulled straight from the Missouri Vehicle Stops data" />
      </a>
      <h3 class="rf-card__name"><a href="https://recoveredfactory.net/en/announcing-missouri-vehicle-stops">Missouri Vehicle Stops</a></h3>
      <p class="rf-card__deck">Twenty-five years of who Missouri police pulled over, by agency and by race — drawn out of state reports that bury one important facet of daily life.</p>
      <p class="rf-card__craft">We built a Dagster pipeline to extract and enrich the numbers from PDFs, test the output, and produce usable data; a custom SvelteKit front end to explore it; and an MCP server to query it in plain language through ChatGPT and Claude.</p>
      <a class="rf-card__link" href="https://recoveredfactory.net/en/announcing-missouri-vehicle-stops">Explore →</a>
    </article>
    <article class="rf-card">
      <span class="rf-card__media">
        <img class="rf-card__img" src="/images/pando_forest_01.jpg" alt="A lush single map layer — a census of trees" />
      </span>
      <h3 class="rf-card__name">Mapping Cali, Colombia</h3>
      <p class="rf-card__deck">354 map layers — including 3D elevation — built as a multilingual tool to teach a primarily Spanish-speaking audience what the modern geospatial stack can do.</p>
      <p class="rf-card__craft">We freed the layers off an aging MapServer with an exotic projection, modernized them to MapLibre and PMTiles, made them searchable, and tracked down the data dictionary — well, some of it. Infrastructure costs only a few dollars a month. We're fluent in this stack end to end, from geocoding exceptionally messy addresses to animating thousands of points.</p>
    </article>
    <article class="rf-card">
      <a class="rf-card__media" href="https://recoveredfactory.net/en">
        <img class="rf-card__img" src="/images/rf_25years_homepage.png" alt="The Recovered Factory homepage" />
      </a>
      <h3 class="rf-card__name"><a href="https://recoveredfactory.net/en">Recovered Factory</a></h3>
      <p class="rf-card__deck">This site itself — the publication and open archive that ties the projects together, free to read and download.</p>
      <p class="rf-card__craft">A fully bilingual SvelteKit site we designed, built, and run ourselves for a few dollars a month. Every project here lives here. Subscribe and you'll see the next one the day it ships.</p>
      <a class="rf-card__link" href="https://recoveredfactory.net/en">Visit →</a>
    </article>
  </div>

  <div class="rf-before">
    <h3 class="rf-card__name">Before this</h3>
    <p class="rf-card__deck">The work we did in past lives</p>
    <p class="rf-card__craft">TK TK TK</p>
  </div>
</div>

---

<script>
  import BuildRotator from '$lib/components/BuildRotator.svelte';

  // Copy stays in the content file; the component handles the motion.
  const buildItems = [
    'A pipeline.',
    'Analysis notebooks.',
    'An explorer people actually use.',
    'Data liberated from a PDF.',
    'An MCP server you can question in plain language.',
    'An AI agent that surfaces themes from a huge corpus — with a human at the wheel.',
    'An amazing animated map.',
    'Software that turns your web content into spectacular images and video.',
  ];
</script>

<style>
  /* ════════════════════════════════════════════════════════
     Data Elixir — 1980s Apple / magazine-spread treatment.
     Serif voice (Lora), geometric labels (Jost / Futura revival),
     hairline rules, true-color plates, one crimson accent.
     ════════════════════════════════════════════════════════ */

  /* Hairline rule — the single recurring divider */
  hr {
    border: 0;
    border-top: 1px solid rgba(15, 23, 42, 0.16);
    margin: 3.5rem 0;
  }

  /* Two-line display headline. Block span turns the second line
     ("Our expertise is for hire.") with a smidge of space above. */
  .rf-headline {
    margin: 0;
    font-family: var(--font-display);
    font-weight: 400;
    font-size: clamp(2.2rem, 6.2vw, 4rem);
    line-height: 1.03;
    letter-spacing: -0.02em;
    /* color: #444; */
    color: rgb(48 56 75);
    /* color: rgb(15 23 42); */
    text-wrap: balance;
  }
  .rf-headline b { font-weight: 900;  color: rgb(15 24 42);}
  .rf-headline__turn { display: block; margin-top: 0.5em; }

  /* Hero strip — a short row of portrait product views. MOBILE
     ONLY: it reads great on a phone but felt cramped on desktop,
     so it's hidden there. 4 tiles on mobile, top-cropped so each
     reads as a little "view."
     PLACEHOLDER ASSETS: these are the screenshots on hand (mostly
     desktop captures, top-cropped). Replace with real mobile-width
     captures of each product for the intended look. */
  .rf-strip { display: none; }
  .rf-strip__track {
    display: flex;
    gap: 0.6rem;
  }
  .rf-strip__tile {
    flex: 1 1 0;
    min-width: 0;
    height: 165px;
    object-fit: cover;
    object-position: top center;
    border: 1px solid rgba(15, 23, 42, 0.14);
    background: #fff;
    box-shadow: 0 2px 6px rgba(15, 23, 42, 0.1);
    display: block;
  }
  @media (max-width: 639px) {
    .rf-strip { display: block; margin: 0.25rem 0 1.75rem; }
    .rf-strip__tile:nth-child(n + 5) { display: none; }
  }

  /* Jump link under the headline */
  .rf-jump { margin: 0.25rem 0 1.75rem; }
  .rf-jump a {
    font-family: "Jost", sans-serif;
    font-size: 0.82rem;
    font-weight: 600;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--color-fern);
    text-decoration: none;
  }
  .rf-jump a:hover { text-decoration: underline; text-underline-offset: 5px; }

  /* Section kickers — geometric caps with a Bauhaus left rule.
     Border-left (not a centered square) so it spans cleanly when
     the label wraps on narrow screens. */
  .rf-kicker {
    margin: 0 0 1.7rem;
    padding: 0.15rem 0 0.15rem 0.95rem;
    border-left: 3px solid var(--color-fern);
    font-family: "Jost", sans-serif;
    font-size: 0.98rem;
    font-weight: 600;
    letter-spacing: 0.17em;
    line-height: 1.3;
    text-transform: uppercase;
    color: rgb(15 23 42);
  }

  /* ── Project cards: flat plates, generous air, no boxes ── */
  .rf-cards-wrap { padding: 0 1.5rem; }
  @media (min-width: 640px) { .rf-cards-wrap { padding: 0 2.5rem; } }
  @media (min-width: 1024px) { .rf-cards-wrap { padding: 0 4rem; } }
  .rf-cards {
    max-width: 70rem;
    margin: 0 auto;
    display: grid;
    gap: 3rem 3.5rem;
  }
  @media (min-width: 760px) {
    .rf-cards { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  }
  .rf-card { display: flex; flex-direction: column; }

  .rf-card__media {
    position: relative;
    display: block;
    aspect-ratio: 3 / 2;
    overflow: hidden;
    border: 1px solid rgba(15, 23, 42, 0.18);
    background: #efece2;
    margin-bottom: 1.4rem;
  }
  .rf-card__media img,
  .rf-card__media video {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
  .rf-card__poster { z-index: 0; }
  .rf-card__video { z-index: 1; }

  .rf-card__name {
    margin: 0 0 0.5rem;
    font-family: var(--font-display);
    font-size: 1.7rem;
    font-weight: 600;
    line-height: 1.1;
    letter-spacing: -0.01em;
    color: rgb(15 23 42);
  }
  .rf-card__name a { color: inherit; text-decoration: none; }
  .rf-card__name a:hover { color: var(--color-fern); }

  .rf-card__deck {
    margin: 0 0 0.9rem;
    font-family: var(--font-display);
    font-style: italic;
    font-size: 1.08rem;
    line-height: 1.45;
    color: rgb(51 65 85);
  }
  .rf-card__craft {
    margin: 0;
    font-family: var(--font-body);
    font-size: 0.92rem;
    line-height: 1.6;
    color: rgb(71 85 105);
  }
  .rf-card__link {
    margin-top: 1rem;
    font-family: "Jost", sans-serif;
    font-size: 0.78rem;
    font-weight: 600;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--color-fern);
    text-decoration: none;
  }
  .rf-card__link:hover { text-decoration: underline; text-underline-offset: 5px; }

  /* "Before this" — centered colophon below the project grid.
     No image to represent it, so words carry it, set apart by a
     hairline and centered on desktop like an end-note. */
  .rf-before {
    max-width: 42rem;
    margin: 3.25rem auto 0;
    padding-top: 1.7rem;
    border-top: 1px solid rgba(15, 23, 42, 0.18);
  }
  @media (min-width: 760px) { .rf-before { text-align: center; } }
  .rf-before .rf-card__name { margin: 0 0 0.5rem; }

  /* ── Work-with-us badge: a printed crimson stamp ──────── */
  .rf-badge-wrap {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 0.6rem 1.1rem;
    margin: 2.25rem 0 0;
  }
  .rf-badge {
    display: inline-block;
    padding: 0.85rem 1.4rem;
    background: var(--color-fern);
    color: #fff;
    font-family: "Jost", sans-serif;
    font-size: 0.86rem;
    font-weight: 600;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    text-decoration: none;
    transition: background-color 0.18s ease;
  }
  .rf-badge:hover { background: #b91540; }
  .rf-badge-note {
    font-family: var(--font-display);
    font-style: italic;
    font-size: 1rem;
    color: rgb(71 85 105);
  }

  @media (prefers-reduced-motion: reduce) {
    .rf-card__video { display: none; }
    .rf-badge { transition: none; }
  }
</style>
