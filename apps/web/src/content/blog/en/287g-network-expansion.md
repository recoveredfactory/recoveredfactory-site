---
id: "287g-network-expansion"
title: "Almost a third of all 287(g) agreements are barely three months old"
date: "2026-07-23"
description: "The ever-expanding network of immigration enforcement is quickly adding the smallest police departments in the South."
type: "post"
byline: "David Eads and PromptQL"
editors:
  - "Tory Lysik"
tags:
  - "field-notes"
  - "immigration"
lang: "en"
previewImage: "/images/287g-expansion-og.png"
---

<script>
  import SigningsChart from '$lib/components/charts/SigningsChart.svelte';
  import StateSigningsTable from '$lib/components/charts/StateSigningsTable.svelte';
  import ResizedImage from '$lib/components/ResizedImage.svelte';
</script>

<ResizedImage
  src="/images/287g-expansion-nation.gif"
  alt="An animated map of the United States. Agencies that joined ICE's 287(g) program before April 2026 appear in gray, then agencies that have signed on from April through July fill in as orange dots, clustering heavily across Texas, the South, and the lower Midwest."
  figureClass="mb-8 max-w-2xl"
  caption="Every agency in ICE's 287(g) program: those that signed on before April 2026 (gray) and the wave since April (orange), which concentrates across Texas and the South. Dots are sized by each agency's sworn-officer count."
  unoptimized
/>

*We're back with another AI experiment. This time, provoked by a slow-dawning human insight: Staring at the latest charts, it seemed to me like 287(g) signings since April must represent a big chunk of all agreements. I handed that hunch to [PromptQL](https://promptql.io), which has the ICE 287(g) roster, deep news context, state legislation tracking, and sources like Florida's Suspected Unauthorized Alien Encounters dashboard and this is what it came up with. As always, heavily edited and checked by me.*

