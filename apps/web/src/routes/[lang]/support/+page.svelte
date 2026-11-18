<script lang="ts">
  import { SITE_URL } from '$lib/config';
  import { formatDate } from '$lib/dates';
  import { getResizedImageUrl, getSocialImageUrl } from '$lib/images';
  import { trackEvent } from '$lib/analytics';
  import SupportOptions from '$lib/components/SupportOptions.svelte';
  import { m } from '$lib/paraglide/messages';
  import { SUPPORT_CONTACT_URL } from '$lib/support';

  const { data } = $props();
  const toAbsoluteUrl = (value: string) =>
    /^https?:\/\//i.test(value) ? value : new URL(value, SITE_URL).href;
  const canonical = $derived(new URL(`/${data.lang}/support`, SITE_URL).href);
  const description = $derived(m.support_intro());
  const pageTitle = $derived(`${m.site_name()} · ${m.nav_donate()}`);
  const ogImage = toAbsoluteUrl(
    getSocialImageUrl('/images/factory-share--white-bg.png'),
  );

  const editedLabel = $derived(data.lang === 'es' ? 'Editado por' : 'Edited by');

  // What a supporter is paying for. Someone arriving from one project may not know the others.
  const work = $derived([
    { name: '287(g) Watch', url: 'https://287g.recoveredfactory.net', line: m.support_work_287g() },
    { name: 'Immigration Daybook', url: 'https://immigrationdaybook.com', line: m.support_work_daybook() },
    { name: 'Missouri Vehicle Stops', url: 'https://vsr.recoveredfactory.net', line: m.support_work_vsr() },
    { name: 'Cleveland Police Discipline', url: `${SITE_URL}/police`, line: m.support_work_cleveland() },
  ]);
  const label = 'text-xs font-semibold uppercase tracking-[0.3em] text-slate-500';
</script>

<svelte:head>
  <title>{pageTitle}</title>
  <meta name="description" content={description} />
  <meta property="og:site_name" content={m.site_name()} />
  <meta property="og:title" content={pageTitle} />
  <meta property="og:description" content={description} />
  <meta property="og:type" content="website" />
  <meta property="og:url" content={canonical} />
  <meta property="og:image" content={ogImage} />
  <meta property="og:image:alt" content={pageTitle} />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content={pageTitle} />
  <meta name="twitter:description" content={description} />
  <meta name="twitter:image" content={ogImage} />
  <link rel="canonical" href={canonical} />
</svelte:head>

<main class="min-h-dvh px-6 py-12 sm:px-10 lg:px-16">
  <div class="mx-auto flex max-w-3xl flex-col gap-10">
    <header class="space-y-6">
      <p class={label}>{m.nav_donate()}</p>
      <h1 class="font-display text-4xl font-semibold tracking-tight text-slate-900 sm:text-6xl">
        {m.support_title()}
      </h1>
      <p class="max-w-2xl font-display text-xl leading-relaxed text-slate-700 sm:text-2xl">
        {m.support_intro()}
      </p>
    </header>

    <section class="space-y-4">
      <p class={label}>{m.support_work_heading()}</p>
      <ul class="border-t border-slate-900/20">
        {#each work as item}
          <li class="border-b border-slate-900/20">
            <a
              class="group grid gap-1 py-5 sm:grid-cols-[minmax(0,0.45fr)_minmax(0,1fr)] sm:gap-8"
              href={item.url}
              onclick={() => trackEvent('support_work_click', { project: item.name })}
              rel="noopener noreferrer"
              target="_blank"
            >
              <span class="font-display text-xl font-semibold text-slate-900 group-hover:text-fern">
                {item.name}
              </span>
              <span class="text-base text-slate-700">{item.line}</span>
            </a>
          </li>
        {/each}
      </ul>
    </section>

    <section class="space-y-5 border-t-2 border-slate-900 pt-8">
      <div class="space-y-3">
        <h2 class="font-display text-3xl font-semibold text-slate-900 sm:text-4xl">
          {m.support_levels_heading()}
        </h2>
        <p class="max-w-2xl text-lg text-slate-800">{m.support_pays_body()}</p>
        <p class="text-base text-slate-700">{m.support_subtitle()}</p>
      </div>
      <SupportOptions bare source="page" variant="page" />
    </section>

    <section class="space-y-5 border-t-2 border-slate-900 pt-8">
      <h2 class="font-display text-3xl font-semibold text-slate-900 sm:text-4xl">
        {m.support_hire_heading()}
      </h2>
      <p class="max-w-2xl text-lg text-slate-800">{m.support_hire_body()}</p>
      <p class="flex flex-col gap-3 text-base sm:flex-row sm:items-baseline sm:gap-8">
        <a
          class="font-semibold text-fern underline decoration-2 underline-offset-4 transition hover:text-slate-900"
          href={SUPPORT_CONTACT_URL}
          onclick={() => trackEvent('support_click', { level: 'hire', source: 'page' })}
        >
          {m.support_hire_cta()}
        </a>
        <a
          class="text-slate-700 underline underline-offset-4 transition hover:text-slate-900"
          href={SUPPORT_CONTACT_URL}
          onclick={() => trackEvent('support_click', { level: 'institutional', source: 'page' })}
        >
          {m.support_institutional()}
        </a>
      </p>
    </section>

    <section class="space-y-8 border-t border-slate-900/20 pt-8">
      <p class={label}>
        {m.latest_heading()}
      </p>
      {#if data.posts.length === 0}
        <p class="text-sm text-slate-600">{m.no_posts()}</p>
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
                    class="font-display text-2xl font-semibold tracking-tight text-slate-900 transition group-hover:text-slate-700 sm:text-4xl lg:text-5xl"
                  >
                    {post.meta.title}
                  </h2>
                  <p class="pt-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    By {post.meta.byline || m.site_name()} ·{' '}
                    {formatDate(post.meta.date, data.lang, {
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
