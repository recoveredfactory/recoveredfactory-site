import { error } from '@sveltejs/kit';
import { getEdition, getLatestDeck, getSlateUpcoming, listEditions, listMonths } from '$lib/daybook/loader';
import { isLang } from '$lib/i18n';
import { homePath } from '$lib/urls';

// The home page is the front page, then the archive: the ask, the newest
// edition beside its slide deck, the calendar of what's coming, then every
// edition by month underneath.
export const load = async ({ params }) => {
  const { lang } = params;
  if (!isLang(lang)) {
    throw error(404, 'Not found');
  }

  // The newest edition that actually renders. A published record that will not
  // read is skipped for the one before it rather than leaving the page without
  // a latest edition.
  const editions = await listEditions(lang);
  let edition: Awaited<ReturnType<typeof getEdition>> = undefined;
  for (const candidate of editions.slice(0, 3)) {
    edition = await getEdition(lang, candidate.date);
    if (edition) break;
  }

  return {
    lang,
    switchTo: homePath(lang === 'en' ? 'es' : 'en'),
    // Finished strings only: the loader stays on the server, and the page
    // wants the headline and the other section heads, nothing more.
    latest: edition
      ? {
          date: edition.date,
          title: edition.title,
          // An archived edition's description is its section heads joined, which
          // the list under the headline already shows; only a real dek is kept.
          dek: edition.description.startsWith(edition.title) ? '' : edition.description,
          headings: edition.sections.map((section) => section.heading).filter(Boolean),
        }
      : null,
    // The newest published deck, usually the latest edition's own, once it has
    // rendered; and the standing Upcoming slate from today on.
    deck: await getLatestDeck(lang),
    upcoming: await getSlateUpcoming(lang),
    months: await listMonths(lang),
  };
};
