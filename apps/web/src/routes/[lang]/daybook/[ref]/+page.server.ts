import { error } from '@sveltejs/kit';
import { getDossier } from '$lib/daybook/dossier';
import { getEdition, getMonth, listEditions } from '$lib/daybook/loader';
import { getUpcoming, parseUpcomingIds } from '$lib/daybook/upcoming';
import { isLang, LANGS } from '$lib/i18n';

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const MONTH = /^\d{4}-\d{2}$/;

// One dynamic segment serves both an edition (`2026-08-05`) and a month roundup
// (`2026-08`). They are the same content at two altitudes, and keeping them on
// one route means the archive never grows a second URL shape to keep in sync.
export const load = ({ params, url }) => {
  const { lang, ref } = params;
  // `?sent` shows the edition as it landed in the inbox. The page renders from
  // markdown otherwise, which is the difference between a web page and a
  // screenshot of an email — but the sent artifact is the archive's record of
  // what subscribers actually received, so it stays one link away.
  const asSent = url.searchParams.has('sent');
  if (!isLang(lang)) {
    throw error(404, 'Not found');
  }

  if (DATE.test(ref)) {
    const edition = getEdition(lang, ref);
    if (!edition) {
      throw error(404, 'Not found');
    }

    // The two languages share the edition date as their canonical id, so the
    // hreflang pair resolves without any slug matching — but only link across
    // when the other language actually published that day.
    const alternates = LANGS.filter((other) => other !== lang && getEdition(other, ref)).map(
      (other) => ({ lang: other, href: `/${other}/daybook/${ref}` }),
    );

    const all = listEditions(lang);
    const at = all.findIndex((entry) => entry.date === ref);

    return {
      lang,
      kind: 'edition' as const,
      ref,
      // The sent HTML is a whole second copy of the edition, so it only rides
      // along when it is going to be drawn.
      edition: asSent ? edition : { ...edition, emailHtml: null },
      asSent,
      // Resolved here rather than in the component so the deck specs — which
      // are globbed out of scripts/ — stay on the server and out of the bundle.
      dossier: edition.dossier ? getDossier(edition.dossier, lang) : null,
      // The calendar as the edition ran it, lifted out of its own body.
      //
      // Before 2026-08-26 the markdown shipped without one, and the page rebuilt
      // a subset from the pipeline's snapshot — narrowed by `upcomingIds`, the
      // ids recovered from the sent email — which is what the archive before
      // that date still gets. The reconstruction is a subset by construction:
      // the snapshot holds a deterministic slate rather than the composer's
      // selection, so an entry the edition ran and the slate does not hold could
      // not be shown at all. On Aug. 26 that cost three of eight, one of them a
      // deadline on the story the newsletter had led with the day before.
      // An edition that skipped the calendar on purpose gets none: the
      // fallback below cannot tell "ran no calendar" from "shipped one we
      // could not read", and on the first kind it prints deadlines the
      // edition never carried. See `upcomingSkipped` in the loader.
      upcoming:
        edition.upcomingSkipped === 'true'
          ? null
          : edition.upcoming.length
            ? { editionDate: ref, entries: edition.upcoming }
            : getUpcoming(lang, ref, parseUpcomingIds(edition.upcomingIds)),
      alternates,
      newer: at > 0 ? all[at - 1] : null,
      older: at >= 0 && at < all.length - 1 ? all[at + 1] : null,
    };
  }

  if (MONTH.test(ref)) {
    const editions = getMonth(lang, ref);
    if (!editions.length) {
      throw error(404, 'Not found');
    }

    const alternates = LANGS.filter((other) => other !== lang && getMonth(other, ref).length).map(
      (other) => ({ lang: other, href: `/${other}/daybook/${ref}` }),
    );

    return { lang, kind: 'month' as const, ref, editions, alternates };
  }

  throw error(404, 'Not found');
};
