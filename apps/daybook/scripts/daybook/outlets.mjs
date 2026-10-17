// Who published a link, when the record doesn't say.
//
// The composer names each slide's outlets itself (record.social.slides, see
// deck.mjs applySocialCopy), and David fixes them in edits. This is only the
// fallback for a record without that: the first live edition (2026-10-17)
// linked phrases inside its prose ("CNN reports that [the lawsuit remains
// unresolved](https://us.cnn.com/…)") and three of its four slides had no cite.
// No lookup table (David: "a big name lookup sounds pretttttty rigid"). The
// outlet is the name the sentence or the link itself gives it, else the site's
// address, and either way it is marked a guess, which the script flags.

const COUNTRY_SECOND = new Set(['co', 'com', 'org', 'gov', 'gob', 'ac', 'net']);

/** A link's registrable domain: one credit per outlet, however many links. */
export function outletKey(url) {
  let host;
  try {
    host = new URL(url).hostname.toLowerCase().replace(/^www\./, '');
  } catch {
    return null;
  }
  if (host === 'news.google.com') return null;
  const parts = host.split('.');
  const country = parts.length > 2 && parts.at(-1).length === 2 && COUNTRY_SECOND.has(parts.at(-2));
  return parts.slice(country ? -3 : -2).join('.');
}

// "CNN reports that", "Modern Law Group explains", "según Reuters": a name of up
// to six capitalised words before a reporting verb, or after "según".
const SAYS = /((?:[A-Z][\w&’'.-]*(?:\s+(?:of|the|de|del|la|el|y|and|for|on))?\s+){0,5}[A-Z][\w&’'.-]*)\s+(?:reports?|reported|says|said|writes|wrote|found|finds|notes|noted|explains?|explained|argues?|argued|told|informa|informó|reporta|reportó|publicó|explica|explicó)\b/g;
const SEGUN = /\b[Ss]egún\s+((?:[A-Z][\w&’'.-]*\s+){0,5}[A-Z][\w&’'.-]*)/g;

/** The outlet a sentence names, if it names one. */
export function namedIn(text) {
  const sentence = text.split(/(?<=[.!?])\s+/).at(-1) ?? text;
  const hits = [...sentence.matchAll(SAYS), ...sentence.matchAll(SEGUN)].sort((a, b) => a.index - b.index);
  const name = hits.at(-1)?.[1]?.trim();
  return name && !/^(The|A|An|It|He|She|They|We|El|La|Los|Las)$/.test(name) ? name : null;
}

/** The outlet behind a link, as a guess: {name, url, guessed: true}, or null. */
export function outletFor(url, before = '', text = '') {
  const key = outletKey(url);
  if (!key) return null;
  return { name: namedIn(`${before} ${text}`.trim()) ?? key, url, guessed: true };
}
