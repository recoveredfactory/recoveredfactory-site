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

export const formatMonth = (month: string, lang: Lang) =>
  formatDate(`${month}-01`, lang === 'en' ? 'en-US' : 'es-ES', {
    year: 'numeric',
    month: 'long',
  });
