# Recovered Factory Ghost + SvelteKit + SST

Monorepo scaffold for a custom SvelteKit site deployed with SST and backed by Ghost(Pro) for content, memberships, payments, and email.

## Structure

- `apps/web` — SvelteKit site
- `apps/web/messages` — Paraglide message sources (en/es)
- `apps/web/project.inlang` — Paraglide project config
- `packages/ghost` — Ghost Content API + member status helpers
- `packages/config` — shared eslint/prettier/tsconfig defaults
- `sst.config.ts` — SST v3 infrastructure config

## Local development

1. Install dependencies:
   ```bash
   pnpm install
   ```
2. Create a `.env` in `apps/web` (ignored by git):
   ```bash
   GHOST_CONTENT_API_URL=https://members.recoveredfactory.net
   GHOST_CONTENT_API_KEY=your_content_key
   GHOST_MEMBER_STATUS_URL=https://members.recoveredfactory.net
   GHOST_PORTAL_SIGNIN_URL=https://members.recoveredfactory.net/#/portal/signin
   GHOST_PORTAL_UPGRADE_URL=https://members.recoveredfactory.net/#/portal/signup
   PUBLIC_SITE_URL=https://recoveredfactory.net
   ```
3. Run SvelteKit directly:
   ```bash
   pnpm dev
   ```
   Or run the SST dev loop:
   ```bash
   pnpm dev:sst
   ```

## Environment variables

Required for the web app (wired in `sst.config.ts`):

- `PUBLIC_SITE_URL` — public site base URL
- `GHOST_CONTENT_API_URL` — Ghost base URL (no `/ghost/api` suffix)
- `GHOST_CONTENT_API_KEY` — Ghost Content API key
- `GHOST_MEMBER_STATUS_URL` — Ghost base URL for member lookups
- `GHOST_PORTAL_SIGNIN_URL` — Ghost Portal sign-in URL
- `GHOST_PORTAL_UPGRADE_URL` — Ghost Portal upgrade URL
- `GHOST_MEMBER_CACHE_TTL_SECONDS` — optional, default `120`

## How gating works

- `packages/ghost/src/members.ts` forwards the inbound `cookie` header to Ghost’s member endpoint.
- Results are cached in an in-memory LRU cache (120s default). This cache is per Lambda/container and resets on cold start.
- `apps/web/src/lib/server/requireMember.ts` is the guard used by paid routes.

Examples:
- `apps/web/src/routes/bench-notes/+page.server.ts` (paid-only page)
- `apps/web/src/routes/downloads/report.pdf/+server.ts` (paid-only download)
- `apps/web/src/routes/api/member-status/+server.ts` (public status endpoint, rate-limited)

## Ghost endpoints and Portal URLs

Member status uses:
```
GET /members/api/member/
```
This is the default Ghost members session endpoint and requires only the browser cookie. The base URL is configured via `GHOST_MEMBER_STATUS_URL`.

If your Ghost setup uses a different members endpoint or requires extra headers:
- Update `MEMBER_STATUS_PATH` in `packages/ghost/src/members.ts`.
- Add custom headers in `fetchMemberStatus` (same file), keeping them server-only.

## Content API usage

The writing route (`/writing/[slug]`) fetches posts via the Ghost Content API server-side and returns CDN-friendly caching headers.
Posts are filtered by a language tag per locale (expected tag slugs: `lang-en` and `lang-es`). Keep those tags hidden in Ghost so they don't appear on public pages.

## Paraglide i18n

- Message sources live in `apps/web/messages` (`en.json`, `es.json`).
- The Paraglide project lives in `apps/web/project.inlang`.
- Client/server hooks are wired in `apps/web/src/hooks.ts` and `apps/web/src/hooks.server.ts`.
- Use `m.*` from `$lib/paraglide/messages` for non-Ghost UI strings.

## Deploy with SST

- Update `sst.config.ts` with your region and DNS preferences.
- Run:
  ```bash
  pnpm deploy
  ```

`members.recoveredfactory.net` should be managed in Ghost(Pro); SST only owns `recoveredfactory.net`.

## Security notes

- Ghost Admin API keys are never used.
- Member status checks happen server-side only.
- Content API key is safe for public use, but fetching is server-side for consistent caching.
- The `/api/member-status` endpoint includes a local token bucket; use Redis/Dynamo for distributed rate limiting.
