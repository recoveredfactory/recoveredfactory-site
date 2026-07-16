This document accompanies the editorial piece. It lists every quantity that appears in (or backs) the piece and, for each one, gives a short plain-language note on exactly how it was computed. It is meant to stand on its own — you should be able to read it without any prior knowledge of the tools or data behind the piece.

**Where the data comes from.** Most figures trace to the [Deportation Data Project](https://deportationdata.org) (DDP), a public-interest effort hosted at UC Berkeley Law that obtains internal U.S. government immigration-enforcement datasets through the Freedom of Information Act and publishes them — mostly as anonymized, individual-level records — under a CC-0 public-domain dedication, each accompanied by DDP's own documentation and [codebook](https://deportationdata.org/data). This piece uses DDP's published dataset that joins ICE interior-arrest records to ICE detention-stay records. The field names and coded values referenced below (e.g. `apprehension_date`, `final_order_yes_no`, the `1`/`2`/`3` criminality codes) are DDP's own — consult the DDP codebook for their authoritative definitions.

Two families of figures come from **outside** DDP. The 287(g) counts (see "Local enforcement") come from a daily scrape of ICE's own public list of participating state and local agencies, not from DDP. And the rhetoric counts (see "Rhetoric corpus") come from DHS's public press-release archive. Each of those sections says so again where its numbers appear.

**How these numbers are produced.** The raw data is run once through a single analysis routine that computes every figure and writes them to one machine-readable file; this document is then produced purely by reading and formatting that file. It runs no database query and calls no AI or statistical model — it is a plain, deterministic transform, so the same inputs always yield exactly these numbers. (Verified: regenerating this document repeatedly from the same inputs yields a byte-for-byte identical result.)

**Base dataset.** The analysis works over DDP's joined arrests x detention-stays dataset — one row per deduplicated ICE interior arrest, with a detention stay attached when book-in falls within 5 days before to 10 days after the arrest.

**Administration split** (`apprehension_date` vs. the Trump inauguration boundary): `BIDEN = apprehension_date < TIMESTAMP '2025-01-20'`, `TRUMP = apprehension_date >= TIMESTAMP '2025-01-20'`. The two administrations are read separately, never as one continuous curve.

## Headline (all arrests, both administrations)

_Each row is one deduplicated ICE arrest, with detention meaning a detention stay booked within five days before to ten days after the arrest._

| Figure | Value | How it's computed |
|---|---|---|
| Total arrests | 705,286 | `COUNT(1)` over the whole joined table |
| Total detained | 544,300 | `SUM(CASE WHEN has_detention_stay THEN 1 ELSE 0 END)` |
| Overall detention rate | 77.2% | detained / arrests × 100 |
| Coverage window | 2022-10 → 2026-02 | monthly series after trimming lagged/incomplete trailing months (a trailing month is dropped while its arrests &lt; 0.6 × median of the prior 6) |
| Median book-in lag | 0.42 hours | `APPROX_PERCENTILE_CONT(0.5)` of `(stay_book_in_date_time − apprehension_date_time)/3600` over detained arrests with both timestamps |

## Detention rate by administration

_These are two distinct enforcement administrations, so the full series should not be read as one continuous trend._

| Figure | Value | How it's computed |
|---|---|---|
| Biden arrests / detained / rate | 315,461 / 193,474 / 61.3% | same headline formulas, filtered to `BIDEN` window |
| Trump arrests / detained / rate | 389,825 / 350,826 / 90.0% | same headline formulas, filtered to `TRUMP` window |

## Detention consequences per arrest

_This is the capability the July arrests x detention-stays join newly unlocks, with each percentage taken over arrests unless it is marked 'of detained'._

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

_Released after detention equals detained minus those still in custody, and each percentage is taken over all arrests._

| Figure | Value | How it's computed |
|---|---|---|
| Trump: swift release | 38,999 (10.0%) | `SUM(NOT has_detention_stay)` / arrests |
| Trump: released after detention | 301,016 (77.2%) | (detained − still_in_custody) / arrests |
| Trump: still in custody | 49,810 (12.8%) | `SUM(has_detention_stay AND book_out IS NULL)` / arrests |
| Biden: swift release | 121,987 (38.7%) | `SUM(NOT has_detention_stay)` / arrests |
| Biden: released after detention | 192,760 (61.1%) | (detained − still_in_custody) / arrests |
| Biden: still in custody | 714 (0.2%) | `SUM(has_detention_stay AND book_out IS NULL)` / arrests |

## Outcome taxonomy (5-way, share of all arrests)

_Each person is placed in a single bucket based on their release reason and arrest-side departure fields._

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

_These signals corroborate how often a Trump-era arrest ended in an actual removal or departure._

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
| Non-criminal detention rate: Biden → Trump | 22.9% → 82.9% | detention rate of '3 Other Immigration Violator', each administration window |

## Local enforcement — 287(g)

_These 287(g) figures do not come from DDP; they come from a daily scrape of ICE's own public list of state and local agencies that have signed 287(g) agreements, collated across all daily snapshots and counted as distinct currently-participating agencies._

| Figure | Value | How it's computed |
|---|---|---|
| National participating agencies | 1,720 | `COUNT(DISTINCT COALESCE(ori, normalized_agency_name))` in `tracking_287g_agreements` WHERE `is_current = true` |
| Top states | Texas 350, Florida 272, Pennsylvania 104, Arkansas 98, Missouri 97, Tennessee 80 | same distinct-agency count, grouped by state |
| Sanctuary states with zero agencies | California, Connecticut, Washington, Vermont, Oregon, Illinois, New Jersey | states from the sanctuary watch-list whose distinct-agency count is 0 |

## Rhetoric corpus (DHS press releases)

_These counts come from the Department of Homeland Security's own public press-release archive, covering releases issued from January 20, 2025 through July 13, 2026 (corpus span 2025-01-20..2026-07-13)._

| Figure | Value | How it's computed |
|---|---|---|
| DHS releases, Trump era | 971 | `COUNT(1)` of DHS releases with `release_date >= 2025-01-20` |
| 'Worst of the worst' releases | 42 | title `LIKE 'WORST OF THE WORST%'` |
| Sanctuary-titled releases | 88 | title matching the sanctuary pattern |
| Detainer-titled releases | 68 | title matching the detainer pattern |
| Named-governor attack releases | Pritzker 11, Walz 7, Spanberger 10, Newsom 9, Hochul 1 | count of releases whose title names each governor |

## Series (breakdowns available in full in the underlying data)

_These are longer breakdowns whose full arrays live in the underlying data; only their shape is summarized here._

| Figure | Value | How it's computed |
|---|---|---|
| Monthly arrests / detention rate | 41 months, 2022-10 → 2026-02 | `GROUP BY DATE_TRUNC('month', apprehension_date)`; rate = detained/arrests |
| Monthly criminality mix | 14 months, within-month shares | monthly `GROUP BY apprehension_criminality`, share of that month's total |
| Stay-length histogram | 8 buckets × 2 administrations | bucketed `(book_out − book_in)/86400` over closed detained stays |
| By program | 10 rows | arrests and detention rate grouped by that dimension, top-N by arrests |
| By citizenship | 12 rows | arrests and detention rate grouped by that dimension, top-N by arrests |
| By state | 15 rows | arrests and detention rate grouped by that dimension, top-N by arrests |
| By area of responsibility (AOR) | 15 rows | arrests and detention rate grouped by that dimension, top-N by arrests |

---

_Note: this document is single-sourced from the same computed figures that back the chart and the piece, recomputed from the raw DDP release. The published prose is hand-edited, so a few narrative roundings may differ from these exact figures — that difference is intentional editorial latitude, and these figures are the numeric ground truth._
