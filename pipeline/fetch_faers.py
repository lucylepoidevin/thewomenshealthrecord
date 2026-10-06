"""Pull adverse-event report counts by patient sex from openFDA FAERS for each
snapshot drug (by brand name, falling back to generic name) plus zolpidem.
Writes pipeline/out/faers_raw.csv. Set OPENFDA_API_KEY to raise rate limits.
"""
import csv
import os
import re
import sys

from common import OUT, fetch

API = "https://api.fda.gov/drug/event.json"
KEY = os.environ.get("OPENFDA_API_KEY")


def count_by_sex(field, value):
    params = {"search": f'{field}:"{value}"', "count": "patient.patientsex"}
    if KEY:
        params["api_key"] = KEY
    j = fetch(API, params=params, as_json=True, sleep=0.3)
    if not j or "results" not in j:
        return None
    d = {r["term"]: r["count"] for r in j["results"]}
    return {"female": d.get(2, 0), "male": d.get(1, 0), "unknown": d.get(0, 0),
            "last_updated": j.get("meta", {}).get("last_updated")}


def clean_brand(b):
    b = re.sub(r"\s*\(.*?\)", "", b or "")
    return b.split("/")[0].split(" CO-PACK")[0].strip()


def main():
    rows = []
    with open(f"{OUT}/snapshots_raw.csv", encoding="utf-8") as f:
        snaps = list(csv.DictReader(f))
    print(f"{len(snaps)} snapshot rows")
    for i, r in enumerate(snaps):
        brand = clean_brand(r["brand"]) if r.get("brand") else ""
        if not brand:
            m = re.search(r"snapshots?-(?:drug-)?([a-z0-9]+)", r["slug"])
            brand = m.group(1).upper() if m else ""
        res, how = None, None
        if brand:
            res = count_by_sex("patient.drug.openfda.brand_name", brand)
            how = "brand"
        if (not res or res["female"] + res["male"] == 0) and r.get("generic"):
            g = re.split(r"[,;]| and ", r["generic"])[0].strip()
            g = re.sub(r"\b(tartrate|chloride|hydrochloride|sodium|sulfate|acetate|mesylate|maleate|fumarate|citrate|phosphate|succinate|besylate|dihydrochloride|injection|tablets?)\b", "", g).strip()
            if g:
                res2 = count_by_sex("patient.drug.openfda.generic_name", g)
                if res2 and res2["female"] + res2["male"] > 0:
                    res, how = res2, "generic"
        row = {"slug": r["slug"], "query": how, **(res or {})}
        rows.append(row)
        if i % 25 == 0:
            print(f"  {i}/{len(snaps)} {brand}: {res}")
            sys.stdout.flush()
    z = count_by_sex("patient.drug.openfda.generic_name", "zolpidem")
    rows.append({"slug": "zolpidem", "query": "generic", **(z or {})})
    with open(f"{OUT}/faers_raw.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=["slug", "query", "female", "male", "unknown", "last_updated"])
        w.writeheader()
        w.writerows(rows)
    ok = sum(1 for r in rows if r.get("female") is not None and (r.get("female", 0) + r.get("male", 0)) > 0)
    print(f"done: {ok}/{len(rows)} with FAERS counts")


if __name__ == "__main__":
    main()
