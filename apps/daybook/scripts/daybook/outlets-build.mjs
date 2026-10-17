#!/usr/bin/env node
// Builds outlets.json: the name each site goes by, as the Daybook's own
// editions have printed it in their credits ("[Reuters](https://www.reuters.com/…)").
//
//   node scripts/daybook/outlets-build.mjs
//
// The carousel's cite needs a publication's name for every link a story's lead
// paragraph carries. Editions written in the house style name it in the link
// text; editions that link a phrase instead ("CNN reports that [the lawsuit
// remains unresolved](https://cnn.com/…)") leave only the address. This table
// turns the address back into the name the Daybook has used for it. A name
// counts when it's link text that reads like a name (short, capitalised, no
// closing punctuation), at least twice, and for at least 40% of that site's links
// (apnews.com: "Associated Press" 20 times, "AP News" and "AP" 10 each).
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { outletKey } from './outlets.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const content = join(here, '../../src/content/daybook');

const counts = new Map();
for (const lang of ['en', 'es']) {
  for (const file of readdirSync(join(content, lang)).filter((f) => f.endsWith('.md'))) {
    const text = readFileSync(join(content, lang, file), 'utf8');
    for (const [, name, url] of text.matchAll(/\[([^\]]{2,60})\]\((https?:\/\/[^)\s]+)\)/g)) {
      const n = name.trim();
      if (n.length > 40 || !/^[A-Z0-9¿¡]/.test(n) || n.split(/\s+/).length > 6 || /[.;:,]$/.test(n)) continue;
      const key = outletKey(url);
      if (!key) continue;
      if (!counts.has(key)) counts.set(key, new Map());
      counts.get(key).set(n, (counts.get(key).get(n) ?? 0) + 1);
    }
  }
}

const table = {};
for (const [key, names] of [...counts].sort(([a], [b]) => a.localeCompare(b))) {
  const total = [...names.values()].reduce((a, b) => a + b, 0);
  const [name, n] = [...names].sort((a, b) => b[1] - a[1])[0];
  if (n >= 2 && n / total >= 0.4) table[key] = name;
}

writeFileSync(join(here, 'outlets.json'), `${JSON.stringify(table, null, 1)}\n`);
console.log(`outlets.json: ${Object.keys(table).length} sites.`);
