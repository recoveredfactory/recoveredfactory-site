import { error } from '@sveltejs/kit';
import { getDeck, getEdition, getSlateUpcoming, listEditions, listMonths } from '$lib/daybook/loader';
import { isLang } from '$lib/i18n';
import { homePath } from '$lib/urls';

// The home page is the front page, then the archive: the ask, the newest
// edition as its slide deck, the calendar of what's coming, then every edition
// by month underneath.
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
    // wants the headline and the other section heads, nothing more. The dek is
    // left out: it is those same heads run together as a sentence.
    latest: edition
      ? {
          date: edition.date,
          title: edition.title,
          headings: edition.sections.map((section) => section.heading).filter(Boolean),
        }
      : null,
    // The latest edition's own deck, once the deck Action has rendered it. An
    // older edition's deck beside the newest headline would show two days' news
    // as one, so until then the headline runs alone.
    deck: edition ? await getDeck(lang, edition.date) : null,
    // The standing Upcoming slate, from today on.
    upcoming: await getSlateUpcoming(lang),
    months: await listMonths(lang),
  };
};
