"""Chapter 6: the current FDA label of every chapter-1 drug, from openFDA.

For each brand we keep the sections that describe how the drug behaves in
women: pharmacokinetics, clinical pharmacology, specific populations, pregnancy,
lactation, dosage. Cached per drug by common.fetch. Writes out/labels.jsonl.
"""
import json
import re

from common import OUT, SITE_DATA, fetch

KEEP = ["pharmacokinetics", "clinical_pharmacology", "use_in_specific_populations", "pregnancy", "lactation", "females_and_males_of_reproductive_potential",
        "dosage_and_administration", "clinical_studies", "adverse_reactions", "boxed_warning", "warnings_and_cautions", "nursing_mothers", "teratogenic_effects", "labor_and_delivery"]


def main():
    drugs = json.load(open(f"{SITE_DATA}/chapter1.json"))["drugs"]
    n = 0
    with open(f"{OUT}/labels.jsonl", "w") as out:
        for d in drugs:
            brand = d["brand"]
            q = f'openfda.brand_name:"{brand}"'
            res = fetch("https://api.fda.gov/drug/label.json", params={"search": q, "limit": 5}, as_json=True, sleep=0.3)
            if not res or not res.get("results"):
                # try generic name
                gen = re.split(r"[,;/]| and ", d.get("generic") or "")[0].strip()
                if gen:
                    res = fetch("https://api.fda.gov/drug/label.json", params={"search": f'openfda.generic_name:"{gen}"', "limit": 5}, as_json=True, sleep=0.3)
            if not res or not res.get("results"):
                out.write(json.dumps({"slug": d["slug"], "brand": brand, "found": False}) + "\n")
                continue
            # prefer the prescription label with the latest effective time
            rs = [r for r in res["results"] if "HUMAN PRESCRIPTION DRUG" in (r.get("openfda", {}).get("product_type") or ["HUMAN PRESCRIPTION DRUG"])]
            rs = rs or res["results"]
            r = max(rs, key=lambda x: x.get("effective_time", "0"))
            rec = {"slug": d["slug"], "brand": brand, "found": True, "effective_time": r.get("effective_time"), "set_id": r.get("set_id"),
                   "openfda_brand": r.get("openfda", {}).get("brand_name"), "openfda_generic": r.get("openfda", {}).get("generic_name")}
            for k in KEEP:
                if r.get(k):
                    rec[k] = " ".join(r[k]) if isinstance(r[k], list) else r[k]
            out.write(json.dumps(rec) + "\n"); n += 1
    print(f"  {n} labels of {len(drugs)} drugs")


if __name__ == "__main__":
    main()
