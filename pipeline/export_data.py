"""Write the open-data CSVs and data dictionary that the site's Data page serves."""
import csv
import json
import os

from common import SITE_DATA

OUT = os.path.join(SITE_DATA, "csv")
os.makedirs(OUT, exist_ok=True)
files = []


def write(name, rows, cols, description, dictionary):
    path = os.path.join(OUT, name)
    with open(path, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=cols, extrasaction="ignore")
        w.writeheader(); w.writerows(rows)
    files.append({"file": name, "rows": len(rows), "description": description, "columns": dictionary})
    print(f"  {name}: {len(rows)} rows")


c1 = json.load(open(f"{SITE_DATA}/chapter1.json"))
write("chapter1_drugs.csv", [{**d, "nih": None} for d in c1["drugs"]],
      ["slug", "brand", "generic", "year", "category", "indication", "trial_n", "trial_female_pct", "enrollment_source", "faers_n", "faers_female_pct", "gap", "meps_users_n", "meps_female_pct", "rate_ratio", "rate_ratio_lo", "rate_ratio_hi", "snapshot_url"],
      "Chapter 1: every novel drug approved since 2015 with a parsed FDA Drug Trials Snapshot, its FAERS adverse-event report split by sex, and (where available) MEPS prescription users by sex.",
      {"brand": "Brand name as on the FDA snapshot", "year": "FDA approval year", "category": "Therapeutic area assigned by keyword rules on the FDA indication text", "trial_n": "Participants counted in the snapshot's demographics tables (may double-count overlapping populations; use the share, not the count)", "trial_female_pct": "Share of pivotal-trial participants who were women", "enrollment_source": "fda-snapshot, or carmeli-2023 where the archived page could not be retrieved", "faers_n": "FAERS reports with a recorded sex (openFDA, brand-name query)", "faers_female_pct": "Share of those reports from women", "gap": "faers_female_pct minus trial_female_pct, percentage points", "meps_users_n": "Unweighted MEPS person-years with a fill, 2018-2024", "meps_female_pct": "Weighted share of users who are women", "rate_ratio": "(female:male reports) / (female:male users); lo/hi are a 95% interval from the survey share's sampling error"})

c2 = json.load(open(f"{SITE_DATA}/chapter2.json"))
rows = []
for g in c2["groups"] + [{"id": "all", "label": "All pain complaints", "metrics": c2["all_pain"]["metrics"]}]:
    for k, v in g["metrics"].items():
        if v:
            rows.append({"complaint": g["id"], "measure": k, "women_est": v["women"]["est"], "women_lo": v["women"]["lo"], "women_hi": v["women"]["hi"], "women_n": v["women"]["n"], "men_est": v["men"]["est"], "men_lo": v["men"]["lo"], "men_hi": v["men"]["hi"], "men_n": v["men"]["n"], "diff": v["diff"], "diff_lo": v["diff_lo"], "diff_hi": v["diff_hi"]})
for k, v in c2["heart_attack"]["metrics"].items():
    if v:
        rows.append({"complaint": "heart_attack", "measure": k, "women_est": v["women"]["est"], "women_lo": v["women"]["lo"], "women_hi": v["women"]["hi"], "women_n": v["women"]["n"], "men_est": v["men"]["est"], "men_lo": v["men"]["lo"], "men_hi": v["men"]["hi"], "men_n": v["men"]["n"], "diff": v["diff"], "diff_lo": v["diff_lo"], "diff_hi": v["diff_hi"]})
write("chapter2_ed_estimates.csv", rows, ["complaint", "measure", "women_est", "women_lo", "women_hi", "women_n", "men_est", "men_lo", "men_hi", "men_n", "diff", "diff_lo", "diff_hi"],
      "Chapter 2: survey-weighted estimates by patient sex for NHAMCS ED visits 2018-2022, adults 18+, by pain complaint and for heart-attack visits.",
      {"complaint": "Reason-for-visit group (abdominal, chest, back, headache, limb, flank, all) or heart_attack (ICD-10 I21/I22 in any diagnosis)", "measure": "See the Methods page: shares are percentages, wait_mean and lov_mean are minutes, tests_count is a count", "women_n/men_n": "Unweighted sampled visits in the estimate", "lo/hi": "95% confidence interval, Taylor linearization over strata and PSUs", "diff": "women minus men"})
exp = [{"complaint": c["complaint"], "age": c["age"], "measure": k, "women_est": v["women"]["est"], "women_lo": v["women"]["lo"], "women_hi": v["women"]["hi"], "men_est": v["men"]["est"], "men_lo": v["men"]["lo"], "men_hi": v["men"]["hi"], "diff": v["diff"], "n_women": c["n_women"], "n_men": c["n_men"]} for c in c2["explorer"] for k, v in c["metrics"].items() if v]
write("chapter2_explorer.csv", exp, ["complaint", "age", "measure", "women_est", "women_lo", "women_hi", "men_est", "men_lo", "men_hi", "diff", "n_women", "n_men"], "Chapter 2: the same estimates by complaint and age band (18-44, 45-64, 65+, all).", {"age": "Age band", "others": "as chapter2_ed_estimates.csv"})

c3 = json.load(open(f"{SITE_DATA}/chapter3.json"))
write("chapter3_diseases.csv", [{**d, "nih_categories": "; ".join(d["nih_categories"]), "who_codes": "; ".join(map(str, d["who_codes"]))} for d in c3["diseases"]],
      ["disease", "nih_categories", "who_codes", "note", "funding_m", "dalys_k", "female_share", "disability_share", "dollars_per_daly", "expected_m", "ratio_to_expected", "rank_by_ratio", "skew"],
      "Chapter 3: 67 diseases with NIH FY2024 funding matched to WHO 2021 US burden by sex.",
      {"nih_categories": "RCDC categories summed", "who_codes": "WHO GHE cause codes summed", "funding_m": "NIH FY2024 funding, $ millions", "dalys_k": "US DALYs 2021, thousands, both sexes", "female_share": "Share of DALYs falling on women", "disability_share": "YLD as a share of DALYs", "dollars_per_daly": "funding_m*1e6 / (dalys_k*1e3)", "expected_m": "Fitted funding from the power law of funding on burden", "ratio_to_expected": "funding_m / expected_m", "rank_by_ratio": "1 = most underfunded", "skew": "female (>=60% women), male (>=60% men) or balanced"})
hist = [{"disease": d["disease"], "fy": h["fy"], "funding_m": h["funding_m"]} for d in c3["diseases"] for h in d["history"]]
write("chapter3_funding_history.csv", hist, ["disease", "fy", "funding_m"], "Chapter 3: NIH funding by fiscal year 2008-2025 for each matched disease, $ millions (0 means the category was not yet reported).", {})
write("chapter3_uncounted.csv", c3["uncounted"], ["category", "funding_m"], "Chapter 3: NIH-funded conditions with no WHO burden estimate, FY2024 funding in $ millions.", {})
json.dump({"generated": c3["generated"], "files": files}, open(f"{SITE_DATA}/data_index.json", "w"), indent=1)
print("index written")
