// The deck's one picked image, from a record's `social.pick` (David,
// 2026-10-17: "I do want to be able to supply an image from the jump").
//
// At most one per edition, and only when David supplies it: a crop of a source
// document that shows the change itself (the Federal Register's "from thirty to
// ten days"), or an image he already has. It sits on the cover by default, or
// on the story whose headline it names, between the headline and the line.
//
// The record carries an instruction, never pixels:
//
//   "social": { "pick": {
//     "story":   "cover",                         // or words from a story's headline
//     "pdf":     "https://www.govinfo.gov/…/2026-20956.pdf",
//     "page":    3,                               // optional: where to look
//     "quote":   "The response period to a Notice of Intent to Terminate (NOIT) is reduced from thirty to ten days.",
//     "mark":    "from thirty to ten days",       // optional; a list marks several
//     "caption": "Interim final rule, Federal Register, Oct. 14, 2026"
//   } }
//
// or, for an image made elsewhere: { "story", "image": "https://….png", "caption" }.
//
// pdfcrop.py finds the quote word for word and crops to its lines plus one
// faded line either side, with the mark highlighted. Whatever fails (a bad
// link, a quote it can't find, a slow server), the slide goes out as text: the
// deck never waits on a picture.
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));

const FETCH_TIMEOUT_MS = 30_000;
const MAX_PDF_BYTES = 40 * 1024 * 1024;
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const IMAGE_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif']);

const isHttpUrl = (u) => typeof u === 'string' && /^https?:\/\/\S+$/.test(u);

/** Why a pick can't be used, if it can't. Checks shape only. */
export function pickError(pick) {
  if (!pick || typeof pick !== 'object' || Array.isArray(pick)) return 'social.pick must be an object';
  if (pick.story !== undefined && (typeof pick.story !== 'string' || !pick.story.trim())) {
    return 'social.pick.story names "cover" or words from a story headline';
  }
  if (pick.caption !== undefined && typeof pick.caption !== 'string') return 'social.pick.caption must be text';
  const hasPdf = pick.pdf !== undefined;
  const hasImage = pick.image !== undefined;
  if (hasPdf === hasImage) return 'social.pick takes a pdf (with a quote) or an image, not both';
  if (hasImage) return isHttpUrl(pick.image) ? undefined : 'social.pick.image must be an http(s) link';
  if (!isHttpUrl(pick.pdf)) return 'social.pick.pdf must be an http(s) link';
  if (typeof pick.quote !== 'string' || !pick.quote.trim()) return 'social.pick.quote is the sentence to show, word for word';
  const marks = marksOf(pick);
  if (marks.some((m) => typeof m !== 'string' || !m.trim())) return 'social.pick.mark takes the words to highlight';
  if (pick.page !== undefined && !(Number.isInteger(pick.page) && pick.page > 0)) return 'social.pick.page must be a page number';
  return undefined;
}

const marksOf = (pick) => (pick.mark === undefined ? [] : [pick.mark].flat());

/**
 * Put a loaded pick on the deck: the cover, or the story whose headline holds
 * `story`. A pick naming a story that isn't on the deck is dropped with a
 * warning, and the deck goes out as text.
 */
export function placePick(deck, shown, story, lang) {
  const want = String(story ?? 'cover').trim().toLowerCase();
  if (want === 'cover') {
    deck.pick = shown;
    return true;
  }
  const beat = deck.beats?.find((b) => b.headline.toLowerCase().includes(want));
  if (beat) {
    beat.pick = shown;
    return true;
  }
  console.warn(`WARNING: ${deck.date} ${lang}: the pick names "${story}", which is not on the deck. Text only.`);
  return false;
}

async function fetchBytes(url, max) {
  const res = await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS), redirect: 'follow' });
  if (!res.ok) throw new Error(`${url} answered ${res.status}`);
  const bytes = Buffer.from(await res.arrayBuffer());
  if (bytes.length > max) throw new Error(`${url} is ${Math.round(bytes.length / 1048576)} MB, over the limit`);
  return { bytes, type: (res.headers.get('content-type') ?? '').split(';')[0].trim().toLowerCase() };
}

/**
 * The pick as the renderer takes it, {src, marks, dims}, or null when it can't
 * be made (with a warning saying why). `work` is a scratch directory. The
 * caption is the caller's: each language's record carries its own.
 */
export async function loadPick(pick, { work, label = '' }) {
  const why = pickError(pick);
  if (why) {
    console.warn(`WARNING: ${label}${why}. Text only.`);
    return null;
  }
  try {
    if (pick.image) {
      const { bytes, type } = await fetchBytes(pick.image, MAX_IMAGE_BYTES);
      if (!IMAGE_TYPES.has(type)) throw new Error(`${pick.image} is ${type || 'of no stated type'}, not an image`);
      return { src: `data:${type};base64,${bytes.toString('base64')}`, marks: [], dims: [] };
    }

    const { bytes } = await fetchBytes(pick.pdf, MAX_PDF_BYTES);
    if (bytes.subarray(0, 5).toString('latin1') !== '%PDF-') throw new Error(`${pick.pdf} is not a PDF`);
    const pdf = join(work, 'pick.pdf');
    const png = join(work, 'pick.png');
    writeFileSync(pdf, bytes);
    const args = [join(here, 'pdfcrop.py'), pdf, png, '--find', pick.quote, '--context', '1'];
    for (const mark of marksOf(pick)) args.push('--mark', mark);
    if (pick.page) args.push('--page', String(pick.page));
    const run = spawnSync('python3', args, { encoding: 'utf8', timeout: 120_000 });
    if (run.status !== 0) throw new Error((run.stderr || run.error?.message || 'pdfcrop failed').trim().split('\n').at(-1));
    const crop = JSON.parse(run.stdout);
    return {
      src: `data:image/png;base64,${readFileSync(png).toString('base64')}`,
      marks: crop.marks ?? [],
      dims: crop.dims ?? [],
    };
  } catch (err) {
    console.warn(`WARNING: ${label}the picked image could not be made (${err.message}). Text only.`);
    return null;
  }
}
