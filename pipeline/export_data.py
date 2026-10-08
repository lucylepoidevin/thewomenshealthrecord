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
write("chapter3_uncounted.csv", c3["uncounted"], ["category", "label", "funding_m"], "Chapter 3: NIH-funded conditions with no WHO burden estimate, FY2024 funding in $ millions.", {})

c4 = json.load(open(f"{SITE_DATA}/chapter4.json"))
rows = []
for d in c4["diseases"] + c4["sex_specific"]:
    rows.append({**{k: d.get(k) for k in ("disease", "sex_specific", "trials", "participants", "female_pct", "female_pct_open", "burden_female_pct", "dalys_k", "skew", "ratio", "gap_pts", "trials_per_100k_dalys", "excl_preg_pct", "excl_lact_pct", "contra_pct", "wocbp_pct", "max_age_pct", "max_age_le75_pct", "outcome_by_sex", "age_trials", "over65_trial_pct", "mean_age", "burden_65plus_pct", "women_share_70plus", "age_gap_pts")},
                 "industry_female_pct": d["by_sponsor"]["Industry"]["female_pct"], "industry_trials": d["by_sponsor"]["Industry"]["trials"], "nih_female_pct": d["by_sponsor"]["NIH"]["female_pct"], "nih_trials": d["by_sponsor"]["NIH"]["trials"], "academic_female_pct": d["by_sponsor"]["Universities, hospitals, other"]["female_pct"], "academic_trials": d["by_sponsor"]["Universities, hospitals, other"]["trials"]})
write("chapter4_diseases.csv", rows, list(rows[0].keys()), "Chapter 4: for each disease, US interventional trials with posted results on ClinicalTrials.gov, women's share of participants against women's share of US burden (WHO 2021), by sponsor, and what the eligibility text excludes.",
      {"female_pct": "Women as a share of participants with a recorded sex, all trials", "female_pct_open": "Same, trials open to both sexes only", "burden_female_pct": "Women's share of US DALYs", "ratio": "female_pct / burden_female_pct", "excl_preg_pct": "Share of trials whose criteria exclude pregnant women", "contra_pct": "Share requiring contraception", "wocbp_pct": "Share with a childbearing-potential clause", "max_age_pct": "Share with an upper age limit", "outcome_by_sex": "Trials reporting any outcome in sex-named groups", "over65_trial_pct": "Share of participants aged 65+ in trials reporting age categories", "burden_65plus_pct": "Share of US DALYs after 65 (70+ band plus half of 60-69)", "women_share_70plus": "Women's share of the 70+ burden", "age_gap_pts": "burden_65plus_pct minus over65_trial_pct"})
write("chapter4_trend.csv", c4["trend"], list(c4["trend"][0].keys()), "Chapter 4: by trial start year, women's share of participants (trials open to both sexes, non sex-specific conditions) and the share of all US trials with each exclusion.", {})

c5 = json.load(open(f"{SITE_DATA}/chapter5.json"))
rows = []
for g in c5["groups"] + [{"id": "all_symptom_complaints", "metrics": c5["symptoms"]["metrics"]}, {"id": "all_noninjury", "metrics": c5["overall"]["metrics"]}]:
    for k, v in g["metrics"].items():
        if v:
            rows.append({"complaint": g["id"], "measure": k, "women_est": v["women"]["est"], "women_lo": v["women"]["lo"], "women_hi": v["women"]["hi"], "women_n": v["women"]["n"], "men_est": v["men"]["est"], "men_lo": v["men"]["lo"], "men_hi": v["men"]["hi"], "men_n": v["men"]["n"], "diff": v["diff"], "diff_lo": v["diff_lo"], "diff_hi": v["diff_hi"]})
write("chapter5_ed_estimates.csv", rows, ["complaint", "measure", "women_est", "women_lo", "women_hi", "women_n", "men_est", "men_lo", "men_hi", "men_n", "diff", "diff_lo", "diff_hi"],
      "Chapter 5: survey-weighted estimates by patient sex for NHAMCS ED visits 2018-2022, adults 18+, non-injury, by symptom complaint: symptom-code diagnoses, anxiety codes, tests, imaging, admission and 72-hour returns.", {"measure": "See the Methods page; shares are percentages, tests_count a count, lov_mean minutes"})
write("chapter5_models.csv", [{"model": k, **v} for k, v in c5["models"].items()], ["model", "label", "note", "n", "or", "lo", "hi", "p", "formula"], "Chapter 5: adjusted odds ratios for women relative to men from survey-weighted logistic regressions.", {})
exp = [{"complaint": c["complaint"], "age": c["age"], "measure": k, "women_est": v["women"]["est"], "women_lo": v["women"]["lo"], "women_hi": v["women"]["hi"], "men_est": v["men"]["est"], "men_lo": v["men"]["lo"], "men_hi": v["men"]["hi"], "diff": v["diff"], "n_women": c["n_women"], "n_men": c["n_men"]} for c in c5["explorer"] for k, v in c["metrics"].items() if v]
write("chapter5_explorer.csv", exp, ["complaint", "age", "measure", "women_est", "women_lo", "women_hi", "men_est", "men_lo", "men_hi", "diff", "n_women", "n_men"], "Chapter 5: the same estimates by complaint and age band.", {})

c6 = json.load(open(f"{SITE_DATA}/chapter6.json"))
write("chapter6_labels.csv", c6["labels"]["drugs"], ["slug", "brand", "year", "category", "trial_female_pct", "label_date", "sex_statement", "male_only_pk", "quantified", "difference", "no_difference", "not_evaluated", "no_preg_data", "no_lact_data", "sex_dose", "example"],
      "Chapter 6: what the current FDA label of each chapter-1 drug says about sex, pregnancy and breastfeeding, classified by the published rules.", {"sex_statement": "Classification of the pharmacology section's statement about sex", "male_only_pk": "Pharmacokinetics reported from healthy male subjects", "no_preg_data": "Label says human pregnancy data are absent, limited or insufficient", "example": "The sentence the classification matched"})
pm = [{"series": name, **p} for name, s in list(c6["pubmed"]["fields"].items()) + [("NIH-funded rodent studies", c6["pubmed"]["nih"])] + list(c6["pubmed"]["human"].items()) for p in s]
write("chapter6_pubmed.csv", pm, ["series", "year", "n", "n_sexed", "male_only_pct", "female_only_pct", "both_pct", "includes_female_pct", "sexed_pct"], "Chapter 6: PubMed record counts by year and sex check tag for rodent studies (overall, by field, NIH-funded) and human trial reports.", {"n": "Records in the series that year", "n_sexed": "Records carrying a Male or Female tag", "male_only_pct": "Male and not Female, as a share of n_sexed"})

json.dump({"generated": c3["generated"], "files": files}, open(f"{SITE_DATA}/data_index.json", "w"), indent=1)
print("index written")
