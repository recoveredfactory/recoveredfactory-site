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
 *   social/{date}/{lang}/deck.json the edition's slide deck, once this repo's deck Action renders it
 *   social/{date}/{lang}/posted.json  the posts that deck went out as, once broadcast
 *   upcoming/slate.json            the standing Upcoming slate's next 30 days
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

/** One slide of an edition's deck: the rendered image and the words baked into it. */
export type DeckSlide = {
  name: string;
  url: string;
  text: Record<string, unknown>;
};

/** An edition's social deck (`daybook-deck/1`), as the deck Action wrote it. */
export type Deck = {
  date: string;
  lang: Lang;
  revision?: number;
  slides: DeckSlide[];
};

/** Where a deck went out, by platform: the posts' public links. */
export type Posted = {
  instagram?: string;
  facebook?: string;
};

/** One dated item on the public slate, in the languages it has. */
export type SlateItem = {
  watchItemId: number;
  date: string;
  en: { text: string; line: string | null };
  es: { text: string; line: string | null } | null;
  sources: Array<{ label: string; url: string }>;
};

/** The public slate (`daybook-slate/1`): the standing Upcoming items in a 30-day window. */
export type Slate = {
  from: string;
  to: string;
  items: SlateItem[];
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
  /** An edition's deck, or null until it has rendered. */
  deck(date: string, lang: Lang): Promise<Deck | null>;
  /** An edition's posts, or null until it has been broadcast. */
  posted(date: string, lang: Lang): Promise<Posted | null>;
  /** The public slate, or null when it is missing or unreadable. */
  slate(): Promise<Slate | null>;
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
    return {
      enabled: false,
      index: async () => [],
      record: async () => null,
      deck: async () => null,
      posted: async () => null,
      slate: async () => null,
    };
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

    // The deck and its posts arrive after the record, a minute or two for the
    // render and only on broadcast for the posts, so a missing one is the
    // normal state for a while and isn't logged.
    async deck(date, lang) {
      if (!DATE.test(date) || !isLang(lang)) return null;
      const path = `social/${date}/${lang}/deck.json`;
      const deck = await cached(path, async () => {
        const raw = await getJson(path);
        return raw === null ? null : readDeck(raw, date, lang, log);
      });
      return deck ?? null;
    },

    async posted(date, lang) {
      if (!DATE.test(date) || !isLang(lang)) return null;
      const path = `social/${date}/${lang}/posted.json`;
      const posted = await cached(path, async () => {
        const raw = await getJson(path);
        return raw === null ? null : readPosted(raw);
      });
      return posted ?? null;
    },

    async slate() {
      const slate = await cached('upcoming/slate.json', async () => {
        const raw = await getJson('upcoming/slate.json');
        return raw === null ? null : readSlate(raw, log);
      });
      return slate ?? null;
    },
  };
}

const isHttp = (value: unknown): value is string => typeof value === 'string' && /^https?:\/\//.test(value);

/** A deck that belongs to its key and has slides to show, or null. */
export function readDeck(raw: unknown, date: string, lang: Lang, log: Log): Deck | null {
  const doc = raw as { format?: unknown; date?: unknown; lang?: unknown; revision?: unknown; slides?: unknown };
  if (doc?.format !== 'daybook-deck/1' || doc.date !== date || doc.lang !== lang || !Array.isArray(doc.slides)) {
    log(`social/${date}/${lang}/deck.json: not this edition's daybook-deck/1, skipped`);
    return null;
  }
  const slides = (doc.slides as Record<string, unknown>[])
    .filter((slide) => slide && isHttp(slide.url))
    .map((slide) => ({
      name: typeof slide.name === 'string' ? slide.name : '',
      url: slide.url as string,
      text: slide.text && typeof slide.text === 'object' ? (slide.text as Record<string, unknown>) : {},
    }));
  if (!slides.length) return null;
  return { date, lang, revision: typeof doc.revision === 'number' ? doc.revision : undefined, slides };
}

/** The posts' public links, by platform. */
export function readPosted(raw: unknown): Posted | null {
  const doc = (raw ?? {}) as Record<string, { permalink?: unknown } | undefined>;
  const posted: Posted = {};
  if (isHttp(doc.instagram?.permalink)) posted.instagram = doc.instagram.permalink;
  if (isHttp(doc.facebook?.permalink)) posted.facebook = doc.facebook.permalink;
  return Object.keys(posted).length ? posted : null;
}

/** The slate's items that can be printed: a date, English words, and only linkable sources. */
export function readSlate(raw: unknown, log: Log): Slate | null {
  const doc = raw as { format?: unknown; from?: unknown; to?: unknown; items?: unknown };
  if (doc?.format !== 'daybook-slate/1' || !DATE.test(String(doc.from)) || !DATE.test(String(doc.to)) || !Array.isArray(doc.items)) {
    log('upcoming/slate.json: not a daybook-slate/1 document, skipped');
    return null;
  }
  const words = (value: unknown) => {
    const copy = (value ?? {}) as { text?: unknown; line?: unknown };
    return isText(copy.text) ? { text: copy.text.trim(), line: isText(copy.line) ? copy.line.trim() : null } : null;
  };
  const items: SlateItem[] = [];
  for (const item of doc.items as Record<string, unknown>[]) {
    const en = words(item?.en);
    if (!item || !DATE.test(String(item.date)) || typeof item.watch_item_id !== 'number' || !en) continue;
    items.push({
      watchItemId: item.watch_item_id,
      date: String(item.date),
      en,
      es: words(item.es),
      sources: (Array.isArray(item.sources) ? (item.sources as Record<string, unknown>[]) : [])
        .filter((source) => source && isHttp(source.url))
        .map((source) => ({ label: isText(source.label) ? source.label.trim() : String(source.url), url: String(source.url) })),
    });
  }
  return { from: String(doc.from), to: String(doc.to), items };
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
