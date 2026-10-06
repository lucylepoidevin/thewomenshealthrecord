"""Cross-check our parsed % female against Carmeli et al. (2015-21). QA only."""
import csv
import re

from common import CACHE, OUT

ours = {}
with open(f"{OUT}/snapshots_raw.csv", encoding="utf-8") as f:
    for r in csv.DictReader(f):
        if r["female_n"] and r["male_n"]:
            fn, mn = float(r["female_n"]), float(r["male_n"])
            if fn + mn > 0:
                ours[(r["brand"] or "").upper().strip()] = (fn / (fn + mn) * 100, r["slug"], r["method"])

acc = {}
with open(f"{CACHE}/carmeli_2015-21.csv", encoding="utf-8-sig") as f:
    for r in csv.DictReader(f):
        try:
            b = re.sub(r"-\d+$", "", r["Brand_Name"].upper().strip())
            fem, n = float(r["Female"]), float(r["Enrollment"] or 1)
            a = acc.setdefault(b, [0.0, 0.0]); a[0] += fem * n; a[1] += n
        except ValueError:
            pass
ref = {b: a[0] / a[1] for b, a in acc.items() if a[1] > 0}

matched, diffs, bad = 0, [], []
for b, v in ref.items():
    if b in ours:
        matched += 1
        d = ours[b][0] - v
        diffs.append(abs(d))
        if abs(d) > 5:
            bad.append((b, round(ours[b][0], 1), v, ours[b][2]))
print(f"Carmeli drugs: {len(ref)}; matched to ours: {matched}; our parsed total: {len(ours)}")
if diffs:
    diffs.sort()
    print(f"median |diff| = {diffs[len(diffs)//2]:.1f} pts; within 2 pts: {sum(d <= 2 for d in diffs)}/{len(diffs)}")
print(f"{len(bad)} drugs differ by >5 pts (ours, carmeli, method):")
for b in sorted(bad, key=lambda x: -abs(x[1] - x[2]))[:40]:
    print("  ", b)
missing = [b for b in ref if b not in ours]
print(f"{len(missing)} Carmeli drugs we did not parse: {missing[:40]}")
