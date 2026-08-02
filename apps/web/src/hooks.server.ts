import type { Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { paraglideMiddleware } from '$lib/paraglide/server';
import { getEntry } from '$lib/blog/loader';
import { SITE_URL } from '$lib/config';
import { getResizedImageUrl } from '$lib/images';
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

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/**
 * Body for the parked-domain redirect.
 *
 * A redirect response is allowed to carry one, and it earns its keep: browsers
 * follow `Location` and never render this, while a scraper that does not follow
 * redirects still finds the card. Most of them (Facebook, X, Slack, LinkedIn)
 * do follow and read the destination's tags instead — this is for the ones that
 * don't, so sharing a bare immigrationdaybook.com link is never a blank unfurl.
 *
 * Tags are read off the page's own frontmatter so the copy has one home.
 */
const parkedDomainBody = (lang: 'en' | 'es', slug: string, target: string) => {
  const meta = getEntry(lang, slug)?.meta;
  const title = meta?.title ?? 'Immigration Daybook';
  const description = meta?.description ?? '';
  const image = meta?.previewImage
    ? new URL(getResizedImageUrl(meta.previewImage, { width: 1600 }), SITE_URL).href
    : '';

  return `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8" />
<title>${escapeHtml(title)}</title>
<link rel="canonical" href="${escapeHtml(target)}" />
<meta name="description" content="${escapeHtml(description)}" />
<meta property="og:site_name" content="Recovered Factory" />
<meta property="og:type" content="website" />
<meta property="og:title" content="${escapeHtml(title)}" />
<meta property="og:description" content="${escapeHtml(description)}" />
<meta property="og:url" content="${escapeHtml(target)}" />
${image ? `<meta property="og:image" content="${escapeHtml(image)}" />` : ''}
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${escapeHtml(title)}" />
<meta name="twitter:description" content="${escapeHtml(description)}" />
${image ? `<meta name="twitter:image" content="${escapeHtml(image)}" />` : ''}
</head>
<body><p><a href="${escapeHtml(target)}">${escapeHtml(title)}</a></p></body>
</html>`;
};

const parkedDomainHandle: Handle = ({ event, resolve }) => {
  const host = event.request.headers.get('host') ?? event.url.host;
  const parked = PARKED_DOMAINS.find((entry) => entry.pattern.test(host));

  if (parked) {
    const { lang } = resolveLocaleForRequest(event.request);
    const target = new URL(`/${lang}/${parked.slug}`, SITE_URL).href;

    // Built by hand rather than with `redirect()`, which sends an empty body.
    return new Response(parkedDomainBody(lang, parked.slug, target), {
      status: 307,
      headers: {
        location: target,
        'content-type': 'text/html; charset=utf-8',
      },
    });
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
