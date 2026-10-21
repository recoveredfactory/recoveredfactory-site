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
previewImage: "/images/287g-redesign-laramie-election-v2.png"
---

<script>
  import LoopVideo from '$lib/components/LoopVideo.svelte';
  import ResizedImage from '$lib/components/ResizedImage.svelte';
</script>

<!--
  Stills (-v2) shot from the live 287(g) Watch site on Oct. 21 at a 768px window (the "ctrl-+" pass:
  the site caps content at 896px, so a narrower window makes text bigger relative to the shot), 2x,
  clipped to the content column and padded 40/36px in the site's surface color. The NC loop scrolls a
  full-page 3x capture of the state page. Both loops have an email GIF beside them (same name, .gif).
  Unused on disk: the first-pass stills (same names without -v2, 1100px window, 96px padding), the flat
  search loop (287g-redesign-search-laramie.*), the phone shot (287g-redesign-laramie-phone.png) and
  the NC chart and news shots (287g-redesign-nc-chart.png, -nc-news.png).
  The Tella walkthrough clips (287g-redesign-0N-*) are still in static/videos, unused.
-->

Election Day is two weeks away, and we have found 242 sheriff's offices with 287(g) agreements that have a sheriff's race on the ballot.

The [287(g) program](https://www.ice.gov/identify-and-arrest/287g), named for a section of federal immigration law, lets ICE deputize local police and sheriff's deputies to carry out immigration enforcement. In nearly every state, sheriffs are elected, and it's usually the sheriff who ultimately decides whether a county signs on. That makes the vote for sheriff one of the few direct ways voters can weigh in on the program.

Now, [287(g) Watch](https://287g.recoveredfactory.net/en) shows those races. Every agency page in a county that elects its sheriff this year shows the race: who's running, their party, and whether a candidate signed one or more agreements. Whether you support the program or oppose it, you should be able to see if someone running for office signed your local agreement.

That's the timely part. The bigger news is that we rebuilt the whole site. It's faster, more searchable, easier to read on a phone, and goes deeper on every agency, every state and the program's history. As of October 16, it tracks 2,231 participating agencies in 40 states.

ICE's list of 287(g) agreements tells you who signed, for which program and when. It doesn't tell you why, what it costs or what it changes on the ground. We've added election data, and more joined data is coming, but the rest takes groundwork: observing law enforcement, requesting records, making calls, and asking questions in public, at county meetings and candidate forums. Here's where to start.

## "Is my local department in the program?"

Start with the search box at the top of any page and type an agency, a county or a state. Say you live in Cheyenne, Wyoming, which is in Laramie County. Search "Laramie" and open the [Laramie County Sheriff's Office](https://287g.recoveredfactory.net/en/agency/laramie-county-sheriffs-office-wy). Or just search for [Wyoming](https://287g.recoveredfactory.net/en/state/wy).

<LoopVideo
  src="/videos/287g-redesign-search-laramie-zoom.mp4"
  poster="/videos/287g-redesign-search-laramie-zoom.jpg"
  label="On the 287(g) Watch home page, typing “Laramie” into the search box narrows the results to the Laramie County Sheriff’s Office, the Pine Bluffs Police Department and the Wyoming State Highway Patrol; choosing the sheriff’s office opens its page."
  figureClass="my-6 max-w-2xl"
  class="rounded-lg shadow-xl"
/>

Using the old site for our own research, we found that looking up a single agency took several steps. Now you just start typing.

## "Who's running for sheriff, and did they sign?"

Until Election Day, the election card lists each candidate and their party, and notes any candidate who signed the agreement. Buttons take you to register to vote and, for most states, to your state's voter information. It also includes how people in that county voted in the 2024 presidential election to give you a better idea of the local politics.

<ResizedImage
  src="/images/287g-redesign-laramie-election-v2.png"
  alt="The 2026 sheriff's race card for Laramie County, Wyoming, listing two candidates, with buttons to register to vote and find voter information, above how the county voted for president in 2024."
  width={1400}
  figureClass="my-6 max-w-2xl"
  class="rounded-lg shadow-xl"
/>

In Laramie County, [Brian Kozak](https://ballotpedia.org/Brian_Kozak_%28Laramie_County_Sheriff,_Wyoming,_candidate_2026%29), the Republican who signed the agreement, faces Democrat [Robin Cozad](https://ballotpedia.org/Robin_Cozad_%28Laramie_County_Sheriff,_Wyoming,_candidate_2026%29). In [Hale County, Alabama](https://287g.recoveredfactory.net/en/agency/hale-county-sheriffs-office-al), the signer is the Democrat: [Michael Hamilton](https://www.alabamasheriffs.com/sheriffmap) faces Republican [Kevin McDaniel](https://goodparty.org/people/kevin-mcdaniel-73c70a66).

But most signers don't face anyone at all. In the 146 counties where we have official candidate lists, we found 22 sheriffs on the November ballot who signed their office's agreement. Eighteen of them are unopposed.

We show the sheriff's race on the pages for every agency in a county, because residents of the cities and towns those departments serve vote for the sheriff too. The [Pine Bluffs Police Department](https://287g.recoveredfactory.net/en/agency/pine-bluffs-police-department-wy) page, for example, shows the Laramie County race.

Some questions worth asking any candidate, whether while reporting or at a town hall:

- Will you keep the agreement, change it or end it?
- How many of your officers are trained under it, and what have they done with that authority?
- How many people has your office turned over to ICE, and will you publish that number?
- How much funding has your office received from the federal government, and how did you use it?

## "What's happening in my state?"

Some of the most consequential decisions about 287(g) are happening at the [state level](https://287g.recoveredfactory.net/en/states). States like [Florida](https://287g.recoveredfactory.net/en/state/fl) and [Texas](https://287g.recoveredfactory.net/en/state/tx) make participation mandatory via legislation, while states like [Illinois](https://287g.recoveredfactory.net/en/state/il) have prohibited it.

Each state gets its own page because a single law can put all a state's sheriffs into the program or keep them out.

For example, [North Carolina](https://287g.recoveredfactory.net/en/state/nc) opens with a map of the state's 32 agencies and a chart of how participation has grown. Next come the 2026 races: 28 of those 32 agencies are in counties that elect a sheriff this year, and we have the official candidate list for every one of them, from the [State Board of Elections](https://www.ncsbe.gov/).

Below that is an AI-written summary of recent news coverage, in English and Spanish, with links to the original reporting. Last comes a table of every agency, which you can filter to the ones with a sheriff's race this year. Each row links to its signed agreement.

<LoopVideo
  src="/videos/287g-redesign-nc-scroll.mp4"
  poster="/videos/287g-redesign-nc-scroll.jpg"
  label="Scrolling down the North Carolina page on 287(g) Watch: a map of the state's agencies, a chart of how participation has grown, the 2026 sheriff's races, an AI-written summary of news coverage and the table of agencies."
  figureClass="my-6 max-w-2xl"
  class="rounded-lg shadow-xl"
/>

The newest North Carolina agreement, for the [Sampson County Sheriff's Office](https://287g.recoveredfactory.net/en/agency/sampson-county-sheriffs-office-nc), was signed October 9, three and a half weeks before the county votes for sheriff.

<ResizedImage
  src="/images/287g-redesign-nc-table-2026-v2.png"
  alt="The North Carolina page on 287(g) Watch, with a table of agencies filtered to counties with a 2026 sheriff's race, newest agreement first."
  width={1400}
  figureClass="my-6 max-w-2xl"
  class="rounded-lg shadow-xl"
/>

## "I want the data or free content to share."

The [downloads](https://287g.recoveredfactory.net/en/downloads) page has every agency in the program, plus the 111 that have left it, as one CSV with a data dictionary that explains each column. The same page has our maps, videos and images, in English and Spanish, refreshed as the data changes.

All of it is free to use, including in your own reporting, as long as you credit [287(g) Watch](https://287g.recoveredfactory.net/en).

<ResizedImage
  src="/images/287g-redesign-downloads-v2.png"
  alt="The 287(g) Watch downloads page, with a button to download the data as a CSV and a gallery of free videos and images."
  width={1400}
  figureClass="my-6 max-w-xl"
  class="rounded-lg shadow-xl"
/>

After November 3, we'll add the winners from preliminary and certified results when they are available.
