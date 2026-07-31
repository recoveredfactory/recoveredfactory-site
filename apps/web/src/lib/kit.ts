type KitAuth = {
  headers: Record<string, string>;
  query: Record<string, string>;
};

const KIT_API_BASE_URL =
  process.env.KIT_API_BASE_URL ?? 'https://api.convertkit.com/v3';
const KIT_API_KEY = process.env.KIT_API_KEY ?? '';
const KIT_API_SECRET = process.env.KIT_API_SECRET ?? '';

const getAuth = (): KitAuth => {
  if (KIT_API_KEY) {
    return {
      headers: { Authorization: `Bearer ${KIT_API_KEY}` },
      query: {},
    };
  }
  if (KIT_API_SECRET) {
    return {
      headers: {},
      query: { api_secret: KIT_API_SECRET },
    };
  }
  return { headers: {}, query: {} };
};

const buildUrl = (path: string, query: Record<string, string>) => {
  const url = new URL(path, KIT_API_BASE_URL);
  Object.entries(query).forEach(([key, value]) => {
    if (value) url.searchParams.set(key, value);
  });
  return url.toString();
};

const request = async (
  method: 'GET' | 'POST',
  path: string,
  body?: Record<string, unknown>,
): Promise<unknown> => {
  const auth = getAuth();
  if (!KIT_API_KEY && !KIT_API_SECRET) {
    throw new Error('Missing Kit API credentials.');
  }
  const response = await fetch(buildUrl(path, auth.query), {
    method,
    headers: {
      'content-type': 'application/json',
      ...auth.headers,
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`Kit API error: ${response.status} ${text}`);
  }
  return response.json().catch(() => ({}));
};

const postJson = async (path: string, body: Record<string, unknown>) => {
  await request('POST', path, body);
};

export const upsertSubscriber = async (payload: {
  email: string;
  fields?: Record<string, string>;
}) => {
  const body: Record<string, unknown> = {
    email: payload.email,
    email_address: payload.email,
  };
  if (payload.fields) {
    body.fields = payload.fields;
  }
  await postJson('/subscribers', body);
};

export const tagSubscriber = async (payload: { email: string; tagId: string }) => {
  if (!payload.tagId) return;
  await postJson(`/tags/${payload.tagId}/subscribe`, {
    email: payload.email,
    email_address: payload.email,
  });
};

// Newsletter tags are named, not configured: a page asks for
// `newsletter:immigration-daybook` and we look the id up (creating it the first
// time) rather than threading another numeric id through the SST environment.
const tagIdsByName = new Map<string, string>();

const listTagIdByName = async (name: string): Promise<string | null> => {
  const payload = (await request('GET', '/tags')) as {
    tags?: Array<{ id?: number | string; name?: string }>;
  };
  const wanted = name.trim().toLowerCase();
  const match = payload?.tags?.find(
    (tag) => String(tag?.name ?? '').trim().toLowerCase() === wanted,
  );
  return match?.id != null ? String(match.id) : null;
};

const createTag = async (name: string): Promise<string | null> => {
  const payload = (await request('POST', '/tags', { tag: { name } })) as
    | { id?: number | string }
    | Array<{ id?: number | string }>;
  const created = Array.isArray(payload) ? payload[0] : payload;
  return created?.id != null ? String(created.id) : null;
};

export const resolveTagId = async (name: string): Promise<string | null> => {
  const key = name.trim().toLowerCase();
  if (!key) return null;

  const cached = tagIdsByName.get(key);
  if (cached) return cached;

  let id = await listTagIdByName(name);
  if (!id) {
    // Kit rejects duplicate names, so a create failure most likely means it
    // appeared between the list and the create. Re-read before giving up.
    id = await createTag(name).catch(() => null);
    if (!id) id = await listTagIdByName(name);
  }

  if (id) tagIdsByName.set(key, id);
  return id;
};

export const tagSubscriberByName = async (payload: {
  email: string;
  tag: string;
}) => {
  const tagId = await resolveTagId(payload.tag);
  if (!tagId) {
    throw new Error(`Could not resolve Kit tag: ${payload.tag}`);
  }
  await tagSubscriber({ email: payload.email, tagId });
};
