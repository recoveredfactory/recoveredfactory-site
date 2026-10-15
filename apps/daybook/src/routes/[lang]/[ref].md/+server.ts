import { error } from '@sveltejs/kit';
import { getEditionMarkdown, getMonth } from '$lib/daybook/loader';
import { isLang } from '$lib/i18n';

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const MONTH = /^\d{4}-\d{2}$/;

// A markdown twin of every archive page, at the same path plus `.md`. Agents
// and crawlers that want the text do better with the source than with HTML
// they have to strip. Companions, not canonical: kept out of the sitemap.
export const GET = async ({ params }) => {
  const { lang, ref } = params;
  if (!isLang(lang)) {
    throw error(404, 'Not found');
  }

  const text = DATE.test(ref)
    ? await getEditionMarkdown(lang, ref)
    : MONTH.test(ref)
      ? await monthMarkdown(lang, ref)
      : undefined;

  if (!text) {
    throw error(404, 'Not found');
  }

  return new Response(`${text}\n`, {
    headers: {
      'content-type': 'text/markdown; charset=utf-8',
      'x-robots-tag': 'noindex',
    },
  });
};

async function monthMarkdown(lang: 'en' | 'es', month: string): Promise<string | undefined> {
  const editions = await getMonth(lang, month);
  if (!editions.length) return undefined;

  const bodies = await Promise.all(
    editions.map(async (edition) => {
      const body = (await getEditionMarkdown(lang, edition.date)) ?? '';
      return `# ${edition.date}\n\n${body}`;
    }),
  );
  return bodies.join('\n\n---\n\n');
}