*We released [embeddable animated maps](https://287g.recoveredfactory.net/en/use-the-map) in English and Spanish to go accompany our analysis. The videos and this article itself are licensed using [Creative Commons BY 4.0](https://creativecommons.org/licenses/by/4.0/). Use freely with attribution.*

<p class="section-break">⁘ ⁘ ⁘</p>

There are currently over 1,800 agencies with an agreement with ICE to enforce federal immigration law through the 287(g) program. About 28% of those have signed since April of this year. Taken together, April through June is the largest three-month stretch of signings since Trump took office in 2025. And agencies are overwhelmingly agreeing to implement the Task Force Model, the agreement type that lets local police make immigration arrests during routine patrols and traffic stops.

A signed agreement does not immediately or automatically mean an active enforcement program. Bigger agencies have a ramp-up, like Missouri State Patrol who joined 287(g) last spring, but reportedly didn't start implementing the program [until the fall](https://spectrumlocalnews.com/mo/st-louis/news/2026/02/13/missouri-ice-mshp-st-louis-st-charles). A small rural police department in Texas or Arkansas, on the other hand, can sign a Task Force Model agreement with minimal upfront investment.

<SigningsChart lang="en" />

April was the first sign of a jump with 139 new agreements, compared to about 100 per month in the first quarter of 2026, and signings have remained elevated since. June was the single biggest month of the year so far, with 154. Across April, May, and June, 409 agencies signed on, the largest three-month run since the administration took office.

Texas alone added 88 new agreements in the April–June window, bringing it to almost 400 agencies. Arkansas (+47), Oklahoma (+40), Pennsylvania (+34), and Missouri (+32) round out the top five. Nearly six in ten new agencies are concentrated in just those five states.

<figure class="rf-resized-image mx-auto my-6 max-w-2xl">
  <picture>
    <source media="(max-width: 639px)" srcset="/images/287g-expansion-states-portrait.gif" />
    <img
      src="/images/287g-expansion-map.gif"
      alt="An animated map of Texas, the South, and the lower Midwest. Agencies that signed 287(g) agreements before April 2026 sit on the map in slate gray; a wave of new signers since April then fills in as orange dots, concentrated across Texas, Arkansas, Oklahoma, Missouri, and Pennsylvania."
      class="w-full h-auto"
      loading="lazy"
      decoding="async"
    />
  </picture>
  <figcaption class="rf-image-caption mt-2 text-xs text-slate-500">Departments that had signed on before April 2026 (gray) and the wave that has signed since (orange). The new signers cluster across Texas and its neighbors. Dots are sized by each agency's sworn-officer count.</figcaption>
</figure>

As the maps above show, most of these new signers are tiny. The median agency that signed since April serves about **4,400 people with nine sworn officers.** Half of the agencies signing up during this time period have fewer than ten officers; a quarter have four or fewer according to FBI data. Nine in ten serve a population under 25,000 and none serve a jurisdiction of 250,000 or more.

That's a shift from the agencies that signed earlier, whose median was roughly 15,000 residents and 27 officers, and which included big metro-area sheriffs and state agencies. The new wave is overwhelmingly small-town and rural: departments like [Mountainburg, Arkansas](https://287g.recoveredfactory.net/en/agency/mountainburg-police-department-ar) (one officer, population 533) or [Brookside, Alabama](https://287g.recoveredfactory.net/en/agency/brookside-police-department-al) (one officer, population 1,185). About two-thirds are municipal police departments; most of the rest are county sheriffs.

<StateSigningsTable lang="en" />

This is an implication of the Task Force Model's apparently low barrier to signing: A one- or two-officer department can sign and gain the authority to make immigration arrests on patrol without building any of the infrastructure a jail-based one requires.

Call it "long tail" policing: Federal immigration-enforcement authority is spreading into some of the smallest, least-resourced police agencies, primarily in the south, which tend to have the least oversight and training capacity. They might not necessarily have many opportunities to carry out immigration enforcement, but now they have federal powers.

<p class="section-break">⁘ ⁘ ⁘</p>

The Task Force Model's dominance matters because it changes how people encounter immigration enforcement. TFM agreements deputize patrol officers to question and arrest people during traffic stops and routine patrols. Oklahoma's state-trooper partnership, for example, recently netted more than [600 commercial-vehicle-operator apprehensions](https://cdllife.com/2026/over-600-commercial-vehicle-operators-apprehended-as-part-of-ice-partnership-oklahoma-troopers/) in a single joint operation.

The other two models — the Jail Enforcement Model and the Warrant Service Officer program — are triggered only after someone has been arrested for another crime. Both have seen modest growth, but the recent swell tilts the balance even further toward patrol-based enforcement. Of the new agreements signed since April, 86% are Task Force Model.

We don't have cohesive national enforcement data, but Florida's [Suspected Unauthorized Alien Encounters dashboard](https://www.fdle.state.fl.us/CJIS/Suspected-Unauthorized-Alien-Encounters.aspx) offers a window into what this looks like in practice. The state reports about 14K 287(g) arrests since this time last year. Florida has perhaps the most transparent topline immigrant arrest data in the country, and while it does not break down the initiating event for every arrest, the scale is clear: 287(g) is now a major pipeline into immigration detention and [likely deportation](https://recoveredfactory.net/en/ice-jails-nearly-everyone).

<ResizedImage
  src="/images/287g-fdle-dashboard.png"
  alt="Florida's Suspected Unauthorized Alien Encounters dashboard, showing tiles for 29,025 encounters, 23,419 arrests, 14K 287(g) arrests, 21,731 ICE contacted, and 11K ICE responded, for encounters submitted since August 1, 2025."
  figureClass="my-6 max-w-xl"
  caption="Florida's Suspected Unauthorized Alien Encounters dashboard. Of the 23,419 immigration arrests the state logs since August 2025, it attributes about 14,000 to 287(g). Captured July 23, 2026."
  unoptimized
/>

<p class="section-break">⁘ ⁘ ⁘</p>

But even in places where Trump's immigration policies are popular, there's been pushback.

In Texas, the expansion is driving visible friction. Attorney General Ken Paxton is [publicly pressuring Dallas County](https://nbcdfw.com/news/local/paxton-pressures-dallas-county-on-immigration-enforcement-compliance/4023761) to join the program, while [cities like Hitchcock](https://nbcdfw.com/news/local/paxton-pressures-dallas-county-on-immigration-enforcement-compliance/4023761) have formally voted against it. The [tension escalated sharply](https://www.texastribune.org/2026/07/15/texas-houston-ice-shooting-fear/) after an ICE agent [fatally shot a man](https://apnews.com/article/ice-shooting-houston-lorenzo-araujo-salgado-93aa1fdf11e89422027d8b9c963a9b64) during a Houston enforcement stop. The Texas Rangers are now investigating the incident; policing experts noted the agency's use of unmarked cars and firing into a vehicle likely violated its own policies.

In Arkansas, immigrant advocates called for a [boycott of the Tontitown Grape Festival](https://www.5newsonline.com/article/news/politics/immigration-news/immigration-reform-group-calls-tontitown-grape-festival-boycott/527-3fb38ecd-713b-4bfa-bfb3-f6f3306d517e) after the local police department entered a 287(g) agreement, while [crackdowns in Springdale](https://www.nwaonline.com/news/2026/may/07/iced-out-immigration-enforcement-efforts-in-springdale-elicit-wide-array-of-reactions/) and an [ICE facility in Little Rock](https://arktimes.com/arkansas-blog/2026/06/26/american-dreams-on-ice) have drawn sustained protest.

And in Idaho, the state sheriffs' association voiced "[unequivocal opposition](https://www.ktvb.com/article/news/local/capitol-watch/idahos-sheriffs-association-pens-letter-legislature-emphasizing-unequivocal-opposition-ice-partnership-proposal/277-c3fb865f-16aa-424e-88fe-fb3d36102501)" to mandatory, state-legislated agreements, with Ada County Sheriff Matt Clifford [posting his concerns](https://adacounty.id.gov/sheriff/news/statement-from-sheriff-matt-clifford/) on the department's website. "I find it difficult to come to grips with the idea that our Republican, conservative state would seek to force Idaho Sheriffs into participating in a voluntary federal program — one that binds us not just today, but into the future under any administration."

Florida also offers a fascinating picture of the role of financial incentives. The state is directing millions in state and federal funds to agencies with 287(g) agreements, and CFO Blaise Ingoglia has been [explicit about chasing the money](https://flvoicenews.com/cfo-ingoglia-awards-over-24-million-to-law-enforcement-agencies-for-immigration-enforcement/). But now some [police officials seem frustrated](https://www.cltampa.com/news/tampa-bay-cops-say-their-ice-agreements-are-a-formality-pinellas-sheriff-says-thats-not-enough/) that their peers are taking the resources without doing much enforcement, and local leaders in [Miami](https://wlrn.org/government-politics/2026-06-25/miami-leaders-face-mounting-pressure-to-exit-controversial-pact-between-ice-and-city-police) and [St. Petersburg](https://floridapolitics.com/archives/808246-rev-andy-oliver-challenges-ken-welchs-no-choice-claim-on-st-pete-ice-partnership/) are facing intense pushback from civil-rights advocates demanding they terminate their partnerships.

Heading into a critical midterm season, 287(g) participation is higher than ever. We know the recent expansion is heavily concentrated in a handful of states, that the model being deployed is the one most closely tied to street-level policing — traffic stops, warrant service, patrol encounters, and workplace raids — and that it's reaching ever-smaller, less-resourced departments.

This is the long tail and increasingly omnipresent network of immigration enforcement.

---

*Data: ICE 287(g) roster is sourced from ICE via [Elijah Appelson's archive](https://github.com/appelson/Tracking_287g). Agency size from the [FBI Law Enforcement Employees](https://cde.ucr.cjis.gov/LATEST/webapp/#/pages/downloads) (LEE) dataset joined on ORI. State news is grounded in systematic search and clustering developed by Recovered Factory, specifically filtered to Texas, Arkansas, Oklahoma, Missouri, Pennsylvania, and Florida. Florida arrest data from the [FDLE SUAE](https://app.powerbigov.us/view?r=eyJrIjoiYTEyNTlhZTYtYmI0My00MzgwLWE3MjUtNjgzNmFjY2VmMTJlIiwidCI6IjZmM2E4MGIzLTY2Y2EtNDE0MC04ODg2LWRjNjBiMDM3ZGEwNiJ9&pageName=8bd088f208a6865a0c71) dashboard.*

*Want to use our animated maps in your work? [Download them here.](https://287g.recoveredfactory.net/en/use-the-map)*

<a href="https://287g.recoveredfactory.net/en/use-the-map" aria-label="Download and embed these 287(g) maps on the Use the Map page">
  <ResizedImage
    src="/images/287g-expansion-card.gif"
    alt="The vertical, shareable version of this graphic, animating the wave of new agencies from April to July: the headline, the 514 new-agencies count, the national map, a timeline, and a grid of state maps."
    figureClass="mx-auto mt-6 mb-2 max-w-[260px]"
    unoptimized
  />
</a>
