import type { RequestEvent } from "@sveltejs/kit";
import { createHash } from "node:crypto";
import { LruCache } from "./cache";

export type GhostMemberConfig = {
  memberStatusUrl: string;
};

export type MemberStatus = {
  loggedIn: boolean;
  paid: boolean;
  tiers: string[];
  id?: string;
  email?: string;
};

export type MemberStatusOptions = {
  cacheTtlSeconds?: number;
  fetchFn?: typeof fetch;
};

const MEMBER_STATUS_PATH = "/members/api/member/";
const DEFAULT_CACHE_TTL_SECONDS = 120;

// In-memory cache only lives per Lambda/container; cold starts reset it.
const memberStatusCache = new LruCache<string, MemberStatus>({ max: 500 });

export function resolveMemberConfig(
  overrides: Partial<GhostMemberConfig> = {},
): GhostMemberConfig {
  const memberStatusUrl =
    overrides.memberStatusUrl ??
    process.env.GHOST_MEMBER_STATUS_URL ??
    process.env.GHOST_CONTENT_API_URL ??
    "";

  if (!memberStatusUrl) {
    throw new Error("Missing Ghost member status configuration.");
  }

  return {
    memberStatusUrl,
  };
}

export async function getMemberStatusFromRequest(
  event: RequestEvent,
  configOverrides: Partial<GhostMemberConfig> = {},
  options: MemberStatusOptions = {},
): Promise<MemberStatus> {
  const cookieHeader = event.request.headers.get("cookie");
  if (!cookieHeader) {
    return {
      loggedIn: false,
      paid: false,
      tiers: [],
    };
  }

  const cacheKey = createHash("sha256").update(cookieHeader).digest("hex");
  const cached = memberStatusCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const config = resolveMemberConfig(configOverrides);
  const envTtl = Number(process.env.GHOST_MEMBER_CACHE_TTL_SECONDS);
  const cacheTtlSeconds =
    options.cacheTtlSeconds ??
    (Number.isFinite(envTtl) ? envTtl : DEFAULT_CACHE_TTL_SECONDS);

  const status = await fetchMemberStatus(
    config.memberStatusUrl,
    cookieHeader,
    options.fetchFn ?? fetch,
  );

  // Cache only the derived status, not raw cookies.
  memberStatusCache.set(cacheKey, status, cacheTtlSeconds * 1000);
  return status;
}

async function fetchMemberStatus(
  memberStatusUrl: string,
  cookieHeader: string,
  fetchFn: typeof fetch,
): Promise<MemberStatus> {
  const url = new URL(MEMBER_STATUS_PATH, memberStatusUrl);

  const response = await fetchFn(url.toString(), {
    headers: {
      accept: "application/json",
      cookie: cookieHeader,
    },
  });

  if (!response.ok || response.status === 204) {
    return {
      loggedIn: false,
      paid: false,
      tiers: [],
    };
  }

  const data = (await response.json()) as {
    member?: {
      id?: string;
      email?: string;
      status?: string;
      tiers?: Array<{ name?: string; slug?: string }>;
    } | null;
  };

  const member = data.member;
  if (!member || !member.id) {
    return {
      loggedIn: false,
      paid: false,
      tiers: [],
    };
  }

  const status = member.status ?? "free";
  const paid = status === "paid" || status === "comped";
  const tiers = (member.tiers ?? [])
    .map((tier) => tier.name || tier.slug)
    .filter((tier): tier is string => Boolean(tier));

  return {
    loggedIn: true,
    paid,
    tiers,
    id: member.id,
    email: member.email,
  };
}
