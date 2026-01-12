import { env } from '$env/dynamic/private';

export type GhostRuntimeConfig = {
  contentApiUrl: string;
  contentApiKey: string;
  memberStatusUrl: string;
};

export type PortalUrls = {
  signInUrl: string;
  upgradeUrl: string;
};

export function getGhostConfig(): GhostRuntimeConfig {
  const contentApiUrl = env.GHOST_CONTENT_API_URL ?? '';
  const contentApiKey = env.GHOST_CONTENT_API_KEY ?? '';
  const memberStatusUrl =
    env.GHOST_MEMBER_STATUS_URL ?? env.GHOST_CONTENT_API_URL ?? '';

  if (!contentApiUrl || !contentApiKey || !memberStatusUrl) {
    throw new Error('Missing Ghost configuration env vars.');
  }

  return {
    contentApiUrl,
    contentApiKey,
    memberStatusUrl,
  };
}

export function getPortalUrls(): PortalUrls {
  return {
    signInUrl:
      env.GHOST_PORTAL_SIGNIN_URL ??
      'https://members.recoveredfactory.net/#/portal/signin',
    upgradeUrl:
      env.GHOST_PORTAL_UPGRADE_URL ??
      'https://members.recoveredfactory.net/#/portal/signup',
  };
}
