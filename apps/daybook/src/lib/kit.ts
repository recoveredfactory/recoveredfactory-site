type KitAuth = {
  headers: Record<string, string>;
  query: Record<string, string>;
};

const KIT_API_BASE_URL =
  process.env.KIT_API_BASE_URL ?? 'https://api.convertkit.com/v3';
const KIT_API_KEY = process.env.KIT_API_KEY ?? '';
const KIT_API_SECRET = process.env.KIT_API_SECRET ?? '';

/**
 * Kit's v3 API authenticates with `api_key` / `api_secret` query parameters.
 * `Authorization: Bearer` is a v4 convention and v3 answers it with a 401, so
 * sending the key as a header meant every authenticated call failed.
 *
 * Both credentials go out when both are configured: endpoints differ on which
 * they accept — tag writes take the key, tag and subscriber reads want the
 * secret — and Kit ignores the one it does not need.
 */
const getAuth = (): KitAuth => {
  const query: Record<string, string> = {};
  if (KIT_API_KEY) query.api_key = KIT_API_KEY;
  if (KIT_API_SECRET) query.api_secret = KIT_API_SECRET;
  return { headers: {}, query };
};

const buildUrl = (path: string, query: Record<string, string>) => {
  // Join the strings rather than resolving them: `new URL('/tags', '…/v3')`
  // treats a leading slash as host-absolute and drops the version segment. The
  // request then lands on a redirect to marketing HTML, which parses as an
  // empty object instead of failing — so every call quietly returns nothing.
  const url = new URL(
    `${KIT_API_BASE_URL.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`,
  );
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

/**
 * Kit v3 gates subscriber *reads* behind the account secret — the publishable
 * key that authorizes tag writes is rejected on this endpoint — so this asks
 * for the secret directly instead of going through `getAuth()`.
 *
 * `checked: false` (no secret configured) is deliberately distinct from
 * `subscriber: null` (Kit does not know this address). Collapsing the two would
 * make a missing credential look identical to a failed signup.
 */
export type SubscriberLookup = {
  checked: boolean;
  subscriber: { id: string; state: string } | null;
};

export const findSubscriberByEmail = async (
  email: string,
): Promise<SubscriberLookup> => {
  if (!KIT_API_SECRET) return { checked: false, subscriber: null };

  const response = await fetch(
    buildUrl('/subscribers', {
      api_secret: KIT_API_SECRET,
      email_address: email,
      // Kit defaults this endpoint to `active`, which hides everyone who has
      // not answered the double opt-in yet — i.e. precisely the people a guard
      // confirmation is asking about. Without `all`, a fresh signup reads as
      // "no such subscriber" seconds after it succeeded.
      status: 'all',
    }),
    { headers: { 'content-type': 'application/json' } },
  );
  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`Kit API error: ${response.status} ${text}`);
  }

  const payload = (await response.json().catch(() => ({}))) as {
    subscribers?: Array<{ id?: number | string; state?: string }>;
  };
  const match = payload?.subscribers?.[0];
  return {
    checked: true,
    subscriber:
      match?.id != null
        ? { id: String(match.id), state: String(match.state ?? '') }
        : null,
  };
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
