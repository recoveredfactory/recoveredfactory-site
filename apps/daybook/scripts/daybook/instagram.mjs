// Instagram's carousel cut, shared by the posting step (deck-post.mjs) and the
// preview that says what the cut will leave off (deck-sync.mjs).

// Instagram's carousel ceiling: "Carousels are limited to 10 images, videos,
// or a mix of the two" (developers.facebook.com/docs/instagram-platform/
// content-publishing, read 2026-10-15). Facebook's multi-photo post has no such
// cut at this deck's length.
export const INSTAGRAM_MAX_ITEMS = 10;

/**
 * The deck cut to Instagram's ceiling. Stories come off the end first, as
 * record-deck.mjs cuts at 20, so the calendar survives; then the subscribe
 * plate; only then, and loudly, the end of the calendar.
 */
export function fitInstagram(slides, max = INSTAGRAM_MAX_ITEMS) {
  const kept = [...slides];
  const dropped = [];
  const removeLast = (test) => {
    for (let i = kept.length - 1; i > 0; i -= 1) {
      if (test(kept[i])) return dropped.push(...kept.splice(i, 1));
    }
    return 0;
  };
  while (kept.length > max && removeLast((s) => s.name === 'story'));
  while (kept.length > max && removeLast((s) => s.name === 'subscribe'));
  while (kept.length > max) dropped.push(kept.pop());
  return { slides: kept, dropped };
}
