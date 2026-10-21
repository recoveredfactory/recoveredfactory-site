---
id: "287g-watch-redesign"
title: "287(g) Watch, rebuilt for election season"
date: "2026-10-21"
description: "Look up any agency in the program, see who's running for sheriff, and take the data with you."
type: "post"
byline: "Tory Lysik"
tags:
  - "field-notes"
lang: "en"
previewImage: "/images/287g-redesign-laramie-election.png"
draft: true
---

<script>
  import LoopVideo from '$lib/components/LoopVideo.svelte';
  import ResizedImage from '$lib/components/ResizedImage.svelte';
</script>

<!--
  Stills shot from the live 287(g) Watch site on Oct. 21 (headless Chrome, 2x; phone at 390px, 3x),
  padded in the site's surface color. The search loop has an email GIF beside it (same name, .gif).
  The Tella walkthrough clips (287g-redesign-0N-*) are still in static/videos, unused.
-->

Election Day is two weeks away, and we have found 242 sheriff's offices with 287(g) agreements that have a sheriff's race on the ballot.

The [287(g) program](https://www.ice.gov/identify-and-arrest/287g), named for a section of federal immigration law, lets [ICE](https://www.ice.gov/287g) deputize local police and sheriff's deputies to carry out immigration enforcement. In most states, sheriffs are elected, and it's usually the sheriff who ultimately decides whether a county signs on. That makes the vote for sheriff one of the few direct ways voters can weigh in on the program.

Now, [287(g) Watch](https://287g.recoveredfactory.net/en) shows those races. Every agency page lists its county's 2026 sheriff's race: who's running, their party, and whether a candidate signed one or more agreements. Whether you support the program or oppose it, you should be able to see if someone running for office signed your local agreement.

That's the timely part. The bigger news is that we rebuilt the whole site. It's faster, more searchable, easier to read on a phone, and goes deeper on every agency, every state and the program's history. As of \[October 13\], it tracks 2,250+ agencies in 40 states.

ICE's list of 287(g) agreements tells you who signed, for which program and when. It doesn't tell you why, what it costs or what it changes on the ground. We've added election data, and more joined data is coming, but the rest takes groundwork: observing law enforcement, requesting records, making calls, and asking questions in public, at county meetings and candidate forums. Here's where to start.

## Search for states and agencies

Start with the search box at the top of any page and type an agency or a town. Say you live near Cheyenne, Wyoming. Search "Laramie" and open the [Laramie County Sheriff's Office](https://www.laramiecountywy.gov/County-Government/Elected-Officials/Laramie-County-Sheriffs-Office). Or just search for [Wyoming.](https://287g.recoveredfactory.net/en/state/wy)

<LoopVideo
  src="/videos/287g-redesign-search-laramie.mp4"
  poster="/videos/287g-redesign-search-laramie.jpg"
  label="Typing “Laramie” into the 287(g) Watch search box narrows the results to the Laramie County Sheriff’s Office, the Pine Bluffs Police Department and the Wyoming State Highway Patrol."
  figureClass="my-6 max-w-2xl"
  class="rounded-lg shadow-xl"
/>

We found while using the tool for our own research that there were issues with findability — you often want to quickly look up an agency, and in the previous design it took a few steps to do that. Now you just start typing.

<ResizedImage
  src="/images/287g-redesign-laramie-phone.png"
  alt="The Laramie County Sheriff's Office page on 287(g) Watch at phone width, with a map of Wyoming marking the county and the date it signed."
  width={600}
  figureClass="my-6 max-w-[280px]"
  class="rounded-lg shadow-xl"
/>

## "Who's running for sheriff, and did they sign?"

Until Election Day, the election card lists each candidate and their party, and notes any candidate who signed the agreement. Buttons take you to register to vote and, for most states, to your state's voter information. It also includes how people in that county voted in the 2024 presidential election to give you a better idea of the local politics.

<ResizedImage
  src="/images/287g-redesign-laramie-election.png"
  alt="The 2026 sheriff's race card for Laramie County, Wyoming, listing two candidates, with buttons to register to vote and find voter information, above how the county voted for president in 2024."
  width={1000}
  figureClass="my-6 max-w-2xl"
  class="rounded-lg shadow-xl"
/>

In Laramie County, [Brian Kozak](https://ballotpedia.org/Brian_Kozak_%28Laramie_County_Sheriff,_Wyoming,_candidate_2026%29), the Republican who signed the agreement, faces Democrat [Robin Cozad](https://ballotpedia.org/Robin_Cozad_%28Laramie_County_Sheriff,_Wyoming,_candidate_2026%29). In [Hale County, Alabama,](https://287g.recoveredfactory.net/en/agency/hale-county-sheriffs-office-al) the signer is the Democrat: [Michael Hamilton](https://www.alabamasheriffs.com/sheriffmap) faces Republican [Kevin McDaniel.](https://goodparty.org/people/kevin-mcdaniel-73c70a66)

But most signers don't face anyone at all. In the 146 counties where we have official candidate lists, we found 22 sheriffs who signed their office's agreement on the November ballot. Eighteen of them are unopposed.

We show the sheriff's race on the pages for every agency in a county, because residents of the cities and towns those departments serve vote for the sheriff too. The [Pine Bluffs Police Department](https://287g.recoveredfactory.net/en/agency/pine-bluffs-police-department-wy) page, for example, shows the Laramie County race.

Some questions worth asking any candidate whether during reporting or at a town hall:

- Will you keep the agreement, change it or end it?
- How many of your officers are trained under it, and what have they done with that authority?
- How many people has your office turned over to ICE, and will you publish that number?
- How much funding has your department received from the federal government, and how did you use it?

## "What's happening in my state?"

Some of the most consequential decisions about 287(g) are happening at the [state level](https://287g.recoveredfactory.net/en/states). States like [Florida](https://287g.recoveredfactory.net/en/state/fl) and [Texas](https://287g.recoveredfactory.net/en/state/tx) make participation mandatory via legislation, while states like [Illinois](https://287g.recoveredfactory.net/en/state/il) have prohibited it.

Our state pages show you what’s happening at the level with the most opportunities for impact and meaningful discourse.

For example, [North Carolina](https://287g.recoveredfactory.net/en/state/nc) opens with a map of the state's 32 agencies and a chart of how participation has grown. Next come the 2026 races: 28 of those 32 agencies are in counties that elect a sheriff this year, and we have the official candidate list for every one of them, from the [State Board of Elections](https://www.ncsbe.gov/).

<ResizedImage
  src="/images/287g-redesign-nc-map.png"
  alt="The North Carolina page on 287(g) Watch: 32 agencies, their programs, and a map of agency locations."
  width={1000}
  figureClass="my-6 max-w-2xl"
  class="rounded-lg shadow-xl"
/>

Below that is a summary of recent news coverage in English and Spanish, with links to verified reporting from news outlets. Last comes a table of every agency, which you can filter to the ones with a sheriff's race this year. Each row links to its signed agreement.

The newest North Carolina agreement, for the [Sampson County Sheriff's Office](https://287g.recoveredfactory.net/en/agency/sampson-county-sheriffs-office-nc), was signed October 9, three and a half weeks before the county votes for sheriff.

<ResizedImage
  src="/images/287g-redesign-nc-table-2026.png"
  alt="The North Carolina page on 287(g) Watch, with a table of agencies filtered to counties with a 2026 sheriff's race, newest agreement first."
  width={1000}
  figureClass="my-6 max-w-2xl"
  class="rounded-lg shadow-xl"
/>

## "I want the data or free content to share."

The [downloads](https://287g.recoveredfactory.net/en/downloads) page has every agency in the program, plus the 111 that have left it, as one CSV with a data dictionary that explains each column. The same page has our maps, videos and images, in English and Spanish, refreshed as the data changes.

All of it is free to use, including in your own reporting, as long as you credit [287(g) Watch.](https://287g.recoveredfactory.net/en)

<ResizedImage
  src="/images/287g-redesign-downloads.png"
  alt="The 287(g) Watch downloads page, with a button to download the data as a CSV and a gallery of free videos and images."
  width={1000}
  figureClass="my-6 max-w-xl"
  class="rounded-lg shadow-xl"
/>

After November 3, we'll add the winners from preliminary and certified results when they are available.

<div class="my-6 border border-dashed border-slate-400 p-4 text-sm text-slate-500">
  <strong>Unplaced</strong> (shot for the state section; place or drop):
</div>

<ResizedImage
  src="/images/287g-redesign-nc-chart.png"
  alt="How 287(g) participation has grown in North Carolina since December 2024, by program."
  width={1000}
  figureClass="my-6 max-w-2xl"
  class="rounded-lg shadow-xl"
/>

<ResizedImage
  src="/images/287g-redesign-nc-news.png"
  alt="The summary of news coverage of ICE's 287(g) program in North Carolina, written by PromptQL."
  width={1000}
  figureClass="my-6 max-w-2xl"
  class="rounded-lg shadow-xl"
/>
