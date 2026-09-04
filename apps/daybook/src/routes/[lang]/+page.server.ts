import { error } from '@sveltejs/kit';
import { getEdition, listEditions, listMonths } from '$lib/daybook/loader';
import { isLang } from '$lib/i18n';
import { homePath } from '$lib/urls';

// The home page is the archive. It opens on the ask and the newest edition,
// then lists every edition by month underneath.
export const load = ({ params }) => {
  const { lang } = params;
  if (!isLang(lang)) {
    throw error(404, 'Not found');
  }

  const newest = listEditions(lang)[0];
  const edition = newest ? getEdition(lang, newest.date) : undefined;

  return {
    lang,
    switchTo: homePath(lang === 'en' ? 'es' : 'en'),
    // Finished strings only: the loader stays on the server, and the page
    // wants the headline and the other section heads, nothing more.
    latest: edition
      ? {
          date: edition.date,
          title: edition.title,
          description: edition.description,
          headings: edition.sections.map((section) => section.heading).filter(Boolean),
        }
      : null,
    months: listMonths(lang),
  };
};
