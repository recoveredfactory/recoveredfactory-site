import type { Lang } from '$lib/i18n';

/**
 * The dossier decks, read from the same spec the renderer reads.
 *
 * scripts/daybook/dossier.mjs renders a deck's slides to PNGs from
 * scripts/daybook/dossiers/<slug>/spec.json. That spec is the editorial
 * artifact — which documents, cut where, what the slide claims, in both
 * languages — and it is committed. The PNGs are not: static/images is
 * gitignored by design and ships with the build.
 *
 * So the site reads the spec rather than the directory. It gives us the slide
 * order, the filenames (the renderer derives them from index and name), and —
 * the part that matters most on a page — the words that are baked into each
 * image, which is the only way a deck of text-in-pictures says anything to a
 * screen reader.
 */

type SpecCopy = { hed?: string; nut?: string; caption?: string; facts?: string };

type SpecSlide = {
  type: string;
  name: string;
  en?: SpecCopy;
  es?: SpecCopy;
};

type Spec = {
  slug: string;
  date?: Record<string, string>;
  slides: SpecSlide[];
};

export type DossierSlide = {
  /** Public path to the 4:5 portrait render. */
  src: string;
  /** The words on the slide, for anyone who cannot see it. */
  alt: string;
  /** The exhibit's source line, shown under the slide. */
  caption: string;
};

export type Dossier = {
  slug: string;
  lang: Lang;
  date: string;
  slides: DossierSlide[];
};

const specs = import.meta.glob<Spec>('/scripts/daybook/dossiers/*/spec.json', {
  eager: true,
  import: 'default',
});

const bySlug = new Map<string, Spec>(
  Object.values(specs)
    .filter((spec): spec is Spec => Boolean(spec?.slug) && Array.isArray(spec?.slides))
    .map((spec) => [spec.slug, spec]),
);

// dossier.mjs writes `NN-<name><suffix>.png`, one-based and zero-padded, with
// the portrait frame taking the empty suffix. Kept in step by hand: the two
// ends of this are a hundred lines apart in different runtimes, and a rendered
// directory listing is not available at build time to check against.
const slideSrc = (slug: string, lang: Lang, index: number, name: string) =>
  `/images/social/${slug}/${lang}/${String(index + 1).padStart(2, '0')}-${name}.png`;

/**
 * Alt text for a slide.
 *
 * Every one of these slides is words set over a document crop, so an empty or
 * decorative alt would drop the entire argument. The hed and the nut are what
 * the slide says; the caption cites the exhibit and is also rendered as visible
 * text below, so it is left out here rather than read twice.
 */
const slideAlt = (copy: SpecCopy) =>
  [copy.hed, copy.nut, copy.facts].filter(Boolean).join(' — ');

/** One deck in one language, or null for a slug that has no spec. */
export function getDossier(slug: string, lang: Lang): Dossier | null {
  const spec = bySlug.get(slug);
  if (!spec) return null;

  const slides = spec.slides.map((slide, index) => {
    const copy = slide[lang] ?? slide.en ?? {};
    return {
      src: slideSrc(spec.slug, lang, index, slide.name),
      alt: slideAlt(copy),
      caption: copy.caption ?? '',
    };
  });

  return { slug: spec.slug, lang, date: spec.date?.[lang] ?? '', slides };
}
