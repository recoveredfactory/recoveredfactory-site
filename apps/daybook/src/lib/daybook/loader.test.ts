import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import record from './fixtures/record-2026-10-14-en.json';

// The loader reads the bucket URL from the private env on first use; point it at
// a fake origin whose responses each test sets.
vi.mock('$env/dynamic/private', () => ({ env: { DAYBOOK_EDITIONS_URL: 'https://editions.test/' } }));

type Routes = Record<string, unknown | Error | number>;

let routes: Routes = {};
const requested: string[] = [];

function serve(next: Routes) {
  routes = next;
  vi.stubGlobal('fetch', async (url: string) => {
    requested.push(url);
    const path = url.replace('https://editions.test/', '');
    const hit = routes[path];
    if (hit instanceof Error) throw hit;
    if (typeof hit === 'number') return new Response('', { status: hit });
    if (hit === undefined) return new Response('', { status: 403 });
    return new Response(JSON.stringify(hit), { status: 200 });
  });
}

const index = (...editions: Record<string, unknown>[]) => ({
  format: 'daybook-index/1',
  updated_at: '2026-10-19T10:00:00Z',
  editions,
});

const entry = (date: string, lang = 'en', title = `Edition ${date}`) => ({
  date,
  lang,
  title,
  description: `About ${date}`,
  published_at: `${date}T10:00:00Z`,
  revision: 1,
});

// Every test gets a fresh module, so the per-instance caches start empty.
async function loader() {
  vi.resetModules();
  return import('./loader');
}

let warn: ReturnType<typeof vi.spyOn>;
beforeEach(() => {
  requested.length = 0;
  warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
});
afterEach(() => {
  vi.unstubAllGlobals();
  warn.mockRestore();
});

