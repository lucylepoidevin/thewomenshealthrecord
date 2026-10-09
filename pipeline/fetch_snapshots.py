"""Scrape FDA Drug Trials Snapshots (2015-present) for % female enrollment.

Current snapshots live on fda.gov; 2014-2022 snapshots were removed from the
live index and are fetched from the Internet Archive capture of the old index.
Writes pipeline/out/snapshots_raw.csv
"""
import csv
import json
import os
import re
import sys
from urllib.parse import urljoin

from common import CACHE, OUT, fetch, html_to_text
from parse_snapshot import parse_sex
from parse_tables import parse_html_tables

LIVE_INDEX = "https://www.fda.gov/drugs/drug-approvals-and-databases/drug-trials-snapshots"
ARCHIVE_INDEX = "https://web.archive.org/web/20230127052325/https://www.fda.gov/drugs/drug-approvals-and-databases/drug-trials-snapshots"
LINK_RE = re.compile(r'href="([^"]*drug-?tria?i?ls?-snapshots?-[^"#]+)"', re.I)

PAIR = r"(\d[\d,]*)\s*\(\s*([\d.]+)\s*%?\s*\)"


def collect_urls():
    urls = {}
    live = fetch(LIVE_INDEX) or ""
    for m in LINK_RE.finditer(live):
        u = urljoin("https://www.fda.gov", m.group(1))
        urls[u.split("/")[-1].lower()] = ("live", u)
    arch = fetch(ARCHIVE_INDEX) or ""
    for m in LINK_RE.finditer(arch):
        href = m.group(1)
        slug = href.split("/")[-1].lower()
        if slug in urls:
            continue
        if href.startswith("/web/"):
            href = "https://web.archive.org" + href
        urls[slug] = ("archive", href)
    return urls


def last_pair_after(label, text):
    """Find 'Female 30 (25.6) 28 (23.5) 58 (24.6)' and return the last (n, pct)."""
    best = None
    for m in re.finditer(label + r"\b\s*((?:\s*" + PAIR + r"|\s*\d[\d,]*(?![\d.,]*\s*\())+)", text):
        chunk = m.group(1)
        pairs = re.findall(PAIR, chunk)
        if pairs:
            n, pct = pairs[-1]
            cand = (int(n.replace(",", "")), float(pct))
        else:
            nums = re.findall(r"\d[\d,]*", chunk)
            if not nums:
                continue
            cand = (int(nums[-1].replace(",", "")), None)
        yield cand


def parse(text):
    rec = {}
    m = re.search(r"Drug Trials? Snapshots?:\s*([A-Z0-9][A-Z0-9 \-/&.']+?)\s*\|", text)
    rec["brand"] = m.group(1).strip() if m else None
    m = re.search(r"(?:Original )?Approval [Dd]ate\s*:\s*([A-Z][a-z]+ \d{1,2},? \d{4})", text)
    rec["approval_date"] = m.group(1) if m else None
    if rec["brand"]:
        m = re.search(re.escape(rec["brand"]) + r"\s*\(([^)]{3,120})\)", text)
        rec["generic"] = m.group(1).strip() if m else None
    m = re.search(r"What is (?:the|this) drug (?:used )?for\??\s*:?\s*", text)
    rec["indication"] = None
    if m:
        tail = text[m.end(): m.end() + 900]
        cut = re.search(r"\s+How is (?:the|this) drug|\s+What are the benefits|\s+Who participated", tail)
        ind = tail[: cut.start()] if cut else tail[:400]
        if len(ind) > 420:  # keep the first couple of sentences
            ind = ".".join(ind[:420].split(".")[:-1]) + "."
        rec["indication"] = ind.strip() or None
    m = re.search(r"(?:trials?|stud(?:y|ies))\s+(?:of|in|with|that (?:enrolled|included))\s+(\d[\d,]*)\s+(?:adult |pediatric |healthy |adolescent )?(?:patients|participants|subjects|adults|women|men|volunteers)", text, re.I)
    rec["total_n"] = int(m.group(1).replace(",", "")) if m else None

    res = parse_sex(text)
    if res:
        rec.update(res)
    else:
        rec["method"] = "unparsed"
    return rec


def main():
    urls = collect_urls()
    # pages the archive holds that neither index listed (found with the Wayback CDX index; mostly 2021 approvals)
    extra_path = os.path.join(CACHE, "ch1_missing_snapshots.json")
    if os.path.exists(extra_path):
        for original, ts in json.load(open(extra_path)):
            slug = original.rstrip("/").rsplit("/", 1)[-1].lower()
            if slug not in urls:
                urls[slug] = ("archive-cdx", f"https://web.archive.org/web/{ts}/{original}")
        print(f"  + archive-cdx pages: {sum(1 for v in urls.values() if v[0] == 'archive-cdx')}")
    print(f"{len(urls)} snapshot URLs collected")
    # Pre-fetch into the cache: live pages first (fast), then archived pages with a small pool.
    from concurrent.futures import ThreadPoolExecutor
    items = sorted(urls.items(), key=lambda kv: (kv[1][0] != "live", kv[0]))
    live = [u for _, (src, u) in items if src == "live"]
    arch = [u for _, (src, u) in items if src != "live"]
    for u in live:
        fetch(u, sleep=0.3)
    print(f"live pages cached ({len(live)}); fetching {len(arch)} archived pages"); sys.stdout.flush()
    with ThreadPoolExecutor(max_workers=1) as ex:
        list(ex.map(lambda u: fetch(u, sleep=3.0), arch))
    rows = []
    for i, (slug, (src, u)) in enumerate(sorted(urls.items())):
        html = fetch(u, sleep=0.5 if src == "live" else 1.5)  # cached, or a final retry
        if not html:
            rows.append({"slug": slug, "source": src, "url": u, "method": "fetch_failed"})
            continue
        rec = parse(html_to_text(html))
        if rec.get("method") in ("unparsed", "pct", "all-female", "all-male") or rec.get("method", "").startswith("tables"):
            alt = parse_html_tables(html)
            if alt and alt.get("female_n") is not None:
                rec.update(alt)
        rec.update({"slug": slug, "source": src, "url": u})
        rows.append(rec)
        if i % 25 == 0:
            print(f"  {i}/{len(urls)} {slug}: {rec.get('method')} F={rec.get('female_n')} M={rec.get('male_n')}")
            sys.stdout.flush()
    cols = ["slug", "brand", "generic", "approval_date", "indication", "female_n", "male_n", "female_pct_only", "total_n", "method", "source", "url"]
    with open(f"{OUT}/snapshots_raw.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=cols, extrasaction="ignore")
        w.writeheader()
        w.writerows(rows)
    from collections import Counter
    print(Counter(r.get("method", "").split("(")[0] for r in rows))


if __name__ == "__main__":
    main()
