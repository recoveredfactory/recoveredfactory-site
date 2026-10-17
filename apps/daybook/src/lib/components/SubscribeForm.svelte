<script lang="ts">
  /**
   * The signup itself. Posts to /api/signup, which subscribes the address
   * through Kit's API with the Daybook tag attached. Same mechanics as
   * recoveredfactory.net's form — the two sites feed one Kit account — with
   * the words coming from $lib/copy instead of Paraglide.
   */
  import { fade, slide } from 'svelte/transition';
  import { trackEvent } from '$lib/analytics';
  import { copy } from '$lib/copy';
  import type { Lang } from '$lib/i18n';

  type SubscribeFormProps = {
    lang: Lang;
    /** Where on the site the form sits; rides on every event. */
    placement: string;
    id?: string;
    /** `big` is the plate's form; `inline` is the one between an edition's stories. */
    size?: 'big' | 'inline';
  };

  let { lang, placement, id = 'subscribe', size = 'big' }: SubscribeFormProps = $props();

  const TAG = 'newsletter:immigration-daybook';
  const SOURCE = 'immigrationdaybook.com';

  const t = $derived(copy[lang].ui.subscribe);

  let status = $state<'idle' | 'loading' | 'success' | 'error'>('idle');
  let errorMessage = $state('');
  let emailValue = $state('');

  const inputId = $derived(`${id}-email`);
  const isLocked = $derived(status === 'loading' || status === 'success');

  const handleSubmit = async (event: SubmitEvent) => {
    event.preventDefault();
    if (status === 'loading') return;
    status = 'loading';
    errorMessage = '';
    trackEvent('subscribe_submit', { source: SOURCE, lang, tag: TAG, placement });

    const form = event.currentTarget as HTMLFormElement;
    const formData = new FormData(form);
    formData.set('lang', lang);
    formData.set('fields[lang]', lang);
    formData.set('source', SOURCE);
    formData.set('tag', TAG);

    try {
      const response = await fetch('/api/signup', {
        method: 'POST',
        body: formData,
        headers: { accept: 'application/json' },
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || payload?.ok === false) {
        throw new Error(payload?.error || t.error);
      }
      status = 'success';
      emailValue = '';
      form.reset();
      trackEvent('subscribe_success', { source: SOURCE, lang, tag: TAG, placement });
    } catch (err) {
      status = 'error';
      errorMessage = (err as Error)?.message || t.error;
      trackEvent('subscribe_error', { source: SOURCE, lang, tag: TAG, placement });
    }
  };
</script>

<form action="/api/signup" {id} method="post" onsubmit={handleSubmit}>
  <label class="sr-only" for={inputId}>{t.title}</label>
  {#if status !== 'success'}
    <div
      class={size === 'big'
        ? 'flex flex-col gap-3 sm:flex-row sm:items-stretch'
        : 'flex flex-col gap-2 sm:flex-row sm:items-stretch'}
      transition:slide={{ duration: 220 }}
    >
      <input
        aria-label={t.title}
        bind:value={emailValue}
        class={`db-input sm:flex-1 ${size === 'big' ? 'text-[1.25em]' : ''}`}
        disabled={isLocked}
        id={inputId}
        name="email_address"
        placeholder={t.placeholder}
        required
        type="email"
      />
      <!-- Honeypot: off-screen and unlabeled, so only a bot fills it. -->
      <input
        aria-hidden="true"
        autocomplete="off"
        class="absolute -left-[9999px] h-0 w-0 opacity-0"
        name="website"
        tabindex="-1"
        type="text"
      />
      <input name="fields[lang]" type="hidden" value={lang} />
      <input name="lang" type="hidden" value={lang} />
      <input name="source" type="hidden" value={SOURCE} />
      <input name="tag" type="hidden" value={TAG} />
      <button
        class={`db-button sm:shrink-0 ${size === 'big' ? 'text-[1.25em]' : ''}`}
        disabled={isLocked}
        type="submit"
      >
        {t.button}
      </button>
    </div>
  {/if}
  {#if status === 'success'}
    <p class="db-hed" in:fade={{ duration: 250 }} role="status">{t.success}</p>
  {:else if status === 'error'}
    <p class="mt-3 text-fire-deep" in:fade={{ duration: 200 }} role="alert">
      {errorMessage}
    </p>
  {/if}
</form>
