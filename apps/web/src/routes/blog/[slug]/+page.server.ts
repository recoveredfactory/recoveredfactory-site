import { error, redirect } from '@sveltejs/kit';
import { getPost } from '$lib/blog/loader';
import { DEFAULT_LANG, isLang } from '$lib/i18n';
import { extractLocaleFromRequest } from '$lib/paraglide/runtime';

export const load = ({ params, request }) => {
  const detected = extractLocaleFromRequest(request);
  const lang = isLang(detected) ? detected : DEFAULT_LANG;

  if (getPost(lang, params.slug)) {
    throw redirect(307, `/${lang}/blog/${params.slug}`);
  }

  if (lang !== DEFAULT_LANG && getPost(DEFAULT_LANG, params.slug)) {
    throw redirect(307, `/${DEFAULT_LANG}/blog/${params.slug}`);
  }

  throw error(404, 'Not found');
};
