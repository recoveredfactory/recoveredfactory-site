#!/usr/bin/env python3
"""Crop a PDF to the lines holding a quoted passage, and mark a phrase in it.

  pdfcrop.py PDF OUT.png --find "passage text" [--mark "phrase"] [--page N]
             [--context 1] [--skip N] [--dpi 300] [--padx 8] [--pady 0.5]

Prints JSON: {page, png, width, height, aspect, marks, dims}, the marks (the
highlighter) and dims (words and context lines outside the quote, shown faded)
as fractions of the crop: the shape og.mjs's picked image takes.

Text-anchored on purpose: whoever names the image quotes the document, never
pixel coordinates, so the crop survives a re-render at any size. This is how
the deck's one picked image is made from a record's social.pick (pick.mjs).
Needs poppler's pdftotext and pdftoppm on the PATH.
"""
import argparse, json, re, shutil, subprocess, sys, tempfile, xml.etree.ElementTree as ET

ap = argparse.ArgumentParser()
ap.add_argument("pdf"); ap.add_argument("out")
ap.add_argument("--find", required=True)
ap.add_argument("--mark", action="append", default=[])
ap.add_argument("--page", type=int)
ap.add_argument("--context", type=int, default=0, help="whole lines of the same column to add above and below, dimmed")
ap.add_argument("--skip", type=int, default=0, help="words from another column the match may step over")
ap.add_argument("--dpi", type=int, default=300)
ap.add_argument("--padx", type=float, default=8, help="points left and right of the passage")
ap.add_argument("--pady", type=float, default=0.5, help="points above and below; tight-set columns reach the next line past ~1")
a = ap.parse_args()

norm = lambda s: re.sub(r"[^a-z0-9]+", "", s.lower().replace("‘", "'").replace("’", "'"))

def words_by_page(pdf, first=None, last=None):
    cmd = ["pdftotext", "-bbox-layout"]
    if first: cmd += ["-f", str(first), "-l", str(last or first)]
    xml = subprocess.run(cmd + [pdf, "-"], capture_output=True, text=True, check=True).stdout
    xml = re.sub(r'xmlns="[^"]+"', "", xml, count=1)
    root = ET.fromstring(xml)
    for pi, page in enumerate(root.iter("page"), start=first or 1):
        out = []
        for li, line in enumerate(page.iter("line")):
            lx = [float(line.get(k)) for k in ("xMin", "yMin", "xMax", "yMax")]
            for w in line.iter("word"):
                out.append({"t": w.text or "", "line": li, "lbox": lx,
                            "box": [float(w.get(k)) for k in ("xMin", "yMin", "xMax", "yMax")]})
        yield pi, out

def find_span(words, phrase, max_skip=0):
    """Indexes of the words that spell the phrase, ignoring punctuation and hyphen breaks.

    max_skip lets the match step over words that belong to a neighbouring column
    (a court caption's right-hand block lands between its left-hand lines in
    reading order). Only the matched words decide the crop."""
    target = norm(phrase)
    keys = [norm(w["t"]) for w in words]
    for i in range(len(words)):
        if not keys[i] or not target.startswith(keys[i]): continue
        acc, hits, skipped = "", [], 0
        for j in range(i, len(words)):
            if keys[j] and target.startswith(acc + keys[j]):
                acc += keys[j]; hits.append(j); skipped = 0
                if acc == target: return hits
            elif not keys[j]:
                continue
            else:
                skipped += 1
                if skipped > max_skip: break
    return None

pages = words_by_page(a.pdf, a.page, a.page)
hit = None
for pno, words in pages:
    span = find_span(words, a.find, a.skip)
    if span: hit = (pno, words, span); break
if not hit: sys.exit(f"not found: {a.find!r}")
pno, words, idx = hit

