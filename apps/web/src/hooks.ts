import type { Reroute } from '@sveltejs/kit';
import { deLocalizeUrl } from '$lib/paraglide/runtime';

export const reroute: Reroute = (request) => {
	const url = new URL(request.url);
	if (/^\/(en|es)(\/|$)/.test(url.pathname)) {
		return url.pathname;
	}

	return deLocalizeUrl(request.url).pathname;
};
