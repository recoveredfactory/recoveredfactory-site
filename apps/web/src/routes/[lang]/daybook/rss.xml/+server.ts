import { error } from '@sveltejs/kit';
import { SITE_URL } from '$lib/config';
import { parseDate } from '$lib/dates';
import { getEdition, listEditions } from '$lib/daybook/loader';
import { isLang } from '$lib/i18n';

const escapeXml = (value: string) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');

// `]]>` inside an edition would close the CDATA section early and break the
// feed, so it is split across two sections — the standard escape.
const cdata = (value: string) => `<![CDATA[${value.replaceAll(']]>', ']]]]><![CDATA[>')}]]>`;

export const GET = ({ params }) => {
  const { lang } = params;
  if (!isLang(lang)) {
    throw error(404, 'Not found');
  }

  const editions = listEditions(lang);
  const channelUrl = new URL(`/${lang}/daybook`, SITE_URL).href;
  const feedUrl = new URL(`/${lang}/daybook/rss.xml`, SITE_URL).href;

  // Full text, not excerpts. The point of this feed is to be readable and
  // ingestible end to end — a truncated newsletter archive gives a crawler the
  // headline and none of the reporting under it.
  const items = editions
    .map((summary) => {
      const edition = getEdition(lang, summary.date);
      if (!edition) return '';
      const url = new URL(`/${lang}/daybook/${edition.date}`, SITE_URL).href;

      return `
      <item>
        <title>${escapeXml(edition.title)}</title>
        <link>${url}</link>
        <guid isPermaLink="true">${url}</guid>
        <pubDate>${parseDate(edition.date).toUTCString()}</pubDate>
        <description>${escapeXml(edition.description)}</description>
        <content:encoded>${cdata(edition.html)}</content:encoded>
      </item>`;
    })
    .join('');

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>Immigration Daybook (${lang.toUpperCase()})</title>
    <link>${channelUrl}</link>
    <atom:link href="${feedUrl}" rel="self" type="application/rss+xml" />
    <language>${lang}</language>
    <description>Immigration Daybook — archive.</description>
    ${items}
  </channel>
</rss>`;

  return new Response(body, {
    headers: {
      'content-type': 'application/rss+xml; charset=utf-8',
    },
  });
};
