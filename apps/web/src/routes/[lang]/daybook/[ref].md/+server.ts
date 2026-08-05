import { error } from '@sveltejs/kit';
import { getEditionMarkdown, getMonth } from '$lib/daybook/loader';
import { isLang } from '$lib/i18n';

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const MONTH = /^\d{4}-\d{2}$/;

// A markdown twin of every archive page, at the same path plus `.md`.
//
// Agents and crawlers that want the text do better with the source than with
// HTML they have to strip, and this costs nothing to serve because the markdown
// is what is already on disk. These are companions, not canonical: the HTML
// pages carry the canonical URL, and these are kept out of the sitemap so they
// do not read as duplicates of it.
export const GET = ({ params }) => {
  const { lang, ref } = params;
  if (!isLang(lang)) {
    throw error(404, 'Not found');
  }

  const text = DATE.test(ref)
    ? getEditionMarkdown(lang, ref)
    : MONTH.test(ref)
      ? monthMarkdown(lang, ref)
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

function monthMarkdown(lang: 'en' | 'es', month: string): string | undefined {
  const editions = getMonth(lang, month);
  if (!editions.length) return undefined;

  return editions
    .map((edition) => {
      const body = getEditionMarkdown(lang, edition.date) ?? '';
      return `# ${edition.date}\n\n${body}`;
    })
    .join('\n\n---\n\n');
}
