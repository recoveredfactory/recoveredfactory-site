import { json } from '@sveltejs/kit';
import { findSubscriberByEmail, tagSubscriberByName } from '$lib/kit';
import { resolveTag } from '$lib/signup-tags';

/**
 * Kit challenges some signups with a recaptcha guard. When it does, /api/signup
 * has already returned 409 — the reader completes the challenge inside Kit's
 * own iframe, so nothing on our side ever learns the outcome and the newsletter
 * tag never gets applied. Untagged subscribers are the failure that matters:
 * with two language forms feeding one account, a subscriber with no tag is
 * ambiguous, and an ambiguous subscriber is worse than a missing one.
 *
 * The form calls back here when the guard reports confirmed. This route decides
 * whether it actually was — Kit not knowing the address means the challenge did
 * not pass, and saying so is what stops the form from claiming a signup that
 * never happened.
 */
export const POST = async ({ request }) => {
  const formData = await request.formData();
  const email = String(formData.get('email_address') ?? '').trim();
  const tag = resolveTag(String(formData.get('tag') ?? ''));
  // Kit's own `ckjs:guard:confirmed` message is an explicit statement that the
  // challenge passed. The form's other trigger — the guard iframe loading a
  // second time — only means the reader submitted something. The first is
  // trusted when our own lookup comes up empty; the second never is.
  const trusted = String(formData.get('trusted') ?? '') === '1';

  if (!email) {
    return json({ ok: false, error: 'Missing email address.' }, { status: 400 });
  }

  let lookup;
  try {
    lookup = await findSubscriberByEmail(email);
  } catch (err) {
    console.error('[signup/confirm] Kit lookup failed', {
      error: (err as Error)?.message,
    });
    // A lookup outage is not evidence either way, so let the form ask again
    // rather than resolving it as success or failure.
    return json({ ok: false, subscribed: false, retryable: true }, { status: 502 });
  }

  // Kit had not registered the address. Usually the challenge is still in
  // flight, so this is retryable rather than final.
  if (lookup.checked && !lookup.subscriber) {
    // On the untrusted trigger, unverified means unsubscribed: better to tell
    // the reader it failed than to congratulate someone who never got on.
    if (!trusted) {
      return json({ ok: false, subscribed: false, retryable: true }, { status: 200 });
    }
    // On the trusted trigger the form has already exhausted its retries, and
    // Kit said the challenge passed. Lookup lag is likelier than a lie, and an
    // untagged subscriber is the outcome worth spending a wrong tag to avoid —
    // a stray tag is one deletion, an untagged one is unattributable between
    // two language forms.
    console.warn('[signup/confirm] Guard confirmed but subscriber not found; tagging anyway', {
      tag,
    });
  }

  // Tagging is what this call exists for, but the subscription itself has
  // already landed at this point. A tagging failure is reported, not thrown —
  // signing up again would not fix it.
  let tagged = true;
  if (tag) {
    try {
      await tagSubscriberByName({ email, tag });
    } catch (err) {
      tagged = false;
      console.error('[signup/confirm] Failed to apply Kit tag', {
        tag,
        error: (err as Error)?.message,
      });
    }
  }

  // `verified: false` means the tag was applied on the guard's word alone —
  // either no account secret is configured, or Kit did not yet list the
  // address. Worth watching in logs; not worth failing the signup over.
  return json({
    ok: true,
    tagged,
    verified: lookup.checked && Boolean(lookup.subscriber),
  });
};
