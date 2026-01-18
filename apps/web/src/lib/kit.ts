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

const postJson = async (path: string, body: Record<string, unknown>) => {
  const auth = getAuth();
  if (!KIT_API_KEY && !KIT_API_SECRET) {
    throw new Error('Missing Kit API credentials.');
  }
  const response = await fetch(buildUrl(path, auth.query), {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...auth.headers,
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`Kit API error: ${response.status} ${text}`);
  }
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
