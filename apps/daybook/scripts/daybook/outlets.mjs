// Who published a link, by name, for the carousel's cite (David, 2026-10-17:
// "there's links, I don't see cites").
//
// The first live edition linked phrases inside its prose ("CNN reports that
// [the lawsuit remains unresolved](https://us.cnn.com/…)") rather than crediting
// "[CNN](…)" after the claim, so three of its four story slides had no cite.
// A link's outlet is, in order:
//   1. a fixed name for a government or data site, where the address names the
//      institution and past editions named the document instead (congress.gov
//      had come out as "Congressional Research Service");
//   2. the name the Daybook's own editions have printed for that site
//      (outlets.json, built by outlets-build.mjs);
//   3. the name the sentence or the link gives it: "CNN reports that …",
//      "[Modern Law Group explains that argument](…)", "según Reuters, …";
//   4. the site's own address, "reason.com", which is at least true.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));

let TABLE = null;
const table = () => (TABLE ??= JSON.parse(readFileSync(join(here, 'outlets.json'), 'utf8')));

// Hosts where each subdomain is its own publication: an author's Substack,
// 287(g) Watch on recoveredfactory.net.
const BY_HOST = new Set(['substack.com', 'medium.com', 'blogspot.com', 'wordpress.com', 'github.io', 'recoveredfactory.net', 'uscourts.gov']);

// Checked before the table, on the host and each parent of it, closest first:
// cdn.ca9.uscourts.gov is the Ninth Circuit; any other uscourts.gov host is a federal court.
const FIXED = new Map([
  ['senate.gov', 'U.S. Senate'],
  ['house.gov', 'U.S. House'],
  ['congress.gov', 'Congress.gov'],
  ['whitehouse.gov', 'White House'],
  ['dhs.gov', 'DHS'],
  ['ice.gov', 'ICE'],
  ['cbp.gov', 'CBP'],
  ['uscis.gov', 'USCIS'],
  ['justice.gov', 'Justice Department'],
  ['state.gov', 'State Department'],
  ['dol.gov', 'Labor Department'],
  ['gao.gov', 'GAO'],
  ['federalregister.gov', 'Federal Register'],
  ['govinfo.gov', 'Federal Register'],
  ['regulations.gov', 'Regulations.gov'],
  ['supremecourt.gov', 'Supreme Court'],
  ['courtlistener.com', 'CourtListener'],
  ['uscourts.gov', 'Federal court'],
  ['ca1.uscourts.gov', 'First Circuit'],
  ['ca2.uscourts.gov', 'Second Circuit'],
  ['ca3.uscourts.gov', 'Third Circuit'],
  ['ca4.uscourts.gov', 'Fourth Circuit'],
  ['ca5.uscourts.gov', 'Fifth Circuit'],
  ['ca6.uscourts.gov', 'Sixth Circuit'],
  ['ca7.uscourts.gov', 'Seventh Circuit'],
  ['ca8.uscourts.gov', 'Eighth Circuit'],
  ['ca9.uscourts.gov', 'Ninth Circuit'],
  ['ca10.uscourts.gov', 'Tenth Circuit'],
  ['ca11.uscourts.gov', 'Eleventh Circuit'],
  ['cadc.uscourts.gov', 'D.C. Circuit'],
  ['syr.edu', 'TRAC'],
  ['deportationdata.org', 'Deportation Data Project'],
]);
const COUNTRY_SECOND = new Set(['co', 'com', 'org', 'gov', 'gob', 'ac', 'net']);

function hostAndDomain(url) {
  let host;
  try {
    host = new URL(url).hostname.toLowerCase().replace(/^www\./, '');
  } catch {
    return null;
  }
  if (host === 'news.google.com') return null;
  const parts = host.split('.');
  const country = parts.length > 2 && parts.at(-1).length === 2 && COUNTRY_SECOND.has(parts.at(-2));
  return { host, domain: parts.slice(country ? -3 : -2).join('.') };
}

/** The table's key for a link: its registrable domain, or its host on a shared platform. */
export function outletKey(url) {
  const at = hostAndDomain(url);
  if (!at) return null;
  return BY_HOST.has(at.domain) && at.host !== at.domain ? at.host : at.domain;
}

// "CNN reports that", "The Guardian reported", "según Reuters": a name of up to
// six capitalised words just before a reporting verb, or just after "según".
const SAYS = /((?:[A-Z][\w&’'.-]*(?:\s+(?:of|the|de|del|la|el|y|and|for|on))?\s+){0,5}[A-Z][\w&’'.-]*)\s+(?:reports?|reported|says|said|writes|wrote|found|finds|notes|noted|explains?|explained|argues?|argued|told|informa|informó|reporta|reportó|publicó|explica|explicó)\b/g;
const SEGUN = /\b[Ss]egún\s+((?:[A-Z][\w&’'.-]*\s+){0,5}[A-Z][\w&’'.-]*)/g;

/** The outlet named in the prose before a link, if the sentence names one. */
export function namedBefore(text) {
  const sentence = text.split(/(?<=[.!?])\s+/).at(-1) ?? text;
  const hits = [...sentence.matchAll(SAYS), ...sentence.matchAll(SEGUN)].sort((a, b) => a.index - b.index);
  const name = hits.at(-1)?.[1]?.trim();
  return name && !/^(The|A|An|It|He|She|They|We|El|La|Los|Las)$/.test(name) ? name : null;
}

/** The outlet behind a link, given the prose before it and the link's own text. */
export function outletFor(url, before = '', text = '') {
  const at = hostAndDomain(url);
  if (!at) return null;
  for (let host = at.host; host.includes('.'); host = host.slice(host.indexOf('.') + 1)) {
    if (FIXED.has(host)) return FIXED.get(host);
  }
  const key = outletKey(url);
  return table()[key] ?? namedBefore(`${before} ${text}`.trim()) ?? key;
}
