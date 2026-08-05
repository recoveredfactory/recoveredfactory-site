import { error } from '@sveltejs/kit';
import { listEditions, listMonths } from '$lib/daybook/loader';
import { isLang } from '$lib/i18n';

export const load = ({ params }) => {
  const { lang } = params;
  if (!isLang(lang)) {
    throw error(404, 'Not found');
  }

  // The archive's standfirst is the newest edition's dek — the three beats it
  // led with. It moves every weekday, which is the point: an archive index whose
  // description is a fixed sentence about the newsletter tells a reader nothing
  // about what is actually in it today.
  const dek = listEditions(lang)[0]?.description ?? null;

  return {
    lang,
    dek,
    months: listMonths(lang),
  };
};
