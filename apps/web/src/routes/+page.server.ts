import { redirect } from '@sveltejs/kit';
import { dev } from '$app/environment';
import { LANGS, isLang } from '$lib/i18n';
import { resolveLocaleForRequest } from '$lib/locale-request';
import { cookieName } from '$lib/paraglide/runtime';

const LOCALE_DEBUG_ENABLED = dev || process.env.LOCALE_DEBUG === '1';

export const load = ({ request }) => {
  const resolution = resolveLocaleForRequest(request);

  if (LOCALE_DEBUG_ENABLED) {
    if (resolution.cookieValue && !isLang(resolution.cookieValue)) {
      console.warn('[i18n] Ignoring invalid locale cookie value', {
        cookieName,
        cookieValue: resolution.cookieValue,
      });
    }
    console.info('[i18n] Root locale resolution', {
      pathname: resolution.pathname,
      selected: resolution.lang,
      source: resolution.source,
      cookieLocale: resolution.cookieValue,
      browserLocale: resolution.browserLocale,
      supportedLocales: LANGS,
    });
  }

  throw redirect(307, `/${resolution.lang}`);
};
