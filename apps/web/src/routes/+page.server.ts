import { redirect } from '@sveltejs/kit';
import { dev } from '$app/environment';
import { DEFAULT_LANG, LANGS, isLang, type Lang } from '$lib/i18n';
import { cookieName, extractLocaleFromHeader } from '$lib/paraglide/runtime';

const LOCALE_PREFIX_PATTERN = new RegExp(`^\\/(${LANGS.join('|')})(?=\\/|$)`);
const LOCALE_DEBUG_ENABLED = dev || process.env.LOCALE_DEBUG === '1';

const extractCookieValue = (cookieHeader: string | null, name: string) => {
  if (!cookieHeader) return null;
  const entry = cookieHeader
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`));
  if (!entry) return null;
  return decodeURIComponent(entry.slice(name.length + 1));
};

const extractLocaleFromPathname = (pathname: string): Lang | null => {
  const match = pathname.match(LOCALE_PREFIX_PATTERN);
  if (!match) return null;
  const candidate = match[1];
  return isLang(candidate) ? candidate : null;
};

const resolveLocaleForRoot = (request: Request) => {
  const url = new URL(request.url);
  // Paraglide's URL strategy treats unprefixed paths as the base locale, so root redirects
  // need explicit cookie/browser fallback to avoid always choosing English.
  const pathLocale = extractLocaleFromPathname(url.pathname);
  const cookieHeader = request.headers.get('cookie');
  const cookieValue = extractCookieValue(cookieHeader, cookieName);
  const cookieLocale = cookieValue && isLang(cookieValue) ? cookieValue : null;
  const headerLocale = extractLocaleFromHeader(request);
  const browserLocale = headerLocale && isLang(headerLocale) ? headerLocale : null;

  if (pathLocale) {
    return {
      lang: pathLocale,
      source: 'url' as const,
      cookieValue,
      browserLocale,
      pathname: url.pathname,
    };
  }
  if (cookieLocale) {
    return {
      lang: cookieLocale,
      source: 'cookie' as const,
      cookieValue,
      browserLocale,
      pathname: url.pathname,
    };
  }
  if (browserLocale) {
    return {
      lang: browserLocale,
      source: 'browser' as const,
      cookieValue,
      browserLocale,
      pathname: url.pathname,
    };
  }
  return {
    lang: DEFAULT_LANG,
    source: 'default' as const,
    cookieValue,
    browserLocale,
    pathname: url.pathname,
  };
};

export const load = ({ request }) => {
  const resolution = resolveLocaleForRoot(request);

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
