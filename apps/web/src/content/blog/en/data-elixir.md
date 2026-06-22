---
id: "data-elixir"
title: "A newsletter for people who fight with data."
date: "2026-05-30"
type: "page"
hideTitle: true
description: "Dispatches from the edge of data journalism's encounter with AI — rigorous, public-interest work on real, messy administrative data, built in the open. Subscribe."
byline: "Recovered Factory"
hidePreview: true
lang: "en"
---

<div class="rf-hero not-prose relative left-1/2 right-1/2 -mx-[50vw] w-screen">
  <div class="rf-hero__inner">
    <h1 class="rf-headline">
      You fight with<br />data for a living.
      <span class="rf-headline__turn">So do we…<br />in the open.</span>
    </h1>
    <div class="rf-heroshots">
      <img src="/images/287g-loop-poster.jpg" alt="The 287(g) national map" />
      <img src="/images/vsr.recoveredfactory.net_en-stl-scatter.png" alt="A disparity chart from the vehicle-stops data" />
      <img src="/images/pando_forest_01.jpg" alt="A map layer from the Cali, Colombia project" />
      <img src="/images/rf_25years_homepage.png" alt="The Recovered Factory homepage" />
    </div>
  </div>
</div>

<p class="rf-lede no-drop">We're independent data journalists navigating a world swimming in messy data in the midst of an industry disrupted by AI. We think Data Elixir readers can relate.</p>

<p class="rf-lede">That's why we're building open data products and writing dispatches with practical advice and open discussion of our strategy and challenges. We're part of an emerging wave of creators building the future by returning to broader values of transparency and honesty instead of devotion to dying forms and self-congratulatory myths.</p>

<p class="rf-lede">Subscribe to join the conversation: We'll share what we're learning through our projects, and we want to learn from you and work with you to make those projects better.</p>

<div class="rf-subscribe not-prose">
  <SubscribeForm lang="en" source="data-elixir" id="subscribe-top" />
</div>

---

<p class="rf-kicker">What we're asking ourselves</p>

<h2 class="rf-q">How do we get more out of the data we already have?</h2>

