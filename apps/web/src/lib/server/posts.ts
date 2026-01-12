import { fetchGhostContent, type GhostPost } from '@recoveredfactory/ghost';
import { getGhostConfig } from '$lib/server/ghostConfig';

export async function getRecentPosts(limit = 10): Promise<GhostPost[]> {
  const { contentApiUrl, contentApiKey } = getGhostConfig();

  const data = await fetchGhostContent<{ posts: GhostPost[] }>(
    'posts',
    {
      limit,
      include: 'tags',
      fields: 'title,slug,excerpt,feature_image,published_at,reading_time',
    },
    { contentApiUrl, contentApiKey },
  );

  return data.posts ?? [];
}
