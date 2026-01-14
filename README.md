# Recovered Factory Site + SvelteKit + SST

Monorepo scaffold for a custom SvelteKit site deployed with SST, with Paraglide i18n.

## Structure

- `apps/web` — SvelteKit site
- `apps/web/messages` — Paraglide message sources (en/es)
- `apps/web/project.inlang` — Paraglide project config
- `packages/config` — shared eslint/prettier/tsconfig defaults
- `sst.config.ts` — SST v3 infrastructure config

## Local development

1. Install dependencies:
   ```bash
   pnpm install
   ```
2. Create a `.env` in `apps/web` (ignored by git):
   ```bash
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

## Paraglide i18n

- Message sources live in `apps/web/messages` (`en.json`, `es.json`).
- The Paraglide project lives in `apps/web/project.inlang`.
- Client/server hooks are wired in `apps/web/src/hooks.ts` and `apps/web/src/hooks.server.ts`.
- Use `m.*` from `$lib/paraglide/messages` for UI strings.

## Deploy with SST

- Update `sst.config.ts` with your region and DNS preferences.
- Run:
  ```bash
  pnpm deploy
  ```

Domains are wired as:
- `cms--stage.recoveredfactory.net` for `--stage staging`
- `cms--prod.recoveredfactory.net` for `--stage prod`
