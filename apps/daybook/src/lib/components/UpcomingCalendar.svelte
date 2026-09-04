<script lang="ts">
  /**
   * The Upcoming calendar, set for a page rather than for an inbox.
   *
   * A description list: a date, and what happens on it. A repeated date prints
   * once — two rules closing on the same day are two entries under one
   * deadline, not two deadlines.
   */
  import { copy } from '$lib/copy';
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

  const t = $derived(copy[lang].ui.calendar);
</script>

{#if entries.length}
  <section class="border-t-2 border-ink pt-6">
    <svelte:element this={`h${level}`} class="db-hed">{t.heading}</svelte:element>
    <p class="mt-1 text-ink-soft">{t.window}</p>

    <dl class="mt-7 flex flex-col gap-6">
      {#each entries as entry}
        {@const chip = formatChipDate(entry.date, lang)}
        <div class="flex gap-5">
          <!-- The date, as a stamp: the month over the day, in the display
               face, at full size. -->
          <dt class="w-16 shrink-0 sm:w-20">
            {#if !entry.repeatsDate}
              <span class="sr-only">{formatEditionDate(entry.date, lang)}</span>
              <span aria-hidden="true" class="block font-semibold leading-none text-fire">
                {chip.month}
              </span>
              <span
                aria-hidden="true"
                class="block font-display text-[2.25em] font-semibold leading-none"
              >
                {chip.day}
              </span>
            {/if}
          </dt>
          <dd class="min-w-0 flex-1">
            <p class="text-pretty">{entry.summary}</p>
            {#if entry.sources.length}
              <p class="db-links mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-[1rem]">
                {#each entry.sources as source}
                  <a href={source.url} rel="noopener" target="_blank">{source.label}</a>
                {/each}
              </p>
            {/if}
          </dd>
        </div>
      {/each}
    </dl>
  </section>
{/if}
