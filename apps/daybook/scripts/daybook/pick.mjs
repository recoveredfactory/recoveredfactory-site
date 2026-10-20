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
// Since 2026-10-19 any slide can carry one, as `image` on its entry in
// social.slides (deck.mjs applySocialCopy), and social.pick is the older way to
// put one on a story's first slide. A slide's `image` takes the same two forms,
// with `url` for the link: { "url": "https://…", "caption" } or { "pdf", "quote",
// "mark", "page", "caption" }. A third form, { "data": "<base64>", "type":
// "image/png", "caption" }, is how the desk sends pixels it has rather than a
// link to them: news-ingester's publish_edition stores the bytes in the editions
// bucket and leaves the record a `url` to them, so the deck reads them from the
// bucket like the records. Bytes that reach this file anyway are drawn as sent.
//
// pdfcrop.py finds the quote word for word and crops to its lines plus one
// faded line either side, with the mark highlighted. Whatever fails (a bad
// link, a quote it can't find, a slow server), the slide goes out as text: the
// deck never waits on a picture.
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { copyTarget } from './deck.mjs';

const here = dirname(fileURLToPath(import.meta.url));

const FETCH_TIMEOUT_MS = 30_000;
const MAX_PDF_BYTES = 40 * 1024 * 1024;
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const IMAGE_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif']);

const isHttpUrl = (u) => typeof u === 'string' && /^https?:\/\/\S+$/.test(u);

// What the bytes say they are, whatever the record says: PNG, JPEG, WebP, GIF.
export function sniffImage(bytes) {
  if (bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png';
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg';
  if (bytes.length >= 12 && bytes.subarray(0, 4).toString('latin1') === 'RIFF' && bytes.subarray(8, 12).toString('latin1') === 'WEBP') return 'image/webp';
  if (bytes.length >= 6 && /^GIF8[79]a$/.test(bytes.subarray(0, 6).toString('latin1'))) return 'image/gif';
  return null;
}

/**
 * A slide entry's `image` as a pick: a bare link, `{url}` for `{image}`, or as
 * given. `story` comes from the entry it sits on, so it's not the image's to name.
 */
export function asPick(image) {
  if (typeof image === 'string') return { image };
  if (!image || typeof image !== 'object' || Array.isArray(image)) return image;
  const { url, story: _story, ...rest } = image;
  return url !== undefined && rest.image === undefined ? { ...rest, image: url } : rest;
}

// Where a photo's crop is centred: a side, or "x% y%" as CSS takes it.
const FOCUS = { center: 'center', top: 'center top', bottom: 'center bottom', left: 'left center', right: 'right center' };

/**
 * How a loaded image sits on its slide (og.mjs pickFigure). A photo, `{photo:
 * true, focus}`, is cropped to the room the slide's words leave it, around
 * `focus` (David, 2026-10-20: "crop the image shorter and make the body text
 * bigger"). An image whose spec says `"fit": "whole"`, `{photo: true, whole:
 * true}`, gets the same room but is never cropped: it is scaled down inside it,
 * with the frame's white around it. That's for one the desk has already
 * cropped, or a chart, a map or a screenshot of words, where a crop would cut
 * what it shows. A document crop keeps the old layout, because its marks are
 * placed on the whole crop.
 */
export function placement(image, shown) {
  if (image?.pdf || shown?.marks?.length || shown?.dims?.length) return {};
  if (image?.fit === 'whole') return { photo: true, whole: true };
  const want = typeof image?.focus === 'string' ? image.focus.trim().toLowerCase() : 'center';
  const focus = FOCUS[want] ?? (/^\d{1,3}% \d{1,3}%$/.test(want) ? want : 'center');
  return { photo: true, focus };
}

/** Why a pick can't be used, if it can't. Checks shape only. */
export function pickError(pick, at = 'social.pick') {
  if (!pick || typeof pick !== 'object' || Array.isArray(pick)) return `${at} must be an object`;
  if (pick.story !== undefined && (typeof pick.story !== 'string' || !pick.story.trim())) {
    return `${at}.story names "cover" or words from a story headline`;
  }
  if (pick.caption !== undefined && typeof pick.caption !== 'string') return `${at}.caption must be text`;
  const forms = ['pdf', 'image', 'data'].filter((k) => pick[k] !== undefined);
  if (forms.length !== 1) return `${at} takes one of a pdf (with a quote), an image link or image data`;
  if (pick.data !== undefined) {
    return typeof pick.data === 'string' && pick.data.trim() ? undefined : `${at}.data is the image's bytes, base64`;
  }
  if (pick.image !== undefined) return isHttpUrl(pick.image) ? undefined : `${at}: the image's link must be http(s)`;
  if (!isHttpUrl(pick.pdf)) return `${at}.pdf must be an http(s) link`;
  if (typeof pick.quote !== 'string' || !pick.quote.trim()) return `${at}.quote is the sentence to show, word for word`;
  const marks = marksOf(pick);
  if (marks.some((m) => typeof m !== 'string' || !m.trim())) return `${at}.mark takes the words to highlight`;
  if (pick.page !== undefined && !(Number.isInteger(pick.page) && pick.page > 0)) return `${at}.page must be a page number`;
  return undefined;
}

const marksOf = (pick) => (pick.mark === undefined ? [] : [pick.mark].flat());

/**
 * Put a loaded pick on the deck: the cover, or the story whose headline holds
 * `story`. A pick naming a story that isn't on the deck is dropped with a
 * warning, and the deck goes out as text.
 */
export function placePick(deck, shown, story, lang) {
  const target = copyTarget(deck, story);
  if (target) {
    target.pick = shown;
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
export async function loadPick(pick, { work, label = '', at } = {}) {
  const why = pickError(pick, at);
  if (why) {
    console.warn(`WARNING: ${label}${why}. Text only.`);
    return null;
  }
  try {
    if (pick.data) {
      const bytes = Buffer.from(pick.data, 'base64');
      if (bytes.length > MAX_IMAGE_BYTES) throw new Error(`the image data is ${Math.round(bytes.length / 1048576)} MB, over the limit`);
      const type = sniffImage(bytes);
      if (!type) throw new Error('the image data is not a PNG, JPEG, WebP or GIF');
      return { src: `data:${type};base64,${bytes.toString('base64')}`, marks: [], dims: [] };
    }
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

/**
 * Spanish slide entries with the English images filled in where they have
 * none: entry by entry, since the Spanish carries the same slides in the same
 * order. The image's caption becomes its `caption_es` when it has one.
 */
export function withEnglishImages(slides, englishSlides, { date = '', lang = 'es' } = {}) {
  if (!Array.isArray(slides) || !Array.isArray(englishSlides)) return slides;
  if (slides.length !== englishSlides.length) {
    if (englishSlides.some((slide) => slide?.image) && slides.every((slide) => !slide?.image)) {
      console.warn(
        `WARNING: ${date} ${lang}: social.slides has ${slides.length} entries where the English has ${englishSlides.length}, ` +
          `so the English images can't be matched to them. Text only.`,
      );
    }
    return slides;
  }
  return slides.map((slide, i) => {
    const image = englishSlides[i]?.image;
    if (!slide || typeof slide !== 'object' || slide.image || !image) return slide;
    const shared = asPick(image);
    const caption = typeof image === 'object' ? image[`caption_${lang}`] ?? image.caption : undefined;
    return { ...slide, image: { ...shared, ...(caption !== undefined ? { caption } : {}) } };
  });
}
