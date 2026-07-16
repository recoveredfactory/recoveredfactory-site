# ICE arrests vs. detention — "rhetoric vs. numbers", reproduced from raw DDP data.
#
# This marimo notebook independently reproduces the figures in the piece
# "ICE jails nearly everyone it arrests and deports most of them" directly from
# the Deportation Data Project's published joined arrests-detention-stays file.
#
#   uv run python download_data.py    # once, to fetch ./data/*.parquet (~74 MB)
#   uv run marimo edit notebook.py    # to open/run this notebook
#
# All analysis logic lives in ddp_analysis.py (the single main analysis module),
# so the notebook is a thin, readable presentation layer over it.
import marimo

__generated_with = "0.9.0"
app = marimo.App(width="medium")


@app.cell
def _():
    import marimo as mo
    import pandas as pd
    import altair as alt
    from pathlib import Path
    import ddp_analysis as A
    return A, Path, alt, mo, pd


@app.cell
def _(mo):
    mo.md(
        """
        # ICE arrests vs. detention: reproducing the numbers

        This notebook rebuilds — from the **raw** [Deportation Data Project](https://deportationdata.org)
        data — every figure in the piece *"ICE jails nearly everyone it arrests and
        deports most of them."*

        **Dataset:** `joined-arrests-detention-stays-latest.parquet` (repo
        `deportationdata/ice`, CC-0). One row per **deduplicated ICE arrest
        episode**, with the arrest's detention stay attached when a book-in falls
        within −5 to +10 days of the apprehension.

        **Scope caveat (state it in any writeup):** this is about ICE **arrests and
        their consequences**, *not* ICE detention as a whole — detention stays that
        begin with no ICE arrest (most often at the border, after a CBP arrest) are
        excluded. For a detention-focused analysis, use the standalone
        detention-stays / detention-stints datasets instead.
        """
    )
    return


@app.cell
def _(A, Path, mo, pd):
    _path = Path("data") / "joined-arrests-detention-stays-latest.parquet"
    if not _path.exists():
        mo.stop(
            True,
            mo.md(
                "**Data not found.** Run `uv run python download_data.py` first "
                "to fetch `./data/joined-arrests-detention-stays-latest.parquet`."
            ),
        )
    raw = pd.read_parquet(_path)
    df = A.add_derived(raw)
    mo.md(f"Loaded **{len(df):,}** arrest episodes from `{_path}`.")
    return df, raw


@app.cell
def _(A, df, mo):
    h = A.headline(df)
    s = A.administration_split(df)
    mo.md(
        f"""
        ## Headline

        - **{h['total_arrests']:,}** arrest episodes, coverage **{h['coverage_start']} → {h['coverage_end_solid']}** (solid).
        - **{h['total_detained']:,}** booked into detention — overall detention rate **{h['overall_detention_rate_pct']}%**.

        ### Two enforcement regimes (split at the Trump inauguration, 2025-01-20)

        Do **not** read the full series as one continuous curve.

        | Era | Arrests | Detained | Detention rate |
        |---|--:|--:|--:|
        | Biden (Oct 2022–Jan 2025) | {s['Biden']['arrests']:,} | {s['Biden']['detained']:,} | **{s['Biden']['detention_rate_pct']}%** |
        | Trump (Jan 2025–) | {s['Trump']['arrests']:,} | {s['Trump']['detained']:,} | **{s['Trump']['detention_rate_pct']}%** |
        """
    )
    return


@app.cell
def _(A, alt, df, pd):
    monthly = pd.DataFrame(A.monthly_detention_rate(df))
    monthly["month_dt"] = pd.PeriodIndex(monthly["month"], freq="M").to_timestamp()
    chart_rate = (
        alt.Chart(monthly)
        .mark_line(point=True)
        .encode(
            x=alt.X("month_dt:T", title="Apprehension month"),
            y=alt.Y("detention_rate_pct:Q", title="Detention rate (%)",
                    scale=alt.Scale(domain=[0, 100])),
            color=alt.Color("admin:N", title="Administration"),
            tooltip=["month", "arrests", "detained", "detention_rate_pct"],
        )
        .properties(height=320, title="Monthly detention rate (arrests booked into detention)")
    )
    chart_rate
    return chart_rate, monthly


