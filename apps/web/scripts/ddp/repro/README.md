# DDP "rhetoric vs. numbers" — reproducible analysis

Independently reproduces the figures in *"ICE jails nearly everyone it arrests
and deports most of them"* directly from the **raw** [Deportation Data
Project](https://deportationdata.org) data, so you can check the work end to end.

The whole thing is driven by [`uv`](https://docs.astral.sh/uv/) and
[marimo](https://marimo.io/) — no manual virtualenv.

## Quickstart

```bash
# 1. Download the source dataset (~74 MB parquet) into ./data/
uv run python download_data.py

# 2. Open the reproducible notebook
uv run marimo edit notebook.py
#    (or run it headless / as an app)
uv run marimo run notebook.py
```

`uv` reads `pyproject.toml`, creates the environment, and installs
`marimo`, `pandas`, `pyarrow`, and `altair` on first run.

## What's here

| File | Purpose |
|---|---|
| `download_data.py` | Fetches `joined-arrests-detention-stays-latest.parquet` from the `deportationdata/ice` repo via its **raw** URL (the `data/` tree is Git LFS, so the GitHub API only returns ~133-byte pointer files — the raw URL is the only way to the real bytes). |
| `ddp_analysis.py` | The single main analysis module — all figures as pure pandas functions over the arrests DataFrame. Import it anywhere; the notebook is just a presentation layer over it. |
| `notebook.py` | The marimo notebook: headline, the two-enforcement-regime split, detention consequences, outcome taxonomy, criminality, per-person removal traceability, stay-length distribution, and where/how breakdowns — each with the DDP caveats stated inline. |
| `pyproject.toml` | uv/PEP-621 project + dependencies. |

## The dataset

- **One row per deduplicated ICE arrest episode.** A detention stay is attached
  when its book-in falls within −5 to +10 days of the apprehension.
- Coverage begins **October 2022**; the most recent months arrive in lagged,
  incomplete batches, so the monthly series is capped at the last solid month
  (**2026-02**).
- **Scope:** ICE **arrests and their consequences** — *not* ICE detention as a
  whole. Detention stays with no ICE arrest (most often border/CBP) are excluded.
  For a detention-focused analysis, use the standalone detention-stays /
  detention-stints datasets.
- `apprehension_criminality` is ICE's own **administrative** classification, not
  a court adjudication. Wording rule: *"convicted of nothing"* = pending charges
  **+** other-immigration-violator; *"charged with nothing"* = other-immigration
  -violator **only** (the pending-charges group *has* been charged).

## Out of scope for this reproduction

The published piece also cites 287(g) local-agreement counts and DHS
press-release rhetoric tallies. Those come from separate trackers, **not** this
arrests dataset, so they're not recomputed here.

All DDP data is released **CC-0**.