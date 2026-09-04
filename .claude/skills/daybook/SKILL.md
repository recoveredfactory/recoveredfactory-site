---
name: daybook
description: Publish a day's Immigration Daybook edition — pull it from the PromptQL automation, triage the upstream shape drift, commit it, ship it. Use for "the 9-2 edition", "today's daybook", "pull the daybook", or any dated edition of the Immigration Daybook.
---

# The Immigration Daybook daily edition

The newsletter is composed upstream by PromptQL and mailed by Kit. This repo is
its archive. The job here is to bring the edition across, notice what arrived
wrong, and ship it. **The composition is not ours to write** — never author or
rewrite the news copy.

## 1. Pull

```sh
pnpm daybook
```

Runs `apps/web/scripts/daybook/pull.mjs`. Two facts that shape everything else:

- **There is no date selector.** The endpoint always returns the latest row on
  the shelf. If the date that comes back is not the one you were asked for, stop
  and say so — you cannot ask for another one from here.
- **A re-run overwrites the markdown body.** Only frontmatter marked
  `titleOverride: true` / `descriptionOverride: true`, plus `dossier`,
  `instagramPost` and `translationEditor`, survive. Never hand-edit the body.

Tracked output, five files — this is the commit:

```
apps/web/src/content/daybook/{en,es}/<date>.md
apps/web/src/content/daybook/{en,es}/<date>.html
apps/web/src/content/daybook/upcoming/<date>.json
```

The OG cards and the carousel slides under `apps/web/static/images/` are
gitignored by design. They exist only on this machine until the deploy.

## 2. Triage every `WARNING:` line

This is the whole job. The upstream markdown changes shape constantly — eight
distinct wrong shapes since launch — and each warning is the script telling you
which one showed up today. Read them all before committing.

| Warning | What it means | What to do |
|---|---|---|
| `dropped the lede's headline … Restored "…" from the email` | The markdown lost the lede's `## `; the English email had it. | Nothing. Repaired. Mention it in the commit. |
| `the lede has no headline and the email has none to lift` | Same, but no source — usually Spanish, whose email is a heading short too. Hed, dek, card and carousel are all leading on the **second** story. | Put the lede's headline in `title:` with `titleOverride: true`, then `pnpm daybook:again`. That one line restores the body heading and everything derives off it. A Spanish headline is editorial work — **flag it for David rather than shipping your translation silently.** |
| `dropped section "Upcoming"/"Próximamente" … no content under the heading` | The calendar shipped as a bare heading. | Nothing to fix. The page reads the calendar off the email HTML instead. Note it. |
| The same, but the edition **meant** to skip Upcoming | Ask, or read the email: on 2026-09-04 it told readers the section was "in the shop for a tuneup". The page would otherwise rebuild a calendar off the snapshot and print deadlines the edition never ran. | Set `upcomingSkipped: true` in both languages' frontmatter, re-run `pnpm daybook:again --no-upcoming` so the board drops its calendar slide too. |
| `dropped section … it arrived as the email calendar flattened to text` | Worse shape: no calendar in the markdown *or* recoverable from it. | Page falls back to the snapshot, which is narrower than what shipped. Check the board and say so in the commit. |
| `dropped N empty list markers` | Round-up bullets arrived as bare `-` lines. | Cosmetic, already stripped. Note the count. |
| `N story sections where the first language had M` | The two languages' decks disagree. | Usually a symptom of a lost heading in one language. Fix that first, then confirm this clears. |
| `the manifest and the <lang> email disagree about the calendar` | Manifest bookkeeping drifted. | The email wins and the script already took it. Manifests are known-unreliable; do not add new dependencies on them. |
| `no calendar recoverable from the <lang> email and none on the manifest` | The board will show the whole eligible slate, wider than what shipped. | Check it before posting the carousel. |
| `no email HTML` | The archive loses the as-sent record and the calendar. | Re-run without `--offline`. If it persists, say so — do not paper over it. |
| `upcoming snapshot is <version>, which this script has not been read against` | Schema drift upstream. | Check the slides look right; flag it. |
| `replacing title/description "…" with the derived "…"` | Someone hand-edited frontmatter without the override flag. | Decide which is right. Add the `Override: true` flag to keep the hand-set one. |
| `could not render the social card` / `the carousels` | Needs `google-chrome` and ImageMagick `convert` on PATH, plus egress for Google Fonts. | Fix the environment and re-run; do not ship an edition with no card. |

Also read the non-warning lines: `Upcoming: N published, read off the <lang> email`
and any `dropped a claim the headline already made` line, which is the script
editing the deck copy.

## 3. Re-run after a hand fix

```sh
pnpm daybook:again      # --offline: re-templates from the saved response, no API spend
```

Safe and repeatable. It re-reads the cached response and email HTML, and it does
**not** re-fetch the upcoming snapshot, which is sticky once archived.

## 4. Check the two languages match

Both decks should have the same slide count and lead on the same story. Compare:

```sh
ls apps/web/static/images/social/<date>/en apps/web/static/images/social/<date>/es
head -6 apps/web/src/content/daybook/{en,es}/<date>.md
```

Do not screenshot the dev server to self-verify. David watches the live server.

## 5. Commit

Stage exactly the five tracked files. The house message shape:

```
Immigration Daybook: the <Mon. D> edition, and <the day's anomaly>

<3-6 paragraphs of prose: the stories and the round-up; what the standing note
says; the calendar reconciliation with specific dates and ids; any new upstream
markdown shape.>
```

**Whether the email actually went out is not this repo's concern.** `kit_status`,
`kit_sent`, `delivery` and the broadcast id belong to the composer and to Kit,
and something upstream owns them. The pull copies the broadcast id into
frontmatter as archival metadata and that is the end of it — do not report on
send state, and do not treat it as a problem to be solved from here. The archive
archives what it was given.

The subject's second clause is the day's *interesting* fact, not a summary —
"and three dates the page cannot show", "and a calendar that arrived flattened",
"and a Spanish calendar that shipped empty". Write it from the warnings you just
triaged.

**A fix to the pull script is a separate commit from the edition it was found
on.** Same `Immigration Daybook: ` prefix.

## 6. Ship

```sh
pnpm daybook:ship
```

`PUBLIC_DAYBOOK_BANNER=1 sst deploy --stage prod && ./scripts/backup-assets.sh`.

The banner env var must ride along on **every** prod deploy or the promo strip
silently disappears. Editions 404 on the live site until this runs, and so do
the carousel URLs the pull prints, because the images are gitignored and ship as
a build input. The backup pushes those images to S3, where the working copy is
otherwise the only copy.

Deploying is outward-facing. Confirm with David before running it.

## 7. Post the carousel

The pull prints two URLs. Posting happens on a phone: open the URL there and
long-press each slide. Nothing to automate on this end.

## Reference

- `apps/web/scripts/daybook/pull.mjs` — the pull, heavily commented; the header
  explains why editions are plain markdown and not mdsvex.
- `apps/web/scripts/daybook/upcoming.mjs` — the calendar snapshot and
  `publishedFromText`, which recovers what actually shipped off the email.
- `apps/web/scripts/daybook/og.mjs` — cards and carousel. Needs
  `google-chrome` and `convert`.
- `apps/web/src/lib/daybook/calendar.ts` — how the page reads the calendar:
  edition markdown first, then the sent email, then the snapshot.
