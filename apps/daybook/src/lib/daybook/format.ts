import { formatApDate, formatDate } from '$lib/dates';
import type { Lang } from '$lib/i18n';

// Deliberately its own module, separate from the loader.
//
// The loader eagerly globs every edition's markdown, so anything that imports it
// pulls the whole archive along. These formatters are needed by the archive
// pages themselves, which run in the browser — importing them from the loader
// shipped every edition into the client bundle, which is the precise cost the
// raw-glob-plus-marked design exists to avoid. Pure string formatting lives
// here, where it is safe to import from anywhere.

export const formatEditionDate = (date: string, lang: Lang, { weekday = false } = {}) =>
  lang === 'en'
    ? formatApDate(date, { weekday })
    : formatDate(date, 'es-ES', {
        ...(weekday ? { weekday: 'long' as const } : {}),
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

/**
 * The two halves of a calendar chip: an abbreviated month over a bare day.
 *
 * Uppercased at the callsite rather than here — Spanish month abbreviations are
 * lowercase in ordinary prose, and this is the one place they are set as a
 * label instead.
 */
export const formatChipDate = (date: string, lang: Lang) => ({
  month: formatDate(date, lang === 'en' ? 'en-US' : 'es-ES', { month: 'short' }).replace(/\.$/, ''),
  day: formatDate(date, lang === 'en' ? 'en-US' : 'es-ES', { day: 'numeric' }),
});

export const formatMonth = (month: string, lang: Lang) =>
  formatDate(`${month}-01`, lang === 'en' ? 'en-US' : 'es-ES', {
    year: 'numeric',
    month: 'long',
  });
