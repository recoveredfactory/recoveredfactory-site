import type { Handle } from '@sveltejs/kit';
import { paraglideMiddleware } from '$lib/paraglide/server';

const preserveLangPrefix = (pathname: string) =>
	/^\/(en|es)\/blog(\/|$)/.test(pathname) ||
	/^\/(en|es)\/rss\.xml$/.test(pathname) ||
	/^\/(en|es)\/?$/.test(pathname);

const stripEnPrefix = (pathname: string) =>
	pathname.replace(/^\/en(?=\/|$)/, '');

// creating a handle to use the paraglide middleware
const paraglideHandle: Handle = ({ event, resolve }) => {
	const originalRequest = event.request;
	const url = new URL(originalRequest.url);
	const pathname = url.pathname;
	const shouldStripEn = /^\/en\/(blog|rss\.xml)(\/|$)/.test(pathname);
	const paraglideRequest = shouldStripEn
		? new Request(new URL(stripEnPrefix(pathname), url), originalRequest)
		: originalRequest;

	return paraglideMiddleware(paraglideRequest, ({ request: localizedRequest, locale }) => {
		event.request = preserveLangPrefix(pathname) ? originalRequest : localizedRequest;
		return resolve(event, {
			transformPageChunk: ({ html }) => {
				return html.replace('%lang%', locale);
			}
		});
	});
};

export const handle: Handle = paraglideHandle;