By being lazy in the right places. The leverage usually isn't more effort — it's automation, and it hides in assets you already have. A finished dataset can become a server you [interrogate in plain language](https://recoveredfactory.net/en/announcing-missouri-vehicle-stops); a pipeline you tend once keeps working while you sleep. We build the expressive tools for the people who want to go deep, and our [dispatches](https://recoveredfactory.net) hand over the whole workflow so you can rebuild it yourself — or describe it to an AI. Spend the slow hour setting it up once; collect the fast minutes forever.

<h2 class="rf-q">How do we make data more accessible?</h2>

By cutting the same numbers into more front doors. The data behind a deep tool can be re-rendered for everyone else, automatically and on a schedule — a looping map, a short video, a poster you can print. And we build every project in [English and Spanish](https://recoveredfactory.net/es), interface and methodology alike, because accessible has to include the language people actually read. One set of facts; many ways in.

<h2 class="rf-q">What does rigor mean in a stochastic world?</h2>

Old-school journalists wanted certainty, a smoking gun, a single clear finding. Working with administrative data at the ambitious scale required to understand our world was never going to give them that. Data Elixir readers know what we're talking about. If that mythical certainty ever existed, it's gone now. Rigor, on the other hand, hasn't gone anywhere. What survives is older and simpler: tell the truth, show your work, estimate the error, invite people to prove you wrong.

Those values didn't vanish, and they're critical in an era of new threats that have allowed misinformation to flourish. We think the path runs through AI, not around it — used by people deep in the data, who can go and see for themselves what that means out in the world, and always with a human at the wheel.

---

<p class="rf-kicker">More about our projects</p>

Our projects aren't charity, they're proof. Proof you can trust us. Proof you can criticize us. Proof we can build things that work and keep working. We read the methodology, publish it, and tell you where the data is funky. Download it, open a notebook, and push back — that's the whole idea.

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
</div>

---

<div class="rf-subscribe rf-subscribe--foot not-prose">
  <p class="rf-subscribe__note">Free · We read every reply · Leave whenever you like</p>
  <SubscribeForm lang="en" source="data-elixir" id="subscribe-foot" />
</div>

<p class="rf-fineprint">We still take on commissioned work — pipelines, explorers, MCP servers for public-interest data. <a href="mailto:davideads@recoveredfactory.net?subject=Work%20with%20Recovered%20Factory">Tell us what you need built.</a></p>

<script>
  import SubscribeForm from '$lib/components/SubscribeForm.svelte';
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

  /* Two-line display headline. */
  .rf-headline {
    margin: 0;
    font-family: var(--font-display);
    font-weight: 400;
    font-size: clamp(2.2rem, 6.2vw, 4rem);
    line-height: 1.03;
    letter-spacing: -0.02em;
    color: rgb(48 56 75);
    text-wrap: balance;
  }
  .rf-headline b { font-weight: 900;  color: rgb(15 24 42);}
  .rf-headline__turn { display: block; margin-top: 1em; }

  /* ── Hero: bleeds wider than the article column. Headline left
     (always two couplets / four lines, with a paragraph gap), a
     2×2 grid of square product views right (desktop). Stacks on
     small screens, headline over the grid. ─────────────────── */
  .rf-hero { padding: 0 1.5rem; }
  @media (min-width: 640px) { .rf-hero { padding: 0 2.5rem; } }
  @media (min-width: 1024px) { .rf-hero { padding: 0 4rem; } }
  .rf-hero__inner { max-width: 66rem; margin: 0 auto; }

  .rf-heroshots {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.6rem;
    margin: 1.9rem 0 0;
  }
  .rf-heroshots img {
    width: 100%;
    aspect-ratio: 1 / 1;
    object-fit: cover;
    object-position: top center;
    border: 1px solid rgba(15, 23, 42, 0.16);
    background: #fff;
    box-shadow: 0 2px 8px rgba(15, 23, 42, 0.12);
    display: block;
  }

  @media (min-width: 860px) {
    .rf-hero__inner {
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 3rem;
      align-items: center;
      padding: 1rem 0 1.5rem;
    }
    .rf-hero__inner .rf-headline {
      font-size: clamp(2.8rem, 4.8vw, 4rem);
      line-height: 1.05;
    }
    .rf-hero__inner .rf-heroshots {
      margin: 0;
      width: clamp(16rem, 26vw, 23rem);
    }
  }

  /* Lede — balanced sans-serif intro paragraphs with a clear
     paragraph break between them (bottom margin beats the prose
     space-y, so the grafs read as distinct beats). */
  .rf-lede {
    margin: 0 0 1.75rem;
    font-family: var(--font-body);
    font-size: 1.15rem;
    line-height: 1.6;
    color: rgb(48 56 75);
    text-wrap: pretty;
  }

  /* Section kickers — geometric caps with a Bauhaus left rule. */
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

  /* Section questions — reader-voice headers in the serif display
     face, carrying the same crimson left rule as the kickers.
     Two classes beat the route's `.dropcap-prose h2` utilities. */
  .rf-q {
    margin: 2.75rem 0 1.1rem;
    padding: 0.1rem 0 0.1rem 0.95rem;
    border-left: 3px solid var(--color-fern);
    font-family: var(--font-display);
    font-size: clamp(1.5rem, 3.6vw, 2.05rem);
    font-weight: 600;
    line-height: 1.18;
    letter-spacing: -0.01em;
    color: rgb(15 23 42);
    text-wrap: balance;
  }

  /* ── Subscribe blocks ─────────────────────────────────── */
  .rf-subscribe { margin: 2rem 0 0; }
  .rf-subscribe--foot { margin-top: 0.5rem; }
  .rf-subscribe__lead {
    margin: 0 0 1rem;
    font-family: var(--font-display);
    font-style: italic;
    font-size: 1.05rem;
    line-height: 1.5;
    color: rgb(51 65 85);
  }
  .rf-subscribe__note {
    margin: 0 0 1rem;
    font-family: "Jost", sans-serif;
    font-size: 0.8rem;
    font-weight: 600;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: rgb(71 85 105);
  }

  /* Quiet commercial footnote at the very bottom */
  .rf-fineprint {
    margin: 2.75rem 0 0;
    font-family: var(--font-display);
    font-style: italic;
    font-size: 0.95rem;
    line-height: 1.55;
    color: rgb(100 116 139);
  }
  .rf-fineprint a { color: var(--color-fern); text-decoration: none; }
  .rf-fineprint a:hover { text-decoration: underline; text-underline-offset: 4px; }

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

  @media (prefers-reduced-motion: reduce) {
    .rf-card__video { display: none; }
  }
</style>
