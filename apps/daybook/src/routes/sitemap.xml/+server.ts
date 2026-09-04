import { SITE_URL } from '$lib/config';
import { listEditions, listMonths } from '$lib/daybook/loader';
import { LANGS, type Lang } from '$lib/i18n';
import { editionPath, homePath } from '$lib/urls';

const withBase = (path: string) => new URL(path, SITE_URL).href;

type SitemapEntry = {
  url: string;
  lastmod?: string;
  /** hreflang siblings, emitted as xhtml:link alternates. */
  alternates?: { lang: Lang; url: string }[];
};

const escapeXml = (value: string) =>
  value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;');

export const GET = () => {
  const urls: SitemapEntry[] = [];

  for (const lang of LANGS) {
    urls.push({
      url: withBase(homePath(lang)),
      alternates: LANGS.map((other) => ({ lang: other, url: withBase(homePath(other)) })),
    });
  }

  // Editions share the edition date across languages, so an alternate exists
  // exactly when the other language published that day. Month roundups carry
  // the date of the most recent edition they hold. Pilot editions are absent
  // for free: listEditions filters them out in production.
  const editionsByLang = Object.fromEntries(
    LANGS.map((lang) => [lang, listEditions(lang)]),
  ) as Record<Lang, ReturnType<typeof listEditions>>;

  for (const lang of LANGS) {
    for (const edition of editionsByLang[lang]) {
      const alternates = LANGS.filter((other) =>
        editionsByLang[other].some((entry) => entry.date === edition.date),
      ).map((other) => ({ lang: other, url: withBase(editionPath(other, edition.date)) }));

      urls.push({
        url: withBase(editionPath(lang, edition.date)),
        lastmod: edition.date,
        alternates: alternates.length > 1 ? alternates : undefined,
      });
    }

    for (const month of listMonths(lang)) {
      urls.push({
        url: withBase(editionPath(lang, month.month)),
        lastmod: month.editions[0]?.date,
      });
    }
  }

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.map(toUrlElement).join('\n')}
</urlset>`;

  return new Response(body, {
    headers: {
      'content-type': 'application/xml; charset=utf-8',
    },
  });
};

function toUrlElement(entry: SitemapEntry): string {
  const parts = [`    <loc>${escapeXml(entry.url)}</loc>`];
  if (entry.lastmod) parts.push(`    <lastmod>${entry.lastmod}</lastmod>`);
  for (const alternate of entry.alternates ?? []) {
    parts.push(
      `    <xhtml:link rel="alternate" hreflang="${alternate.lang}" href="${escapeXml(alternate.url)}" />`,
    );
  }
  return `  <url>\n${parts.join('\n')}\n  </url>`;
}
