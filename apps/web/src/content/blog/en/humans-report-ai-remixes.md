---
id: "humans-report-ai-remixes"
title: "Humans report, AI remixes"
date: "2026-10-30"
description: "Most newsroom AI makes the same product a little faster. Cleveland Police Discipline rearranges the work: residents read the records, a model writes the plain-English summaries and people check them."
type: "post"
byline: "David Eads and Cid Standifer"
editors:
  - "Tory Lysik"
tags:
  - "field-notes"
lang: "en"
previewImage: "/images/humans-report-og.jpg"
---

<script>
  import ResizedImage from '$lib/components/ResizedImage.svelte';
</script>

<!--
  Source: Google Doc "Police discipline site: Notes for a post", tab "reorganized draft - essay" (Oct. 30).
  The companion "How we built Cleveland Police Discipline" runs Monday; link it from here once it's up.
  Art: NARA 165-WW-23A-103 (NAID 17342476), War Department, 1917-18, public domain. Hero is the Commons
  crop at 2400w; the preview image is a 1.91:1 crop of it (humans-report-og.jpg). Tried and dropped (Oct. 30):
  a closing photo of the empty Glenn L. Martin Co. plant in Cleveland, 1918 (humans-report-martin-cleveland.jpg).
  Screenshots shot from the live site Oct. 30 at a 768px window, 2x, padded to ~40/36 px in that site's
  gray (#f6f7f7). The case card is the essay's own example and shows the officer's name, which the text
  redacts; David OK'd that on Oct. 30.
-->

<ResizedImage
  src="/images/humans-report-pomilio-lathes.jpg"
  alt="A black-and-white photograph of a factory floor crowded with lathes, each tied by a long belt to pulleys on shafts running along the ceiling. Women and men work at the machines and at a table in the foreground."
  width={1200}
  caption="Lathes at the Pomilio aircraft factory, 1917–18, each driven by a belt from the shafts overhead. War Department photograph, [U.S. National Archives](https://catalog.archives.gov/id/17342476)."
  figureClass="my-6"
  class="w-full h-auto"
/>

When factories first got electricity, many swapped the steam engine for one big electric motor and kept the old layout of shafts and belts. According to economic historian Paul David's 1990 paper "[The Dynamo and the Computer](http://www.dklevine.com/archive/refs4115.pdf)," the real gains came decades later, when factories were redesigned around what electric power made possible.

Most newsroom AI is still in that first phase: the same assembly line, running a little faster, and often a little shoddier. A [field report from ASU's Cronkite School](https://cronkite.asu.edu/knightcenter/field-report-AI-in-news) cataloged 160 AI projects at 101 news organizations and found that newsrooms have spent the last few years "using AI primarily to do what they were already doing but faster."

We helped launch a project in Cleveland that tries to rearrange the production floor instead. To see the difference, start with another Cleveland newsroom.

## Bolting a motor onto the old machine

Chris Quinn, editor of cleveland.com and The Plain Dealer, hired an ["AI rewrite specialist"](https://www.editorandpublisher.com/stories/in-this-cleveland-newsroom-ai-is-writing-but-not-reporting-the-news,260375) in January who uses an in-house version of ChatGPT to turn reporters' notes into stories. In a [February letter to readers](https://www.cleveland.com/news/2026/02/journalism-schools-are-teaching-fear-of-the-future-letter-from-the-editor.html), Quinn explained the logic: "Because we want reporters gathering information, these jobs are 100 percent reporting," he wrote. "By removing writing from reporters' workloads, we've effectively freed up an extra workday for them each week." He also blamed journalism schools for being "decades behind" after a job candidate walked away over the newsroom's use of AI.

In April, cleveland.com started posting AI-generated promos for its podcasts, including one starring a cartoon version of Quinn. They were [widely panned](https://awfulannouncing.com/newspapers/cleveland-com-ai-slop-podcast-videos-chris-quinn.html). In [a text that Axios reporter Sam Allard shared](https://x.com/SceneSallard/status/2047306484728426547), Quinn said the newsroom was "using AI because we don't have resources to do it any other way."

And in September, cleveland.com reporter Kaitlin Durbin said that [AI wrote an article under her byline](https://x.com/njKaitlinDurbin/status/2097061231882317827) while she was on her honeymoon. [Speaking to Futurism](https://futurism.com/artificial-intelligence/journalist-accuses-local-newspaper-ai-article), Quinn called it a "simple mistake, the result of a miscommunication."

Quinn says "humans — not AI — control every step." Sounds good, right? Shenanigans like Durbin's fake byline belie that claim, but even if it were true, the product is the same news story, but worse. The source is the same reporting notes. The staff remains a relatively small (and [shrinking](https://ideastream.org/news/the-plain-dealer-dissolving-news-guild-laying-off-remaining-staff)) group of professional journalists. The reporter's job is the same, minus the writing, which, as Northeastern journalism professor Dan Kennedy [pointed out](https://dankennedy.net/2026/02/17/ai-boosting-editor-blasts-j-schools-as-being-out-of-touch-the-reality-is-more-complex/), is where reporters make sense of what they've gathered.

The time saved goes into making more of the same with fewer humans. Same line shaft, bigger motor: faster, cheaper and, judging by cartoon Quinn, a little shoddier. Quinn freed up a workday, but he didn't change the work.

## Rearranging the factory

Part of the reason this model is so disappointing is that so much more is possible.

[Signal Cleveland](https://signalcleveland.org/), [Cleveland Documenters](https://cleveland.documenters.org/) and Recovered Factory just launched [Cleveland Police Discipline](https://cleveland-police-discipline.signalcleveland.org), a searchable database of more than 1,700 disciplinary cases involving more than 1,000 Cleveland police officers, dispatchers, supervisors and other staff, going back to 2016.

Cleveland's police department has been under a U.S. Department of Justice consent decree for more than a decade. A big part of that oversight is how officers are disciplined after civilian complaints, department rule violations, internal investigations and more. The records of that discipline are public, but they aren't easy to search or digest. The city releases them in large PDF files, roughly monthly, and the outcomes are buried in jargon.

Cleveland Documenters set out to make this information useful to Clevelanders. AI makes it accessible.

When you say it fast, our model sounds a lot like Quinn's: People gather the information, and a model does the writing. We make the same resource argument, too. No newsroom in 2026 is going to pay someone to rewrite 1,700 disciplinary notices in plain English. The difference is how the rest of the factory is arranged:

- **Residents do the reading.** Cleveland Documenters read the notices and entered each case into Airtable: the officer, the hearing date, the charges, the outcome and a link to the source document.
- **Journalists bring the judgment.** April Hirsh Urban, Rachel Dissell and Emma Sedlak spent years gathering and reporting on these records, and reporters continue to draw the conclusions and [present the findings](https://signalcleveland.org/how-cleveland-police-discipline-works/). The team wrote a glossary of almost 400 terms to decode the jargon.
- **The model does the grunt-work writing.** For every case, it writes a headline and a plain-language summary and classifies the outcome and severity.
- **People check the model.** A person has validated nearly every summary against the original records.
- **Readers get a durable tool, not just a story.** They can look up an officer, follow a term like "wearable camera system" across the records of more than 300 employees, see when a firing was later overturned and share a link to any search.

<ResizedImage
  src="/images/humans-report-glossary-wcs.png"
  alt="The glossary entry for Wearable Camera System (WCS) on Cleveland Police Discipline: 'A wearable camera system, also known as a bodycam,' followed by links to officers with an action referring to the term and a link to show all 311 matches."
  width={1400}
  caption="Every glossary entry links to the officers whose cases use the term."
  figureClass="my-6 max-w-2xl"
  class="rounded-lg"
/>

Here's what that grunt work looks like for one case. Documenters entered the notice like this:

> Improper Procedure: failed to safeguard and secure assigned Divisional equipment (Wearable Camera System) entrusted to his care. Patrol Officer [name] received a Non-disciplinary Letter of Reinstruction (First Group I violation. Mitigating Factors: No malice or intent and took responsibility for the loss. Aggravating Factor: active discipline). In addition, Patrol Officer [name] is required to reimburse the City of Cleveland.

And the site shows this, followed by the rule violated and the aggravating and mitigating factors as short lists:

> **Non-Disciplinary Letter of Reinstruction for Failing to Safeguard Assigned Wearable Camera System Equipment**
>
> [Name] received a non-disciplinary letter of reinstruction and was required to reimburse the City of Cleveland for failing to safeguard and secure his assigned wearable camera system. According to the divisional notice, this was treated as a first Group I violation.

<ResizedImage
  src="/images/humans-report-case-wcs.png"
  alt="The same case on Cleveland Police Discipline: the headline, the hearing date, a plain-language disposition, the rule violated, and the aggravating and mitigating factors as short lists, with glossary terms underlined and a note that the summary was generated with AI."
  width={1400}
  caption="The same case on Cleveland Police Discipline."
  figureClass="my-6 max-w-xl"
  class="rounded-lg"
/>

That's not deep analysis. It's careful copy editing, done consistently 1,700 times. Few newsrooms could afford to do it by hand, and none would choose to. But it's a critical step for making information like this useful to a normal reader. The same way an average person might need a lawyer to explain a statute, humans not well-versed in police jargon need a translator.

Quinn's version takes the writing out of a reporter's job description and keeps the product. Ours built a product that didn't exist, and used a new division of labor to make it. The writing the model handles is grunt work; the sense-making stays with people. The human time and money go where they count: paying residents to read the records and checking the summary the model writes. One approach cheapens the process and the product. The other enhances both.

Handing the writing to a model sounds backwards if you think writing equals intelligence, and a lot of the journalism industry does. Even when newsrooms use AI to draft or summarize, the words still land under a byline: a Name, ideally a *Big Name*, the singular author responsible for the prose.

The writing on Cleveland Police Discipline doesn't have a singular author. A large language model wrote the summaries, and the site says so. Instead, there's a list of the people who built it: Documenters who read the notices, reporters who spent years understanding the records, the team who wrote the glossary and engineers who wired it together. The credit goes to the reporting and production, not the prose.

## Doing the work is how you learn the data

Why did we spend our resources having humans mine the data?

Journalists often reach for technology first to *extract* information, like scraping a website or pulling structured data out of PDFs. We went the other way. AI could have done the extraction, but when we gamed out the cost of a reliable scraper for the notices' unstructured text, it came out too close to the cost of paying Documenters to make a difference. And people doing the work bring something a scraper can't.

Manual data entry builds shared understanding. Documenters learn the content as they extract it, which means better questions later. Anyone who has entered or cleaned data by hand knows that's where you notice a dataset's weird, problematic and useful features. A pipeline built by someone who hasn't spent time in the records, or by an AI with a naive understanding of them, will miss some of those features or won't be compelled to do the reporting it takes to understand them.

Investing in human-powered, locally rooted data extraction also means we learn some of what the community finds confusing or has doubts about, and what people actually want to know. That gives us two kinds of feedback before anything is published: how the information resonates with people, and how well it meets their needs. It also helps keep the project from narrowing to top-down ideas about what matters.

It's easy to see AI as a way to squeeze out some efficiency by automating grunt work, while keeping the roles and power structures we've inherited. It's more interesting as a change to the process itself, and to who gets to shape the result.

## Why trust an AI summary?

The obvious worry is that AI summaries get things wrong. They can, and the Cronkite report flags reader-facing AI as a reputational risk for newsrooms. So we built the whole pipeline and information design around earning trust. It starts and ends with people, and the model sits in the middle:

- **It starts with human-entered text.** It works from text that Documenters entered and checked against the notices.
- **The instructions are strict.** The model is told to stick to what the source text explicitly supports, to attribute claims like "first offense" to the notice instead of asserting them, and to leave out anything it can't find in the source.
- **When in doubt, it's "unknown."** If a notice doesn't state something, like a violation's severity group or the date someone was fired, the data says "unknown" instead of guessing.
- **It ends with a real human reading and validating the summaries.** We cross-check summaries against the original records. Only a handful of new cases haven't been checked yet.
- **The source is one click away.** Every case includes the original notice text and links to the source documents.
- **Readers can push back.** Every page has a feedback form that goes straight to Signal's editors.

None of this is a shortcut. Making sure you can stand behind the summary takes far more work than generating one. The difference is where the work goes: into checking the facts, not polishing the prose.

## Where the gains go

Paul David's point was that electricity paid off only when factories were rebuilt around it. This project is a proof of concept of that rebuild. The philosophy is simple: invest in people where judgment is needed, automate the drudgery, keep the tech light and make the outputs portable.

The people we invest in live in Cleveland. Documenters are residents who get paid to attend public meetings and read public records. They don't need to be great writers or big names. They need to be careful readers who are curious about their city. The work pays Clevelanders, and the expertise stays with them: Documenters come away knowing more about how police discipline actually works, and that knowledge remains in the neighborhoods that live with the impact of policing.

It's a loop: Residents read the records, AI makes them readable and residents use them. The national Documenters organization is using similar techniques to [assist people in the field](https://www.citybureau.org/notebook/2026/10/20/many-organizations-are-using-ai-coverage-in-place-of-people-we-built-something-for-the-people-showing-up). In these examples, the people holding the lens are in the picture.

None of this is specific to police discipline. The same Cronkite report describes a small group of AI experiments that treat "journalism as a utility," with tools that help people navigate civic issues such as property taxes, evictions or restaurant inspections. Plenty of records are technically public but practically unreadable, and the same approach works for them: People who know the material do the reading, and AI turns their work into something communities can use.

Once the reporting is solid, the writing becomes clay. Today it's a plain-English summary. Tomorrow it could be translations, a chat or voice interface, or a native app. Humans report, AI remixes, and there's a lot more remixing to do.

There's no byline on the writing. Here are the people who built it: April Hirsh Urban, Rachel Dissell, Emma Sedlak, Cid Standifer, Hails Hoyat, Dan McLaughlin, Rosie Palfy, Mary Ellen Crowley Huesken, Frank W. Lewis and David Eads, with illustrations by John G.
