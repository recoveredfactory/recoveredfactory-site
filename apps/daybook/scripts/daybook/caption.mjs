// The post's caption, shared by the posting step (deck-post.mjs) and the
// preview that shows it before broadcast (deck-sync.mjs).
//
// The words are the composer's, per language (David, 2026-11-04: "snappier,
// less like a hed/dek combo", and "the machine should pick some decent
// hashtags for each language"): record.social.caption and
// record.social.hashtags. A record without a caption posts its title alone.
// Instagram gets no link, since it never makes one clickable in a caption;
// Facebook does, so its caption still says where to read the edition.

import { trimToClause } from './deck.mjs';

// Instagram's caption limit; Facebook's is far higher.
export const CAPTION_MAX = 2200;

// Instagram's hashtag limit: five a post since December 2025. Tags written
// into the caption's words count against it too.
export const HASHTAG_MAX = 5;

const SITE = 'immigrationdaybook.com';

const READ_LINE = {
  en: (link) => `Today’s Immigration Daybook, free every weekday morning: ${link}`,
  es: (link) => `El Immigration Daybook de hoy, gratis cada mañana entre semana: ${link}`,
};

// The first line of a --test-post caption, so nobody who sees it before it is
// deleted takes it for an edition.
const TEST_LINE = {
  en: 'Test post: this will be deleted shortly.',
  es: 'Publicación de prueba: se borrará en breve.',
};

const INLINE_TAG = /(?:^|\s)#[\p{L}\p{M}\p{N}_]+/gu;

const composedCaption = (record) => (typeof record.social?.caption === 'string' ? record.social.caption.trim() : '');

/**
 * The record's hashtags, cleaned: one leading #, letters, digits and
 * underscores only (a space or a hyphen would end the tag where Instagram
 * reads it), no tag of digits alone (Instagram doesn't link one), no
 * repeats. Past what HASHTAG_MAX leaves after the caption's own tags, the
 * rest are `dropped`. A string of tags is taken as well as a list.
 */
export function hashtagsFor(record) {
  const given = record.social?.hashtags;
  const raw = typeof given === 'string' ? given.split(/[\s,]+/) : Array.isArray(given) ? given : [];
  const room = Math.max(0, HASHTAG_MAX - (composedCaption(record).match(INLINE_TAG) ?? []).length);
  const tags = [];
  const dropped = [];
  const seen = new Set();
  for (const value of raw) {
    const word = String(value ?? '').normalize('NFC').trim().replace(/^#+/, '').replace(/[^\p{L}\p{M}\p{N}_]/gu, '');
    if (!word) continue;
    const key = word.toLocaleLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    if (/^\d+$/.test(word) || tags.length >= room) dropped.push(`#${word}`);
    else tags.push(`#${word}`);
  }
  return { tags, dropped };
}

/**
 * The post's caption: the composed words (else the edition's title), on
 * Facebook the line that says where to read the edition, then the hashtags.
 * Under CAPTION_MAX the words give way, cut at a sentence or clause; the link
 * line and the tags are never cut.
 *
 * A test post opens on a line saying so, and links to the site's home page:
 * a test edition does not exist on the live site, so its date path would 404.
 */
export function buildCaption(record, { test = false, platform = 'instagram', max = CAPTION_MAX } = {}) {
  const lang = record.lang === 'es' ? 'es' : 'en';
  const head = test ? TEST_LINE[lang] : '';
  const read = platform === 'facebook' ? READ_LINE[lang](test ? SITE : `${SITE}/${lang}/${record.date}`) : '';
  const { tags } = hashtagsFor(record);
  const tail = [read, tags.join(' ')].filter(Boolean).join('\n\n');

  // head + "\n" + words + "\n\n" + tail
  const room = max - (head ? head.length + 1 : 0) - (tail ? tail.length + 2 : 0);
  const words = trimToClause(composedCaption(record) || record.title.trim(), room);

  return [[head, words].filter(Boolean).join('\n'), tail].filter(Boolean).join('\n\n');
}

/** What the preview should flag about the caption before broadcast. */
export function captionNotes(record) {
  const notes = [];
  if (!composedCaption(record)) notes.push('No caption composed (`social.caption`): the posts carry the edition’s title instead.');
  const { tags, dropped } = hashtagsFor(record);
  if (!tags.length && !dropped.length) notes.push('No hashtags composed (`social.hashtags`).');
  if (dropped.length) notes.push(`Hashtags left off (Instagram takes ${HASHTAG_MAX}, the caption’s own included; none of digits alone): ${dropped.join(' ')}.`);
  return notes;
}
