import { error, redirect } from '@sveltejs/kit';
import { isLang } from '$lib/i18n';

// The Daybook archive lived here until September 2026, and every edition,
// month roundup, feed and markdown twin still has its old URL in inboxes, ads
// and chat threads. Each one goes to the same path on the Daybook's own site:
//
//   /en/daybook                    → https://immigrationdaybook.com/en
//   /es/daybook/2026-09-04         → https://immigrationdaybook.com/es/2026-09-04
//   /en/daybook/2026-09-04.md      → https://immigrationdaybook.com/en/2026-09-04.md
//   /en/daybook/rss.xml            → https://immigrationdaybook.com/en/rss.xml
//
// Permanent, so crawlers move the pages rather than keeping two copies.
const DAYBOOK_SITE = 'https://immigrationdaybook.com';

export const GET = ({ params, url }) => {
  const { lang, rest } = params;
  if (!isLang(lang)) {
    throw error(404, 'Not found');
  }

  const target = new URL(`/${lang}${rest ? `/${rest}` : ''}`, DAYBOOK_SITE);
  target.search = url.search;
  throw redirect(301, target.href);
};
