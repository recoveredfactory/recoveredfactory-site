---
id: "webs-not-deads"
title: "The Web Isn't Dying, It's Becoming Infrastructure."
date: "2026-05-11"
description: "Should you worry about the death of the web? Only if you’re thinking of it as a destination."
type: "post"
byline: "David Eads"
editors:
  - "Ash Ngu"
  - "Tory Lysik"
tags:
  - "field-notes"
lang: "en"
previewImage: "/images/factory-default--white-bg.png"
hidePreview: true
---

<script>
  import ResizedImage from '$lib/components/ResizedImage.svelte';
</script>

You've heard it many times in the past few years: News media is in the midst of an “[extinction event](http://.com/DNVRSaez/status/2045999388636688607/mediaviewer)” where web traffic is collapsing, search referrals are drying up, AI is eating the [long tail](https://www.cjr.org/analysis/traffic-apocalypse-google-ai-overviews-killing-click-throughs-news-sites.php), and [Google Zero](https://www.theverge.com/24167865/google-zero-search-crash-housefresh-ai-overviews-traffic-data-audience) is here. Some of [that rhetoric is inflated](https://www.seoforgooglenews.com/p/google-zero-is-a-lie), but I saw some version of it happening at my last job, and I see it in the tepid web numbers for our current projects. 

Web technology is everywhere; the web itself is receding into the background. There’s a lot of discourse asking "is the web dying?" that treats the web as a destination and measures how much people still go there. It's easy to catastrophize when you look at it that way, but what's happening is something we can take advantage of. It’s the end of the world as we know it, [and I feel fine](https://www.youtube.com/watch?v=Mjvu9ElurIo&list=RDMjvu9ElurIo&start_radio=1). 

A better question is: how can web technology support and boost engagement, information-sharing, and storytelling on other platforms while serving a more niche role? It's a shift from being a destination in and of itself to being a foundational technology in the service of other kinds of experiences. In practice, that means designing for the web in ways that integrate with video and social platforms — surveys and signups, data downloads, animated charts and maps. The web stitches the pieces together; the broader audience meets them somewhere else.

Take our [latest video](https://www.instagram.com/p/DXht4JTgNXr/) about [Missouri Vehicle Stops](https://vsr.recoveredfactory.net) and note how I leverage the site's mobile design to quickly highlight a few important trends. That's because we built the site to look good and navigate smoothly in a mobile, vertical video format first and foremost.

<ResizedImage
  src="/videos/vsr25_scrolling.gif"
  alt="Scrolling through the website in a social native vertical video."
  figureClass="my-6 max-w-[300px] px-4 sm:px-0"
  caption="[Missouri Vehicle Stops](https://vsr.recoveredfactory.net) is optimized for vertical screencasts and for experts who want to download the data."
  class="w-full h-auto"
  unoptimized
/>

Our site has good engagement: users search for specific metrics, take multiple navigation steps, and 1 in 7 non-bouncing visitors has downloaded the data — they're not consuming on our site, they're remixing in their own tools. Yet predictably, traffic is still in the low hundreds of visitors. At the same time, our nascent video publishing operation has more reach after just two posts with nothing but organic sharing.

That asymmetry is powerful because it lets us prioritize. Interaction design questions that vexed the prestige newsrooms I worked at start to become easier to answer once you ask: what looks best in a vertical screencast?

For example: Missouri Vehicle Stops has a big table of police agencies and dozens of metrics to explore — it's what I use in the video to find a department with a low citation rate. When you click an agency in that table, where should it take you? To a view of the specific metric you were just looking at, or to a general overview for that agency? Both are defensible patterns.  We don't have clear analytics to know the golden path, or whether one even exists.

But making the video, it was instantly clear: get to the dang point. Go straight to the charts and details for that metric. Going through a hub that asks you to click again adds precious seconds to videos we're trying to keep under two minutes. We could fix that with editing, but we could also just optimize the site for video from the jump.

<ResizedImage
  src="/videos/vsr25_navigation.gif"
  alt="Navigating through the website in a social native vertical video."
  figureClass="my-6 max-w-[300px] px-4 sm:px-0"
  class="w-full h-auto"
  caption="We had to get to the charts for Cape Girardeau fast."
  unoptimized
/>

I've worked several places where it was sacrilege to invest less in the web presentation or rethink our relationship with web technology. In our case, the web presence was always going to be primarily for an expert audience. The strong download rate is a tell: our users have real expertise and many of them would rather explore the data in their tool of choice than ours, however beautiful we make it. That's the audience for the site-as-a-destination. 

There aren't going to be a lot of them, and that's fine, because we designed for the remix without over-designing for some general audience that isn't coming to us as a destination anyway. The video is the remix. The site is what made it possible.

<p class="section-break">⁘ ⁘ ⁘</p>

Tory as always keeps pushing to make Missouri Vehicle Stops nicer and have a cleaner aesthetic.  She is not a fan of the color palette despite being the one who made it. There's a lot we could improve, and her instinct is the right one for the kind of project most of us trained on. It's also the instinct I'm asking our little collective to unlearn. We're a small team with finite hours and bills to pay. I can't justify those hours going into site polish when the audience on the web it would serve isn't the audience we have. It might not be perfect aesthetically, but it works. 

It's tempting to call this abandoning the craft. I don't think it is. Craft is figuring out what the thing needs to be and doing that thing excellently. The work I used to do — sweating copy and interactive blocks on a longform feature for a destination site — was real craft for that venue. Sweating how a data tool reads in a ninety-second clip so that meaningful information lands with thousands of people who'd never visit the site directly is the real craft for this one.

Same energy, just evolving with the world around us. And I’m not good at it! But I’m trying to learn. 

<p class="section-break">⁘ ⁘ ⁘</p>

During my last year in a traditional newsroom, several reporters of roughly my vintage told me that they didn't get into journalism just for LLMs to regurgitate their work, much less to optimize their writing for people using chatbots. Valid. It doesn’t feel great if your craft is writing destination stories for the web. 

The thing that shook me is that the folks saying this got into the business around the same time I did in the 2010s — they took the jobs of people who said they didn't get into journalism to have their storytelling boiled down to a tweet or an IG post.

The complaint recurs because the venues keep moving. The work is figuring out how to do journalism well in the venues you actually have, not the one you wish you had. That means treating the web as what it is now — a place where things get built and prepared and made remixable, where transactions happen, where the technology glues together other systems — and treating the platforms downstream of it as where the work, finally, gets seen.

<p class="section-break no-drop">⁘ ⁘ ⁘</p>

To that end, we’re going to be experimenting with animation and video export for Missouri Vehicle Stops next and we would love your feedback on how to make that useful and what you’d like to see. 

We’re also going to do some paid promotion in the excellent data science newsletter [Data Elixir](https://dataelixir.com/). We have a hypothesis that while mainstream philanthropy isn’t so keen on foundational data and informational data journalism, there might be some wealthy individuals in the data world who are.

We’re investing in ourselves, but to keep this going we need your support. If this is valuable, consider a paid subscription, one-time support, or hiring us for your next project.