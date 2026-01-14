import type { Handle } from '@sveltejs/kit';
import { paraglideMiddleware } from '$lib/paraglide/server';

const preserveLangPrefix = (pathname: string) => /^\/(en|es)(\/|$)/.test(pathname);

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

export const handle: Handle = paraglideHandle;
