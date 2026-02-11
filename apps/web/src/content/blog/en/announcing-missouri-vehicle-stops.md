---
id: "rf-vsr-announcement"
title: "Announcing Missouri Vehicle Stops"
date: "2026-02-11"
description: "A new tool breaks down traffic stops in Missouri by agency"
type: "post"
byline: "David Eads"
editors:
  - "Tory Lysik"
tags:
  - "field-notes"
lang: "en"
previewImage: "/images/social-meta.png"
---

<script>
  import ResizedImage from '$lib/components/ResizedImage.svelte';
</script>


We’re proud to launch one of the things we’ve been working on: **a new accountability journalism tool that exposes data about [traffic stops by agencies in Missouri](https://vsr.recoveredfactory.net).**

<ResizedImage
  src="/images/vsr-screenshot-collage.png"
  alt="Screenshots of Missouri Vehicle Stops site"
  width={800}
  figureClass="my-6"
  class="w-full h-auto"
/>

I know we said we were going to release it about a week ago, but client work for me and illness for Tory befell us here in Recovered Factory HQ and we had to take an extra beat. Running a two-person show has more perks than downsides, until it comes to the flu.  We’re also happy to report y’all supported us with $150 in our first three weeks. Thank you for a great launch, we’re immensely grateful\! [Let’s keep it going.](https://recoveredfactory.net/en/support)

We’ll unpack the tool in more detail in future posts. For now, it’s worth saying something somewhat simple and unorthodox in a field that often [conflates suffering with service](https://www.pboehler.net/22-service-not-sacrifice/): this is a fairly straightforward release, and it didn’t take an especially long time to build.

That’s not because it’s trivial or unpolished. We have fast and functional search, modern web mapping built on [the MapLibre and Protomaps stack](https://scottreinhardmaps.com/blogs/custom-mapping-projects/custom-reuters-open-source-mapping?srsltid=AfmBOorNMsUSOCvNjhEjimvPo2oJcrUC3DebGfdLWbWUeh_QAhLrRAvU), clean data visualizations with interactive graphics, and critical civic data that’s never been publicly available in structured formats for analysis. We’re also two people with full-time gigs and other side projects who built this in our spare time over less than six weeks and had to think hard about the value this creates. Quality over quantity, but speed over paralysis and excessive deliberation. 

We decided to make our initial release less about invention and more about accessibility: Taking material locked inside a bad PDF and making it legible on the web, usable on a phone, easy to compare across years, and directly connected to the underlying data. 

At most of the newsrooms where I’ve worked, this sort of approach seemed too boring to seriously consider. The data comes out every year. There’s not necessarily a clear scoop or overarching narrative. There’s nothing “new” in our product, technically.

But if you’re someone who’s actually in the data — or implicated in it — it’s hard to argue that this stuff is boring. And the data shows there’s a lot of those folks. Law enforcement conducted almost 1.3 million stops in 2024 in Missouri. They handed out over half a million citations and conducted 61,000 searches. Traffic stops are a huge part of what policing *is*, and it shapes how people experience the state in very direct ways.

Agencies like the [Florissant Police Department](https://vsr.recoveredfactory.net/en/agency/florissant-police-dept) and [St. Ann Police Department](https://vsr.recoveredfactory.net/en/agency/st-ann-police-dept) reported issuing citations in over 85% of stops in 2025—an astonishingly high rate compared to [national practices](https://bjs.ojp.gov/content/pub/pdf/pbtss11.pdf) and the statewide rate of about 41%. The St. Ann Police Department also shows a distinct trend that’s worth raising questions about: The [search rate of Hispanic drivers](https://vsr.recoveredfactory.net/en/agency/st-ann-police-dept/metric/rates-by-race--rates--arrest-rate) has increased from around 3% in 2020 and 2021 to almost 30% in 2024. 

<ResizedImage
  src="/images/st-ann-arrest-rate.png"
  alt="The arrest rates for the St. Ann Police Department referenced above, showing an increase in the arrest rate of Hispanic drivers."
  width={800}
  figureClass="my-6"
  class="w-lg mx-auto h-auto"
/>


These are the kind of facts that are easy to miss when the data is buried, hard to compare across time, or functionally inaccessible. We’re confident that people using our tool will find many more trends and disparities like these that allow the public to ask critical accountability questions. 

We know traffic stops are a big deal in the U.S. and especially Missouri as evidenced by the Missouri NAACP’s [travel advisory](https://www.monaacp.org/travel-advisory) and the [Mid-Missouri Civil Liberties Association](https://www.kbia.org/news/2023-07-25/local-organization-leads-community-discussion-on-traffic-stop-racial-disparities)’s advocacy and education campaigns, to name a few. Making this material easier to access is a form of respect for the scale of the issues and for the ecosystems that already exist. 

More soon. In the meantime, tell us how we can improve our tool. What would make it more useful for you?