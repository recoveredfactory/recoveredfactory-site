import type { Handle } from '@sveltejs/kit';
import { isLang } from '$lib/i18n';

// The site has two languages and no locale library. A page's language is its
// first path segment, and the only thing to remember is which one the reader
// last used, so that a bare immigrationdaybook.com sends them back to it.
export const LANG_COOKIE = 'lang';

export const handle: Handle = ({ event, resolve }) => {
  const lang = event.url.pathname.match(/^\/(en|es)(?=\/|$)/)?.[1];

  if (lang && isLang(lang) && event.cookies.get(LANG_COOKIE) !== lang) {
    event.cookies.set(LANG_COOKIE, lang, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
      sameSite: 'lax',
      httpOnly: false,
    });
  }

  return resolve(event, {
    transformPageChunk: ({ html }) => html.replace('%lang%', lang ?? 'en'),
  });
};
