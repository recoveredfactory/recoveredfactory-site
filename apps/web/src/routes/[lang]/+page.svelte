<script lang="ts">
  import { onMount } from 'svelte';
  import { trackEvent } from '$lib/analytics';
  import { page } from '$app/stores';
  import SubscribeForm from '$lib/components/SubscribeForm.svelte';
  import SupportOptions from '$lib/components/SupportOptions.svelte';
  import { SITE_URL } from '$lib/config';
  import { formatDate } from '$lib/dates';
  import { getResizedImageUrl } from '$lib/images';
  import { m } from '$lib/paraglide/messages';

  const { data } = $props();

  const toAbsoluteUrl = (value: string) =>
    /^https?:\/\//i.test(value) ? value : new URL(value, SITE_URL).href;
  const lang = $derived(data.lang);
  const canonical = $derived(new URL(`/${lang}`, SITE_URL).href);
  const description = $derived(m.hero_subtitle());
  const ogImage = toAbsoluteUrl(
    getResizedImageUrl('/images/factory-share--white-bg.png', { width: 1200 }),
  );

  const redirectTo = $derived($page.url.pathname);
  const isConfirmed = $derived($page.url.searchParams.get('confirmed') === '1');

  const editedLabel = $derived(lang === 'es' ? 'Editado por' : 'Edited by');
  let workshopPulse = $state(false);
  const homeSignupInputClass = $derived(
    `w-full border border-slate-900/15 bg-white/90 px-4 py-3 text-base text-slate-800 placeholder:text-slate-400 shadow-sm sm:max-w-[28rem] sm:flex-none ${
      workshopPulse ? 'workshop-signup-input-pulse' : ''
    }`,
  );

  const onWorkshopAnchor = () => {
    if (typeof window === 'undefined') return;
    workshopPulse = window.location.hash === '#workshop';
  };

  onMount(() => {
    onWorkshopAnchor();
    window.addEventListener('hashchange', onWorkshopAnchor);
    window.addEventListener('workshop-anchor-activate', onWorkshopAnchor);
    return () => {
      window.removeEventListener('hashchange', onWorkshopAnchor);
      window.removeEventListener('workshop-anchor-activate', onWorkshopAnchor);
    };
  });
</script>

<svelte:head>
  <title>{m.site_name()}</title>
  <meta name="description" content={description} />
  <meta property="og:site_name" content={m.site_name()} />
  <meta property="og:title" content={m.site_name()} />
  <meta property="og:description" content={description} />
  <meta property="og:type" content="website" />
  <meta property="og:url" content={canonical} />
  <meta property="og:image" content={ogImage} />
  <meta property="og:image:alt" content={m.site_name()} />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content={m.site_name()} />
  <meta name="twitter:description" content={description} />
  <meta name="twitter:image" content={ogImage} />
  <link rel="canonical" href={canonical} />
</svelte:head>

<main class="min-h-dvh mt-8 px-6 sm:mt-12 sm:px-10 lg:px-16">
  <div class="mx-auto flex max-w-6xl flex-col gap-8 pb-10 sm:gap-10 sm:pb-12">
    <section class="space-y-4 py-10 text-center sm:py-12" id="workshop">
      <h1 class="font-display text-3xl font-semibold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
        {m.hero_title()}
      </h1>
      <p class="mx-auto max-w-2xl text-base text-slate-600">
        {m.hero_subtitle()}
      </p>
    </section>

    {#if isConfirmed}
      <section class="mx-auto w-full max-w-3xl rounded border border-slate-900/10 bg-white/70 p-6 text-center sm:p-8">
        <p class="font-display text-xl font-semibold text-slate-900 sm:text-2xl">
          {m.subscribe_confirmed()}
        </p>
        <div class="my-6 h-px bg-slate-900/10"></div>
        <SupportOptions source="confirm" variant="inline" />
      </section>
    {:else}
      <section>
        <SubscribeForm
          formClass="mx-auto w-full lg:max-w-[75%]"
          id="signup"
          inputClass={homeSignupInputClass}
          lang={data.lang}
          redirectTo={redirectTo}
          source="home"
        />
      </section>
    {/if}

    <section class="mx-auto mt-10 w-full max-w-5xl space-y-8 sm:mt-12">
      <p class="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
        {m.latest_heading()}
      </p>
      {#if data.posts.length === 0}
        <div class="border border-dashed border-slate-900/20 bg-white/50 p-8">
          <p class="text-sm text-slate-600">{m.no_posts()}</p>
        </div>
      {:else}
        <ul class="grid gap-16">
          {#each data.posts as post}
            <li>
              <a
                class={`group grid gap-4 md:items-center md:gap-6 ${
                  post.meta.previewImage && !post.meta.hidePreview
                    ? 'md:grid-cols-[minmax(0,0.7fr)_minmax(0,1fr)]'
                    : 'md:grid-cols-1'
                }`}
                href={`/${data.lang}/${post.slug}`}
              >
                {#if post.meta.previewImage && !post.meta.hidePreview}
                  <img
                    alt={post.meta.title}
                    class="w-full h-auto"
                    loading="lazy"
                    src={getResizedImageUrl(post.meta.previewImage, { width: 720 })}
                  />
                {/if}
                <div
                  class={`max-w-xl space-y-4 text-center ${
                    post.meta.previewImage && !post.meta.hidePreview
                      ? 'md:text-left'
                      : 'md:text-center md:mx-auto'
                  }`}
                >
                  <h2
                    class="font-display text-xl font-semibold tracking-tight text-slate-900 transition group-hover:text-slate-700 sm:text-3xl lg:text-4xl"
                  >
                    {post.meta.title}
                  </h2>
                  <p class="pt-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    By {post.meta.byline || m.site_name()} ·{' '}
                    {formatDate(post.meta.date, lang, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                    {#if post.meta.editors?.length}
                      · {editedLabel} {post.meta.editors.join(', ')}
                    {/if}
                  </p>
                  {#if post.meta.description}
                    <p class="text-lg text-slate-600">{post.meta.description}</p>
                  {/if}
                </div>
              </a>
            </li>
          {/each}
        </ul>
      {/if}
    </section>
  </div>
</main>
