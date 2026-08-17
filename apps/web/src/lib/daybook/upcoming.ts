import type { Lang } from '$lib/i18n';

/**
 * The Upcoming calendar, read from the pipeline's own snapshot.
 *
 * This section exists in exactly one place: the sent email. The markdown
 * artifact ships without it — an edition's body goes story, story, story,
 * "Around the system", and `extractEvents` finds nothing to pull out because
 * there are no `- **date**` entries to find. So a page rendered from markdown
 * has no calendar unless it reads the snapshot, which is what this does.
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

const cite = (citation: Citation | undefined) =>
  citation?.url ? { label: citation.label?.trim() || citation.url, url: citation.url } : null;

/**
 * The calendar for one edition in one language, or null when the day has no
 * snapshot or the snapshot selected nothing.
 *
 * `selection.mode` decides which list is authoritative. Every snapshot so far
 * runs `eligible_only`, where `selected_items` is empty and `eligible_items` is
 * the published set — reading the wrong one renders an empty calendar under a
 * heading, which is worse than no heading.
 */
export function getUpcoming(lang: Lang, date: string): Upcoming | null {
  const snapshot = byDate.get(date);
  if (!snapshot) return null;

  const items =
    snapshot.selection?.mode === 'eligible_only'
      ? (snapshot.eligible_items ?? [])
      : (snapshot.selected_items ?? snapshot.eligible_items ?? []);

  const order = (item: SnapshotItem) =>
    (lang === 'es' ? item.render_order_es : item.render_order) ??
    item.eligible_order ??
    Number.MAX_SAFE_INTEGER;

  const entries: UpcomingEntry[] = [];
  for (const item of [...items].sort((a, b) => order(a) - order(b))) {
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