describe('remote editions merged with the archive', () => {
  it('lists a published edition beside the committed ones, newest first', async () => {
    serve({ 'editions/index.json': index(entry('2026-10-19')) });
    const { listEditions } = await loader();

    const editions = await listEditions('en');
    expect(editions[0]).toMatchObject({ date: '2026-10-19', title: 'Edition 2026-10-19', pilot: false });
    expect(editions.some((edition) => edition.date === '2026-10-09')).toBe(true);
    expect(editions.filter((edition) => edition.lang !== 'en')).toEqual([]);
  });

  it('serves the committed file when a date is both committed and published, and says so once', async () => {
    serve({
      'editions/index.json': index(entry('2026-10-09', 'en', 'Remote title')),
      'editions/2026-10-09/en.json': { ...record, date: '2026-10-09', title: 'Remote title' },
    });
    const { getEdition, listEditions } = await loader();

    await listEditions('en');
    await listEditions('en');
    const listed = (await listEditions('en')).filter((edition) => edition.date === '2026-10-09');
    expect(listed).toHaveLength(1);
    expect(listed[0].title).toBe('Green-card cases freeze at eight companies');
    expect((await getEdition('en', '2026-10-09'))?.title).toBe('Green-card cases freeze at eight companies');
    expect(requested).not.toContain('https://editions.test/editions/2026-10-09/en.json');
    expect(warn.mock.calls.filter(([message]) => String(message).includes('en/2026-10-09'))).toHaveLength(1);
  });

  it('serves the archive alone when the bucket cannot be reached', async () => {
    serve({ 'editions/index.json': new Error('connect ECONNREFUSED') });
    const { getEdition, listEditions, listMonths } = await loader();

    const editions = await listEditions('en');
    expect(editions.length).toBeGreaterThan(30);
    expect(editions.every((edition) => edition.date <= '2026-10-09')).toBe(true);
    expect(await getEdition('en', '2026-10-19')).toBeUndefined();
    expect((await listMonths('en')).length).toBeGreaterThan(1);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('ECONNREFUSED'));
  });

  it('reads a 403 as nothing published, the way the bucket answers a missing key', async () => {
    // Anonymous callers cannot list the bucket, so S3 answers a missing object
    // with AccessDenied: true of the index until the first edition is published.
    serve({ 'editions/index.json': 403 });
    const { listEditions } = await loader();

    expect((await listEditions('en'))[0].date).toBe('2026-10-09');
    expect(warn).not.toHaveBeenCalled();

    serve({ 'editions/index.json': index(entry('2026-10-19')), 'editions/2026-10-19/en.json': 403 });
    const fresh = await loader();
    expect(await fresh.getEdition('en', '2026-10-19')).toBeUndefined();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('listed in the index but not found'));
  });

  it('treats a 5xx as unreachable rather than empty', async () => {
    serve({ 'editions/index.json': 503 });
    const { listEditions } = await loader();

    expect((await listEditions('en'))[0].date).toBe('2026-10-09');
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('HTTP 503'));
  });

  it('keeps serving the last good index through a failed refresh', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    try {
      serve({ 'editions/index.json': index(entry('2026-10-19')) });
      const { listEditions } = await loader();
      expect((await listEditions('en'))[0].date).toBe('2026-10-19');

      serve({ 'editions/index.json': new Error('timeout') });
      vi.setSystemTime(Date.now() + 61_000);
      expect((await listEditions('en'))[0].date).toBe('2026-10-19');
    } finally {
      vi.useRealTimers();
    }
  });

  it('shares one request among concurrent reads', async () => {
    serve({ 'editions/index.json': index(entry('2026-10-19')) });
    const { listEditions } = await loader();

    await Promise.all([listEditions('en'), listEditions('en'), listEditions('es')]);
    expect(requested.filter((url) => url.endsWith('index.json'))).toHaveLength(1);
  });

  it('skips a malformed index entry and 404s a malformed record without touching the rest', async () => {
    serve({
      'editions/index.json': index(
        entry('2026-10-20'),
        { date: 'Oct. 19', lang: 'en', title: 'bad date' },
        entry('2026-10-19'),
      ),
      'editions/2026-10-20/en.json': { format: 'daybook/1', date: '2026-10-20', lang: 'en', title: 'No body' },
      'editions/2026-10-19/en.json': { ...record, date: '2026-10-19' },
    });
    const { getEdition, listEditions } = await loader();

    const dates = (await listEditions('en')).map((edition) => edition.date);
    expect(dates.slice(0, 2)).toEqual(['2026-10-20', '2026-10-19']);
    expect(await getEdition('en', '2026-10-20')).toBeUndefined();
    expect((await getEdition('en', '2026-10-19'))?.title).toBe(record.title);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('malformed entry'));
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('malformed record (no body_md)'));
  });

  it('refuses a record whose date or language disagrees with its key', async () => {
    serve({
      'editions/index.json': index(entry('2026-10-19')),
      'editions/2026-10-19/en.json': record,
    });
    const { getEdition } = await loader();

    expect(await getEdition('en', '2026-10-19')).toBeUndefined();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('malformed record (date "2026-10-14")'));
  });

  it('renders a published edition in a month page and its markdown twin', async () => {
    serve({
      'editions/index.json': index(entry('2026-10-19'), entry('2026-10-20')),
      'editions/2026-10-19/en.json': { ...record, date: '2026-10-19' },
      'editions/2026-10-20/en.json': 404,
    });
    const { getEditionMarkdown, getMonth } = await loader();

    const month = await getMonth('en', '2026-10');
    expect(month.map((edition) => edition.date)).toContain('2026-10-19');
    expect(month.map((edition) => edition.date)).not.toContain('2026-10-20');
    expect(month.map((edition) => edition.date)).toContain('2026-10-09');
    expect(await getEditionMarkdown('en', '2026-10-19')).toBe(record.body_md.trim());
    expect(await getEditionMarkdown('en', '2026-10-20')).toBeUndefined();
  });
});

