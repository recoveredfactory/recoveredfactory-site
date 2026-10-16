import type { Lang } from '$lib/i18n';

/**
 * Editions published to S3, read at request time.
 *
 * From the 2026-10-19 relaunch on, an edition is published by the desk at lock:
 * the news ingester writes the edition record to a public bucket and lists it in
 * an index beside it. Publishing is that upload — there is no pull, no commit
 * and no deploy per edition. The 88 editions archived as markdown before then
 * stay exactly where they are; ./loader merges the two.
 *
 * The bucket's layout is the ingester's contract (news-ingester docs):
 *
 *   editions/index.json            {format: "daybook-index/1", updated_at, editions: [...]}
 *   editions/{date}/{lang}.json    the daybook/1 record as published
 *
 * Every read here is cached in module memory for a minute per Lambda instance,
 * and concurrent reads of the same object share one request. A failed refresh
 * keeps serving the last good copy, and a bucket that has never answered serves
 * nothing — the archive on disk still renders, which is the whole site until
 * the first remote edition exists.
 */

export type IndexEntry = {
  date: string;
  lang: Lang;
  title: string;
  description: string;
  publishedAt?: string;
  revision?: number;
};

export type EditionRecord = {
  format: 'daybook/1';
  date: string;
  lang: Lang;
  title: string;
  description?: string;
  body_md: string;
  standing?: string;
  upcoming?: unknown[];
  published_at?: string;
  revision?: number;
  [key: string]: unknown;
};

type Log = (message: string) => void;

type RemoteOptions = {
  /** Bucket base URL, e.g. `https://<bucket>.s3.amazonaws.com`. Empty turns it off. */
  baseUrl: string;
  fetch?: typeof fetch;
  /** How long a good read is reused. */
  ttlMs?: number;
  /** How long a failed read is remembered before the next attempt. */
  failTtlMs?: number;
  /** Per-request timeout, so a bucket that hangs cannot hang a page. */
  timeoutMs?: number;
  log?: Log;
};

export type Remote = {
  enabled: boolean;
  /** The index's valid entries, or [] when the source is off or has never answered. */
  index(): Promise<IndexEntry[]>;
  /** One record, or null when it is missing, unreachable or malformed. */
  record(date: string, lang: Lang): Promise<EditionRecord | null>;
};

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const isLang = (value: unknown): value is Lang => value === 'en' || value === 'es';
const isText = (value: unknown): value is string => typeof value === 'string' && value.trim() !== '';

type Slot<T> = { value?: T; expires: number; inflight?: Promise<T | undefined> };

export function createRemote({
  baseUrl,
  fetch: fetchImpl = fetch,
  ttlMs = 60_000,
  failTtlMs = 15_000,
  timeoutMs = 3_000,
  log = (message) => console.warn(`daybook remote: ${message}`),
}: RemoteOptions): Remote {
  const base = baseUrl.trim().replace(/\/+$/, '');
  const slots = new Map<string, Slot<unknown>>();

  // One cache for every object. A slot keeps its last good value through a
  // failed refresh — a minute-old index beats an edition vanishing from the
  // home page because S3 blinked — and remembers the failure briefly so a dead
  // bucket costs one timeout every `failTtlMs`, not one per request.
  async function cached<T>(key: string, load: () => Promise<T>): Promise<T | undefined> {
    const slot = (slots.get(key) as Slot<T> | undefined) ?? { expires: 0 };
    slots.set(key, slot);
    if (Date.now() < slot.expires) return slot.value;
    if (slot.inflight) return slot.inflight;

    slot.inflight = load()
      .then((value) => {
        slot.value = value;
        slot.expires = Date.now() + ttlMs;
        return value;
      })
      .catch((err) => {
        log(`${key}: ${err instanceof Error ? err.message : String(err)}`);
        slot.expires = Date.now() + failTtlMs;
        return slot.value;
      })
      .finally(() => {
        slot.inflight = undefined;
      });

    return slot.inflight;
  }

  async function getJson(path: string): Promise<unknown | null> {
    const res = await fetchImpl(`${base}/${path}`, { signal: AbortSignal.timeout(timeoutMs) });
    // S3 answers 403 rather than 404 for a missing key when the bucket policy
    // does not grant ListBucket. Both mean "not there".
    if (res.status === 404 || res.status === 403) return null;
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${path}`);
    return res.json();
  }

  if (!base) {
    return { enabled: false, index: async () => [], record: async () => null };
  }

  return {
    enabled: true,

    async index() {
      const entries = await cached('editions/index.json', async () => {
        const raw = await getJson('editions/index.json');
        if (raw === null) return [];
        return readIndex(raw, log);
      });
      return entries ?? [];
    },

    async record(date, lang) {
      if (!DATE.test(date) || !isLang(lang)) return null;
      const path = `editions/${date}/${lang}.json`;
      const record = await cached(path, async () => {
        const raw = await getJson(path);
        if (raw === null) {
          log(`${path}: listed in the index but not found`);
          return null;
        }
        return readRecord(raw, date, lang, log);
      });
      return record ?? null;
    },
  };
}

/**
 * The index's entries that can be shown. A malformed entry is skipped and named
 * in the log; it never takes the rest of the index down with it.
 */
export function readIndex(raw: unknown, log: Log): IndexEntry[] {
  const doc = raw as { format?: unknown; editions?: unknown };
  if (doc?.format !== 'daybook-index/1' || !Array.isArray(doc.editions)) {
    throw new Error(`index: not a daybook-index/1 document`);
  }

  const entries: IndexEntry[] = [];
  for (const item of doc.editions as Record<string, unknown>[]) {
    if (!item || !DATE.test(String(item.date)) || !isLang(item.lang) || !isText(item.title)) {
      log(`index: skipped a malformed entry ${JSON.stringify(item)?.slice(0, 120)}`);
      continue;
    }
    entries.push({
      date: String(item.date),
      lang: item.lang,
      title: item.title.trim(),
      description: typeof item.description === 'string' ? item.description.trim() : '',
      publishedAt: typeof item.published_at === 'string' ? item.published_at : undefined,
      revision: typeof item.revision === 'number' ? item.revision : undefined,
    });
  }
  return entries;
}

/**
 * A record that is what its key says it is, or null. A record whose date or
 * language disagrees with its path is treated as malformed rather than served
 * under the wrong edition.
 */
export function readRecord(raw: unknown, date: string, lang: Lang, log: Log): EditionRecord | null {
  const record = raw as Partial<EditionRecord> | null;
  const problem =
    record?.format !== 'daybook/1'
      ? `format ${JSON.stringify(record?.format)}`
      : record.date !== date
        ? `date ${JSON.stringify(record.date)}`
        : record.lang !== lang
          ? `lang ${JSON.stringify(record.lang)}`
          : !isText(record.title)
            ? 'no title'
            : !isText(record.body_md)
              ? 'no body_md'
              : null;

  if (problem) {
    log(`editions/${date}/${lang}.json: malformed record (${problem}), skipped`);
    return null;
  }
  return record as EditionRecord;
}
