<script lang="ts">
  /**
   * The Upcoming calendar, set for a page rather than for an inbox.
   *
   * The email builds this out of nested presentational tables because that is
   * what mail clients understand. Nothing here needs to: it is a description
   * list, which is what it has been all along — a date, and what happens on it.
   * Screen readers get that structure for free, and the date chips line up
   * without a table doing the work.
   *
   * A repeated date prints its chip once. Two rules closing on the same day are
   * two entries under one deadline, and stamping "AUG 31" twice down a column
   * reads as two separate ones.
   */
  import { formatChipDate, formatEditionDate } from '$lib/daybook/format';
  import type { UpcomingEntry } from '$lib/daybook/upcoming';
  import type { Lang } from '$lib/i18n';

  type UpcomingCalendarProps = {
    entries: UpcomingEntry[];
    lang: Lang;
    /** Heading level to render at, matching the edition's own sections. */
    level?: 2 | 3;
  };

  let { entries, lang, level = 2 }: UpcomingCalendarProps = $props();

  const es = $derived(lang === 'es');
  const heading = $derived(es ? 'Próximamente' : 'Upcoming');
  const bucket = $derived(es ? 'Próximas cuatro semanas' : 'Next four weeks');
</script>

{#if entries.length}
  <section class="rf-upcoming not-prose">
    <svelte:element this={`h${level}`} class="rf-daybook__section">
      {heading}
    </svelte:element>
    <p class="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500">{bucket}</p>

    <dl class="mt-5 flex flex-col gap-5">
      {#each entries as entry}
        {@const chip = formatChipDate(entry.date, lang)}
        <div class="flex gap-4">
          <dt class="w-12 shrink-0 pt-0.5 text-center">
            {#if !entry.repeatsDate}
              <span class="sr-only">{formatEditionDate(entry.date, lang)}</span>
              <span
                aria-hidden="true"
                class="block text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-fern-strong"
              >
                {chip.month}
              </span>
              <span
                aria-hidden="true"
                class="block font-display text-xl leading-tight font-semibold text-slate-900"
              >
                {chip.day}
              </span>
            {/if}
          </dt>
          <dd class="min-w-0 flex-1">
            <p class="text-sm leading-relaxed text-slate-700">{entry.summary}</p>
            {#if entry.sources.length}
              <p class="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-xs">
                {#each entry.sources as source}
                  <a
                    class="text-link underline-offset-2 transition hover:underline"
                    href={source.url}
                    rel="noopener"
                    target="_blank"
                  >
                    {source.label}
                  </a>
                {/each}
              </p>
            {/if}
          </dd>
        </div>
      {/each}
    </dl>
  </section>
{/if}
