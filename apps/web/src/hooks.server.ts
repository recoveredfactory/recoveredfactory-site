import { redirect, type Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { paraglideMiddleware } from '$lib/paraglide/server';
import { SITE_URL } from '$lib/config';
import { resolveLocaleForRequest } from '$lib/locale-request';

const preserveLangPrefix = (pathname: string) => /^\/(en|es)(\/|$)/.test(pathname);

// Parked newsletter domains. Until Immigration Daybook has a site of its own,
// every request to them lands on the newsletter page in the reader's language.
const PARKED_DOMAINS: Array<{ pattern: RegExp; slug: string }> = [
  {
    pattern: /^(www\.)?immigrationdaybook\.(com|net)$/i,
    slug: 'immigration-daybook',
  },
];

const parkedDomainHandle: Handle = ({ event, resolve }) => {
  const host = event.request.headers.get('host') ?? event.url.host;
  const parked = PARKED_DOMAINS.find((entry) => entry.pattern.test(host));

  if (parked) {
    const { lang } = resolveLocaleForRequest(event.request);
    throw redirect(307, new URL(`/${lang}/${parked.slug}`, SITE_URL).href);
  }

  return resolve(event);
};

// creating a handle to use the paraglide middleware
const paraglideHandle: Handle = ({ event, resolve }) => {
	const originalRequest = event.request;
	const pathname = new URL(originalRequest.url).pathname;

	return paraglideMiddleware(originalRequest, ({ request: localizedRequest, locale }) => {
		event.request = preserveLangPrefix(pathname) ? originalRequest : localizedRequest;
		return resolve(event, {
			transformPageChunk: ({ html }) => {
				return html.replace('%lang%', locale);
			}
		});
	});
};

export const handle: Handle = sequence(parkedDomainHandle, paraglideHandle);
