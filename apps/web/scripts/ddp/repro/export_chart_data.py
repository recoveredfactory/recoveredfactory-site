#!/usr/bin/env python3
"""
Independently recompute the chart data for the DDP "rhetoric vs. numbers"
post from the raw DDP dataset, for cross-checking against the
`ddp_rhetoric_chart_data` artifact that scripts/ddp/pull.mjs writes to
src/lib/data/ddp-chart-data.json (matching key names, so the files diff
cleanly on the sections this reproduces).

Usage:
    uv run python download_data.py        # once, fetches the parquet
    uv run python export_chart_data.py    # writes ../out/ddp-chart-data-local.json
"""
from __future__ import annotations
import json
from pathlib import Path

import pandas as pd

import ddp_analysis as a

PARQUET = Path(__file__).parent / "data" / "joined-arrests-detention-stays-latest.parquet"
OUT = Path(__file__).parent.parent / "out" / "ddp-chart-data-local.json"


def main() -> None:
    df = a.add_derived(pd.read_parquet(PARQUET))

    taxonomy = a.outcome_taxonomy(df)
    crim = {r["category"]: r for r in a.by_criminality(df, era="Trump")}

    payload = {
        "headline": a.headline(df),
        "monthly": a.monthly_detention_rate(df),
        "outcome_taxonomy": {
            "trump": taxonomy["Trump"],
            "biden": taxonomy["Biden"],
        },
        "removal_signal": a.removal_signal(df, era="Trump"),
        "criminality_precision": {
            "convicted_criminal": {
                "arrests": crim[a.CRIM_CONVICTED]["arrests"],
                "detention_rate_pct": crim[a.CRIM_CONVICTED]["detention_rate_pct"],
            },
            "pending_charges": {
                "arrests": crim[a.CRIM_PENDING]["arrests"],
                "detention_rate_pct": crim[a.CRIM_PENDING]["detention_rate_pct"],
            },
            "other_immigration_violator": {
                "arrests": crim[a.CRIM_OTHER]["arrests"],
                "detention_rate_pct": crim[a.CRIM_OTHER]["detention_rate_pct"],
            },
        },
        "monthly_criminality_mix": a.monthly_criminality_mix(df),
        "stay_length_hist": {
            "trump": a.stay_length_hist(df, "Trump"),
            "biden": a.stay_length_hist(df, "Biden"),
        },
        "administration_split": {
            "biden_oct2022_jan2025": a.administration_split(df)["Biden"],
            "trump_jan2025_on": a.administration_split(df)["Trump"],
        },
        "detention_consequences": {
            "biden_oct2022_jan2025": a.detention_consequences(df)["Biden"],
            "trump_jan2025_on": a.detention_consequences(df)["Trump"],
        },
        "criminality_wording": a.criminality_wording(df, era="Trump"),
    }

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(payload, indent=2))
    print(f"Wrote {OUT} ({OUT.stat().st_size:,} bytes)")


if __name__ == "__main__":
    main()
