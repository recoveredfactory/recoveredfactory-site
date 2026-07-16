---
id: "ice-jails-nearly-everyone-numbers"
title: "DDP drop — numbers ledger"
date: "2026-07-15"
description: "Every figure in the piece, with the math behind it."
type: "page"
lang: "en"
---

Every quantity in the *ICE rhetoric vs. the numbers* piece, with a short note on the math/SQL behind it. Values are single-sourced from the `ddp_rhetoric_chart_data` artifact (the same computed JSON that backs the charts and the copy); the derivations are transcribed from `ddp_drop_analysis.py`. This doc is regenerated deterministically from that JSON — it runs no query and no model.

**Base table:** `shelf.davideads.ddp_joined_arrests_stays` — one row per deduplicated ICE interior arrest; a detention stay is attached when book-in falls within 5 days before to 10 days after the arrest.

**Regime split** (`apprehension_date` vs. the Trump inauguration boundary): `BIDEN = apprehension_date < TIMESTAMP '2025-01-20'`, `TRUMP = apprehension_date >= TIMESTAMP '2025-01-20'`. The two regimes are read separately, never as one continuous curve.

## Headline (all arrests, both regimes)

_one row per deduplicated ICE arrest; detention = a detention stay booked within 5 days before to 10 days after the arrest_

| Figure | Value | How it's computed |
|---|---|---|
| Total arrests | 705,286 | `COUNT(1)` over the whole joined table |
| Total detained | 544,300 | `SUM(CASE WHEN has_detention_stay THEN 1 ELSE 0 END)` |
| Overall detention rate | 77.2% | detained / arrests × 100 |
| Coverage window | 2022-10 → 2026-02 | monthly series after trimming lagged/incomplete trailing months (a trailing month is dropped while its arrests &lt; 0.6 × median of the prior 6) |
| Median book-in lag | 0.42 hours | `APPROX_PERCENTILE_CONT(0.5)` of `(stay_book_in_date_time − apprehension_date_time)/3600` over detained arrests with both timestamps |

## Detention rate by administration

_two distinct enforcement regimes; do not read the full series as one continuous trend_

| Figure | Value | How it's computed |
|---|---|---|
| Biden arrests / detained / rate | 315,461 / 193,474 / 61.3% | same headline formulas, filtered to `BIDEN` window |
| Trump arrests / detained / rate | 389,825 / 350,826 / 90.0% | same headline formulas, filtered to `TRUMP` window |

## Detention consequences per arrest

_The capability the July arrests⋈stays join newly unlocks. Percentages are of arrests unless noted 'of detained'._

| Figure | Value | How it's computed |
|---|---|---|
| Trump: swift release (no book-in) | 38,999 (10.0% of arrests) | `SUM(NOT has_detention_stay)`; pct / arrests |
| Trump: still in custody | 49,810 (14.2% of detained) | `SUM(has_detention_stay AND stay_book_out_date_time IS NULL)`; pct / detained |
| Trump: bond posted | 28,465 (8.1% of detained) | `SUM(bond_posted_amount_lowest_seen > 0)`; pct / detained |
| Trump: median completed stay | 21.9 days | `APPROX_PERCENTILE_CONT(0.5)` of `(book_out − book_in)/86400` over **closed** stays (book_out not null) |
| Trump: median stints per detained person | 3 | `APPROX_PERCENTILE_CONT(0.5)` of `n_stints` over detained people. NB: `n_stints` = facility booking segments (transfers create multiple stints within one stay); it is NOT distinct detention **stays** (`n_stays`, whose median is 1 in both eras) |
| Biden: swift release (no book-in) | 121,987 (38.7% of arrests) | `SUM(NOT has_detention_stay)`; pct / arrests |
| Biden: still in custody | 714 (0.4% of detained) | `SUM(has_detention_stay AND stay_book_out_date_time IS NULL)`; pct / detained |
| Biden: bond posted | 21,010 (10.9% of detained) | `SUM(bond_posted_amount_lowest_seen > 0)`; pct / detained |
| Biden: median completed stay | 22.8 days | `APPROX_PERCENTILE_CONT(0.5)` of `(book_out − book_in)/86400` over **closed** stays (book_out not null) |
| Biden: median stints per detained person | 2 | `APPROX_PERCENTILE_CONT(0.5)` of `n_stints` over detained people. NB: `n_stints` = facility booking segments (transfers create multiple stints within one stay); it is NOT distinct detention **stays** (`n_stays`, whose median is 1 in both eras) |

## Outcome mix (3-way, share of all arrests)

_released_after_detention = detained − still_in_custody; each pct is of arrests._

| Figure | Value | How it's computed |
|---|---|---|
| Trump: swift release | 38,999 (10.0%) | `SUM(NOT has_detention_stay)` / arrests |
| Trump: released after detention | 301,016 (77.2%) | (detained − still_in_custody) / arrests |
| Trump: still in custody | 49,810 (12.8%) | `SUM(has_detention_stay AND book_out IS NULL)` / arrests |
| Biden: swift release | 121,987 (38.7%) | `SUM(NOT has_detention_stay)` / arrests |
| Biden: released after detention | 192,760 (61.1%) | (detained − still_in_custody) / arrests |
| Biden: still in custody | 714 (0.2%) | `SUM(has_detention_stay AND book_out IS NULL)` / arrests |

## Outcome taxonomy (5-way, share of all arrests)

_A single CASE over each person's release reason + arrest-side departure fields._

