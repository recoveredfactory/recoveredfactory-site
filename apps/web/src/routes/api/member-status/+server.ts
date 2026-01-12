import { json } from '@sveltejs/kit';
import { getMemberStatusFromRequest } from '@recoveredfactory/ghost';
import { checkRateLimit } from '$lib/server/rateLimit';
import { getGhostConfig } from '$lib/server/ghostConfig';

export const GET = async (event) => {
  const clientKey = event.getClientAddress();
  if (!checkRateLimit(clientKey)) {
    return json(
      { error: 'rate_limited' },
      {
        status: 429,
        headers: {
          'retry-after': '60',
        },
      },
    );
  }

  const { memberStatusUrl } = getGhostConfig();

  try {
    const status = await getMemberStatusFromRequest(event, { memberStatusUrl });
    return json({
      loggedIn: status.loggedIn,
      paid: status.paid,
      tiers: status.tiers,
    });
  } catch {
    return json({ loggedIn: false, paid: false, tiers: [] });
  }
};
