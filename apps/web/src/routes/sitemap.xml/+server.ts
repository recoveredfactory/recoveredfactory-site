import { listPosts } from '$lib/blog/loader';
import { SITE_URL } from '$lib/config';
import { LANGS } from '$lib/i18n';

const withBase = (path: string) => new URL(path, SITE_URL).href;

export const GET = () => {
  const staticEntries = LANGS.flatMap((lang) => [
    withBase(`/${lang}/blog`),
    withBase(`/${lang}/rss.xml`),
  ]);

  const postEntries = LANGS.flatMap((lang) =>
    listPosts(lang).map((post) => ({
      url: withBase(`/${lang}/blog/${post.slug}`),
      lastmod: post.meta.date,
    })),
  );

  const urls = [
    ...staticEntries.map((url) => ({ url })),
    ...postEntries,
  ];

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map((entry) => {
    const lastmod = entry.lastmod ? `<lastmod>${entry.lastmod}</lastmod>` : '';
    return `  <url><loc>${entry.url}</loc>${lastmod}</url>`;
  })
  .join('\n')}
</urlset>`;

  return new Response(body, {
    headers: {
      'content-type': 'application/xml; charset=utf-8',
    },
  });
};
