<script lang="ts">
  import { fade } from 'svelte/transition';
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

  let status = $state<'idle' | 'loading' | 'success' | 'error'>('idle');
  let errorMessage = $state('');
  let emailValue = $state('');
  let supportEmail = $state('');

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
        throw new Error(payload?.error || m.subscribe_error());
      }
      status = 'success';
      supportEmail = submittedEmail;
      emailValue = '';
      form.reset();
    } catch (err) {
      status = 'error';
      errorMessage = (err as Error)?.message || m.subscribe_error();
    }
  };
</script>

<form
  action="/api/signup"
  class={formClass}
  id={id}
  method="post"
  onsubmit={handleSubmit}
>
  <label class={labelClass} for={inputId}>{m.subscribe_title()}</label>
  <div class={layoutClass}>
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
  {#if status === 'success'}
    <p
      class="mt-4 text-center text-base font-semibold text-[#323133] sm:text-lg"
      role="status"
      in:fade={{ duration: 250 }}
    >
      {m.subscribe_success()}
    </p>
    <div class="mt-6" in:fade={{ duration: 250 }}>
      <SupportOptions prefillEmail={supportEmail} source={source} variant="inline" />
    </div>
  {:else if status === 'error'}
    <p class="mt-3 text-center text-sm text-red-600" role="alert" in:fade={{ duration: 200 }}>
      {errorMessage}
    </p>
  {/if}
</form>
