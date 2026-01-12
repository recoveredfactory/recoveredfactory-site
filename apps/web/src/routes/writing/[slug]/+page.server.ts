import { error } from '@sveltejs/kit';
import { fetchGhostContent, type GhostPost } from '@recoveredfactory/ghost';
import { getGhostConfig } from '$lib/server/ghostConfig';

export const load = async ({ params, setHeaders }) => {
  const { contentApiUrl, contentApiKey } = getGhostConfig();

  const data = await fetchGhostContent<{ posts: GhostPost[] }>(
    'posts',
    {
      filter: `slug:${params.slug}`,
      include: 'tags',
      fields: 'title,slug,html,excerpt,feature_image,published_at,reading_time',
    },
    { contentApiUrl, contentApiKey },
  );

  const post = data.posts?.[0];
  if (!post) {
    throw error(404, 'Post not found');
  }

  setHeaders({
    'cache-control': 'public, max-age=60, s-maxage=300, stale-while-revalidate=600',
  });

  return { post };
};
