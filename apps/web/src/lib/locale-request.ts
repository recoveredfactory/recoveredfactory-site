import { DEFAULT_LANG, LANGS, isLang, type Lang } from '$lib/i18n';
import { cookieName, extractLocaleFromHeader } from '$lib/paraglide/runtime';

const LOCALE_PREFIX_PATTERN = new RegExp(`^\\/(${LANGS.join('|')})(?=\\/|$)`);

export type LocaleResolution = {
  lang: Lang;
  source: 'url' | 'cookie' | 'browser' | 'default';
  cookieValue: string | null;
  browserLocale: Lang | null;
  pathname: string;
};

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

/**
 * Paraglide's URL strategy treats unprefixed paths as the base locale, so any
 * unprefixed entry point — the root redirect, the newsletter domains — needs an
 * explicit cookie/browser fallback to avoid always choosing English.
 */
export const resolveLocaleForRequest = (request: Request): LocaleResolution => {
  const url = new URL(request.url);
  const pathLocale = extractLocaleFromPathname(url.pathname);
  const cookieHeader = request.headers.get('cookie');
  const cookieValue = extractCookieValue(cookieHeader, cookieName);
  const cookieLocale = cookieValue && isLang(cookieValue) ? cookieValue : null;
  const headerLocale = extractLocaleFromHeader(request);
  const browserLocale = headerLocale && isLang(headerLocale) ? headerLocale : null;

  const base = { cookieValue, browserLocale, pathname: url.pathname };

  if (pathLocale) return { lang: pathLocale, source: 'url', ...base };
  if (cookieLocale) return { lang: cookieLocale, source: 'cookie', ...base };
  if (browserLocale) return { lang: browserLocale, source: 'browser', ...base };
  return { lang: DEFAULT_LANG, source: 'default', ...base };
};
