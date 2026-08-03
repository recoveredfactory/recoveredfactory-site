// Anyone can POST to the signup routes, so tags are allow-listed rather than
// pattern-matched — otherwise a forged request could fill the Kit account with
// junk tags. Shared by /api/signup and /api/signup/confirm so the two cannot
// drift apart.
export const ALLOWED_TAGS = new Set(['newsletter:immigration-daybook']);

export const resolveTag = (value: string) => {
  const tag = value.trim().toLowerCase();
  return ALLOWED_TAGS.has(tag) ? tag : '';
};