describe('a record as an edition', () => {
  it('maps the test record onto the same edition the markdown path builds', async () => {
    serve({});
    const { editionFromRecord } = await loader();
    const edition = editionFromRecord(record as never);

    expect(edition).toMatchObject({
      date: '2026-10-14',
      lang: 'en',
      title: record.title,
      description: record.description,
      pilot: false,
      emailHtml: null,
      standingHtml: '',
    });
    // The italic lead is the intro; every `##` is a section, the lede at h1.
    expect(edition.intro).toContain('<em>A new USCIS rule cuts the response period');
    expect(edition.sections.map((section) => section.heading)).toEqual([
      'Refugees get 10 days to contest termination of status',
      'Automatic work-permit extensions end as DHS separately proposes tougher repeat reviews',
      'Texas prosecutor says an ICE vehicle strike may have been intentional',
      'San Antonio sues to block a proposed ICE detention site',
      'Judge calls the federal voter-data effort an unlawful dragnet',
      'Around the system',
    ]);
    expect(edition.sections[0].html).toMatch(/^<h1 class="db-section">/);
    expect(edition.sections[1].html).toMatch(/^<h2 class="db-section">/);
    expect(edition.sections[0].html).toContain('target="_blank" rel="noopener"');

    // The calendar is the record's, in its order, with the shared date chip.
    expect(edition.upcoming).toHaveLength(6);
    expect(edition.upcoming[0]).toEqual({
      date: '2026-10-14',
      summary: record.upcoming[0].text,
      sources: [{ label: 'Federal Register', url: record.upcoming[0].sources[0].url }],
      repeatsDate: false,
    });
    expect(edition.upcoming.map((entry) => entry.repeatsDate)).toEqual([false, false, true, false, false, true]);
    expect(edition.upcomingSkipped).toBeUndefined();
  });

  it('records an edition that ran no calendar, so the page draws none', async () => {
    serve({});
    const { editionFromRecord } = await loader();
    const bare = editionFromRecord({ ...record, upcoming: [], description: undefined } as never);

    expect(bare.upcoming).toEqual([]);
    expect(bare.upcomingSkipped).toBe('true');
    // No description falls back to the section heads, the way the pull builds one.
    expect(bare.description).toMatch(/^Refugees get 10 days to contest termination of status · Automatic/);
  });

  it('drops calendar rows it cannot print and sources it cannot link', async () => {
    serve({});
    const { editionFromRecord } = await loader();
    const edition = editionFromRecord({
      ...record,
      upcoming: [
        { date: '2026-10-21T00:00:00Z', text: 'Kept', sources: [{ url: 'https://x.test/a' }, { label: 'bad', url: 'ftp://x' }] },
        { date: 'soon', text: 'No date' },
        { date: '2026-10-22', text: '  ' },
      ],
    } as never);

    expect(edition.upcoming).toEqual([
      { date: '2026-10-21', summary: 'Kept', sources: [{ label: 'https://x.test/a', url: 'https://x.test/a' }], repeatsDate: false },
    ]);
  });
});

const deck = (date: string, lang = 'en') => ({
  format: 'daybook-deck/1',
  date,
  lang,
  revision: 2,
  slides: [
    {
      name: 'cover',
      url: `https://editions.test/social/${date}/${lang}/r2/01-cover.jpg`,
      text: { kind: 'cover', headline: 'Judge leaves the city’s laws in place', line: 'The ruling stands.', sources: ['The Guardian', 'The Hill'] },
    },
    {
      name: 'upcoming',
      url: `https://editions.test/social/${date}/${lang}/r2/06-upcoming.jpg`,
      text: { kind: 'calendar', headline: 'What’s coming', entries: [{ date: 'Oct. 19', day: 'Monday', text: 'Work permits end' }] },
    },
    { name: 'broken', url: 'not a link', text: {} },
  ],
});

