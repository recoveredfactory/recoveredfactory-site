---
id: "announcing-immigration-daybook"
title: "Announcing Immigration Daybook"
date: "2026-08-03"
description: "A weekday rundown of the immigration system — and a calendar of what's coming. Proudly algorithmic, edited every weekday by David Eads. Free pilot starts Wednesday, August 5."
type: "post"
hideSubscribe: true
byline: "David Eads"
tags:
  - "field-notes"
  - "immigration"
lang: "en"
previewImage: "/images/immigration-daybook-og-en.png"
---

<p class="no-drop"><em>Immigration Daybook starts Wednesday, August 5.</em></p>

<div class="rf-signup not-prose">
  <SubscribeForm
    buttonClass="bg-fern-strong px-6 py-4 text-sm font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-fern sm:shrink-0"
    id="daybook-post-top"
    inputClass="w-full border border-slate-900/20 bg-white px-5 py-4 text-lg text-slate-800 placeholder:text-slate-400 sm:max-w-[24rem] sm:flex-none"
    lang="en"
    layoutClass="flex flex-col gap-3 sm:flex-row sm:items-stretch sm:gap-2"
    meta={{ placement: 'announcement-top' }}
    source="immigration-daybook"
    tag="newsletter:immigration-daybook"
  />
  <p class="rf-signup__note">Free August pilot · English and Spanish editions</p>
</div>

---

**On August 24, the comment window closes on [a DHS rule](https://www.federalregister.gov/documents/2026/06/23/2026-12542/naturalization-application-fee-adjustments) that would raise the naturalization filing fee by 75% and eliminate fee waivers outright.**

If you're filing, that's real money coming — $760 today, $1,330 proposed — and a reason to move now. If you're a lawyer, that's a week of phone calls you'd rather schedule than receive. If you're a reporter, that's a story you want to file on the 23rd, not the 25th.

Maybe you already knew, because you track this stuff yourself. A lot of people don't, and shouldn't have to.

That's what we built Immigration Daybook to solve. Every weekday morning: a rundown of what happened in the immigration system, along with the part I'm most excited about — **a calendar of what's coming.** Effective dates, comment deadlines, court dates, all backed by primary sources and links to expert analysis. The rules that quietly take force while everyone's arguing about the outrage of the day.

<div class="rf-tk">SCREENSHOT TK — the calendar section, ideally with 2–3 real upcoming dates visible</div>

## Finding the fire in the smoke

There's a lot of fire in US immigration right now. There's far more smoke: thousands of articles, videos, threads, and posts a day, often trying to cover actions that seem designed to create confusion, chaos, and spectacle.

Machines are good at telling you where the smoke is thickest. Finding the fire takes judgement and expertise.

So this newsletter is proudly algorithmic, and we intend to make it the most carefully crafted algorithmic writing you've ever read. We're not just tracking the big headlines and prestige investigations you're already seeing. We're reading deeply technical policy blogs, Substack newsletters, and social video, covering law and procedure alongside whatever's actually hot in Spanish-language media, YouTube coverage of ICE raids included.

But the machine doesn't get the last word, and it can't do the part that matters most. The system reads all day and surfaces the patterns it finds. Then I edit: what it means, whether it's accurate, and who covered it best.

I've been on this beat a while. I was the de facto immigration editor at [The Marshall Project](https://www.themarshallproject.org/) for my first several years there, and my team did a lot of the lifting on their pop-up immigration newsletter last summer. So when we write about detention trends, we check the latest data from the [Deportation Data Project](https://deportationdata.org). When we write about 287(g), we pull [the roster](https://287g.recoveredfactory.net) and read the actual agreements. When we write about a rule or policy change, we look it up in the [Federal Register](https://www.federalregister.gov) and the [USCIS Policy Manual](https://www.uscis.gov/policy-manual) first.

## The newsroom brain

Our bet here isn't "AI reads the news." Lots of people are doing that and a lot of it is slop. Our bet is that a newsroom can have a brain — something you can actually *query* about everything it knows, that shows its work instead of asking you to trust it.

We're using a tool called [PromptQL](https://promptql.io) for that. Rather than handing a pile of documents to a chatbot and hoping its guesses are good, it writes an explicit plan that runs outside the language model, so we can read the steps, reproduce them, and check them. It drafts into a Google Doc, lets us know the draft is ready for edits, and finally picks the edited draft back up to produce the final newsletter.

We think tools like this are going to be a major part of how news gets made. Immigration Daybook is an experiment in how far that takes a small, scrappy shop like [Recovered Factory](/en/introducing-recovered-factory).

## The pilot

We're running August as a pilot for free, while we figure out what this should be and how to sustain it. We'd rather have you in the room for the early version than polish it in a vacuum, so tell us what's missing and what you'd actually use.

Sustainability is the open question. This runs on a fraction of what a traditional link newsletter takes, but it isn't free: there's real compute, plus the time I spent building the system and the time I'll spend editing it every morning. We're not chasing philanthropic money — we'd rather be accountable to our audience than to a program officer — which means at some point we sell something at a fair price that covers costs and pays for the work. This month is how we find out what that is.

<div class="rf-signup not-prose">
  <p class="rf-signup__lead">Starts Wednesday, August 5.</p>
  <SubscribeForm
    buttonClass="bg-fern-strong px-6 py-4 text-sm font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-fern sm:shrink-0"
    id="daybook-post-foot"
    inputClass="w-full border border-slate-900/20 bg-white px-5 py-4 text-lg text-slate-800 placeholder:text-slate-400 sm:max-w-[24rem] sm:flex-none"
    lang="en"
    layoutClass="flex flex-col gap-3 sm:flex-row sm:items-stretch sm:gap-2"
    meta={{ placement: 'announcement-foot' }}
    source="immigration-daybook"
    tag="newsletter:immigration-daybook"
  />
  <p class="rf-signup__note">Free through August · Unsubscribe anytime</p>
</div>

<script>
  import SubscribeForm from '$lib/components/SubscribeForm.svelte';
</script>

<style>
  /* The route's stock house-list forms are switched off for this post via
     `hideSubscribe`, so these are the only asks on the page and they carry the
     newsletter's own tag. */
  .rf-signup {
    margin: 2rem 0;
    padding: 1.75rem 1.5rem;
    border: 1px solid rgba(15, 23, 42, 0.15);
    border-left: 6px solid var(--color-fern);
    background: #ffffff;
  }
  .rf-signup__lead {
    margin: 0 0 1.1rem;
    font-family: var(--font-display);
    font-size: clamp(1.35rem, 3vw, 1.7rem);
    font-weight: 600;
    line-height: 1.2;
    letter-spacing: -0.015em;
    color: rgb(15 23 42);
  }
  .rf-signup__note {
    margin: 1.1rem 0 0;
    font-family: "Jost", sans-serif;
    font-size: 0.74rem;
    font-weight: 600;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: rgb(100 116 139);
  }
  /* Placeholder marker for art that hasn't been shot yet. Delete the block
     along with this rule once the real screenshot lands. */
  .rf-tk {
    margin: 2rem 0;
    padding: 2.5rem 1.5rem;
    border: 1px dashed rgba(15, 23, 42, 0.35);
    font-family: "Jost", sans-serif;
    font-size: 0.78rem;
    font-weight: 600;
    letter-spacing: 0.14em;
    text-align: center;
    text-transform: uppercase;
    color: rgb(100 116 139);
  }
</style>
