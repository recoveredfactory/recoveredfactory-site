import { error } from '@sveltejs/kit';
import { getDossier } from '$lib/daybook/dossier';
import { getDeck, getEdition, getMonth, hasEdition, listEditions } from '$lib/daybook/loader';
import { getUpcoming, parseUpcomingIds } from '$lib/daybook/upcoming';
import { isLang, LANGS } from '$lib/i18n';
import { editionPath } from '$lib/urls';

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const MONTH = /^\d{4}-\d{2}$/;

// One dynamic segment serves both an edition (`2026-08-05`) and a month roundup
// (`2026-08`). They are the same content at two altitudes.
export const load = async ({ params, url }) => {
  const { lang, ref } = params;
  // `?sent` shows the edition as it landed in the inbox — the archive's record
  // of what subscribers actually received, one link away from the web render.
  const asSent = url.searchParams.has('sent');
  if (!isLang(lang)) {
    throw error(404, 'Not found');
  }

  if (DATE.test(ref)) {
    const edition = await getEdition(lang, ref);
    if (!edition) {
      throw error(404, 'Not found');
    }

    // The two languages share the edition date as their id, so the hreflang
    // pair resolves without any slug matching — but only when the other
    // language actually published that day.
    const others = await Promise.all(
      LANGS.map(async (candidate) =>
        candidate !== lang && (await hasEdition(candidate, ref)) ? candidate : undefined,
      ),
    );
    const other = others.find(Boolean);

    const all = await listEditions(lang);
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
      // A published edition's own deck, the same card a dossier gets, once the
      // deck Action has rendered it; it links to the Instagram post once there is one.
      deck: edition.dossier ? null : await getDeck(lang, ref),
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
    const editions = await getMonth(lang, ref);
    if (!editions.length) {
      throw error(404, 'Not found');
    }

    // Whether the other language has the month at all; its listing answers that
    // without rendering every edition in it.
    const others = await Promise.all(
      LANGS.map(async (candidate) =>
        candidate !== lang &&
        (await listEditions(candidate)).some((entry) => entry.date.startsWith(ref))
          ? candidate
          : undefined,
      ),
    );
    const other = others.find(Boolean);

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
