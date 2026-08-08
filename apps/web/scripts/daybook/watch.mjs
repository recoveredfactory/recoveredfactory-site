// The Upcoming calendar, read from the ingestion database.
//
// The entries the Daybook publishes under "Upcoming" are watch items: rows the
// ingester maintains and the composer assembles into an edition. There is no
// events table and deliberately so — PromptQL owns the assembly — so this reads
// the composer-facing view rather than inventing a second source of truth.
//
// Read-only, and it must stay that way: a write to watch_items has to recompute
// content_fingerprint or the item silently drops off the diff surface. Nothing
// here writes.
//
// Both languages live on the same row (plain_summary / plain_summary_es), unlike
// articles, where each row is one language. Do not carry the article model over.

import pg from 'pg';

// How far ahead the calendar looks. The newsletter's own rubric is "next four
// weeks", so the card deck uses the same window rather than a second definition
// of soon.
const WINDOW_DAYS = 28;

/**
 * Watch items due within the window after `editionDate`, soonest first.
 *
 * Selection here is deliberately dumb — nearest deadline wins. The composer
 * applies editorial judgement when it picks the five that go in the newsletter,
 * and that judgement is not recorded anywhere queryable, so this does not
 * pretend to reproduce it. If the composer's picks ever land in a table, this
 * is the function that should read them instead.
 *
 * `tier` is proximity, not importance: past / approaching / horizon / future.
 * Anything already dated `past` is dropped — a comment window that shut is not
 * upcoming, whatever the row says.
 */
export async function fetchUpcoming({ connectionString, editionDate, limit }) {
  // pg reads sslmode out of the URL and treats `require` as verify-full, which
  // fails against the RDS certificate chain. TLS is still on — the connection is
  // encrypted — but the chain is not verified, which is the same posture the
  // rest of the tooling uses against this host.
  const client = new pg.Client({
    connectionString: connectionString.replace(/[?&]sslmode=[^&]*/, ''),
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  try {
    const { rows } = await client.query(
      `select id,
              title,
              key_date,
              key_date_raw,
              status,
              tier,
              date_certainty,
              source_url,
              plain_summary,
              plain_summary_es
         from v_watch_items
        where key_date > $1::date
          and key_date <= $1::date + $2::int
          and tier is distinct from 'past'
          and plain_summary is not null
        order by key_date, id
        limit $3`,
      [editionDate, WINDOW_DAYS, limit],
    );
    return rows;
  } finally {
    await client.end();
  }
}

/**
 * Shape a row for a card, in one language.
 *
 * Returns null when that language has no plain-language summary. About one item
 * in twenty has no Spanish yet, and a card is not the place to discover it: an
 * English paragraph under a Spanish headline is worse than one fewer slide.
 */
export function toCalendarEntry(row, lang) {
  const text = lang === 'es' ? row.plain_summary_es : row.plain_summary;
  if (!text) return null;

  const date = row.key_date instanceof Date ? row.key_date : new Date(`${row.key_date}T00:00:00Z`);

  return {
    iso: date.toISOString().slice(0, 10),
    month: MONTH_LABEL[lang][date.getUTCMonth()],
    day: String(date.getUTCDate()),
    text: text.trim(),
  };
}

// Short month labels for the date chip. English follows the Daybook's AP style
// minus the period, which reads as an abbreviation at this size without one.
const MONTH_LABEL = {
  en: ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'],
  es: ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'],
};
