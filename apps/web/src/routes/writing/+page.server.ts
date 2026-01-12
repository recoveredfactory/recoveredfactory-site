import { getRecentPosts } from '$lib/server/posts';

export const load = async ({ setHeaders }) => {
  const posts = await getRecentPosts(10);

  setHeaders({
    'cache-control': 'public, max-age=60, s-maxage=300, stale-while-revalidate=600',
  });

  return { posts };
};
