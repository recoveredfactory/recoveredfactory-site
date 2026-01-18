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

  const ok = response.ok || (response.status >= 300 && response.status < 400);
  if (!ok) {
    return json({ ok: false, error: 'Sign up failed.' }, { status: 502 });
  }

  const wantsJson = request.headers.get('accept')?.includes('application/json');
  if (wantsJson) {
    return json({ ok: true });
  }

  const url = new URL(redirectTarget, request.url);
  url.searchParams.set('signed_up', '1');
  throw redirect(303, url.toString());
};