# Whole lines, not just the words: a crop that starts mid-line reads as tampered.
lines = sorted({words[k]["line"] for k in idx})
boxes = [next(w["lbox"] for w in words if w["line"] == l) for l in lines]
# Context: the nearest whole lines of the same column above and below, shown
# dimmed so the quote reads as part of a page rather than a pull quote.
px0, py0 = min(b[0] for b in boxes), min(b[1] for b in boxes)
px1, py1 = max(b[2] for b in boxes), max(b[3] for b in boxes)
all_lines = {}
for w in words: all_lines.setdefault(w["line"], w["lbox"])
def same_column(b):
    overlap = min(b[2], px1) - max(b[0], px0)
    return overlap > 0.5 * (px1 - px0)
above = sorted((b for b in all_lines.values() if same_column(b) and b[3] <= py0 + 0.5), key=lambda b: -b[3])[:a.context]
below = sorted((b for b in all_lines.values() if same_column(b) and b[1] >= py1 - 0.5), key=lambda b: b[1])[:a.context]
context = above + below
boxes = boxes + context
x0 = min(b[0] for b in boxes) - a.padx; y0 = min(b[1] for b in boxes) - a.pady
x1 = max(b[2] for b in boxes) + a.padx; y1 = max(b[3] for b in boxes) + a.pady

scale = a.dpi / 72
X, Y, W, H = (round(v * scale) for v in (x0, y0, x1 - x0, y1 - y0))
with tempfile.TemporaryDirectory() as d:
    subprocess.run(["pdftoppm", "-f", str(pno), "-l", str(pno), "-r", str(a.dpi), "-x", str(X), "-y", str(Y),
                    "-W", str(W), "-H", str(H), "-png", "-singlefile", a.pdf, f"{d}/crop"], check=True)
    shutil.move(f"{d}/crop.png", a.out)

marks = []
sub = [words[k] for k in idx]
for m in a.mark:
    s = find_span(sub, m)
    if not s: sys.exit(f"mark not in passage: {m!r}")
    ms = [sub[k] for k in s]
    for l in sorted({w["line"] for w in ms}):  # one rectangle per line the phrase runs across
        ws = [w["box"] for w in ms if w["line"] == l]
        bx0, by0 = min(b[0] for b in ws) - 3, min(b[1] for b in ws) - 1.5
        bx1, by1 = max(b[2] for b in ws) + 3, max(b[3] for b in ws) + 1.5
        marks.append({"l": round((bx0 - x0) / (x1 - x0), 4), "t": round((by0 - y0) / (y1 - y0), 4),
                      "w": round((bx1 - bx0) / (x1 - x0), 4), "h": round((by1 - by0) / (y1 - y0), 4)})

# Words that share the passage's first and last lines but aren't in it: dimmed
# by the renderer, not hidden, so the crop still shows the document as printed.
dims = []
first_line, last_line = words[idx[0]]["line"], words[idx[-1]]["line"]
for k, w in enumerate(words):
    if k in idx or w["line"] not in (first_line, last_line): continue
    if w["line"] == first_line and k > idx[0] and w["line"] != last_line: continue
    if w["line"] == last_line and k < idx[-1] and w["line"] != first_line: continue
    if first_line == last_line and idx[0] < k < idx[-1]: continue
    b = w["box"]
    dims.append({"l": round((b[0] - 1 - x0) / (x1 - x0), 4), "t": round((b[1] - 1 - y0) / (y1 - y0), 4),
                 "w": round((b[2] - b[0] + 2) / (x1 - x0), 4), "h": round((b[3] - b[1] + 2) / (y1 - y0), 4)})

for b in context:
    dims.append({"l": round((b[0] - 1 - x0) / (x1 - x0), 4), "t": round((b[1] - 0.5 - y0) / (y1 - y0), 4),
                 "w": round((b[2] - b[0] + 2) / (x1 - x0), 4), "h": round((b[3] - b[1] + 1) / (y1 - y0), 4)})

print(json.dumps({"page": pno, "png": a.out, "width": W, "height": H, "aspect": round(W / H, 4), "marks": marks, "dims": dims}))
