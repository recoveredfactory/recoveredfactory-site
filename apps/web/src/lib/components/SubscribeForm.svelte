<script lang="ts">
  import { onMount } from 'svelte';
  import { fade, slide } from 'svelte/transition';
  import { trackEvent } from '$lib/analytics';
  import { m } from '$lib/paraglide/messages';
  import SupportOptions from '$lib/components/SupportOptions.svelte';

  type SubscribeFormProps = {
    lang: string;
    source: string;
    id?: string;
    formClass?: string;
    layoutClass?: string;
    inputClass?: string;
    buttonClass?: string;
    labelClass?: string;
    redirectTo?: string;
    tag?: string;
    /** Override when the form sits on a dark ground — the default card is
        translucent white and would go unreadable over a dark plate. */
    successClass?: string;
    meta?: Record<string, unknown>;
  };

  let {
    lang,
    source,
    id = 'subscribe',
    formClass = '',
    layoutClass = 'flex flex-col gap-3 sm:flex-row sm:items-stretch sm:justify-center sm:gap-2',
    inputClass =
      'w-full border border-slate-900/15 bg-white/90 px-4 py-3 text-base text-slate-800 placeholder:text-slate-400 shadow-sm sm:max-w-[28rem] sm:flex-none',
    buttonClass =
      'bg-fern-strong px-5 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-fern sm:shrink-0',
    labelClass = 'sr-only',
    redirectTo = '',
    tag = '',
    successClass = 'mt-6 rounded border border-slate-900/10 bg-white/70 p-6 text-center sm:p-8',
    meta = {},
  }: SubscribeFormProps = $props();

  let status = $state<'idle' | 'loading' | 'success' | 'error' | 'guard'>('idle');
  let errorMessage = $state('');
  let emailValue = $state('');
  let supportEmail = $state('');
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
    trackEvent('subscribe_submit', { source, lang, ...(tag ? { tag } : {}), ...meta });

    const form = event.currentTarget as HTMLFormElement;
    const formData = new FormData(form);
    const submittedEmail = String(formData.get('email_address') ?? '').trim();
    pendingEmail = submittedEmail;
    formData.set('lang', lang);
    formData.set('fields[lang]', lang);
    formData.set('source', source);
    if (tag) {
      formData.set('tag', tag);
    }
    if (redirectTo) {
      formData.set('redirect', redirectTo);
    }

    try {
      const response = await fetch('/api/signup', {
        method: 'POST',
        body: formData,
        headers: {
          accept: 'application/json',
        },
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || payload?.ok === false) {
        if (payload?.guard) {
          guardUrl = payload?.guardUrl || '';
          guardLoadCount = 0;
          status = 'guard';
          throw new Error(m.subscribe_guard());
        }
        throw new Error(payload?.error || m.subscribe_error());
      }
      status = 'success';
      guardUrl = '';
      supportEmail = submittedEmail;
      emailValue = '';
      form.reset();
    } catch (err) {
      if (status !== 'guard') {
        status = 'error';
        guardUrl = '';
      }
      errorMessage = (err as Error)?.message || m.subscribe_error();
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
    if (tag) body.set('tag', tag);

    try {
      for (let attempt = 0; attempt < GUARD_CONFIRM_TRIES; attempt += 1) {
        if (attempt > 0) {
          await new Promise((resolve) =>
            setTimeout(resolve, GUARD_CONFIRM_DELAY_MS),
          );
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
          supportEmail = pendingEmail;
          emailValue = '';
          return;
        }
        // A definite "no" ends it; only an unsettled answer is worth retrying.
        if (payload && !payload.retryable) break;
      }

      status = 'error';
      guardUrl = '';
      errorMessage = m.subscribe_error();
    } finally {
      confirming = false;
    }
  };

  onMount(() => {
    if (typeof window === 'undefined') return;
    window.addEventListener('message', handleGuardMessage);
    return () => {
      window.removeEventListener('message', handleGuardMessage);
    };
  });
</script>

<form
  action="/api/signup"
  class={formClass}
  id={id}
  method="post"
  onsubmit={handleSubmit}
>
  <label class={labelClass} for={inputId}>{m.subscribe_title()}</label>
  {#if status !== 'success' && status !== 'guard'}
    <div class={layoutClass} transition:slide={{ duration: 220 }}>
      <input
        aria-label={m.subscribe_title()}
        bind:value={emailValue}
        class={inputClass}
        disabled={isLocked}
        id={inputId}
        name="email_address"
        placeholder={m.subscribe_placeholder()}
        type="email"
      />
      <input name="fields[lang]" type="hidden" value={lang} />
      <input name="lang" type="hidden" value={lang} />
      <input name="source" type="hidden" value={source} />
      {#if tag}
        <input name="tag" type="hidden" value={tag} />
      {/if}
      {#if redirectTo}
        <input name="redirect" type="hidden" value={redirectTo} />
      {/if}
      <button class={buttonClass} disabled={isLocked} type="submit">
        {m.subscribe_button()}
      </button>
    </div>
  {/if}
  {#if status === 'success'}
    <div class={successClass} in:fade={{ duration: 250 }}>
      <p class="font-display text-xl font-semibold text-slate-900 sm:text-2xl" role="status">
        {m.subscribe_success()}
      </p>
      <div class="my-6 h-px bg-slate-900/10"></div>
      <SupportOptions prefillEmail={supportEmail} source={source} variant="inline" />
    </div>
  {:else if status === 'error'}
    <p class="mt-3 text-center text-sm text-red-600" role="alert" in:fade={{ duration: 200 }}>
      {errorMessage}
    </p>
  {:else if status === 'guard'}
    <div class="mt-3 space-y-4 text-center" in:fade={{ duration: 250 }}>
      <p class="text-sm text-slate-600">{m.subscribe_guard()}</p>
      {#if guardUrl}
        <div class="overflow-hidden rounded border border-slate-900/10 bg-white">
          <iframe
            class="h-[520px] w-full"
            onload={handleGuardLoad}
            sandbox="allow-scripts allow-forms allow-same-origin"
            src={guardUrl}
            title={m.subscribe_guard_link()}
          ></iframe>
        </div>
        <p class="text-xs text-slate-500">
          <a
            class="font-semibold text-link transition hover:text-link/80"
            href={guardUrl}
            rel="noopener noreferrer"
            target="_blank"
          >
            {m.subscribe_guard_link()}
          </a>
        </p>
      {/if}
    </div>
  {/if}
</form>
