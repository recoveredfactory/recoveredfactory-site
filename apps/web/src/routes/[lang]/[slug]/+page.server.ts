import { error } from '@sveltejs/kit';
import { findTranslationSlug, getEntry } from '$lib/blog/loader';
import { formatEditionDate } from '$lib/daybook/format';
import { listEditions } from '$lib/daybook/loader';
import { isLang } from '$lib/i18n';

/** The landing page that carries a "latest edition" plate, by canonical id. */
const DAYBOOK_LANDING = 'immigration-daybook';

/**
 * The dek lists an edition's first three section headlines, and the first of
 * them is also the edition's title — so on the plate, where the headline is
 * already the heading, the dek would open by repeating it verbatim. Drop that
 * leading beat here and the plate reads "headline, and also these two."
 *
 * Only the plate needs this. The stored dek keeps all three beats, because the
 * meta description and the archive standfirst are both read without a headline
 * above them.
 */
function plateBlurb(title: string, dek: string): string {
  const lead = `${title} · `;
  return dek.startsWith(lead) ? dek.slice(lead.length) : dek;
}

export const load = ({ params }) => {
  const { lang, slug } = params;
  if (!isLang(lang)) {
    throw error(404, 'Not found');
  }

  const entry = getEntry(lang, slug);
  if (!entry) {
    throw error(404, 'Not found');
  }

  const otherLang = lang === 'en' ? 'es' : 'en';
  const translatedSlug = findTranslationSlug(lang, slug, otherLang);

  // Resolved here rather than in the page so the daybook loader stays on the
  // server. It eagerly globs every edition, and importing it from anything that
  // reaches the browser would ship the whole archive into the client bundle —
  // the exact cost the archive was built to avoid.
  // The dateline is formatted here for the same reason: formatEditionDate is
  // exported from that module, so importing it into the page would drag the
  // glob along with it. The page receives finished strings, not the loader.
  const id = entry.meta.canonicalId ?? entry.meta.id;
  const newest = id === DAYBOOK_LANDING ? listEditions(lang)[0] : undefined;
  const latestEdition = newest
    ? {
        title: newest.title,
        description: plateBlurb(newest.title, newest.description),
        href: `/${lang}/daybook/${newest.date}`,
        dateline: formatEditionDate(newest.date, lang, { weekday: true }),
      }
    : null;

  return {
    lang,
    slug,
    switchTo: translatedSlug ? `/${otherLang}/${translatedSlug}` : null,
    latestEdition,
  };
};
