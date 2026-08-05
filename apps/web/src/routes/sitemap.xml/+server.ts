import { findTranslationSlug, listPosts } from '$lib/blog/loader';
import { SITE_URL } from '$lib/config';
import { listEditions, listMonths } from '$lib/daybook/loader';
import { LANGS, type Lang } from '$lib/i18n';

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

  // The RSS feeds used to be listed here. A feed is not a page — it is a
  // discovery mechanism, advertised with <link rel="alternate"> in the head —
  // so it no longer sits in the sitemap.
  const staticPaths = ['', '/posts', '/support', '/daybook'];
  for (const lang of LANGS) {
    for (const path of staticPaths) {
      urls.push({
        url: withBase(`/${lang}${path}`),
        alternates: LANGS.map((other) => ({ lang: other, url: withBase(`/${other}${path}`) })),
      });
    }
  }

  // Posts are matched by canonicalId rather than by slug — translated slugs
  // differ by design — so each alternate is resolved, not constructed.
  for (const lang of LANGS) {
    for (const post of listPosts(lang)) {
      const alternates = [{ lang, url: withBase(`/${lang}/${post.slug}`) }];
      for (const other of LANGS) {
        if (other === lang) continue;
        const slug = findTranslationSlug(lang, post.slug, other);
        if (slug) alternates.push({ lang: other, url: withBase(`/${other}/${slug}`) });
      }

      urls.push({
        url: withBase(`/${lang}/${post.slug}`),
        lastmod: post.meta.date,
        alternates: alternates.length > 1 ? alternates : undefined,
      });
    }
  }

  // Daybook editions share the edition date across languages, so an alternate
  // exists exactly when the other language published that day. Month roundups
  // carry the date of the most recent edition they hold.
  //
  // Pilot editions are absent here for free: listEditions already filters them
  // out in production, which is the whole reason that gate lives in the loader
  // rather than in each consumer.
  const editionsByLang = Object.fromEntries(
    LANGS.map((lang) => [lang, listEditions(lang)]),
  ) as Record<Lang, ReturnType<typeof listEditions>>;

  for (const lang of LANGS) {
    for (const edition of editionsByLang[lang]) {
      const alternates = LANGS.filter((other) =>
        editionsByLang[other].some((entry) => entry.date === edition.date),
      ).map((other) => ({ lang: other, url: withBase(`/${other}/daybook/${edition.date}`) }));

      urls.push({
        url: withBase(`/${lang}/daybook/${edition.date}`),
        lastmod: edition.date,
        alternates: alternates.length > 1 ? alternates : undefined,
      });
    }

    for (const month of listMonths(lang)) {
      urls.push({
        url: withBase(`/${lang}/daybook/${month.month}`),
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
