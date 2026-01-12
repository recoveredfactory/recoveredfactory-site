import { fetchGhostContent, type GhostPost } from '@recoveredfactory/ghost';
import { baseLocale, getLocale } from '$lib/paraglide/runtime';
import { getGhostConfig } from '$lib/server/ghostConfig';

const LOCALE_TAG_PREFIX = 'lang-';

function resolveLocale(): string {
  try {
    return getLocale();
  } catch {
    return baseLocale;
  }
}

export function getLocaleTag(locale?: string): string {
  const resolved = locale ?? resolveLocale();
  return `${LOCALE_TAG_PREFIX}${resolved}`;
}

export function getLocaleFilter(locale?: string): string {
  return `tag:${getLocaleTag(locale)}`;
}

export async function getRecentPosts(
  limit = 10,
  locale?: string,
): Promise<GhostPost[]> {
  const { contentApiUrl, contentApiKey } = getGhostConfig();

  const data = await fetchGhostContent<{ posts: GhostPost[] }>(
    'posts',
    {
      limit,
      filter: getLocaleFilter(locale),
      fields: 'title,slug,excerpt,feature_image,published_at,reading_time',
    },
    { contentApiUrl, contentApiKey },
  );

  return data.posts ?? [];
}