@app.cell
def _(A, df, mo):
    dc = A.detention_consequences(df)
    def _row(era):
        d = dc[era]
        return (f"| {era} | {d['swift_release_pct']}% | "
                f"{d['still_in_custody_pct_of_detained']}% | "
                f"{d['bond_posted_pct_of_detained']}% | "
                f"{d['median_stay_days_closed']} d | {d['median_stints_detained']} |")
    mo.md(
        f"""
        ## What happens after the arrest

        | Era | Swift release (no book-in) | Still in custody (of detained) | Bond posted (of detained) | Median completed stay | Median stints |
        |---|--:|--:|--:|--:|--:|
        {_row('Biden')}
        {_row('Trump')}

        What changed under Trump is not *how long or how fast* ICE detains
        (median completed stay ~22 days, book-in within a day in both eras) — it's
        *whether anyone is let go at all*: swift releases collapsed from ~39% to
        ~10%, and open-ended custody rose from ~0.4% to ~14% of detainees.

        *Note: completed-stay length here is computed from the aggregate
        `stay_book_in_date_time` → `stay_book_out_date_time` fields; the published
        median (~22.8 / 21.9 d) differs by <1 day.*
        """
    )
    return dc,


@app.cell
def _(A, alt, df, pd):
    tax = A.outcome_taxonomy(df)
    rows = []
    labels = {
        "released_no_detention": "Released (no detention)",
        "removed_departed": "Removed / departed",
        "released_into_us": "Released into the U.S.",
        "transferred_other": "Transferred / other",
        "still_in_custody": "Still in custody",
    }
    for era in ["Biden", "Trump"]:
        for k, lab in labels.items():
            rows.append({"era": era, "outcome": lab, "pct": tax[era][k + "_pct"],
                         "n": tax[era][k]})
    outcomes = pd.DataFrame(rows)
    chart_outcome = (
        alt.Chart(outcomes)
        .mark_bar()
        .encode(
            x=alt.X("pct:Q", title="% of arrests", stack="zero"),
            y=alt.Y("era:N", title=None),
            color=alt.Color("outcome:N", title="Outcome",
                            sort=list(labels.values())),
            order=alt.Order("outcome:N"),
            tooltip=["era", "outcome", "pct", "n"],
        )
        .properties(height=140, title="Arrest outcome mix, by era")
    )
    chart_outcome
    return chart_outcome, outcomes, tax


@app.cell
def _(A, df, mo):
    crim = {r["category"]: r for r in A.by_criminality(df, "Trump")}
    w = A.criminality_wording(df, "Trump")
    mo.md(
        f"""
        ## Criminality (ICE's *administrative* classification — not court adjudications)

        Trump-era detention rate by `apprehension_criminality`:

        | Category | Arrests | Detention rate |
        |---|--:|--:|
        | 1 Convicted Criminal | {crim['1 Convicted Criminal']['arrests']:,} | {crim['1 Convicted Criminal']['detention_rate_pct']}% |
        | 2 Pending Criminal Charges | {crim['2 Pending Criminal Charges']['arrests']:,} | {crim['2 Pending Criminal Charges']['detention_rate_pct']}% |
        | 3 Other Immigration Violator | {crim['3 Other Immigration Violator']['arrests']:,} | {crim['3 Other Immigration Violator']['detention_rate_pct']}% |

        **Wording rule (a correctness trap):**
        - *"convicted of nothing" / "no criminal conviction"* = pending **+** other =
          **{w['convicted_of_nothing']['arrests']:,}** ({w['convicted_of_nothing']['share_of_era_pct']}%).
        - *"charged with nothing" / "no criminal charge"* = other-immigration-violator **only** =
          **{w['charged_with_nothing']['arrests']:,}** ({w['charged_with_nothing']['share_of_era_pct']}%).
        - People with only **pending charges** are detained at ~94.6% — statistically
          indistinguishable from convicted criminals (~94.2%) — so the pending group
          must never be described as "charged with nothing."
        """
    )
    return crim, w


