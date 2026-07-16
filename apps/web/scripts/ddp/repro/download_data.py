#!/usr/bin/env python3
"""
Download the Deportation Data Project (DDP) joined arrests-detention-stays
dataset used by this analysis.

Source: https://deportationdata.org  (repo: deportationdata/ice), released CC-0.

Tribal knowledge baked in here:
  * The repo stores everything under data/ via Git LFS, so the GitHub Contents
    API returns ~133-byte LFS *pointer* files, NOT the real bytes. The actual
    payload is only reachable through the raw URL below.
  * The raw download does NOT require auth or a User-Agent, but we send one
    anyway (the GitHub REST API 403s without it; harmless on raw).
  * Format choice: parquet (~74 MB) is by far the smallest. The same data as
    .dta is ~1.5 GB and .sav ~883 MB. Parquet needs `pyarrow` (a project dep).
"""
from __future__ import annotations
import sys
import urllib.request
from pathlib import Path

RAW_URL = (
    "https://github.com/deportationdata/ice/raw/refs/heads/main/"
    "data/joined-arrests-detention-stays-latest.parquet"
)
DEST = Path(__file__).parent / "data" / "joined-arrests-detention-stays-latest.parquet"
CHUNK = 1 << 20  # 1 MiB


def _remote_size() -> int | None:
    req = urllib.request.Request(RAW_URL, method="HEAD",
                                 headers={"User-Agent": "ddp-rhetoric-vs-numbers"})
    with urllib.request.urlopen(req) as r:
        cl = r.headers.get("Content-Length")
        return int(cl) if cl else None


def download() -> Path:
    DEST.parent.mkdir(parents=True, exist_ok=True)
    remote = _remote_size()

    if DEST.exists() and remote and DEST.stat().st_size == remote:
        print(f"Already present and complete: {DEST} ({DEST.stat().st_size:,} bytes)")
        return DEST

    print(f"Downloading DDP joined arrests-detention-stays dataset")
    print(f"  from {RAW_URL}")
    print(f"  to   {DEST}")
    if remote:
        print(f"  size ~{remote:,} bytes (~{remote/1e6:.0f} MB)")

    req = urllib.request.Request(RAW_URL, headers={"User-Agent": "ddp-rhetoric-vs-numbers"})
    got = 0
    with urllib.request.urlopen(req) as resp, open(DEST, "wb") as fh:
        while True:
            block = resp.read(CHUNK)
            if not block:
                break
            fh.write(block)
            got += len(block)
            if remote:
                pct = 100 * got / remote
                print(f"\r  {got/1e6:7.1f} / {remote/1e6:.0f} MB ({pct:5.1f}%)", end="")
    print()

    size = DEST.stat().st_size
    if remote and size != remote:
        print(f"WARNING: downloaded {size:,} bytes but expected {remote:,}.",
              file=sys.stderr)
    else:
        print(f"Done: {size:,} bytes")
    return DEST


if __name__ == "__main__":
    download()