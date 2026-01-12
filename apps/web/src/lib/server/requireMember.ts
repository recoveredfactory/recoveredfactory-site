import { redirect, type RequestEvent } from '@sveltejs/kit';
import {
  getMemberStatusFromRequest,
  type MemberStatus,
} from '@recoveredfactory/ghost';
import { getGhostConfig, getPortalUrls } from '$lib/server/ghostConfig';

export type RequireMemberOptions = {
  paid?: boolean;
  tier?: string;
};

export async function requireMember(
  event: RequestEvent,
  options: RequireMemberOptions = {},
): Promise<MemberStatus> {
  const portalUrls = getPortalUrls();
  const { memberStatusUrl } = getGhostConfig();

  let status: MemberStatus;
  try {
    status = await getMemberStatusFromRequest(event, { memberStatusUrl });
  } catch {
    // Treat Ghost outages as logged-out for safety.
    status = { loggedIn: false, paid: false, tiers: [] };
  }

  if (!status.loggedIn) {
    throw redirect(302, portalUrls.signInUrl);
  }

  if (options.paid && !status.paid) {
    throw redirect(302, portalUrls.upgradeUrl);
  }

  if (options.tier && !status.tiers.includes(options.tier)) {
    throw redirect(302, portalUrls.upgradeUrl);
  }

  return status;
}
