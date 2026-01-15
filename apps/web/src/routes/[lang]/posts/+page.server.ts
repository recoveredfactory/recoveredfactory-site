import { error } from '@sveltejs/kit';
import { listPosts } from '$lib/blog/loader';
import { isLang } from '$lib/i18n';

export const load = ({ params }) => {
  const { lang } = params;
  if (!isLang(lang)) {
    throw error(404, 'Not found');
  }

  return {
    lang,
    posts: listPosts(lang),
  };
};
