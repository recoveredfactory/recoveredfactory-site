import { error } from '@sveltejs/kit';
import { findTranslationSlug, getEntry } from '$lib/blog/loader';
import { isLang } from '$lib/i18n';

export const load = ({ params }) => {
  const { lang, slug } = params;
  if (!isLang(lang)) {
    throw error(404, 'Not found');
  }

  const entry = getEntry(lang, slug);
  if (!entry) {
    throw error(404, 'Not found');
  }

  const otherLang = lang === 'en' ? 'es' : 'en';
  const translatedSlug = findTranslationSlug(lang, slug, otherLang);

  return {
    lang,
    slug,
    switchTo: translatedSlug ? `/${otherLang}/${translatedSlug}` : null,
  };
};
