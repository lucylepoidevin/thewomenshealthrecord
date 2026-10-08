"""Chapter 2 adjusted models: survey-weighted logistic regressions with
cluster-robust (PSU) standard errors. Writes site/public/data/chapter2_models.json."""
import json
import numpy as np
import pandas as pd
import statsmodels.api as sm
import statsmodels.formula.api as smf

from build_chapter2 import load, GROUPS
from common import SITE_DATA

d = load()
chest_codes = {10500, 10501, 10502, 10503}
d["complaint"] = "other"
for gid, _, codes in GROUPS:
    d.loc[d["rfv1"].isin(codes), "complaint"] = gid
d["pain_rec"] = d["pain"].where(d["pain"] >= 0)
d["age_band"] = pd.cut(d["age"], [17, 44, 64, 200], labels=["18-44", "45-64", "65+"])
d["ems_bin"] = (d["ems"] == 1).astype(int)
d["femalei"] = d["female"].astype(int)
d["yearf"] = d["year"].astype(str)


def fit(df, formula, label, note=""):
    df = df.dropna(subset=[c for c in ["pain_rec"] if c in formula])
    mod = smf.glm(formula, data=df, family=sm.families.Binomial(), freq_weights=df["w"] / df["w"].mean())
    res = mod.fit(cov_type="cluster", cov_kwds={"groups": df["psu"].astype(str) + "_" + df["strat"].astype(str)})
    b, se = res.params["femalei"], res.bse["femalei"]
    out = {"label": label, "note": note, "n": int(len(df)), "or": round(float(np.exp(b)), 2), "lo": round(float(np.exp(b - 1.96 * se)), 2), "hi": round(float(np.exp(b + 1.96 * se)), 2), "p": round(float(res.pvalues["femalei"]), 3), "formula": formula}
    print(f"  {label:58} OR {out['or']} [{out['lo']}, {out['hi']}] p={out['p']} n={out['n']}")
    return out


pain = d[d["complaint"] != "other"].copy()
tri = pain[pain["triage"] >= 1].copy(); tri["urgent_i"] = tri["urgent"].astype(int)
mi = d[d["mi"]].copy(); mi["cardenz_i"] = mi["cardenz_done"].astype(int); mi["urgent_i"] = mi["urgent"].astype(int); mi["chest_i"] = mi["rfv1"].isin(chest_codes).astype(int)
sev = pain[pain["severe"] & (pain["complaint"] == "abdominal")].copy(); sev["op_i"] = sev["op_ed"].astype(int)
chest = tri[tri["complaint"] == "chest"].copy()
chest_young = chest[chest["age"] < 45].copy()
head = pain[pain["complaint"] == "headache"].copy(); head["an_i"] = head["an_ed"].astype(int)
print("Adjusted odds ratios, women vs men:")
models = {
    "urgent_raw": fit(tri, "urgent_i ~ femalei", "Triaged urgent, pain visits: unadjusted"),
    "urgent_adj": fit(tri, "urgent_i ~ femalei + C(age_band) + C(complaint) + yearf", "… adjusted for age band, complaint, year"),
    "urgent_adj_pain": fit(tri, "urgent_i ~ femalei + C(age_band) + C(complaint) + pain_rec + yearf", "… plus reported pain score", "visits with a recorded pain score"),
    "urgent_adj_full": fit(tri, "urgent_i ~ femalei + C(age_band) + C(complaint) + pain_rec + ems_bin + yearf", "… plus arrival by ambulance", "visits with a recorded pain score"),
    "chest_urgent_adj": fit(chest, "urgent_i ~ femalei + C(age_band) + pain_rec + ems_bin + yearf", "Triaged urgent, chest pain: adjusted for age, pain score, ambulance, year", "visits with a recorded pain score"),
    "chest_young_urgent_adj": fit(chest_young, "urgent_i ~ femalei + pain_rec + ems_bin + yearf", "Triaged urgent, chest pain under 45: adjusted for pain score, ambulance, year", "visits with a recorded pain score"),
    "headache_analgesic_adj": fit(head, "an_i ~ femalei + C(age_band) + yearf", "Any painkiller, headache: adjusted for age, year"),
    "opioid_severe_abd_adj": fit(sev, "op_i ~ femalei + C(age_band) + yearf", "Opioid in ED, severe abdominal pain: adjusted for age, year"),
    "mi_cardenz_raw": fit(mi, "cardenz_i ~ femalei", "Cardiac enzymes ordered, heart attack: unadjusted"),
    "mi_cardenz_adj": fit(mi, "cardenz_i ~ femalei + C(age_band) + chest_i + yearf", "… adjusted for age band, chest-pain complaint, year"),
    "mi_urgent_adj": fit(mi[mi["triage"] >= 1], "urgent_i ~ femalei + C(age_band) + chest_i + ems_bin + yearf", "Triaged urgent, heart attack: adjusted for age, complaint, ambulance, year"),
}
json.dump({"models": models, "note": "Survey-weighted logistic regressions (weights normalised to mean 1); standard errors clustered on stratum x PSU. Odds ratio for female patients relative to male."}, open(f"{SITE_DATA}/chapter2_models.json", "w"), indent=1)
