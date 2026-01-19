import { json, redirect } from '@sveltejs/kit';

const FORM_IDS = {
  en: '8972189',
  es: '8981790',
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

export const POST = async ({ request }) => {
  const formData = await request.formData();
  const email = String(formData.get('email_address') ?? '').trim();
  const lang = resolveLang(
    String(formData.get('lang') ?? formData.get('fields[lang]') ?? 'en').toLowerCase(),
  );
  const redirectTarget = getSafeRedirect(
    request.url,
    String(formData.get('redirect') ?? request.headers.get('referer') ?? ''),
  );

  if (!email) {
    return json({ ok: false, error: 'Missing email address.' }, { status: 400 });
  }

  const body = new URLSearchParams();
  body.set('email_address', email);
  body.set('fields[lang]', lang);

  const response = await fetch(
    `https://app.kit.com/forms/${FORM_IDS[lang]}/subscriptions`,
    {
      method: 'POST',
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    },
  );

  const responseText = await response.text();
  const ok = response.ok || (response.status >= 300 && response.status < 400);
  const guard =
    responseText.includes('ck-recaptcha-challenge') ||
    responseText.includes('guards-show') ||
    responseText.includes('Please complete this security check');
  const success =
    responseText.includes('subscriptions-success') ||
    responseText.includes('ckjs:guard:confirmed') ||
    responseText.includes('Success! Now check your email');
  const guardActionMatch = guard
    ? responseText.match(/action="([^"]*\/forms\/guards\/[^"]+)"/)
    : null;
  const guardUrl = guardActionMatch
    ? new URL(guardActionMatch[1], 'https://app.kit.com').href
    : '';

  if (!ok || guard || !success) {
    return json(
      {
        ok: false,
        guard,
        error: guard ? 'Security check required.' : 'Sign up failed.',
        status: response.status,
        body: responseText,
        guardUrl,
      },
      { status: guard ? 409 : 502 },
    );
  }

  const wantsJson = request.headers.get('accept')?.includes('application/json');
  if (wantsJson) {
    return json({ ok: true, status: response.status, body: responseText });
  }

  const url = new URL(redirectTarget, request.url);
  url.searchParams.set('signed_up', '1');
  throw redirect(303, url.toString());
};
