import { redirect } from '@sveltejs/kit';
import { extractLocaleFromRequest } from '$lib/paraglide/runtime';
import { DEFAULT_LANG, isLang } from '$lib/i18n';

export const load = ({ request }) => {
  const detected = extractLocaleFromRequest(request);
  const lang = isLang(detected) ? detected : DEFAULT_LANG;

  throw redirect(307, `/${lang}/blog`);
};
