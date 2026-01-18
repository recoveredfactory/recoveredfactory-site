import crypto from 'node:crypto';
import { json } from '@sveltejs/kit';
import { tagSubscriber, upsertSubscriber } from '$lib/kit';

const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET ?? '';
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY ?? '';

const STRIPE_PRICE_LEVEL_1 = process.env.STRIPE_PRICE_LEVEL_1 ?? '';
const STRIPE_PRICE_LEVEL_2 = process.env.STRIPE_PRICE_LEVEL_2 ?? '';
const STRIPE_PRICE_ONCE = process.env.STRIPE_PRICE_ONCE ?? '';

const KIT_TAG_LEVEL_1 = process.env.KIT_TAG_SUPPORT_LEVEL_1 ?? '';
const KIT_TAG_LEVEL_2 = process.env.KIT_TAG_SUPPORT_LEVEL_2 ?? '';
const KIT_TAG_ONCE = process.env.KIT_TAG_SUPPORTED_ONCE ?? '';

const KIT_FIELD_SUPPORT_TIER = process.env.KIT_FIELD_SUPPORT_TIER ?? 'support_tier';
const KIT_FIELD_SUPPORT_SOURCE = process.env.KIT_FIELD_SUPPORT_SOURCE ?? 'support_source';
const KIT_FIELD_SUPPORT_STARTED = process.env.KIT_FIELD_SUPPORT_STARTED_AT ?? 'support_started_at';

const SUPPORT_TIER_LEVEL_1 = 'v1-level_1';
const SUPPORT_TIER_LEVEL_2 = 'v1-level_2';

const safeEqual = (a: string, b: string) => {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
};

const verifyStripeSignature = (payload: string, signature: string) => {
  if (!STRIPE_WEBHOOK_SECRET) return false;
  const parts = signature.split(',');
  const timestamp = parts.find((part) => part.startsWith('t='))?.slice(2);
  const signatures = parts
    .filter((part) => part.startsWith('v1='))
    .map((part) => part.slice(3));
  if (!timestamp || signatures.length === 0) return false;
  const signedPayload = `${timestamp}.${payload}`;
  const expected = crypto
    .createHmac('sha256', STRIPE_WEBHOOK_SECRET)
    .update(signedPayload)
    .digest('hex');
  return signatures.some((sig) => safeEqual(sig, expected));
};

const getLineItemPriceIds = async (sessionId: string) => {
  if (!STRIPE_SECRET_KEY) return [];
  const response = await fetch(
    `https://api.stripe.com/v1/checkout/sessions/${sessionId}/line_items`,
    {
      headers: {
        Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
      },
    },
  );
  if (!response.ok) return [];
  const payload = await response.json();
  if (!Array.isArray(payload?.data)) return [];
  return payload.data
    .map((item: any) => item?.price?.id)
    .filter((value: string | undefined) => !!value);
};

const resolveTier = (session: any, priceIds: string[]) => {
  const metaTier = session?.metadata?.support_tier;
  if (typeof metaTier === 'string' && metaTier) return metaTier;

  if (priceIds.includes(STRIPE_PRICE_LEVEL_1)) return SUPPORT_TIER_LEVEL_1;
  if (priceIds.includes(STRIPE_PRICE_LEVEL_2)) return SUPPORT_TIER_LEVEL_2;
  if (priceIds.includes(STRIPE_PRICE_ONCE)) return 'once';

  if (session?.mode === 'payment') return 'once';
  return '';
};

const applySupport = async (email: string, tier: string, source = 'stripe') => {
  const now = new Date().toISOString();
  if (tier === 'once') {
    if (KIT_TAG_ONCE) {
      await tagSubscriber({ email, tagId: KIT_TAG_ONCE });
    }
    return;
  }

  if (tier) {
    await upsertSubscriber({
      email,
      fields: {
        [KIT_FIELD_SUPPORT_TIER]: tier,
        [KIT_FIELD_SUPPORT_SOURCE]: source,
        [KIT_FIELD_SUPPORT_STARTED]: now,
      },
    });
  }

  if (tier === SUPPORT_TIER_LEVEL_1 && KIT_TAG_LEVEL_1) {
    await tagSubscriber({ email, tagId: KIT_TAG_LEVEL_1 });
  }
  if (tier === SUPPORT_TIER_LEVEL_2 && KIT_TAG_LEVEL_2) {
    await tagSubscriber({ email, tagId: KIT_TAG_LEVEL_2 });
  }
};

export const POST = async ({ request }) => {
  if (!STRIPE_WEBHOOK_SECRET) {
    return json({ ok: false, error: 'Missing STRIPE_WEBHOOK_SECRET.' }, { status: 500 });
  }

  const signature = request.headers.get('stripe-signature') ?? '';
  const payload = await request.text();

  if (!verifyStripeSignature(payload, signature)) {
    return json({ ok: false, error: 'Invalid signature.' }, { status: 400 });
  }

  const event = JSON.parse(payload);

  if (event?.type === 'checkout.session.completed') {
    const session = event.data?.object ?? {};
    const email =
      session?.customer_details?.email ||
      session?.customer_email ||
      session?.customer_details?.email_address;
    if (!email) {
      return json({ ok: false, error: 'Missing customer email.' }, { status: 200 });
    }

    const priceIds = session?.id ? await getLineItemPriceIds(session.id) : [];
    const tier = resolveTier(session, priceIds);
    await applySupport(email, tier, 'stripe');
  }

  return json({ ok: true });
};
