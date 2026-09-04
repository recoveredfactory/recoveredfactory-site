<script lang="ts">
  /**
   * The signup itself. Posts to /api/signup, which posts on to Kit's form and
   * applies the Daybook tag; handles Kit's recaptcha guard when it appears.
   * Same mechanics as recoveredfactory.net's form — the two sites feed one Kit
   * account — with the words coming from $lib/copy instead of Paraglide.
   */
  import { onMount } from 'svelte';
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

  let status = $state<'idle' | 'loading' | 'success' | 'error' | 'guard'>('idle');
  let errorMessage = $state('');
  let emailValue = $state('');
  let guardUrl = $state('');
  let guardLoadCount = $state(0);
  // Held from submit so the guard confirmation can name the address again — by
  // then the input has been hidden behind the challenge.
  let pendingEmail = $state('');

  // Kit's guard runs inside Kit's own iframe, so the only signals we get are a
  // postMessage that may never arrive and the iframe reloading. Neither proves
  // the challenge passed, so both are treated as "go ask the server", and the
  // server asks Kit. Kit can lag a moment behind the challenge, hence retries.
  const GUARD_CONFIRM_TRIES = 4;
  const GUARD_CONFIRM_DELAY_MS = 1500;
  let confirming = false;

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
    const submittedEmail = String(formData.get('email_address') ?? '').trim();
    pendingEmail = submittedEmail;
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
        if (payload?.guard) {
          guardUrl = payload?.guardUrl || '';
          guardLoadCount = 0;
          status = 'guard';
          trackEvent('subscribe_guard', { source: SOURCE, lang, tag: TAG, placement });
          throw new Error(t.guard);
        }
        throw new Error(payload?.error || t.error);
      }
      status = 'success';
      guardUrl = '';
      emailValue = '';
      form.reset();
      trackEvent('subscribe_success', { source: SOURCE, lang, tag: TAG, placement });
    } catch (err) {
      if (status !== 'guard') {
        status = 'error';
        guardUrl = '';
        trackEvent('subscribe_error', { source: SOURCE, lang, tag: TAG, placement });
      }
      errorMessage = (err as Error)?.message || t.error;
    }
  };

  const handleGuardMessage = (event: MessageEvent) => {
    const data = event?.data;
    if (!data) return;
    const messageName =
      typeof data === 'string'
        ? data
        : (data as { name?: string; event?: string; type?: string }).name ||
          (data as { event?: string }).event ||
          (data as { type?: string }).type;
    if (!messageName || !String(messageName).includes('ckjs:guard:confirmed')) return;
    if (status !== 'guard') return;
    void confirmGuard(true);
  };

  const handleGuardLoad = () => {
    if (status !== 'guard') return;
    guardLoadCount += 1;
    // The first load is the challenge appearing; a second means it was
    // submitted. That says the reader acted, not that they passed, so it asks
    // the server instead of declaring victory.
    if (guardLoadCount >= 2) {
      void confirmGuard(false);
    }
  };

  /**
   * Applies the newsletter tag that /api/signup could not, because Kit
   * interrupted it with the guard. The server verifies against Kit before
   * tagging, so a failed challenge surfaces as an error rather than a success
   * message to someone who never got subscribed.
   */
  const confirmGuard = async (trusted: boolean) => {
    if (confirming || status !== 'guard') return;
    confirming = true;

    const body = new FormData();
    body.set('email_address', pendingEmail);
    body.set('lang', lang);
    body.set('tag', TAG);

    try {
      for (let attempt = 0; attempt < GUARD_CONFIRM_TRIES; attempt += 1) {
        if (attempt > 0) {
          await new Promise((resolve) => setTimeout(resolve, GUARD_CONFIRM_DELAY_MS));
        }
        if (status !== 'guard') return;

        // Ask for real verification on every pass but the last. Only once the
        // retries are spent does a trusted trigger fall back to Kit's word, so
        // lookup lag ends in a tagged subscriber rather than a failed one.
        const isFinal = attempt === GUARD_CONFIRM_TRIES - 1;
        body.set('trusted', trusted && isFinal ? '1' : '0');

        const payload = await fetch('/api/signup/confirm', {
          method: 'POST',
          body,
          headers: { accept: 'application/json' },
        })
          .then((response) => response.json())
          .catch(() => null);

        if (payload?.ok) {
          status = 'success';
          guardUrl = '';
          guardLoadCount = 0;
          errorMessage = '';
          emailValue = '';
          trackEvent('subscribe_success', { source: SOURCE, lang, tag: TAG, placement, guard: 1 });
          return;
        }
        // A definite "no" ends it; only an unsettled answer is worth retrying.
        if (payload && !payload.retryable) break;
      }

      status = 'error';
      guardUrl = '';
      errorMessage = t.error;
      trackEvent('subscribe_error', { source: SOURCE, lang, tag: TAG, placement, guard: 1 });
    } finally {
      confirming = false;
    }
  };

  onMount(() => {
    window.addEventListener('message', handleGuardMessage);
    return () => window.removeEventListener('message', handleGuardMessage);
  });
</script>

<form action="/api/signup" {id} method="post" onsubmit={handleSubmit}>
  <label class="sr-only" for={inputId}>{t.title}</label>
  {#if status !== 'success' && status !== 'guard'}
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
  {:else if status === 'guard'}
    <div class="mt-3 space-y-4" in:fade={{ duration: 250 }}>
      <p>{t.guard}</p>
      {#if guardUrl}
        <div class="overflow-hidden border-2 border-ink bg-paper">
          <iframe
            class="h-[520px] w-full"
            onload={handleGuardLoad}
            sandbox="allow-scripts allow-forms allow-same-origin"
            src={guardUrl}
            title={t.guardLink}
          ></iframe>
        </div>
        <p class="db-links">
          <a href={guardUrl} rel="noopener noreferrer" target="_blank">{t.guardLink}</a>
        </p>
      {/if}
    </div>
  {/if}
</form>
