import { SITE_URL } from '$lib/config';
import { EVENT_DATE, parseEntryDate, stripInline } from '$lib/daybook/calendar';
import type { Lang } from '$lib/i18n';

export type CalendarEvent = {
  /** ISO date, `YYYY-MM-DD`. */
  date: string;
  name: string;
  description: string;
  url?: string;
};

const PUBLISHER = {
  '@type': 'Organization',
  name: 'Recovered Factory',
  url: SITE_URL,
};

const PERIODICAL = {
  '@type': 'Periodical',
  name: 'Immigration Daybook',
  publisher: PUBLISHER,
};

const abs = (path: string) => new URL(path, SITE_URL).href;

// Whether the calendar is emitted as schema.org Events.
//
// Off, deliberately. The calendar is the Daybook's most valuable asset and a
// candidate product in its own right, and Event JSON-LD is the single most
// harvestable form it could take: it is exactly what search engines and
// assistants use to answer "when does the comment window close" without anyone
// visiting the page or subscribing. The entries are readable as prose either
// way — this is not secrecy — but publishing a typed, dated feed of them is a
// different act from publishing an edition that mentions them.
//
// Flip this to true if the calendar stays free and reach matters more than
// capture. Everything behind it is built and tested; only the emission is off.
const PUBLISH_EVENT_SCHEMA = false;

/**
 * Pull dated entries out of an edition's calendar section.
 *
 * The Daybook's whole argument is that it tells you what is coming, so those
 * entries are the part of an edition most worth making machine-readable. They
 * are written as `- **Aug. 4 — <what happens>** <why it matters> [source](url)`.
 *
 * Entries whose date cannot be parsed with confidence are skipped rather than
 * guessed at. Wrong structured data is worse than none — it is the kind of thing
 * that earns a manual action — so this only emits what it can actually read.
 */
export function extractEvents(body: string, lang: Lang, editionDate: string): CalendarEvent[] {
  const section = body.split(/\n(?=## )/).find((block) => /\{\{|^- \*\*/m.test(block));
  if (!section) return [];

  const events: CalendarEvent[] = [];

  for (const line of section.split('\n')) {
    const entry = line.match(/^-\s+\*\*(.+?)\*\*\s*(.*)$/);
    if (!entry) continue;

    const [, bolded, tail] = entry;
    const date = parseEntryDate(bolded, lang, editionDate);
    if (!date) continue;

    // Everything after the em dash in the bolded run is what actually happens;
    // the trailing sentence is the why-it-matters.
    const name = bolded
      .replace(EVENT_DATE[lang], '')
      .replace(/^\s*[—–-]\s*/, '')
      .trim();
    if (!name) continue;

    events.push({
      date,
      name: stripInline(name),
      description: stripInline(tail),
      url: tail.match(/\]\((https?:\/\/[^)]+)\)/)?.[1],
    });
  }

  return events;
}

type EditionForSchema = {
  date: string;
  lang: Lang;
  title: string;
  description: string;
  events?: CalendarEvent[];
};

/** JSON-LD for a single edition: the issue itself, its calendar, its trail. */
export function editionSchema(edition: EditionForSchema): unknown[] {
  const url = abs(`/${edition.lang}/daybook/${edition.date}`);
  const published = `${edition.date}T00:00:00Z`;

  const article = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: edition.title,
    description: edition.description,
    url,
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    datePublished: published,
    dateModified: published,
    inLanguage: edition.lang,
    isAccessibleForFree: true,
    publisher: PUBLISHER,
    isPartOf: {
      ...PERIODICAL,
      '@type': 'PublicationIssue',
      datePublished: published,
      isPartOf: { ...PERIODICAL, url: abs(`/${edition.lang}/daybook`) },
    },
  };

  // Each calendar entry would be its own Event rather than folded into the
  // article, because a comment deadline is a thing in the world that several
  // editions will mention — not a property of the day it was written up. Held
  // back by PUBLISH_EVENT_SCHEMA; see the note there.
  const events = (PUBLISH_EVENT_SCHEMA ? (edition.events ?? []) : []).map((event) => ({
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: event.name,
    ...(event.description ? { description: event.description } : {}),
    startDate: event.date,
    endDate: event.date,
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OnlineEventAttendanceMode',
    // Deadlines and effective dates have no venue. Schema requires a location,
    // and a virtual one is the honest reading of a Federal Register cutoff.
    location: { '@type': 'VirtualLocation', url: event.url ?? url },
    ...(event.url ? { url: event.url } : {}),
  }));

  return [article, breadcrumbs(edition.lang, edition.date), ...events];
}

/** JSON-LD for the archive index and the month roundups. */
export function archiveSchema(
  lang: Lang,
  items: { date: string; title: string }[],
  ref?: string,
): unknown[] {
  const path = ref ? `/${lang}/daybook/${ref}` : `/${lang}/daybook`;

  return [
    {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: 'Immigration Daybook',
      url: abs(path),
      inLanguage: lang,
      isPartOf: { ...PERIODICAL, url: abs(`/${lang}/daybook`) },
      publisher: PUBLISHER,
      mainEntity: {
        '@type': 'ItemList',
        itemListOrder: 'https://schema.org/ItemListOrderDescending',
        numberOfItems: items.length,
        itemListElement: items.map((item, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          url: abs(`/${lang}/daybook/${item.date}`),
          name: item.title,
        })),
      },
    },
    breadcrumbs(lang, ref),
  ];
}

function breadcrumbs(lang: Lang, ref?: string) {
  const trail = [
    { name: 'Recovered Factory', url: abs(`/${lang}`) },
    { name: 'Immigration Daybook', url: abs(`/${lang}/daybook`) },
  ];

  // An edition sits under its month, so the trail reads year → month → day and
  // the month page gets linked from every edition that belongs to it.
  if (ref && ref.length === 10) {
    const month = ref.slice(0, 7);
    trail.push({ name: month, url: abs(`/${lang}/daybook/${month}`) });
    trail.push({ name: ref, url: abs(`/${lang}/daybook/${ref}`) });
  } else if (ref) {
    trail.push({ name: ref, url: abs(`/${lang}/daybook/${ref}`) });
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((crumb, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: crumb.name,
      item: crumb.url,
    })),
  };
}
