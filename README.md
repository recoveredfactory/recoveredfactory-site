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

## Post system (MD + mdsvex)

- Post source files live in:
  - `apps/web/src/content/blog/en/*.md`
  - `apps/web/src/content/blog/es/*.md`
- Markdown is compiled with mdsvex (see `apps/web/svelte.config.js`), so post files can include Svelte components.
- Frontmatter is read in `apps/web/src/lib/blog/loader.ts` and should include:
  - `id` (or `canonicalId`) for cross-language matching
  - `title`, `date`, `lang`
  - optional: `description`, `byline`, `editors`, `previewImage`, `hidePreview`, `tags`, `type`
- `type` defaults to `post`. If `type: page`, the entry can still render at `/{lang}/{slug}` but is excluded from post listings and RSS.

### How routing works

- `/{lang}` homepage: loads latest posts via `listPosts(lang)` in `apps/web/src/routes/[lang]/+page.server.ts`.
- `/{lang}/posts`: full archive via `listPosts(lang)` in `apps/web/src/routes/[lang]/posts/+page.server.ts`.
- `/{lang}/{slug}`: loads any entry via `getEntry(lang, slug)` in `apps/web/src/routes/[lang]/[slug]/+page.server.ts`.
- `/{lang}/rss.xml`: emits RSS from `listPosts(lang)` in `apps/web/src/routes/[lang]/rss.xml/+server.ts`.

### Translation linking

- Language switching between post slugs uses `findTranslationSlug(fromLang, fromSlug, toLang)`.
- Matching is done by shared `canonicalId`/`id` (not by slug), so translated slugs can differ by language.
- If no translated match is found, the UI falls back gracefully (no alternate slug link).

## Deploy with SST

- Update `sst.config.ts` with your region and DNS preferences.
- Run:
  ```bash
  pnpm deploy
  ```

Domains are wired as:
- `cms--stage.recoveredfactory.net` for `--stage staging`
- `recoveredfactory.net` for `--stage prod`

## Integration with email provider (Kit.com)

There is not integration currently. Posts should get a URL and be published before sending emails that reference them ("read on the web"). Email production must be handled separately from web production.