import { error } from '@sveltejs/kit';
import { listPosts } from '$lib/blog/loader';
import { isLang } from '$lib/i18n';

export const load = ({ params }) => {
  if (!isLang(params.lang)) {
    throw error(404, 'Not found');
  }

  return {
    lang: params.lang,
    posts: listPosts(params.lang).slice(0, 3),
  };
};
