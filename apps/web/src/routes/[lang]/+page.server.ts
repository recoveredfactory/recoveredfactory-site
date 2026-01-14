import { error } from '@sveltejs/kit';
import { listPosts } from '$lib/blog/loader';
import { isLang } from '$lib/i18n';

export const load = ({ params, setHeaders }) => {
  const { lang } = params;
  if (!isLang(lang)) {
    throw error(404, 'Not found');
  }

  setHeaders({
    'cache-control': 'public, max-age=60, s-maxage=300, stale-while-revalidate=600',
  });

  return {
    lang,
    posts: listPosts(lang),
  };
};
