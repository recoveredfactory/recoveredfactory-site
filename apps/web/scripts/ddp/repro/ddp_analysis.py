"""
Reproduction of the DDP "rhetoric vs. numbers" analysis, as pure pandas over the
Deportation Data Project joined-arrests-detention-stays dataset.

Every function takes the full arrests DataFrame (one row per deduplicated ICE
arrest episode) and returns the same figures published in the piece
"ICE jails nearly everyone it arrests and deports most of them".

Data source: https://deportationdata.org  (deportationdata/ice repo,
data/joined-arrests-detention-stays-latest.parquet). CC-0.
"""
import pandas as pd
import numpy as np

# Segment the arrests series at the Trump inauguration. The series spans two
# distinct enforcement regimes and must NOT be read as one continuous curve.
TRUMP_CUTOFF = pd.Timestamp("2025-01-20")

# Recent months arrive in lagged / incomplete batches; cap the time-series
# (monthly rate + monthly criminality mix) at the last solid month. Aggregate
# rates use the full era slice.
COVERAGE_END_SOLID = pd.Period("2026-02", freq="M")

# apprehension_criminality is ICE's own administrative classification, NOT court
# adjudications. Three canonical values, each prefixed with a leading digit.
CRIM_CONVICTED = "1 Convicted Criminal"          # has a criminal conviction
CRIM_PENDING   = "2 Pending Criminal Charges"    # charged, NOT convicted
CRIM_OTHER     = "3 Other Immigration Violator"  # neither charged nor convicted

# Release-outcome bucketing of stay_release_reason (tribal knowledge).
REMOVED_REASONS = {"Removed", "Voluntary departure", "Voluntary Return"}
RELEASED_INTO_US_REASONS = {
    "Bonded Out - IJ", "Bonded Out - Field Office",
    "Order of recognizance", "Order of Recognizance - Humanitarian",
    "Order of supervision", "Order of Supervision - No SLRRFF",
    "Order of Supervision - Humanitarian", "Order of Supervision - Re-Release",
    "Relief Granted by IJ", "Proceedings Terminated",
    "Paroled", "Paroled - Humanitarian", "Paroled - Public Benefit",
    "Withdrawal",
}
# Everything else on a detained row with a non-null reason (transfer / USMS /
# ORR / court-ordered / died / escaped / title 42) = transferred/other.


def _era(df):
    return np.where(df["apprehension_date"] < TRUMP_CUTOFF, "Biden", "Trump")


def add_derived(df):
    """Attach the derived columns the analysis relies on."""
    df = df.copy()
    df["apprehension_date"] = pd.to_datetime(df["apprehension_date"])
    df["era"] = _era(df)
    df["month"] = df["apprehension_date"].dt.to_period("M")
    return df


def headline(df):
    total = len(df)
    detained = int(df["has_detention_stay"].sum())
    return {
        "total_arrests": total,
        "total_detained": detained,
        "overall_detention_rate_pct": round(100 * detained / total, 1),
        "coverage_start": str(df["month"].min()),
        "coverage_end_solid": str(COVERAGE_END_SOLID),
    }


def administration_split(df):
    out = {}
    for era, g in df.groupby("era"):
        arrests = len(g)
        detained = int(g["has_detention_stay"].sum())
        out[era] = {
            "arrests": arrests,
            "detained": detained,
            "detention_rate_pct": round(100 * detained / arrests, 1),
        }
    return out


def detention_consequences(df):
    """Per-era swift release / open-ended custody / bond / stay length / stints."""
    out = {}
    for era, g in df.groupby("era"):
        arrests = len(g)
        det = g[g["has_detention_stay"]]
        detained = len(det)
        swift = int((~g["has_detention_stay"]).sum())
        still = int(det["stay_book_out_date_time"].isna().sum())
        bond = int((det["bond_posted_amount_lowest_seen"].fillna(0) > 0).sum())
        closed = det[det["stay_book_out_date_time"].notna()].copy()
        stay_days = (
            pd.to_datetime(closed["stay_book_out_date_time"])
            - pd.to_datetime(closed["stay_book_in_date_time"])
        ).dt.total_seconds() / 86400.0
        out[era] = {
            "arrests": arrests,
            "detained": detained,
            "detention_rate_pct": round(100 * detained / arrests, 1),
            "swift_release": swift,
            "swift_release_pct": round(100 * swift / arrests, 1),
            "still_in_custody": still,
            "still_in_custody_pct_of_detained": round(100 * still / detained, 1),
            "bond_posted": bond,
            "bond_posted_pct_of_detained": round(100 * bond / detained, 1),
            "median_stay_days_closed": round(float(stay_days.median()), 1),
            "median_stints_detained": int(det["n_stints"].median()),
        }
    return out


def _release_bucket(row):
    if not row["has_detention_stay"]:
        return "released_no_detention"
    r = row["stay_release_reason"]
    if pd.isna(r):
        return "still_in_custody"
    if r in REMOVED_REASONS:
        return "removed_departed"
    if r in RELEASED_INTO_US_REASONS:
        return "released_into_us"
    return "transferred_other"


def outcome_taxonomy(df):
    df = df.copy()
    df["bucket"] = df.apply(_release_bucket, axis=1)
    out = {}
    for era, g in df.groupby("era"):
        arrests = len(g)
        counts = g["bucket"].value_counts().to_dict()
        row = {"arrests": arrests}
        for b in ["released_no_detention", "removed_departed", "released_into_us",
                  "transferred_other", "still_in_custody"]:
            n = int(counts.get(b, 0))
            row[b] = n
            row[b + "_pct"] = round(100 * n / arrests, 1)
        out[era] = row
    return out


