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
    meta?: Record<string, unknown>;
  };

  const {
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
    meta = {},
  } = $props<SubscribeFormProps>();

  let status = $state<'idle' | 'loading' | 'success' | 'error' | 'guard'>('idle');
  let errorMessage = $state('');
  let emailValue = $state('');
  let supportEmail = $state('');
  let guardUrl = $state('');
  let guardLoadCount = $state(0);

  const inputId = `${id}-email`;
  const isLocked = $derived(status === 'loading' || status === 'success');

  const handleSubmit = async (event: SubmitEvent) => {
    event.preventDefault();
    if (status === 'loading') return;
    status = 'loading';
    errorMessage = '';
    trackEvent('subscribe_submit', { source, lang, ...meta });

    const form = event.currentTarget as HTMLFormElement;
    const formData = new FormData(form);
    const submittedEmail = String(formData.get('email_address') ?? '').trim();
    formData.set('lang', lang);
    formData.set('fields[lang]', lang);
    formData.set('source', source);
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
    status = 'success';
    guardUrl = '';
    guardLoadCount = 0;
    errorMessage = '';
  };

  const handleGuardLoad = () => {
    if (status !== 'guard') return;
    guardLoadCount += 1;
    if (guardLoadCount >= 2) {
      status = 'success';
      guardUrl = '';
      errorMessage = '';
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
      {#if redirectTo}
        <input name="redirect" type="hidden" value={redirectTo} />
      {/if}
      <button class={buttonClass} disabled={isLocked} type="submit">
        {m.subscribe_button()}
      </button>
    </div>
  {/if}
  {#if status === 'success'}
    <div
      class="mt-6 rounded border border-slate-900/10 bg-white/70 p-6 text-center sm:p-8"
      in:fade={{ duration: 250 }}
    >
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
