---
id: "one-story-two-languages"
title: "One story, two languages: How we summarize 287(g) news"
date: "2026-07-30"
description: "How we write bilingual news summaries about the ICE program for every state, and the big idea that makes it work."
type: "post"
byline: "David Eads"
editors:
  - "Tory Lysik"
tags:
  - "field-notes"
  - "immigration"
lang: "en"
previewImage: "/images/one-story-two-languages-og.png"
---

<script>
  import ResizedImage from '$lib/components/ResizedImage.svelte';
</script>

<p class="no-drop"><a href="https://287g.recoveredfactory.net">287(g) Watch</a> now publishes a running history of the program in <a href="https://287g.recoveredfactory.net/en/states">all 53 states and territories we track</a>, including the ones that have never participated and the ones that no longer do, in both English and Spanish. Both language editions come out of the same pipeline. Neither is a translation of the other, yet together they tell a richer story than coverage in a single language can.</p>

<figure class="rf-resized-image mx-auto my-8 max-w-3xl">
  <div class="grid grid-cols-2 gap-3 sm:gap-5">
    <img
      src="/images/287g-summary-mo-en.png"
      alt="The English news summary on 287(g) Watch's Missouri page: a two-sentence topline in italics, then a narrative brief with links out to the reporting behind each development."
      class="w-full h-auto rounded-lg shadow-xl"
      loading="lazy"
      decoding="async"
    />
    <img
      src="/images/287g-summary-mo-es.png"
      alt="The Spanish news summary on the same Missouri page, covering the same developments in the same order but written natively in Spanish, with its own links."
      class="w-full h-auto rounded-lg shadow-xl"
      loading="lazy"
      decoding="async"
    />
  </div>
  <figcaption class="rf-image-caption mt-3 text-xs text-slate-500">Missouri, in <a href="https://287g.recoveredfactory.net/en/state/mo#news">English</a> and <a href="https://287g.recoveredfactory.net/es/state/mo#news">Spanish</a>. Same lead, same developments, same order — but no two sentences line up, because neither edition was written from the other.</figcaption>
</figure>

Everything else here — search and dedupe and cost control — is plumbing we'll walk through quickly. The idea we think is worth stealing is the one at the end: **build a single language-neutral outline from everything you found in every language, then write it out natively in each one.**