def by_criminality(df, era=None):
    g = df if era is None else df[df["era"] == era]
    rows = []
    for cat, sub in g.groupby("apprehension_criminality"):
        arrests = len(sub)
        detained = int(sub["has_detention_stay"].sum())
        rows.append({
            "category": cat,
            "arrests": arrests,
            "detention_rate_pct": round(100 * detained / arrests, 1),
        })
    return sorted(rows, key=lambda r: -r["arrests"])


def criminality_wording(df, era="Trump"):
    """The correctness trap: 'convicted of nothing' = pending+other;
    'charged with nothing' = other only."""
    g = df[df["era"] == era]
    total = len(g)
    other = int((g["apprehension_criminality"] == CRIM_OTHER).sum())
    pending = int((g["apprehension_criminality"] == CRIM_PENDING).sum())
    return {
        "convicted_of_nothing": {  # NO conviction (pending + other)
            "arrests": pending + other,
            "share_of_era_pct": round(100 * (pending + other) / total, 1),
        },
        "charged_with_nothing": {  # other-immigration-violator ONLY
            "arrests": other,
            "share_of_era_pct": round(100 * other / total, 1),
        },
    }


def removal_signal(df, era="Trump"):
    g = df[df["era"] == era]
    removed = g["stay_release_reason"].isin(REMOVED_REASONS)
    n_removed = int(removed.sum())
    departed_set = int(g["departed_date"].notna().sum())
    # final_order_yes_no literal is uppercase 'YES'
    final_order_yes = int((g["final_order_yes_no"] == "YES").sum())
    # corroboration: of 'Removed'-reason stays, share with a departed_date
    removed_rows = g[g["stay_release_reason"] == "Removed"]
    corrob = round(100 * removed_rows["departed_date"].notna().mean(), 1) if len(removed_rows) else None
    # Top destinations key off the arrest-side departed_date (a departure
    # actually recorded), not the release-reason bucket.
    top = (
        g[g["departed_date"].notna()]["departure_country"].value_counts().head(8)
        .rename_axis("country").reset_index(name="n").to_dict("records")
    )
    return {
        "arrests": len(g),
        "removed_departed": n_removed,
        "removed_departed_pct_of_arrests": round(100 * n_removed / len(g), 1),
        "departed_date_set": departed_set,
        "final_order_yes": final_order_yes,
        "removed_reason_corroborated_by_departed_date_pct": corrob,
        "top_departure_countries": top,
    }


def monthly_detention_rate(df):
    g = df[df["month"] <= COVERAGE_END_SOLID]
    rows = []
    for m, sub in g.groupby("month"):
        arrests = len(sub)
        detained = int(sub["has_detention_stay"].sum())
        rows.append({
            "month": str(m),
            "arrests": arrests,
            "detained": detained,
            "detention_rate_pct": round(100 * detained / arrests, 1),
            "admin": "Biden" if m.to_timestamp() < TRUMP_CUTOFF else "Trump",
        })
    return sorted(rows, key=lambda r: r["month"])


def monthly_criminality_mix(df):
    g = df[(df["era"] == "Trump") & (df["month"] <= COVERAGE_END_SOLID)]
    rows = []
    for m, sub in g.groupby("month"):
        total = len(sub)
        c = int((sub["apprehension_criminality"] == CRIM_CONVICTED).sum())
        p = int((sub["apprehension_criminality"] == CRIM_PENDING).sum())
        o = int((sub["apprehension_criminality"] == CRIM_OTHER).sum())
        rows.append({
            "month": str(m), "total": total,
            "convicted": c, "pending": p, "other": o,
            "convicted_pct": round(100 * c / total, 1),
            "pending_pct": round(100 * p / total, 1),
            "other_pct": round(100 * o / total, 1),
        })
    return sorted(rows, key=lambda r: r["month"])


STAY_LENGTH_BUCKETS = [
    ("<1 day", 0, 1), ("1–3 days", 1, 3), ("3–7 days", 3, 7),
    ("1–2 weeks", 7, 14), ("2–4 weeks", 14, 28), ("1–2 months", 28, 60),
    ("2–3 months", 60, 90), ("3+ months", 90, np.inf),
]


def stay_length_hist(df, era):
    g = df[(df["era"] == era) & df["has_detention_stay"] & df["stay_book_out_date_time"].notna()].copy()
    days = (
        pd.to_datetime(g["stay_book_out_date_time"])
        - pd.to_datetime(g["stay_book_in_date_time"])
    ).dt.total_seconds() / 86400.0
    rows = []
    for label, lo, hi in STAY_LENGTH_BUCKETS:
        n = int(((days >= lo) & (days < hi)).sum())
        rows.append({"bucket": label, "arrests": n})
    return rows


def rate_breakdown(df, col, era="Trump", top=15):
    g = df[df["era"] == era]
    rows = []
    for val, sub in g.groupby(g[col].fillna("(missing)")):
        arrests = len(sub)
        detained = int(sub["has_detention_stay"].sum())
        rows.append({col: val, "arrests": arrests,
                     "detention_rate_pct": round(100 * detained / arrests, 1)})
    return sorted(rows, key=lambda r: -r["arrests"])[:top]