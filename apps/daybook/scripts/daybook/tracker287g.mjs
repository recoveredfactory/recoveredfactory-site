// The 287(g) map's numbers: who joined ICE's published 287(g) list in the two
// weeks up to its last change, and how many days ago that change was. Used by
// record-deck.mjs; drawn by og.mjs (trackerSlide).

// 287(g) Watch's agency file: every agency on ICE's published 287(g) list, the
// day the tracker first saw it there (`first_seen_date`), and the day the file
// was last rebuilt (`snapshot_date`). Public, CC BY 4.0, rebuilt daily.
const AGENCIES_CSV = 'https://287g.recoveredfactory.net/data/dist/downloads/287g-agencies-latest.csv';

// The window is the two weeks up to ICE's last change to the list, not up to the
// edition. ICE updates in bursts: some weeks every weekday, and in July-August
// 2026 not at all for 24 days while 124 agencies signed, 114 of which then
// appeared on Aug. 14 in one batch. Anchored on the edition, a quiet stretch
// would show an empty map; anchored on the last change, the map always shows
// the latest additions, and the days since that change are the news when they
// pile up (David: "a little data drama").
const TRACKER_WINDOW_DAYS = 14;

// An outage in our own tracker would look exactly like ICE going quiet. So the
// counter only runs when the tracker itself is current: a snapshot older than
// this, measured back from the edition, leaves the slide off with a warning.
const TRACKER_SNAPSHOT_MAX_AGE = 2;

const OUTSIDE_LOWER_48 = new Set(['AK', 'HI', 'PR', 'GU', 'VI', 'AS', 'MP']);
const DAY_MS = 864e5;
const daysBetween = (a, b) => Math.round((Date.parse(b) - Date.parse(a)) / DAY_MS);
const isoMinus = (iso, days) => new Date(Date.parse(iso) - days * DAY_MS).toISOString().slice(0, 10);

/** RFC 4180 enough for this file: quoted fields, doubled quotes, CRLF. */
export function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') {
        cell += '"';
        i += 1;
      } else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ',') {
      row.push(cell);
      cell = '';
    } else if (ch === '\n') {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
    } else if (ch !== '\r') cell += ch;
  }
  if (cell || row.length) {
    row.push(cell);
    rows.push(row);
  }
  const [head = [], ...body] = rows;
  const keys = head.map((key) => key.replace(/^\ufeff/, ''));
  return body.filter((r) => r.length === keys.length).map((r) => Object.fromEntries(keys.map((k, i) => [k, r[i]])));
}

/**
 * The map's numbers for one edition date, from the agency rows. Pure, so the
 * window and the counter can be tested without the network.
 */
export function trackerFrom(rows, date, { windowDays = TRACKER_WINDOW_DAYS, maxSnapshotAge = TRACKER_SNAPSHOT_MAX_AGE } = {}) {
  const snapshot = rows.reduce((max, r) => (r.snapshot_date > max ? r.snapshot_date : max), '');
  if (!snapshot) return { skip: 'the agency file has no snapshot_date' };
  if (daysBetween(snapshot, date) > maxSnapshotAge) {
    return { skip: `287(g) Watch's snapshot is from ${snapshot}; a stale tracker would read as ICE going quiet` };
  }

  // As of the edition: an agency first seen after it was not on the list yet.
  const listed = rows.filter((r) => r.status !== 'terminated' && r.first_seen_date && r.first_seen_date <= date);
  const last = listed.reduce((max, r) => (r.first_seen_date > max ? r.first_seen_date : max), '');
  if (!last) return { skip: 'no agency on the list as of this edition' };
  const start = isoMinus(last, windowDays);
  const added = listed.filter((r) => r.first_seen_date > start);

  const counts = new Map();
  for (const r of added) counts.set(r.state, (counts.get(r.state) ?? 0) + 1);
  const top = [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 3);

  // Lower 48 only, at the county or town 287(g) Watch places each agency.
  const point = (r) => [Number(Number(r.longitude).toFixed(3)), Number(Number(r.latitude).toFixed(3))];
  const mappable = (r) => r.latitude && r.longitude && !OUTSIDE_LOWER_48.has(r.state);

  return {
    last,
    since: daysBetween(last, date),
    start,
    added: added.length,
    top,
    fresh: added.filter(mappable).map(point),
    old: listed.filter((r) => r.first_seen_date <= start && mappable(r)).map(point),
    snapshot,
  };
}

export async function tracker287g(date) {
  try {
    const res = await fetch(AGENCIES_CSV, { signal: AbortSignal.timeout(30000) });
    if (!res.ok) throw new Error(`${res.status} from ${AGENCIES_CSV}`);
    const result = trackerFrom(parseCsv(await res.text()), date);
    if (result.skip) {
      console.warn(`WARNING: ${date}: no 287(g) map — ${result.skip}.`);
      return null;
    }
    console.log(
      `${date}: 287(g) map — ${result.added} added ${result.start}..${result.last}, ` +
        `${result.since} day(s) since ICE's last change.`,
    );
    return result;
  } catch (err) {
    console.warn(`WARNING: ${date}: no 287(g) map — ${err.message}.`);
    return null;
  }
}

