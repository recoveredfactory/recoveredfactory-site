import { redirect } from '@sveltejs/kit';
import { LANG_COOKIE } from '../hooks.server';
import { DEFAULT_LANG, isLang } from '$lib/i18n';

// The bare domain picks a language and goes there: the one the reader last
// read, then the browser's, then English.
export const load = ({ cookies, request }) => {
  const remembered = cookies.get(LANG_COOKIE);
  if (remembered && isLang(remembered)) {
    throw redirect(307, `/${remembered}`);
  }

  const accepted = request.headers.get('accept-language') ?? '';
  const first = accepted
    .split(',')
    .map((part) => part.trim().slice(0, 2).toLowerCase())
    .find(isLang);

  throw redirect(307, `/${first ?? DEFAULT_LANG}`);
};
