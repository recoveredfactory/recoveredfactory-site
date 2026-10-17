import { json, redirect } from '@sveltejs/kit';
import { resolveTagId, subscribeToForm } from '$lib/kit';
import { resolveTag } from '$lib/signup-tags';

const FORM_IDS = {
  en: '9769769',
  es: '9769776',
} as const;

const resolveLang = (value: string) => (value === 'es' ? 'es' : 'en');

const getSafeRedirect = (requestUrl: string, target: string | null) => {
  const base = new URL(requestUrl);
  if (!target) return base.pathname;
  try {
    const url = new URL(target, base);
    if (url.origin !== base.origin) return base.pathname;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return base.pathname;
  }
};

/**
 * Subscribes through Kit's v3 API rather than the public web-form URL. The
 * web form is what Kit guards with a recaptcha challenge, and the challenge
 * ran in a cross-origin iframe that in-app browsers (Instagram, Facebook)
 * could not be relied on to render. The API path has no guard, so the only
 * bot check left is ours: the `website` honeypot below.
 */
export const POST = async ({ request }) => {
  const formData = await request.formData();
  const email = String(formData.get('email_address') ?? '').trim();
  const lang = resolveLang(
    String(formData.get('lang') ?? formData.get('fields[lang]') ?? 'en').toLowerCase(),
  );
  const tag = resolveTag(String(formData.get('tag') ?? ''));
  const redirectTarget = getSafeRedirect(
    request.url,
    String(formData.get('redirect') ?? request.headers.get('referer') ?? ''),
  );
  const wantsJson = request.headers.get('accept')?.includes('application/json');

  if (!email) {
    return json({ ok: false, error: 'Missing email address.' }, { status: 400 });
  }

  // Honeypot: the field is hidden from people, so anything in it came from a
  // bot. Answer as if it worked so the bot has nothing to learn from.
  if (String(formData.get('website') ?? '').trim()) {
    if (wantsJson) return json({ ok: true, tagged: true });
    throw redirect(303, new URL(redirectTarget, request.url).toString());
  }

  // The tag rides on the subscribe call itself, so there is no window where
  // the reader is on the list but not segmented. If the tag id cannot be
  // resolved, the signup still goes through untagged and says so — signing up
  // again would not fix a Kit outage on the tag lookup.
  let tagId: string | null = null;
  let tagged = true;
  if (tag) {
    tagId = await resolveTagId(tag).catch((err: Error) => {
      console.error('[signup] Failed to resolve Kit tag', { tag, error: err?.message });
      return null;
    });
    tagged = Boolean(tagId);
  }

  try {
    await subscribeToForm({
      formId: FORM_IDS[lang],
      email,
      fields: { lang },
      tagIds: tagId ? [tagId] : [],
    });
  } catch (err) {
    console.error('[signup] Kit form subscribe failed', {
      lang,
      error: (err as Error)?.message,
    });
    return json({ ok: false, error: 'Sign up failed.' }, { status: 502 });
  }

  if (wantsJson) {
    return json({ ok: true, tagged });
  }

  const url = new URL(redirectTarget, request.url);
  url.searchParams.set('signed_up', '1');
  throw redirect(303, url.toString());
};
