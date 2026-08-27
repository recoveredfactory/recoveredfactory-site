import type { Lang } from '$lib/i18n';

/**
 * The Upcoming calendar, reconstructed from the pipeline's own snapshot.
 *
 * The last resort, since 2026-08-27. The page reads the calendar the edition
 * itself carried — out of the markdown, or out of the sent email — and only
 * comes here when neither has one, which is the Aug. 14 editions and the days
 * the Spanish email shipped `Próximamente` empty. See ./calendar.
 *
 * What this returns is a reconstruction, not the selection: the snapshot holds a
 * deterministic slate, so an entry the edition ran that the slate does not hold
 * cannot be recovered from it at all. On 2026-08-21 that was two of eight.
 *
 * The snapshots are written by scripts/daybook/upcoming.mjs and committed. Each
 * one carries both languages — summaries, ordering, citations — so nothing here
 * translates or re-derives anything; it picks a side and sorts.
 *
 * Size note: these files are large (~30KB each, mostly audit trail) and there
 * is one per weekday. Globbed eagerly like the sent-email HTML beside them, and
 * for the same reason — but if the archive gets heavy, this and
 * `emailsByDate` in ./loader are the two places to make lazy.
 */

type Citation = { label?: string; url?: string };

type SnapshotItem = {
  id?: number;
  key_date?: string;
  display_summary?: string;
  display_summary_es?: string;
  plain_summary?: string;
  plain_summary_es?: string;
  primary_citation?: Citation;
  secondary_citations?: Citation[];
  render_order?: number;
  render_order_es?: number;
  eligible_order?: number;
  bucket?: string;
};

type Snapshot = {
  edition_date?: string;
  selection?: { mode?: string };
  eligible_items?: SnapshotItem[];
  selected_items?: SnapshotItem[];
};

export type UpcomingEntry = {
  /** ISO `YYYY-MM-DD`. */
  date: string;
  summary: string;
  sources: Array<{ label: string; url: string }>;
  /**
   * True when the entry before it carries the same date. Two rules closing on
   * the same day print the chip once — the email does this, and repeating
   * "AUG 31" down a column reads as two separate deadlines.
   */
  repeatsDate: boolean;
};

export type Upcoming = {
  editionDate: string;
  entries: UpcomingEntry[];
};

const snapshots = import.meta.glob<Snapshot>('/src/content/daybook/upcoming/*.json', {
  eager: true,
  import: 'default',
});

const byDate = new Map<string, Snapshot>();
for (const [path, snapshot] of Object.entries(snapshots)) {
  const date = path.split('/').pop()?.replace(/\.json$/, '') ?? '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) byDate.set(date, snapshot);
}

/** `"310,315,316"` from an edition's frontmatter, as ids. */
export function parseUpcomingIds(value?: string): number[] {
  if (!value) return [];
  return value
    .split(',')
    .map((part) => Number(part.trim()))
    .filter((id) => Number.isInteger(id));
}

const cite = (citation: Citation | undefined) =>
  citation?.url ? { label: citation.label?.trim() || citation.url, url: citation.url } : null;

/**
 * The calendar for one edition in one language, or null when the day has no
 * snapshot or the snapshot selected nothing.
 *
 * `selection.mode` decides which list is authoritative. Every snapshot so far
 * runs `eligible_only`, where `selected_items` is empty and `eligible_items` is
 * the widest defensible set — reading the wrong one renders an empty calendar
 * under a heading, which is worse than no heading.
 *
 * `publishedIds` narrows that set to what the email actually carried, off the
 * edition's `upcomingIds` frontmatter. The eligible slate runs an entry or two
 * long — on 2026-08-17 it held six against the email's five, the extra being an
 * OMB paperwork renewal the composer had kept out — and the page and the inbox
 * disagreeing about the same day's deadlines is a small lie the archive should
 * not tell. Editions pulled before that field existed pass nothing and get the
 * whole slate, as before.
 */
export function getUpcoming(
  lang: Lang,
  date: string,
  publishedIds?: number[] | null,
): Upcoming | null {
  const snapshot = byDate.get(date);
  if (!snapshot) return null;

  const eligible =
    snapshot.selection?.mode === 'eligible_only'
      ? (snapshot.eligible_items ?? [])
      : (snapshot.selected_items ?? snapshot.eligible_items ?? []);

  const order = (item: SnapshotItem) =>
    (lang === 'es' ? item.render_order_es : item.render_order) ??
    item.eligible_order ??
    Number.MAX_SAFE_INTEGER;

  // Published ids decide the order as well as the set: they are the sequence the
  // composer rendered. A list that resolves to nothing is treated as no list at
  // all rather than as an empty calendar.
  const byId = new Map(eligible.map((item) => [item.id, item]));
  const published = (publishedIds ?? [])
    .map((id) => byId.get(id))
    .filter((item): item is SnapshotItem => Boolean(item));

  const items = published.length ? published : [...eligible].sort((a, b) => order(a) - order(b));

  const entries: UpcomingEntry[] = [];
  for (const item of items) {
    const summary = (
      lang === 'es'
        ? (item.display_summary_es ?? item.plain_summary_es)
        : (item.display_summary ?? item.plain_summary)
    )?.trim();

    // An entry with no date or nothing to say about it is dropped rather than
    // printed as an empty row. The calendar is the Daybook's argument for
    // itself; a blank line in it costs more than a missing one.
    if (!item.key_date || !summary) continue;

    const sources = [cite(item.primary_citation), ...(item.secondary_citations ?? []).map(cite)]
      .filter((source): source is { label: string; url: string } => source !== null);

    entries.push({
      date: item.key_date,
      summary,
      sources,
      repeatsDate: entries.at(-1)?.date === item.key_date,
    });
  }

  return entries.length ? { editionDate: snapshot.edition_date ?? date, entries } : null;
}
