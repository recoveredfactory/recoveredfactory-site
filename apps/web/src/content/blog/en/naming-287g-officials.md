---
id: "naming-287g-officials"
title: "Why We're Naming the Officials Who Signed 287(g) Agreements"
date: "2026-07-10"
description: "The public deserves to know who signed their local police agreement with ICE — and how to reach them."
type: "post"
byline: "Tory Lysik and David Eads"
tags:
  - "field-notes"
lang: "en"
previewImage: "/images/287g-og-moa.png"
---

<script>
  import ResizedImage from '$lib/components/ResizedImage.svelte';
</script>

From the beginning, we envisioned [287(g) Watch](https://287g.recoveredfactory.net) as an explanatory and accountability tool. We've added two features that move us closer to that vision:

* [State pages with AI-written, data-grounded news summaries](https://287g.recoveredfactory.net/en/states). We'll be writing about these soon.
* The names and contact information of agency officials who signed 287(g) agreements with the Department of Homeland Security (DHS), like this one from the [Autauga, Alabama Sheriff's Office](https://287g.recoveredfactory.net/en/agency/autauga-county-sheriffs-office-al).

<div class="grid grid-cols-2 gap-4 sm:gap-6 my-6 mx-auto max-w-lg">
  <ResizedImage
    src="/images/287g-state-summaries.png"
    alt="A 287(g) Watch state page for Missouri, with agency counts, an AI-written news summary, and a map of participating agencies"
    figureClass="my-0 max-w-full"
    class="rounded-lg shadow-xl"
  />
  <ResizedImage
    src="/images/287g-signers.png"
    alt="An agency detail on 287(g) Watch showing who signed each agreement for ICE and the public contact information for each agreement"
    figureClass="my-0 max-w-full"
    class="rounded-lg shadow-xl"
  />
</div>

Why are we extracting and revealing agency contacts from these agreements? A 287(g) agreement isn't just a policy position or a bureaucratic checkbox — it's a decision, made by a named official, to enter their agency into a partnership with Immigration and Customs Enforcement (ICE), one that gives local officers the authority to enforce federal immigration law.

That decision has consequences for real people living in that jurisdiction. Agencies put full contact information into the agreements, which ICE publishes alongside its participation roster.

Whether you're a fan or a critic of the 287(g) program, for ideological or pragmatic reasons, you deserve to know who made that decision, and how to reach them in their official capacity. Now, at least where the agreement is available, you can.

## How we did it

Elijah Appelson's [Tracking 287(g)](https://github.com/appelson/Tracking_287g) archive, our primary data source, contains more than 1,800 Memorandum of Agreement files going back to 2016. These are the actual signed documents. They're pretty formulaic and don't disclose much, but they do include names, titles, field office assignments, and dates. We'd been linking to them but hadn't built the code to process them.

Here's the thing about those PDFs: they're formatted for human eyes. Each one has a two-column layout — the local agency's signatory block on one side, ICE's on the other — so a person reading it can see both parties at a glance. Software doesn't read that way. It reads left to right across the whole page, which scrambles the two columns together: ICE's title interleaved with the sheriff's name, or a city name where a job title should be. The information was technically public. It just wasn't machine-readable without a fight.

<ResizedImage
  src="/images/287g-2col-moa.png"
  alt="The two-column signature block from a signed 287(g) agreement — the local sheriff's signatory block on the left, ICE's on the right"
  figureClass="my-6 max-w-2xl"
  class="rounded-lg shadow-xl"
/>

The fix was to convert the PDFs to text using pdftotext's layout-preserving mode, which keeps the spatial position of each line, then count leading spaces to determine which column a line belongs to — thirty or more leading spaces means it's part of the second column.

From there, we had to contend with three different agreement formats, build a blocklist of false positives (template junk like "For ICE:" kept getting pulled in as a signer name), and tune parsers to each template's quirks. The tool now extracts the name and title of the ICE official who signed — typically a headquarters official, such as ICE's Deputy Director or Acting Director — along with the ICE field office responsible for the agreement, the local agency head's name where it appears as typed text, and each agency's public point of contact. The [extraction code is available on Github](https://github.com/recoveredfactory/287g-watch/blob/main/packages/pipeline/extract-moa-signers.ts).

Coverage isn't complete. Some older PDFs don't parse cleanly, addendum dates are embedded as digital signature metadata rather than readable text, and in the current template the local official's signature often exists only as an image of a handwritten name or signature with no typed text to extract.

But for most agencies with a PDF on file, you can now look up whom to contact and in hundreds of cases, exactly who signed. We're not done: the next step is extracting the signatures themselves from the PDFs as images so that even where no typed name exists, the record of who signed is preserved and visible.

Public officials making public decisions should be named. You should be able to contact them in their official role and tell them what you think. This information was always in the documents ICE publishes. Now it's yours.
