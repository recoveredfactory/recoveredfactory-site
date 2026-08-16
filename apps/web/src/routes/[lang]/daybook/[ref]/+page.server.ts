import { error } from '@sveltejs/kit';
import { getDossier } from '$lib/daybook/dossier';
import { getEdition, getMonth, listEditions } from '$lib/daybook/loader';
import { isLang, LANGS } from '$lib/i18n';

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const MONTH = /^\d{4}-\d{2}$/;

// One dynamic segment serves both an edition (`2026-08-05`) and a month roundup
// (`2026-08`). They are the same content at two altitudes, and keeping them on
// one route means the archive never grows a second URL shape to keep in sync.
export const load = ({ params }) => {
  const { lang, ref } = params;
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
      edition,
      // Resolved here rather than in the component so the deck specs — which
      // are globbed out of scripts/ — stay on the server and out of the bundle.
      dossier: edition.dossier ? getDossier(edition.dossier, lang) : null,
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
