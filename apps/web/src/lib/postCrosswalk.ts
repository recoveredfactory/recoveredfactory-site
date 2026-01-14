import postCrosswalkData from './postCrosswalk.json';

export type CrosswalkLocale = 'en' | 'es';

export type PostCrosswalkEntry = {
  en: string;
  es: string;
};

const postCrosswalk = postCrosswalkData as PostCrosswalkEntry[];

export const getCrosswalkEntry = (slug: string) =>
  postCrosswalk.find((entry) => entry.en === slug || entry.es === slug) ?? null;

export const getAlternatePost = (slug: string, currentLocale: CrosswalkLocale) => {
  const entry = getCrosswalkEntry(slug);
  if (!entry) {
    return null;
  }

  const targetLocale: CrosswalkLocale = currentLocale === 'en' ? 'es' : 'en';
  return {
    locale: targetLocale,
    slug: entry[targetLocale],
  };
};