| Figure | Value | How it's computed |
|---|---|---|
| Trump: released no detention | 38,999 (10.0%) | `NOT has_detention_stay` |
| Trump: removed departed | 261,302 (67.0%) | release reason IN ('Removed','Voluntary departure','Voluntary Return') |
| Trump: released into us | 26,913 (6.9%) | release reason IN the bonded-out / order-of-supervision / paroled / relief set |
| Trump: transferred other | 12,793 (3.3%) | any other non-null release reason (transfer/handoff/other) |
| Trump: still in custody | 49,818 (12.8%) | release reason IS NULL (booked in, not yet released) |
| Biden: released no detention | 121,987 (38.7%) | `NOT has_detention_stay` |
| Biden: removed departed | 130,147 (41.3%) | release reason IN ('Removed','Voluntary departure','Voluntary Return') |
| Biden: released into us | 51,725 (16.4%) | release reason IN the bonded-out / order-of-supervision / paroled / relief set |
| Biden: transferred other | 10,353 (3.3%) | any other non-null release reason (transfer/handoff/other) |
| Biden: still in custody | 1,249 (0.4%) | release reason IS NULL (booked in, not yet released) |

## Removal signal (Trump era)

| Figure | Value | How it's computed |
|---|---|---|
| Removed / departed | 261,302 (67.0% of arrests) | release reason IN the removed/departed set; pct / arrests |
| Has a departed date | 278,637 | `COUNT` where the arrest-side `departed_date` is set |
| Has a final order (YES) | 219,945 | `COUNT` where `final_order_yes_no = 'YES'` (value is uppercase) |
| Removed-reason corroborated by departed date | 97.0% | share of 'Removed' stays that also carry a `departed_date` — the two independent signals corroborate |
| Top departure countries | Mexico 128,741, Guatemala 42,305, Honduras 32,496, Venezuela 13,756, El Salvador 11,936, Ecuador 8,200, Nicaragua 8,017, Colombia 7,494 | `GROUP BY` departure country over removed/departed arrests, top 8 (country values are stored uppercase) |

## Criminality (ICE's 3-way classification, Trump era)

_Labels carry a leading digit: '1 Convicted Criminal', '2 Pending Criminal Charges', '3 Other Immigration Violator'. These are ICE administrative classifications, not court adjudications._

| Figure | Value | How it's computed |
|---|---|---|
| Convicted criminal | 128,000 arrests, 94.2% detained | `WHERE apprehension_criminality = '1 Convicted Criminal'` — has a conviction |
| Pending charges | 113,043 arrests, 94.6% detained | '2 Pending Criminal Charges' — charged but NOT convicted |
| Other immigration violator | 148,782 arrests, 82.9% detained | '3 Other Immigration Violator' — neither charged nor convicted (civil) |
| Convicted of nothing | 261,825 (67.2% of Trump arrests) | pending_charges + other_immigration_violator (no conviction). Say 'convicted of nothing', never 'charged with nothing' |
| Charged with nothing | 148,782 (38.2% of Trump arrests) | other_immigration_violator ONLY (no charge at all) |
| Non-criminal detention rate: Biden → Trump | 22.9% → 82.9% | detention rate of '3 Other Immigration Violator', each regime window |

## Local enforcement — 287(g)

_distinct currently-participating state/local agencies with 287(g) agreements_

| Figure | Value | How it's computed |
|---|---|---|
| National participating agencies | 1,720 | `COUNT(DISTINCT COALESCE(ori, normalized_agency_name))` in `tracking_287g_agreements` WHERE `is_current = true` |
| Top states | Texas 350, Florida 272, Pennsylvania 104, Arkansas 98, Missouri 97, Tennessee 80 | same distinct-agency count, grouped by state |
| Sanctuary states with zero agencies | California, Connecticut, Washington, Vermont, Oregon, Illinois, New Jersey | states from the sanctuary watch-list whose distinct-agency count is 0 |

## Rhetoric corpus (DHS press releases)

_Corpus span 2025-01-20..2026-07-13. Source table: `federal_press_releases` WHERE `source = 'DHS'`._

| Figure | Value | How it's computed |
|---|---|---|
| DHS releases, Trump era | 971 | `COUNT(1)` of DHS releases with `release_date >= 2025-01-20` |
| 'Worst of the worst' releases | 42 | title `LIKE 'WORST OF THE WORST%'` |
| Sanctuary-titled releases | 88 | title matching the sanctuary pattern |
| Detainer-titled releases | 68 | title matching the detainer pattern |
| Named-governor attack releases | Pritzker 11, Walz 7, Spanberger 10, Newsom 9, Hochul 1 | count of releases whose title names each governor |

## Series (full arrays live in the JSON)

| Figure | Value | How it's computed |
|---|---|---|
| Monthly arrests / detention rate | 41 months, 2022-10 → 2026-02 | `GROUP BY DATE_TRUNC('month', apprehension_date)`; rate = detained/arrests |
| Monthly criminality mix | 14 months, within-month shares | monthly `GROUP BY apprehension_criminality`, share of that month's total |
| Stay-length histogram | 8 buckets × 2 regimes | bucketed `(book_out − book_in)/86400` over closed detained stays |
| `by_program` | 10 rows | arrests + detention rate grouped by that dimension, top-N by arrests |
| `by_citizenship` | 12 rows | arrests + detention rate grouped by that dimension, top-N by arrests |
| `by_state` | 15 rows | arrests + detention rate grouped by that dimension, top-N by arrests |
| `by_aor` | 15 rows | arrests + detention rate grouped by that dimension, top-N by arrests |

---

_Note: this ledger is single-sourced from `ddp_rhetoric_chart_data`, which is recomputed from the raw DDP release. The published prose is hand-edited, so a few narrative roundings may differ from these exact figures — that difference is intentional editorial latitude, and this ledger is the numeric ground truth._