@app.cell
def _(A, alt, df, pd):
    mix = pd.DataFrame(A.monthly_criminality_mix(df))
    mix["month_dt"] = pd.PeriodIndex(mix["month"], freq="M").to_timestamp()
    long = mix.melt(
        id_vars=["month_dt"],
        value_vars=["convicted_pct", "pending_pct", "other_pct"],
        var_name="group", value_name="pct",
    ).replace({"group": {
        "convicted_pct": "Convicted", "pending_pct": "Pending charges",
        "other_pct": "Other immigration violator",
    }})
    chart_mix = (
        alt.Chart(long)
        .mark_area()
        .encode(
            x=alt.X("month_dt:T", title="Apprehension month"),
            y=alt.Y("pct:Q", title="% of arrests", stack="normalize"),
            color=alt.Color("group:N", title="Criminality"),
            tooltip=["month_dt:T", "group:N", "pct:Q"],
        )
        .properties(height=300, title="Trump-era criminality mix over time")
    )
    chart_mix
    return chart_mix, long, mix


@app.cell
def _(A, df, mo, pd):
    rem = A.removal_signal(df, "Trump")
    top = pd.DataFrame(rem["top_departure_countries"])
    mo.md(
        f"""
        ## Removal is now traceable per person

        This release links each arrest to its detention stay's release reason **and**
        to the arrest record's own departure fields (`departed_date`,
        `departure_country`, `final_order_yes_no`). The two corroborate
        **{rem['removed_reason_corroborated_by_departed_date_pct']}%** of the time.

        - Removed / departed: **{rem['removed_departed']:,}** ({rem['removed_departed_pct_of_arrests']}% of Trump-era arrests).
        - Arrests with a `departed_date` set: **{rem['departed_date_set']:,}**;
          with a final order (`YES`): **{rem['final_order_yes']:,}**.

        **Top departure countries** (arrests with a recorded departure):

        {top.to_markdown(index=False)}

        *Caveat: ~13% of Trump-era arrests remain in open-ended custody (outcome
        unresolved), and the most recent months lag as records arrive in batches.*
        """
    )
    return rem, top


@app.cell
def _(A, alt, df, pd):
    def _hist(era):
        h = pd.DataFrame(A.stay_length_hist(df, era))
        h["era"] = era
        return h
    hist = pd.concat([_hist("Biden"), _hist("Trump")], ignore_index=True)
    order = ["<1 day", "1–3 days", "3–7 days", "1–2 weeks", "2–4 weeks",
             "1–2 months", "2–3 months", "3+ months"]
    chart_hist = (
        alt.Chart(hist)
        .mark_bar()
        .encode(
            x=alt.X("bucket:N", title="Completed stay length", sort=order),
            y=alt.Y("arrests:Q", title="Arrests"),
            color=alt.Color("era:N", title="Era"),
            xOffset="era:N",
            tooltip=["era", "bucket", "arrests"],
        )
        .properties(height=300, title="Completed detention-stay length distribution")
    )
    chart_hist
    return chart_hist, hist, order


@app.cell
def _(A, df, mo, pd):
    prog = pd.DataFrame(A.rate_breakdown(df, "final_program", "Trump"))
    state = pd.DataFrame(A.rate_breakdown(df, "apprehension_state_filled_in", "Trump"))
    aor = pd.DataFrame(A.rate_breakdown(df, "apprehension_aor", "Trump"))
    cit = pd.DataFrame(A.rate_breakdown(df, "citizenship_country", "Trump"))
    mo.md(
        f"""
        ## Where and how (Trump era)

        By ICE program:

        {prog.to_markdown(index=False)}

        By apprehension state (using the recommended `apprehension_state_filled_in`):

        {state.to_markdown(index=False)}

        By area of responsibility (AOR):

        {aor.to_markdown(index=False)}

        By citizenship country:

        {cit.to_markdown(index=False)}
        """
    )
    return aor, cit, prog, state


@app.cell
def _(mo):
    mo.md(
        """
        ## What these numbers do and do not say

        - This dataset is keyed on **ICE arrests and their consequences**, not ICE
          detention as a whole; border/CBP-origin detention with no ICE arrest is
          excluded.
        - A detention stay is attached only when book-in falls within −5 to +10 days
          of the arrest (a ~77% match rate — comfortably inside DDP's 20–95%
          reliability range).
        - Months after February 2026 are incomplete (records arrive on a lag) and are
          excluded from the monthly time series.
        - `apprehension_criminality` is ICE's own **administrative** classification,
          not court adjudication.
        - Secondary figures in the published piece — 287(g) agency counts and DHS
          press-release ("worst of the worst") rhetoric tallies — come from *other*
          sources (the 287(g) tracker and the federal press-release watcher), not this
          arrests dataset, and are out of scope for this local reproduction.
        """
    )
    return


if __name__ == "__main__":
    app.run()