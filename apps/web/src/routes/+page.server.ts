import { getRecentPosts } from '$lib/server/posts';
import { getPortalUrls } from '$lib/server/ghostConfig';

export const load = async ({ setHeaders }) => {
  const posts = await getRecentPosts(10);
  const portal = getPortalUrls();

  setHeaders({
    'cache-control': 'public, max-age=60, s-maxage=300, stale-while-revalidate=600',
  });

  return { posts, portal };
};