describe('an edition’s deck', () => {
  it('shows the rendered slides with their words as alt text, and the Instagram post once there is one', async () => {
    serve({
      'editions/index.json': index(entry('2026-10-19')),
      'social/2026-10-19/en/deck.json': deck('2026-10-19'),
      'social/2026-10-19/en/posted.json': {
        instagram: { id: '1', permalink: 'https://www.instagram.com/p/DepmbEIGcrh/' },
        facebook: { id: '2', permalink: 'https://www.facebook.com/1/posts/2' },
      },
    });
    const { getDeck } = await loader();

    expect(await getDeck('en', '2026-10-19')).toEqual({
      date: '2026-10-19',
      instagramPost: 'DepmbEIGcrh',
      slides: [
        {
          src: 'https://editions.test/social/2026-10-19/en/r2/01-cover.jpg',
          alt: 'Judge leaves the city’s laws in place. The ruling stands. Sources: The Guardian, The Hill.',
          caption: '',
        },
        { src: 'https://editions.test/social/2026-10-19/en/r2/06-upcoming.jpg', alt: 'What’s coming. Oct. 19: Work permits end.', caption: '' },
      ],
    });
  });

  it('has no post link before the broadcast, and no deck before the render or for the wrong edition', async () => {
    serve({
      'editions/index.json': index(entry('2026-10-19'), entry('2026-10-20')),
      'social/2026-10-19/en/deck.json': deck('2026-10-19'),
      'social/2026-10-20/en/deck.json': deck('2026-10-19'),
    });
    const { getDeck } = await loader();

    expect(await getDeck('en', '2026-10-19')).not.toHaveProperty('instagramPost');
    expect(await getDeck('es', '2026-10-19')).toBeNull();
    expect(await getDeck('en', '2026-10-20')).toBeNull();
    // An archived edition's card is its dossier; the bucket isn't asked.
    expect(await getDeck('en', '2026-10-09')).toBeNull();
    expect(requested.some((url) => url.includes('social/2026-10-09'))).toBe(false);
  });

  it('puts the newest published deck on the home page', async () => {
    serve({
      'editions/index.json': index(entry('2026-10-19'), entry('2026-10-20')),
      'social/2026-10-19/en/deck.json': deck('2026-10-19'),
    });
    const { getLatestDeck } = await loader();

    expect(await getLatestDeck('en')).toMatchObject({ date: '2026-10-19' });
    expect(await getLatestDeck('es')).toBeNull();
  });
});

describe('the slate on the home page', () => {
  const slate = {
    format: 'daybook-slate/1',
    updated_at: '2026-10-18T23:00:00Z',
    from: '2026-10-18',
    to: '2026-11-17',
    items: [
      { watch_item_id: 3, date: '2026-11-09', status: 'x', en: { text: 'Fee comments close.', line: null }, es: null, sources: [] },
      { watch_item_id: 1, date: '2026-10-18', status: 'x', en: { text: 'Passed.', line: 'Passed' }, es: { text: 'Pasó.', line: null }, sources: [] },
      {
        watch_item_id: 2,
        date: '2026-10-19',
        status: 'x',
        en: { text: 'The long words.', line: 'Work permits end' },
        es: { text: 'Las palabras largas.', line: 'Terminan los permisos' },
        sources: [{ label: 'Federal Register', url: 'https://www.federalregister.gov/d/1' }, { label: 'bad', url: 'javascript:x' }],
      },
      { watch_item_id: 4, date: '2026-10-19', status: 'x', en: { text: 'Same day.', line: null }, es: { text: 'El mismo día.', line: null }, sources: [] },
    ],
  };

  it('runs from today, in date order, in the short lines where there are any, and prints a shared date once', async () => {
    serve({ 'upcoming/slate.json': slate });
    const { getSlateUpcoming } = await loader();

    expect(await getSlateUpcoming('en', '2026-10-19')).toEqual([
      { date: '2026-10-19', summary: 'Work permits end', sources: [{ label: 'Federal Register', url: 'https://www.federalregister.gov/d/1' }], repeatsDate: false },
      { date: '2026-10-19', summary: 'Same day.', sources: [], repeatsDate: true },
      { date: '2026-11-09', summary: 'Fee comments close.', sources: [], repeatsDate: false },
    ]);
    // Spanish leaves out what has no Spanish rather than printing the English.
    expect((await getSlateUpcoming('es', '2026-10-19')).map((e) => e.summary)).toEqual(['Terminan los permisos', 'El mismo día.']);
  });

  it('shows no calendar when the file is missing or isn’t a slate', async () => {
    serve({});
    expect(await (await loader()).getSlateUpcoming('en', '2026-10-19')).toEqual([]);
    serve({ 'upcoming/slate.json': { format: 'something-else' } });
    expect(await (await loader()).getSlateUpcoming('en', '2026-10-19')).toEqual([]);
  });
});