The system has two halves: ingestion, which runs on Amazon Web Services, and composition, which runs in [PromptQL](https://promptql.io), a collaborative AI knowledge tool that works from your data and documentation and keeps the docs current as you collaborate — you can think of it as a turbo-charged and highly accurate version of the [LLM Wiki](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f) concept.

We're keeping this at the level of *what the system does*. We used AWS for the ingester, but it could also be built on something like DigitalOcean. You could write a composer agent or LLM skill yourself rather than using PromptQL. We want you to be able to hand the shape of this to a coding agent and build your own.

But first: this only works because there's a *news ecosystem* to follow. Many of the local outlets we link to need your support, and your feedback about how you actually want to be informed and how they can improve. A system like ours reads the news and finds bigger patterns. We hope it can strengthen the good on-the-ground reporting happening around the country, but it absolutely cannot replace it.

## Why the obvious approaches don't work

To a large degree, 287(g) trends [are best viewed at the state level](https://287g.recoveredfactory.net/en/states).

Participation is voluntary, but states can override local choices in either direction: some like [Illinois](https://287g.recoveredfactory.net/en/state/il#news) have banned it, while others like [Florida](https://287g.recoveredfactory.net/en/state/fl#news) have mandated it. So the story is really 53 stories — 50 states, the two territories with agreements, and D.C. — each moving at its own pace. That's more than our two-person, barely-paid publication can read, let alone write up.

<ResizedImage
  src="/images/287g-state-index-en.png"
  alt="The 287(g) Watch state index, listing every state and territory with its agency count, model breakdown, population covered, and an AI-written news summary. Texas and Florida are visible at the top."
  width={1000}
  figureClass="my-6 max-w-2xl"
  class="rounded-lg shadow-xl"
  caption="Fifty-three jurisdictions, each with its own arc. Every one of these summaries also exists in Spanish."
/>

And the obvious fixes all fall apart:

- **Read it all yourself.** You burn out in a month, if you make it that long, without covering a fraction of it. We don't believe in [that kind of self-immolation](https://recoveredfactory.net/en/why-go-slow).

- **Do it the old way, with people.** It can work. The Marshall Project's *Opening Statement* proves it, and projects I ran at [the Marshall Project](https://www.themarshallproject.org/2024/10/21/fact-check-12000-trump-statements-immigrants) and [NPR](https://www.npr.org/2016/07/21/486883610/fact-check-donald-trumps-republican-convention-speech-annotated) got real power out of coordinating dozens of reporters. But at four hours per state, 53 writeups comes to more than five weeks of full-time labor. Most organizations will conclude, correctly, that their people have better things to do.

- **Do it the new way, badly.** Point a language model at "the news" and ask for a summary. I've watched old-school editors try exactly this. What comes back is a correct fact wrapped around a subtle but sometimes grievous error: the governor did sign the bill, in March — of *last* year. Hallucinated URLs. Publication names that don't exist. One deep research tool nailed every detail of a citation except the subject's race, age, and profession. Unedited, that's slop. Edited, it can be *fine*, but you're back to a labor problem: enormous editing effort every run on an output whose ceiling is *fine*.

So we didn't build a naive summarizer, and we didn't go looking for a billionaire's foundation we'd have to answer to in order to staff the work. And we didn't burn ourselves out. We built something that combines **the story the records tell** with **an archive of the story the press told, in the major languages it was told in.**

## The decision everything else follows from

Separate **remembering** from **writing** and keep them strictly apart.

*Remembering* is a machine job: cast a wide net, pull in everything that might matter, clean it, label it, file it. This step should be broad, slightly over-inclusive, and cheap. The failure that hurts is missing something. A few off-topic articles cost fractions of a cent to process and store. A Spanish-only story you never saw is a hole nothing downstream can fill.

*Writing* is an editorial job, even when a model does the typing: what leads, what connects to what, what to do about a state with three articles and a state with three hundred, how to avoid defaulting to the famous bylines while still finding quality work. Judgment, encoded as rules, prompts, and constraints.

So: one system builds the memory and a separate system reads it and writes. The writer can't touch the memory, and the memory doesn't know how to write. The handoff is a two-part promise: the run is committed, and the writer has been told. Draw that line and things get easier in both directions. Swap your model and the archive is untouched. Add languages and the composer keeps generating accurate, readable text. That's exactly what you want when the thing doing the writing is a language model.

## Part one: building the memory

### A cocktail of searches

No single source captures the sweep of coverage on a topic. Our tests showed little overlap between what different search engines returned, and big holes across all of them. So we make a cocktail:

- **Broad search APIs** for recall. Google News is a decent baseline; Exa is excellent and plays well with agents; Perplexity is often the most current and best at surfacing official documents, though it needs watching for hallucinations.
- **Sources we always ingest**, search results or not: the State Department's Visa Bulletin, DHS and ICE press releases.
- **Outlets we know by name** that mainstream search underweights: The Haitian Times, Sahan Journal, specialist voices like Cyrus Mehta's *Insightful Immigration Blog*, Spanish-language TV news.

For each place we run several *kinds* of query: the obvious one ("287(g) agreements in Hawaii") plus the oblique ones ("ICE local law enforcement partnership in Hawaii"), in English and Spanish. The oblique ones capture the bigger universe of collaboration with ICE.

And we pull full story text, because headlines don't offer sufficient signal.

Casting a wide net runs the risk of surfacing "pink slime" journalism and propaganda outlets. We've been happy to find that Exa does a good job of filtering those out at this stage of the process, and we have a trick we'll describe later that seems to help as well.

### Clean, label, group

Everything rides the same pipeline:

- **Deduplicate**, cheapest check first: exact URL matches, then a text-fingerprint check for near-identical reprints, both free, then embeddings only for what survives. Most duplicates die before they cost anything.
- **Classify**: is this about the topic, and what kind of event is it — an agreement signed, a lawsuit, a council vote, a raid?
- **Geo-tag**: which state, county, and agency?
- **Cluster**: group the articles covering the same thing.

A pile of articles isn't useful. A story is. So clusters get routed into **threads**, persistent storylines like "Missouri 287(g) expansion" that live across runs and grow as coverage continues. Each new cluster joins a thread, starts one, or wakes a dormant one, and the system scores its own confidence in that call. Low-confidence routings get flagged for human review instead of getting committed or omitted. Being unsure is allowed, but being unsure and pretending otherwise is not.

And **a thread's summary is always rebuilt from the underlying facts, never from its own previous summary.** Seed new summaries from old ones and you carry mistakes forward, degrading the output every run. A summary never descends from a summary. It goes back to the source claims.

Three rules keep the whole thing cheap.

- **Every model call goes through a batch API, no exceptions and no fast path.** That halves the price in exchange for turnaround in hours instead of seconds. The latency costs nothing at a daily cadence, and the no-exceptions part deletes a category of bugs by leaving one path to test.
- **Classify once, forever**: labels cache against a stable content fingerprint, so re-ingesting a story from another feed tomorrow is free.
- **Nothing idle**: one small Postgres instance and a swarm of functions that wake up, work, and sleep. We only pay for what we use.

## The Bad Bunny principle

Spanish is a search leg, not a post-processing step. Call it the Bad Bunny principle, after his Super Bowl halftime show, where he said "God bless America" and then went on to name practically every country in the Americas. It's a core value for us, and we've written before about why Recovered Factory projects are [multilingual from the start](https://recoveredfactory.net/en/multilingual-how-and-why).

<ResizedImage
  src="/images/bad-bunny-flags.gif"
  alt="Bad Bunny dancing at the Super Bowl halftime show with flags of the Americas."
  figureClass="my-6 max-w-lg"
  unoptimized
/>

Concretely: every jurisdiction gets a Spanish net alongside the English one. Native-framed search terms (*redadas*, *cita de asilo*, *permiso de trabajo*, *carga pública*), a broadcast angle for the *noticieros*, and a pass scoped to the Spanish and bilingual outlets we know by name. We do this even in states with no obvious Spanish-language outlet, because the point is catching the Spanish-only development English coverage missed, and because coverage doesn't respect state lines or national ones. A story about a Georgia sheriff can break in a Mexico City newsroom.

Translate at the end and you can only ever be as good as your English recall. Search in both and you're not translating a story, you're finding more of it for *all* audiences.

## Part two: building a spine

Once a search run is committed, daily or weekly or whatever your cadence is, the writing system wakes up, reads the archive through a read-only door, and does one thing before it writes a single sentence: **it builds a spine.**

A spine is an ordered list of beats: the things the piece has to say, in the order it should say them — for example, the governor signed a bill in the spring but a court shot it down in the fall, while activists pressured cities to change their policies. It's the underlying structure of any narrative news product. In our setup the spine is language-neutral, closer to notes on index cards than to sentences, and both the English and Spanish editions descend from that one outline rather than from each other.

**This is the most important trick for making this work**, and it relies on composing the text using a tool like [PromptQL](https://promptql.io) (or rolling your own) that can inject accurate data alongside your knowledge, guidance, and editorial rules.

### Grounding first, then the news

The spine does not start with the headlines. Whenever we can, it starts with what we already know, using imperfect but authoritative records we've spent a lot of time cleaning and understanding.

For 287(g), that means the ICE roster of participating agencies: who has signed, under which model, as of the end of the window we're writing about, plus a small set of standing facts developed through research and reporting. The data and facts set the foundation.

Once we've established a rough timeline and patterns from authoritative sources, we start filling the outline with article links and looking for news beats within that structure.

The roster always wins: a state's current standing, its agency count, and its national rank all come from the roster, not from whatever a national roundup said six months ago. The spine is never allowed to assert a standing, an absence, or a characterization the records or our reporting do not support. This is the same discipline as *never summarize a summary*, applied one level up. Generate from structure and facts. Never from other generated prose, and never from a news source that contradicts the record.

This appears to be an effective last-mile filter for keeping out "pink slime" journalism and propaganda outlets, but we haven't studied it in depth to truly understand what's happening.

### One outline, every language

The news half of the spine is built from the **union of coverage in every language we searched**, not from the English pile with Spanish consulted afterward. A development that was mostly covered by Spanish-language outlets earns a beat on equal footing with anything else. Looking *across* languages is the mechanism that makes the Bad Bunny principle real rather than aspirational.

We source those beats from individual articles, not from the story-clusters the archive already built. Clusters are useful enrichment, but they tend to group same-language coverage together, so a thin Spanish-only story can vanish inside an English-dominated thread. The composer goes back to the article grain and builds from the full bilingual pool, using the clusters for guidance.

### Selective on purpose

The spine consolidates aggressively. Closely related items merge, marginal one-off mentions drop, and there's a hard ceiling on how many beats a brief may carry. An earlier version of the composer tried to drop as little as possible, and the result was longer, flatter, and less useful. The length lever that actually works is fewer beats: a tight statewide story, not a dump of every council vote in the corpus.

Selectivity has a geographic edge too. Each brief stays focused on its primary state. No "beyond Missouri…" coda, no multi-state tally as closing color, no national story without a local hook. These are all things that LLMs, trying to be helpful, want to insert.

If the in-state pool is thin after filtering, the brief ends early. Shorter is correct. Padding with out-of-state material is not.

And the topical gate is narrower than "immigration news about this state." A development enters only if it is about **local police working with ICE**: an agreement in any 287(g) model, another arrangement like detainers or jail access, or direct pushback, litigation, or oversight *of that cooperation*. Detention without a local partner, immigration courts, visas, ballot props, federal-only raids: out, no matter how newsworthy, no matter how often the state is named.

Some jurisdictions produce almost no coverage of 287(g) or other forms of local police collaborating with ICE in a given time window. The honest move is neither to invent a narrative nor to pad with general immigration news. Usually the story there is the roster itself: which agencies signed, and when. The composer narrates that arc from the structured data and doesn't speculate. "Relatively little 287(g) news in the corpus" is a fact the archive can support. "This state is a news desert" is a hunch it cannot. Little coverage does not mean nothing is happening, and the roster usually says otherwise.

<ResizedImage
  src="/images/287g-summary-nd-en.png"
  alt="The North Dakota brief on 287(g) Watch. It says plainly that there is relatively little 287(g) news about the state, then narrates the roster — 11 agencies under 16 agreements, starting with Dickinson, Dunn County, and McKenzie County last spring."
  width={900}
  figureClass="my-6 max-w-xl"
  class="rounded-lg shadow-xl"
  caption="North Dakota, where the roster is the story. The brief says out loud that coverage is thin, and refuses to conclude that nothing is happening."
/>

### Rendered twice, natively

Once the spine exists, it is written out twice. The English edition is written as English. The Spanish edition is written as Spanish, with its own rhythm, its own idiom, its own sense of what a Spanish-reading audience already knows. Same information, same facts, same (approximate) order. Neither is a translation of the other, because both descend from the same outline rather than from each other.

We've said it before: the best way to do multilingual is to [abandon strict parity](https://recoveredfactory.net/en/multilingual-how-and-why). This is another example of that idea.

Some things *are* invariant. Values that must match across editions, like counts, dates, and the names of peer states, get computed once and handed identically to both renders. Volatile standing figures ship as template tokens the site fills at serve time, so a brief written in July still reads true in August when three more sheriffs sign. The two versions can disagree about how to phrase something. They cannot disagree about a number or a fact.

## Viva Las Vegas! — or why we need human editors

As with all our work, a person stays in the loop wherever judgment matters and wherever something gets published. Low-confidence thematic clusters wait for review. Broken monitors send us an alert rather than letting an LLM find a potentially misleading workaround unattended. Nothing reaches a reader without a real human deciding it's right.

Most of our mistakes have been about places: an article from Clark County, Arkansas, was linked in a paragraph about the far more famous Clark County, Nevada, home of Sin City. We fix those manually while refining the ingester and composer to avoid them on the next run.

It's quite similar to editing a human's work. I've edited a lot of link newsletters in my day, and this process is generally a bit more accurate than a good reporter writing up a link summary. Humans confuse places, paste the wrong URL, and get details wrong too. That's why in many ways who or what wrote the draft matters less than the composition guidelines and the editing process.

## If you want to build one

The shape, in six lines, is small enough to hand to a coding agent:

1. Search broadly, from several providers, in **all the primary languages your story lives in.**
2. Dedupe cheapest-check-first, then label and geo-tag what survives. Cache the labels forever.
3. Group articles into persistent storylines. Send the uncertain ones to a person.
4. Keep the archive and the writer in separate systems, connected by a read-only view.
5. Before writing anything, build a **spine**: ordered beats, each with citations, drawn from all languages at once.
6. Render the spine natively in each language. Compute the shared numbers once and hand them to both.

Everything above line 5 is plumbing you can build however you want. Line 5 is the core idea that makes the whole thing workable, and you'll need to spend time tuning and refining it before it reads well.

And be aware that to replicate our national scale, the cost is not trivial. This costs a few dollars minimum per search run and per composition pass to get satisfactory quality. If you're doing that for 53 states and territories, you could easily hit $200 for a completely cold, end-to-end run, though subsequent runs will cost less. It's not *that* expensive in the grand scheme of things, but it's also not cup-of-coffee money. And you'll spend more upfront because you'll need to test it and tune it.

If you try it, let us know how it goes.

## Our next steps

Now that we have this system, we're going to be pushing it into more ambitious places. Why just write articles when we can produce video and social content, too?

We hope to do some investigations of our corpus itself: where are the holes in English and Spanish coverage, respectively? For overlapping coverage, how do the angles and approaches differ?

There are research questions and refinements to make: is our data-grounding helping filter out junk news, or is that a mirage that came from comparing a small number of runs? How do we cut down on geographic mistakes?

And stay tuned: next week we'll be announcing a new, data-driven national immigration newsletter using these techniques.
