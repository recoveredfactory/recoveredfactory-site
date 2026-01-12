export type GhostContentConfig = {
  contentApiUrl: string;
  contentApiKey: string;
};

export type GhostPost = {
  id: string;
  slug: string;
  title: string;
  html?: string;
  excerpt?: string;
  feature_image?: string;
  published_at?: string;
  updated_at?: string;
  reading_time?: number;
  tags?: Array<{ name: string; slug: string }>;
};

export type GhostContentResponse<T> = {
  posts?: T[];
  pages?: T[];
  tags?: T[];
  meta?: {
    pagination?: {
      page: number;
      limit: number;
      pages: number;
      total: number;
      next: number | null;
      prev: number | null;
    };
  };
};

export type GhostContentResource = "posts" | "pages" | "tags";

export type GhostContentParams = Record<string, string | number | boolean | undefined>;

const CONTENT_API_PREFIX = "/ghost/api/content";

export function resolveContentConfig(
  overrides: Partial<GhostContentConfig> = {},
): GhostContentConfig {
  const contentApiUrl =
    overrides.contentApiUrl ?? process.env.GHOST_CONTENT_API_URL ?? "";
  const contentApiKey =
    overrides.contentApiKey ?? process.env.GHOST_CONTENT_API_KEY ?? "";

  if (!contentApiUrl || !contentApiKey) {
    throw new Error("Missing Ghost Content API configuration.");
  }

  return {
    contentApiUrl,
    contentApiKey,
  };
}

export async function fetchGhostContent<T = GhostContentResponse<GhostPost>>(
  resource: GhostContentResource,
  params: GhostContentParams = {},
  configOverrides: Partial<GhostContentConfig> = {},
  fetchFn: typeof fetch = fetch,
): Promise<T> {
  const config = resolveContentConfig(configOverrides);
  const url = new URL(`${CONTENT_API_PREFIX}/${resource}/`, config.contentApiUrl);

  url.searchParams.set("key", config.contentApiKey);
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) continue;
    url.searchParams.set(key, String(value));
  }

  const response = await fetchFn(url.toString(), {
    headers: {
      accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Ghost content request failed: ${response.status}`);
  }

  return (await response.json()) as T;
}
