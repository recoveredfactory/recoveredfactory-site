import { error } from '@sveltejs/kit';
import { listPosts } from '$lib/blog/loader';
import { SITE_URL } from '$lib/config';
import { parseDate } from '$lib/dates';
import { isLang } from '$lib/i18n';

const escapeXml = (value: string) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');

export const GET = ({ params }) => {
  const { lang } = params;
  if (!isLang(lang)) {
    throw error(404, 'Not found');
  }

  const posts = listPosts(lang);
  const channelUrl = new URL(`/${lang}/posts`, SITE_URL).href;

  const items = posts
    .map((post) => {
      const url = new URL(`/${lang}/${post.slug}`, SITE_URL).href;
      const description = post.meta.description
        ? `<description>${escapeXml(post.meta.description)}</description>`
        : '';

      return `
      <item>
        <title>${escapeXml(post.meta.title)}</title>
        <link>${url}</link>
        <guid>${url}</guid>
        <pubDate>${parseDate(post.meta.date).toUTCString()}</pubDate>
        ${description}
      </item>`;
    })
    .join('');

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Recovered Factory Blog (${lang.toUpperCase()})</title>
    <link>${channelUrl}</link>
    <description>Updates and notes.</description>
    ${items}
  </channel>
</rss>`;

  return new Response(body, {
    headers: {
      'content-type': 'application/rss+xml; charset=utf-8',
    },
  });
};
