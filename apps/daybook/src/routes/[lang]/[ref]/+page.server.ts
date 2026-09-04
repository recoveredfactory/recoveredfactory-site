import { error } from '@sveltejs/kit';
import { getDossier } from '$lib/daybook/dossier';
import { getEdition, getMonth, listEditions } from '$lib/daybook/loader';
import { getUpcoming, parseUpcomingIds } from '$lib/daybook/upcoming';
import { isLang, LANGS } from '$lib/i18n';
import { editionPath } from '$lib/urls';

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const MONTH = /^\d{4}-\d{2}$/;

// One dynamic segment serves both an edition (`2026-08-05`) and a month roundup
// (`2026-08`). They are the same content at two altitudes.
export const load = ({ params, url }) => {
  const { lang, ref } = params;
  // `?sent` shows the edition as it landed in the inbox — the archive's record
  // of what subscribers actually received, one link away from the web render.
  const asSent = url.searchParams.has('sent');
  if (!isLang(lang)) {
    throw error(404, 'Not found');
  }

  if (DATE.test(ref)) {
    const edition = getEdition(lang, ref);
    if (!edition) {
      throw error(404, 'Not found');
    }

    // The two languages share the edition date as their id, so the hreflang
    // pair resolves without any slug matching — but only when the other
    // language actually published that day.
    const other = LANGS.find((candidate) => candidate !== lang && getEdition(candidate, ref));

    const all = listEditions(lang);
    const at = all.findIndex((entry) => entry.date === ref);

    return {
      lang,
      switchTo: other ? editionPath(other, ref) : undefined,
      kind: 'edition' as const,
      ref,
      // The sent HTML is a whole second copy of the edition, so it only rides
      // along when it is going to be drawn.
      edition: asSent ? edition : { ...edition, emailHtml: null },
      asSent,
      dossier: edition.dossier ? getDossier(edition.dossier, lang) : null,
      // The calendar as the edition ran it. Editions before 2026-08-26 carried
      // none in the markdown and get a reconstruction from the pipeline's
      // snapshot, narrowed to what the email carried. An edition that skipped
      // the calendar on purpose gets none at all; see `upcomingSkipped`.
      upcoming:
        edition.upcomingSkipped === 'true'
          ? null
          : edition.upcoming.length
            ? { editionDate: ref, entries: edition.upcoming }
            : getUpcoming(lang, ref, parseUpcomingIds(edition.upcomingIds)),
      newer: at > 0 ? all[at - 1] : null,
      older: at >= 0 && at < all.length - 1 ? all[at + 1] : null,
    };
  }

  if (MONTH.test(ref)) {
    const editions = getMonth(lang, ref);
    if (!editions.length) {
      throw error(404, 'Not found');
    }

    const other = LANGS.find((candidate) => candidate !== lang && getMonth(candidate, ref).length);

    return {
      lang,
      switchTo: other ? editionPath(other, ref) : undefined,
      kind: 'month' as const,
      ref,
      editions,
    };
  }

  throw error(404, 'Not found');
};
