---
id: "287g-watch-mcp"
title: "You can now ask 287(g) Watch questions and do in-depth research with our MCP"
date: "2026-11-24"
description: "Connect 287(g) Watch to your AI assistant and ask about any agency, county or state in your own words. Every answer comes back with its sources attached."
type: "post"
byline: "Tory Lysik"
editors:
  - "David Eads"
tags:
  - "field-notes"
  - "immigration"
lang: "en"
previewImage: "/images/287g-watch-mcp.jpg"
draft: false
---

<script>
  import McpChatDemo from '$lib/components/McpChatDemo.svelte';
  import caneyChat from '$lib/data/287g-mcp-caney-chat.json';
</script>

Since [287(g) Watch](https://287g.recoveredfactory.net/en/methodology) launched in May, we have focused on growing it, listening to the audience and making improvements.

One of the biggest gaps we saw: there is only so much you can do digging through a data portal. You cannot ask it reporting questions, easily compare a wide range of statistics, or ask it softer, less analytical questions.

A data portal is like the stacks in a library. Everything is on the shelves, but you have to know which aisle to walk down, and you can't ask the shelves a question.

So we built an MCP server. Connect it to your AI assistant (Claude, ChatGPT, a local model, Cursor) and ask your question in your own words. The assistant asks our server, and every answer comes back with its sources attached and the most up to date information available. A question that used to mean reading and synthesizing hundreds of pages can be asked in a sentence.

## How to use it

You don't install anything, make an account or pay for anything. The address is [https://mcp.287g.recoveredfactory.net/mcp](https://mcp.287g.recoveredfactory.net/mcp).

- **Claude:** Settings → Connectors → Add custom connector, paste the address, leave the sign-in fields blank. It works on the free plan, which allows one custom connector.
- **Claude Code:** `claude mcp add --transport http 287g-watch https://mcp.287g.recoveredfactory.net/mcp`
- **Cursor and other MCP clients:** add it as an HTTP server with that address.

The page at [287g.recoveredfactory.net/connect](https://287g.recoveredfactory.net/en/connect) has the full instructions in both languages and the privacy section in plain language.

We may implement paid access tiers someday. To help keep the project alive and as accessible as possible, [support our work with a recurring subscription, one-time payment, or hiring us for your next project](https://recoveredfactory.net/en/support).

## What you can do with it

- Dig into one agency, or a handful: who signed, when, which model, what the agreement says.
- Zoom out to a region or a state: "South Florida," "the Las Vegas area," a whole state against the national totals.
- Make an analysis or a chart you can reproduce, down to the exact version of the data.
- Export the data into your own spreadsheet or your newsroom's systems.
- Fact-check a draft: have an assistant check every 287(g) claim against the record.
- Automate it: run the same questions on a schedule and hear when your county shows up.

## Why: a school district in Oklahoma

On March 17, a school district in Washington County, Oklahoma appeared on ICE's [list of 287(g) partners](https://www.ice.gov/identify-and-arrest/287g). [Caney Valley Public Schools](https://287g.recoveredfactory.net/en/agency/caney-valley-public-schools-police-department-ok), Task Force Model, signed March 13. Under a Task Force agreement, a local officer deputized by ICE can question anyone they suspect is in the country illegally and make an immigration arrest without a warrant. No other school district appears in the roster snapshots going back to 2021. And in the roster released a day later, on March 18, the entry was gone.

Nobody in Caney Valley announced either event.

ICE replaces its basic file sporadically and keeps no copy of the old one. We do. We've saved every daily version since 2021, the way newspapers used to keep a morgue, the room of old clippings a reporter checked before writing anything. A one-day entry from March is still in ours.

So we asked the MCP server what happened. It found the entry, gave ICE's dates, said the department was gone from the list by March 18, and said no agreement is on file. It reported ICE's label for the school police, "Municipality," as ICE's label. And it said the record can't tell you why it left.

<McpChatDemo data={caneyChat}>
  A real answer, replayed: Claude (Sonnet 5.5) with only 287(g) Watch connected, asked on Nov. 24, 2026. The question, the five calls to our server and the answer are unedited.
</McpChatDemo>

Using that information, I dug deeper. The superintendent [later said](https://www.kgou.org/rural-oklahoma-school-immigration-partnership) the district's police chief had been misled at an ICE training and never signed anything; the chief said he withdrew within days after a school board member said the board never held a [formal vote](https://austinkocher.substack.com/p/what-a-school-districts-enrollment).

This is one of thousands of stories 287(g) Watch tracks. Without the MCP, it was much harder to connect the dots.

## What's behind every answer

The site has had the rest since May: the agreement texts, the signers, the FBI staffing, the budgets, the elections, state law, the press in two languages, and, since this month, ICE's own detainer and arrest records. The server reads all of it.

**Who's covering it.** One of the things I wondered: when an agency signs, does anyone write about it? About half of the agencies that signed this year police a county with one locally based news outlet or none, by [Northwestern Medill's count](https://www.medill.northwestern.edu/news/2026/local-news-deserts-skyrocket-as-newspaper-closures-escalate-even-as-startups-emerge-medill-study-shows.html). And when we looked for this fall's new agencies in the headlines our press gatherer collected, only a small share were named in a headline about 287(g).

**How long it takes to show up.** Most signings reach ICE's file within a couple of days, while some take a month or more. Two [New Hampshire](https://287g.recoveredfactory.net/en/agency/new-durham-police-department-nh) police departments signed June 22 and appeared Sept. 4. For ten weeks the only people who knew were the people who signed.

**What it's led to.** In the first seven months of this year, ICE sent more detainers to [Florida](https://287g.recoveredfactory.net/en/state/fl) jails under 287(g) than in all of last year, and [Texas](https://287g.recoveredfactory.net/en/state/tx) arrests under the program have multiplied. The jail-to-agency match would say which sheriff's office held who is handwork, so the server stops at the state line and says so.

**Where it reaches.** Agencies are matched to their counties and towns, to the FBI's list of police agencies, to the regions people actually name, and to the interstates, so you can ask how much of a state's highway network sits inside a Task Force agency's jurisdiction.

## Why a data MCP makes your work sturdier

When the [BBC and 21 other public broadcasters](https://www.ebu.ch/files/live/sites/ebu/files/Publications/Intelligence/open/EBU-Intelligence-BBC_News_Integrity_in_AI_Assistants_Report_2025.pdf) had journalists grade 2,709 chatbot answers about the news, in a study published in October 2025, 45% had at least one significant problem, and the most common was sourcing: claims the cited source did not support, or a source that did not exist. A [study published this spring](https://arxiv.org/abs/2605.22785), which put 2,100 questions drawn from same-day BBC News reporting to six chatbots, found that "retrieval, not reasoning, failures drive over 70% of all errors."

MCP servers like ours help address this issue. It hands the assistant a limited amount of information and data that we have vetted, with the citation attached. The assistant answers from that rather than from whatever it can find online, which removes the step where most of the measured errors happen.

In a long conversation, what an assistant was told at the start fades. So the server doesn't load everything up front. It's like marking a trail. Directions given at the trailhead are forgotten by the second mile, so it puts a marker at each fork, right where it's needed. Each answer brings the few explanations that apply to it, like what a Task Force agreement allows when one comes up, plus the next questions worth asking, and the assistant follows that chain at the moment it matters. This keeps conversations cheaper and keeps caveats next to the facts they qualify.

Each answer is stamped with the version of the data behind it, so a fact-checker can see exactly what you saw, even after ICE's list moves on.

That's not to say it will never give you wrong answers. Even if our code was perfect, there are inconsistencies, errors, and gaps in ICE's data. What our tool gives you is a dataset that's been tested, with many of its errors fixed or written down, an explanation of its limits for you and your assistant, and everything reproducible from open code and the ledger. We think that makes it more accurate than a person with the spreadsheet or a chatbot on its own.

The risk of this data was never that someone would read it. It was that nobody could. The shelves were always open. Now, there's someone at the desk!

## Try it

[https://mcp.287g.recoveredfactory.net/mcp](https://mcp.287g.recoveredfactory.net/mcp)

Ask in plain language, in English or Spanish:

- "Does Clark County, Nevada have a 287(g) agreement, and which kind?"
- "What does Alamance County's agreement say about warrants?"
- "How many detainers went to Florida jails this year, by month?"
- "¿Qué dice la prensa en español sobre el 287(g) en Texas este mes?"

Ask it anything you want, and please tell us what you think.
