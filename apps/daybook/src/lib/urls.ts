import type { Lang } from '$lib/i18n';

// The site's whole URL scheme. The archive is the home page, so an edition
// lives one segment under the language: /en/2026-09-04, /es/2026-09.
export const homePath = (lang: Lang) => `/${lang}`;
export const editionPath = (lang: Lang, ref: string) => `/${lang}/${ref}`;
export const feedPath = (lang: Lang) => `/${lang}/rss.xml`;
