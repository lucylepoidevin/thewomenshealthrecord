"""Chapter 3 sensitivity: how the headline numbers move under other reasonable choices."""
import json
import numpy as np
from build_chapter3 import load_rcdc, load_who, build_year, summarize, LATEST_FY
from common import SITE_DATA

rcdc = load_rcdc(); who = load_who(2023)
base_rows, fit = build_year(rcdc, who, [LATEST_FY])


def variant(label, rows, thr=60):
    rows = [dict(r) for r in rows]
    x = np.log10([r["dalys_k"] for r in rows]); y = np.log10([r["funding_m"] for r in rows])
    b, a = np.polyfit(x, y, 1)
    for r, xi, yi in zip(rows, x, y):
        r["expected_m"] = 10 ** (a + b * xi); r["ratio_to_expected"] = 10 ** (yi - (a + b * xi))
        r["skew"] = "female" if r["female_share"] >= thr else "male" if r["female_share"] <= 100 - thr else "balanced"
    s = summarize(rows)
    mig = next((r for r in rows if r["disease"] == "Migraine"), None)
    return {"label": label, "n": s["n"], "n_female": s["n_female"], "n_male": s["n_male"], "median_ratio": s["median_ratio_to_expected"], "share_underfunded": s["share_underfunded"], "female_shortfall_m": s["female_shortfall_m"], "slope": round(b, 3), "migraine_ratio": round(mig["ratio_to_expected"], 2) if mig else None}


drop_global = [r for r in base_rows if r["disease"] not in ("HIV/AIDS", "Tuberculosis")]
drop_alz = [r for r in base_rows if r["disease"] != "Alzheimer's and other dementias"]
out = [
    variant("Main analysis (60% threshold, all 67 diseases)", base_rows),
    variant("Without HIV and tuberculosis (global-mission funding)", drop_global),
    variant("Without Alzheimer's", drop_alz),
    variant("Without HIV, tuberculosis and Alzheimer's", [r for r in drop_global if r["disease"] != "Alzheimer's and other dementias"]),
    variant("Threshold 55% instead of 60%", base_rows, 55),
    variant("Threshold 70% instead of 60%", base_rows, 70),
    variant("FY2025 funding instead of FY2024", build_year(rcdc, who, ["Y2025"])[0]),
    variant("2023 burden with FY2023 funding", build_year(rcdc, load_who(2023), ["Y2023"])[0]),
]
for v in out:
    print(f"  {v['label']:56} n={v['n']} F/M {v['n_female']}/{v['n_male']}  median ratio F {v['median_ratio']['female']} M {v['median_ratio']['male']}  under F {v['share_underfunded']['female']}% M {v['share_underfunded']['male']}%  shortfall ${v['female_shortfall_m']}M  migraine {v['migraine_ratio']}×")
json.dump(out, open(f"{SITE_DATA}/chapter3_sensitivity.json", "w"), indent=1)
