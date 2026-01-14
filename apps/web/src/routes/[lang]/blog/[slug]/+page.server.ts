import { error } from '@sveltejs/kit';
import { findTranslationSlug, getPost } from '$lib/blog/loader';
import { isLang, type Lang } from '$lib/i18n';

export const load = ({ params }) => {
  const { lang, slug } = params;
  if (!isLang(lang)) {
    throw error(404, 'Not found');
  }

  if (!getPost(lang, slug)) {
    throw error(404, 'Not found');
  }

  const otherLang: Lang = lang === 'en' ? 'es' : 'en';
  const translatedSlug = findTranslationSlug(lang, slug, otherLang);

  return {
    lang,
    slug,
    switchTo: translatedSlug ? `/${otherLang}/blog/${translatedSlug}` : null,
  };
};
