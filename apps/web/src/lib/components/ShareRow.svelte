<script lang="ts">
  /**
   * Pass this edition on.
   *
   * WhatsApp first, and not as one icon among six. Spanish-language news in the
   * US propagates person-to-person through WhatsApp far more than it does
   * through feeds, so for the readers this newsletter is hardest to reach, a
   * forward is the actual distribution mechanism rather than a courtesy button.
   * Naming it outright also says we know how you read.
   *
   * Copy-link sits beside it for everywhere else — Signal, a text, a group
   * chat we have no business enumerating. There is deliberately no row of
   * network icons: every one of them is a tracker the reader did not ask for,
   * and `wa.me` is a plain link that phones home to nobody until it is clicked.
   */
  import { trackEvent } from '$lib/analytics';
  import type { Lang } from '$lib/i18n';

  type ShareRowProps = {
    /** Absolute URL — this gets pasted into other apps, so it cannot be a path. */
    url: string;
    title: string;
    lang: Lang;
    /** Rides along on the share events so slots can be told apart. */
    placement?: string;
  };

  let { url, title, lang, placement = 'daybook-edition' }: ShareRowProps = $props();

  const es = $derived(lang === 'es');

  // TODO(david): stub copy, all five.
  const prompt = $derived(es ? 'Pásalo:' : 'Pass it on:');
  const whatsappLabel = 'WhatsApp';
  const copyLabel = $derived(es ? 'Copiar enlace' : 'Copy link');
  const copiedLabel = $derived(es ? '¡Copiado!' : 'Copied');
  const note = $derived(
    es
      ? 'El enlace lleva “?via” y nada más — sin identificadores, sin rastreo entre sitios.'
      : 'The link carries “?via” and nothing else — no identifiers, no cross-site tracking.',
  );

  /**
   * One readable parameter, and it is the whole of what we add.
   *
   * WhatsApp sends no referrer, so a link forwarded into a chat arrives as
   * direct traffic and is invisible — without a marker there is no way to know
   * whether any of this works. A single `?via=whatsapp` fixes that, and it is
   * deliberately not the usual `utm_source`/`utm_medium`/`utm_campaign` stack
   * plus a click id: nothing here identifies a person, a session or a device,
   * so the same string can be forwarded a hundred times and still says only
   * "this arrived through a chat app". It is short enough to read in the URL
   * bar, which is the point — a reader can see the whole of what we collect
   * without taking our word for it, and the line below says so out loud.
   */
  const via = (channel: string) => {
    const target = new URL(url);
    target.searchParams.set('via', channel);
    return target.href;
  };

  // wa.me takes one blob of text, so the headline and the link travel together
  // — a bare URL in a group chat is a thing nobody clicks.
  const whatsappHref = $derived(
    `https://wa.me/?text=${encodeURIComponent(`${title} — ${via('whatsapp')}`)}`,
  );

  let copied = $state(false);
  let resetAt: ReturnType<typeof setTimeout> | undefined;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(via('copy'));
      copied = true;
      clearTimeout(resetAt);
      resetAt = setTimeout(() => (copied = false), 2000);
      trackEvent('share', { channel: 'copy', placement, lang });
    } catch {
      // Clipboard is permission-gated and refuses outright in some in-app
      // browsers — the WhatsApp link beside this one still works, so this
      // fails quietly rather than throwing an error at someone who just
      // wanted to send a link.
    }
  };
</script>

<div class="not-prose">
  <div class="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
    <span class="text-slate-500">{prompt}</span>

    <a
      class="inline-flex items-center gap-1.5 border border-slate-900/15 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-900/30 hover:text-slate-900"
      href={whatsappHref}
      onclick={() => trackEvent('share', { channel: 'whatsapp', placement, lang })}
      rel="noopener noreferrer"
      target="_blank"
    >
      <svg aria-hidden="true" class="size-3.5" fill="currentColor" viewBox="0 0 24 24">
      <path
        d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.87 9.87 0 0 0 4.74 1.21h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm0 18.15h-.01a8.23 8.23 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.23 8.25-8.23 2.2 0 4.27.86 5.83 2.42a8.19 8.19 0 0 1 2.41 5.82c0 4.54-3.7 8.23-8.24 8.23Zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.24-.64.8-.78.97-.15.16-.29.18-.54.06-.25-.13-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.01-.38.11-.5.11-.11.25-.29.37-.44.13-.15.17-.25.25-.42.08-.16.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.4-.42-.56-.43h-.47c-.16 0-.43.06-.65.31-.22.25-.85.84-.85 2.04s.87 2.37 1 2.53c.12.16 1.71 2.61 4.14 3.66.58.25 1.03.4 1.38.51.58.19 1.11.16 1.53.1.47-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.15-1.18-.06-.11-.22-.17-.47-.29Z"
        />
      </svg>
      {whatsappLabel}
    </a>

    <button
      class="inline-flex items-center border border-slate-900/15 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-900/30 hover:text-slate-900"
      onclick={copy}
      type="button"
    >
      {copied ? copiedLabel : copyLabel}
    </button>
  </div>

  <!-- Said out loud, because the whole argument for one readable parameter is
       that a reader can check it. -->
  <p class="mt-2 text-xs text-slate-500">{note}</p>
</div>
