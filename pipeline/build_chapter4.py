"""Chapter 4: who gets studied.

Reads out/trials.jsonl (every interventional trial on ClinicalTrials.gov with
posted results) and the chapter-3 burden file. For each disease we can match by
MeSH term: participants by sex, the women's share against the women's share of
US burden (participation-to-burden ratio), by sponsor type, phase and period;
trials and participants per unit of burden; what the eligibility text excludes
(pregnancy, lactation, contraception, 'childbearing potential', upper age limits);
and how many trials report any result by sex. Writes site/public/data/chapter4.json.
"""
import json
import math
import re
from collections import defaultdict
from datetime import date

import numpy as np

from common import OUT, SITE_DATA

import pandas as pd
from build_chapter3 import MAPPING as C3MAP
from common import CACHE

c3 = json.load(open(f"{SITE_DATA}/chapter3.json"))
BURDEN = {d["disease"]: d for d in c3["diseases"]}


def load_who_sheet(sheet):
    df = pd.read_excel(f"{CACHE}/ch3/who_daly_{c3['burden_year']}.xlsx", sheet_name=sheet, header=None)
    col = [i for i in range(df.shape[1]) if str(df.iat[7, i]).strip() == "USA"][0]
    out = {}
    for i in range(9, df.shape[0]):
        sex, code, v = str(df.iat[i, 0]).strip(), df.iat[i, 1], df.iat[i, col]
        try:
            code = int(float(code)); v = float(v)
        except (TypeError, ValueError):
            continue
        out.setdefault(code, {})[sex] = v
    return out


WHO70 = load_who_sheet("70+"); WHO60 = load_who_sheet("60-69"); WHOALL = load_who_sheet("All ages")


def burden_age(dz):
    """Approximate share of the disease's US DALYs falling at 65+, and women's share of the 70+ burden."""
    codes = C3MAP.get(dz, (None, [], None))[1]
    tot = sum(WHOALL.get(c, {}).get("Persons", 0) for c in codes)
    d70 = sum(WHO70.get(c, {}).get("Persons", 0) for c in codes); d60 = sum(WHO60.get(c, {}).get("Persons", 0) for c in codes)
    f70 = sum(WHO70.get(c, {}).get("Females", 0) for c in codes); m70 = sum(WHO70.get(c, {}).get("Males", 0) for c in codes)
    if tot <= 0:
        return None
    return {"burden_65plus_pct": round(100 * (d70 + 0.5 * d60) / tot, 1), "burden_70plus_pct": round(100 * d70 / tot, 1), "women_share_70plus": round(100 * f70 / (f70 + m70), 1) if f70 + m70 > 0 else None}

# disease label (as in chapter 3) -> MeSH terms matched against a trial's terms and ancestors
MESH = {
    "Alzheimer's and other dementias": ["Alzheimer Disease", "Dementia"], "Anxiety disorders": ["Anxiety Disorders"], "Asthma": ["Asthma"], "ADHD": ["Attention Deficit Disorder with Hyperactivity"],
    "Autism": ["Autism Spectrum Disorder", "Autistic Disorder"], "Bipolar disorder": ["Bipolar Disorder"], "Brain cancer": ["Brain Neoplasms", "Glioma"], "Breast cancer": ["Breast Neoplasms"], "Cervical cancer": ["Uterine Cervical Neoplasms"],
    "Cirrhosis and chronic liver disease": ["Liver Cirrhosis"],  # NASH/fatty-liver trials are not cirrhosis and skew female
    "COPD": ["Pulmonary Disease, Chronic Obstructive"], "Colorectal cancer": ["Colorectal Neoplasms"], "Depression": ["Depressive Disorder", "Depression"], "COPD": ["Pulmonary Disease, Chronic Obstructive"], "Colorectal cancer": ["Colorectal Neoplasms"], "Depression": ["Depressive Disorder", "Depression"],
    "Diabetes": ["Diabetes Mellitus"], "Peptic ulcer": ["Peptic Ulcer"], "Gallbladder disease": ["Gallbladder Diseases"], "Down syndrome": ["Down Syndrome"], "Eating disorders": ["Feeding and Eating Disorders"], "Epilepsy": ["Epilepsy"],
    "Esophageal cancer": ["Esophageal Neoplasms"], "Hearing loss": ["Hearing Loss"], "Coronary heart disease": ["Myocardial Ischemia", "Coronary Artery Disease", "Coronary Disease", "Myocardial Infarction", "Acute Coronary Syndrome", "Angina Pectoris"],
    "Hepatitis B": ["Hepatitis B"], "Hepatitis C": ["Hepatitis C"], "HIV/AIDS": ["HIV Infections", "Acquired Immunodeficiency Syndrome"], "Hodgkin lymphoma": ["Hodgkin Disease"], "Inflammatory bowel disease": ["Inflammatory Bowel Diseases"],
    "Kidney disease": ["Renal Insufficiency, Chronic", "Kidney Failure, Chronic", "Diabetic Nephropathies"], "Liver cancer": ["Liver Neoplasms", "Carcinoma, Hepatocellular"], "Lung cancer": ["Lung Neoplasms"], "Lymphoma": ["Lymphoma"], "Macular degeneration": ["Macular Degeneration"],
    "Migraine": ["Migraine Disorders"], "Multiple sclerosis": ["Multiple Sclerosis"], "Osteoarthritis": ["Osteoarthritis"], "Otitis media": ["Otitis Media"], "Ovarian cancer": ["Ovarian Neoplasms"], "Pancreatic cancer": ["Pancreatic Neoplasms"],
    "Parkinson's disease": ["Parkinson Disease"], "Prostate cancer": ["Prostatic Neoplasms"], "Rheumatoid arthritis": ["Arthritis, Rheumatoid"], "Schizophrenia": ["Schizophrenia"], "Sexually transmitted infections": ["Chlamydia Infections", "Gonorrhea", "Syphilis", "Herpes Genitalis", "Trichomonas Infections", "Papillomavirus Infections"],
    "Sickle cell disease": ["Anemia, Sickle Cell"], "Skin cancer": ["Melanoma", "Skin Neoplasms"], "Stomach cancer": ["Stomach Neoplasms"], "Stroke": ["Stroke"], "Suicide and self-harm": ["Suicide", "Suicidal Ideation", "Self-Injurious Behavior"],
    "Testicular cancer": ["Testicular Neoplasms"], "Uterine cancer": ["Endometrial Neoplasms", "Uterine Neoplasms"], "Back and neck pain": ["Back Pain", "Low Back Pain", "Neck Pain"], "Alcohol use disorders": ["Alcoholism", "Alcohol-Related Disorders"],
    "Drug use disorders": ["Substance-Related Disorders"], "Opioid use disorders": ["Opioid-Related Disorders"], "Cocaine use disorders": ["Cocaine-Related Disorders"], "Amphetamine use disorders": ["Amphetamine-Related Disorders"],
    "Gynaecological diseases": ["Endometriosis", "Leiomyoma", "Polycystic Ovary Syndrome", "Vulvodynia", "Pelvic Inflammatory Disease", "Uterine Hemorrhage", "Menorrhagia"], "Infertility": ["Infertility"], "Congenital heart disease": ["Heart Defects, Congenital"],
    "Neural tube defects": ["Spinal Dysraphism"], "Oral and dental disease": ["Periodontal Diseases", "Dental Caries", "Mouth Diseases"], "Pneumonia and influenza": ["Pneumonia", "Influenza, Human"], "Preterm birth": ["Premature Birth"], "Maternal conditions": ["Pregnancy Complications"], "Tuberculosis": ["Tuberculosis"],
    "Vision loss": ["Glaucoma", "Cataract", "Diabetic Retinopathy", "Refractive Errors", "Myopia"],
}
# conditions with no WHO burden (chapter 3's uncounted list): trials only
UNCOUNTED = {"Fibromyalgia": ["Fibromyalgia"], "ME/CFS": ["Fatigue Syndrome, Chronic"], "Lupus": ["Lupus Erythematosus, Systemic"], "Interstitial cystitis": ["Cystitis, Interstitial"], "TMJD": ["Temporomandibular Joint Disorders"],
             "Sjögren's disease": ["Sjogren's Syndrome"], "Scleroderma": ["Scleroderma, Systemic"], "POTS": ["Postural Orthostatic Tachycardia Syndrome"], "Osteoporosis": ["Osteoporosis"]}
SEX_SPECIFIC = {"Breast cancer", "Cervical cancer", "Ovarian cancer", "Uterine cancer", "Prostate cancer", "Testicular cancer", "Gynaecological diseases", "Infertility", "Preterm birth", "Maternal conditions", "Endometriosis", "Vulvodynia", "PCOS"}

PREG = re.compile(r"pregnan|gestation", re.I)
PREG_EXCL = re.compile(r"(exclu|not |no |must not|cannot|ineligible|unable)[^.\n]{0,120}pregnan|pregnan[^.\n]{0,60}(exclu|not eligible|ineligible|will not|may not|cannot)|(pregnant|pregnancy)[^.\n]{0,40}(or|and)[^.\n]{0,40}(lactat|breast|nursing)|^\s*[-•*\d.)]*\s*(women who are |female[s]? who are |currently |known |confirmed |positive )?pregnan|\b(is|are|be|being|currently|known to be|found to be|subjects? who are|patients? who are|if) pregnan|positive (serum |urine |blood )?(β-?|beta-?)?(hcg |hcg-|pregnancy )test|pregnancy test|non-?pregnant|not pregnant", re.I | re.M)
PREG_TOPIC = re.compile(r"pregnan|gestation|obstetric|preterm|premature birth|postpartum|antenatal|prenatal|labor|labour|cesarean|caesarean|lactation|breastfeed", re.I)


def excludes_pregnant(r):
    """Pregnancy is a reason for exclusion, unless the trial is about pregnancy itself."""
    t = r["criteria"] or ""
    if not t:
        return False
    about = any(PREG_TOPIC.search(x) for x in r["conditions"] + r["mesh"] + r["ancestors"])
    if about:
        return False
    i = re.search(r"exclusion criteria", t, re.I)
    in_excl = bool(re.search(r"pregnan", t[i.start():], re.I)) if i else False
    return in_excl or bool(PREG_EXCL.search(t))
LACT = re.compile(r"lactat|breast[- ]?feed|nursing (mother|women|woman)", re.I)
CONTRA = re.compile(r"contracept|birth control|barrier method|double[- ]barrier|intrauterine device", re.I)  # not 'abstinence': addiction trials use the word for drink and drugs
WOCBP = re.compile(r"child[- ]?bearing potential|reproductive potential|WOCBP|WOCP|able to become pregnant|could become pregnant|capable of becoming pregnant|of childbearing age|fertile (women|females)", re.I)
PREGTEST = re.compile(r"pregnancy test|serum hcg|urine hcg|β-?hcg|beta-?hcg", re.I)


def age_years(s):
    if not s:
        return None
    m = re.match(r"([\d.]+)\s*(Year|Month|Week|Day)", s)
    if not m:
        return None
    v = float(m.group(1)); u = m.group(2)
    return v if u == "Year" else v / 12 if u == "Month" else v / 52 if u == "Week" else v / 365


def period(start):
    y = int(start[:4]) if start else None
    if y is None:
        return None, None
    return y, ("before 2010" if y < 2010 else "2010–2015" if y <= 2015 else "2016–2020" if y <= 2020 else "2021 onward")


def main():
    trials = []
    for line in open(f"{OUT}/trials.jsonl"):
        r = json.loads(line)
        f, m = r["female"], r["male"]
        r["n_sex"] = (f or 0) + (m or 0) if f is not None and m is not None else 0
        if r["enrollment"] and r["n_sex"] > 1.1 * r["enrollment"]:  # baseline groups overlap (no total group, repeated periods): counts unreliable
            r["n_sex"] = 0; r["female"] = r["male"] = None
        r["year"], r["period"] = period(r["start"])
        t = r["criteria"] or ""
        r["mentions_preg"] = bool(PREG.search(t)); r["excl_preg"] = excludes_pregnant(r); r["excl_lact"] = bool(LACT.search(t)); r["contra"] = bool(CONTRA.search(t)); r["wocbp"] = bool(WOCBP.search(t)); r["pregtest"] = bool(PREGTEST.search(t))
        r["max_age_y"] = age_years(r["max_age"]); r["min_age_y"] = age_years(r["min_age"])
        r["adult"] = (r["min_age_y"] or 0) >= 18 or ("ADULT" in r["std_ages"] and "CHILD" not in r["std_ages"])
        r["phase_group"] = "Phase 3" if "PHASE3" in r["phases"] else "Phase 2" if "PHASE2" in r["phases"] else "Phase 1" if any(p in r["phases"] for p in ("PHASE1", "EARLY_PHASE1")) else "Phase 4" if "PHASE4" in r["phases"] else "Not applicable"
        r["sponsor_group"] = "Industry" if r["sponsor_class"] == "INDUSTRY" else "NIH" if r["sponsor_class"] == "NIH" else "Other US government" if r["sponsor_class"] in ("FED", "OTHER_GOV") else "Universities, hospitals, other"
        r["drug"] = any(x in r["intervention_types"] for x in ("DRUG", "BIOLOGICAL"))
        terms = set(r["mesh"]) | set(r["ancestors"])
        r["diseases"] = [dz for dz, ms in MESH.items() if terms.intersection(ms)]
        if "Cirrhosis and chronic liver disease" in r["diseases"] and terms & {"Liver Cirrhosis, Biliary", "Cholangitis", "Cholangitis, Sclerosing"}:
            r["diseases"].remove("Cirrhosis and chronic liver disease")  # primary biliary cholangitis trials are ~70% women and a small part of the WHO cirrhosis burden
        if "Drug use disorders" in r["diseases"] and terms & {"Tobacco Use Disorder", "Smoking Cessation", "Smoking", "Tobacco Use", "Vaping", "Nicotine"} and not terms & {"Opioid-Related Disorders", "Cocaine-Related Disorders", "Amphetamine-Related Disorders", "Substance Abuse, Intravenous", "Marijuana Abuse"}:
            r["diseases"].remove("Drug use disorders")  # WHO's drug-use burden excludes tobacco; smoking trials would inflate the women's share
        if "HIV/AIDS" in r["diseases"] and "Sexually transmitted infections" in r["diseases"]:
            r["diseases"].remove("Sexually transmitted infections")
        r["uncounted"] = [dz for dz, ms in UNCOUNTED.items() if terms.intersection(ms)]
        trials.append(r)
    US = [r for r in trials if r["us"]]
    print(f"{len(trials):,} trials with results; {len(US):,} with a US site; {sum(1 for r in trials if r['n_sex']):,} with sex counts")

    def share(rows, excl_sex_restricted=True, adult_only=False):
        rows = [r for r in rows if r["n_sex"] > 0 and (r["sex"] == "ALL" or not excl_sex_restricted) and (r["adult"] or not adult_only)]
        f = sum(r["female"] for r in rows); n = sum(r["n_sex"] for r in rows)
        return {"trials": len(rows), "participants": int(n), "female_pct": round(f / n * 100, 1) if n else None}

    def pct(rows, key):
        return round(100 * sum(1 for r in rows if r[key]) / len(rows), 1) if rows else None

    # ---- disease table
    diseases = []
    for dz in MESH:
        rows = [r for r in US if dz in r["diseases"]]
        b = BURDEN.get(dz)
        if len(rows) < 10:
            continue
        allsex = share(rows, excl_sex_restricted=False); openrows = share(rows)
        entry = {"disease": dz, "sex_specific": dz in SEX_SPECIFIC, "trials": len(rows), "trials_sex_counted": allsex["trials"], "participants": allsex["participants"], "female_pct": allsex["female_pct"],
                 "female_pct_open": openrows["female_pct"], "trials_open": openrows["trials"], "female_only_trials": sum(1 for r in rows if r["sex"] == "FEMALE"), "male_only_trials": sum(1 for r in rows if r["sex"] == "MALE"),
                 "burden_female_pct": b["female_share"] if b else None, "dalys_k": b["dalys_k"] if b else None, "skew": b["skew"] if b else None, "funding_m": b["funding_m"] if b else None,
                 "by_sponsor": {s: share([r for r in rows if r["sponsor_group"] == s], excl_sex_restricted=False) for s in ("Industry", "NIH", "Other US government", "Universities, hospitals, other")},
                 "by_period": {p: share([r for r in rows if r["period"] == p], excl_sex_restricted=False) for p in ("before 2010", "2010–2015", "2016–2020", "2021 onward")},
                 "by_phase": {p: share([r for r in rows if r["phase_group"] == p], excl_sex_restricted=False) for p in ("Phase 1", "Phase 2", "Phase 3", "Phase 4", "Not applicable")},
                 "excl_preg_pct": pct(rows, "excl_preg"), "excl_lact_pct": pct(rows, "excl_lact"), "contra_pct": pct(rows, "contra"), "wocbp_pct": pct(rows, "wocbp"), "pregtest_pct": pct(rows, "pregtest"),
                 "max_age_pct": round(100 * sum(1 for r in rows if r["max_age_y"] is not None and r["max_age_y"] < 100) / len(rows), 1), "max_age_le75_pct": round(100 * sum(1 for r in rows if r["max_age_y"] is not None and r["max_age_y"] <= 75) / len(rows), 1),
                 "max_age_le65_pct": round(100 * sum(1 for r in rows if r["max_age_y"] is not None and r["max_age_y"] <= 65) / len(rows), 1),
                 "outcome_by_sex": sum(1 for r in rows if r["outcome_by_sex"]), "sample_nct": [r["nct"] for r in sorted(rows, key=lambda r: -r["n_sex"])[:3]]}
        aged = [r for r in rows if r.get("age_tot")]
        entry["age_trials"] = len(aged)
        entry["over65_trial_pct"] = round(100 * sum(r["age65"] for r in aged) / sum(r["age_tot"] for r in aged), 1) if aged and sum(r["age_tot"] for r in aged) > 0 else None
        meanrows = [r for r in rows if r.get("age_mean") is not None and r["n_sex"] > 0]
        entry["mean_age"] = round(sum(r["age_mean"] * r["n_sex"] for r in meanrows) / sum(r["n_sex"] for r in meanrows), 1) if meanrows else None
        ba = burden_age(dz)
        if ba:
            entry.update(ba)
            if entry["over65_trial_pct"] is not None and len(aged) >= 10:
                entry["age_gap_pts"] = round(ba["burden_65plus_pct"] - entry["over65_trial_pct"], 1)
        if b and dz not in SEX_SPECIFIC and allsex["female_pct"] is not None:
            entry["ratio"] = round(allsex["female_pct"] / b["female_share"], 2)  # participation-to-burden ratio
            entry["ratio_open"] = round(openrows["female_pct"] / b["female_share"], 2) if openrows["female_pct"] is not None else None
            entry["gap_pts"] = round(allsex["female_pct"] - b["female_share"], 1)
            entry["trials_per_100k_dalys"] = round(len(rows) / b["dalys_k"] * 100, 2)
            entry["participants_per_1k_dalys"] = round(allsex["participants"] / b["dalys_k"], 1)
            entry["by_sponsor_ratio"] = {s: round(v["female_pct"] / b["female_share"], 2) if v["female_pct"] is not None and v["trials"] >= 5 else None for s, v in entry["by_sponsor"].items()}
            entry["by_period_ratio"] = {p: round(v["female_pct"] / b["female_share"], 2) if v["female_pct"] is not None and v["trials"] >= 5 else None for p, v in entry["by_period"].items()}
        diseases.append(entry)
    ranked = [e for e in diseases if e.get("ratio") is not None]
    # trials-per-burden fit (as chapter 3's funding fit)
    x = np.log10([e["dalys_k"] for e in ranked]); y = np.log10([e["trials"] for e in ranked])
    b1, a1 = np.polyfit(x, y, 1)
    for e, xi, yi in zip(ranked, x, y):
        e["expected_trials"] = round(10 ** (a1 + b1 * xi)); e["trials_ratio_to_expected"] = round(10 ** (yi - (a1 + b1 * xi)), 2)
    ranked.sort(key=lambda e: e["ratio"])
    for i, e in enumerate(ranked):
        e["rank"] = i + 1
    uncounted = []
    for dz, ms in UNCOUNTED.items():
        rows = [r for r in US if dz in r["uncounted"]]
        s = share(rows, excl_sex_restricted=False)
        uncounted.append({"condition": dz, "trials": len(rows), "participants": s["participants"], "female_pct": s["female_pct"], "sex_specific": dz in SEX_SPECIFIC})

    # ---- overall and trends (US trials, open to both sexes, non sex-specific diseases)
    def overall_rows(rows):
        return [r for r in rows if r["n_sex"] > 0 and r["sex"] == "ALL" and not set(r["diseases"]) & SEX_SPECIFIC]
    gen = overall_rows(US)
    trend = []
    for yv in range(2000, 2025):
        rows = [r for r in gen if r["year"] == yv]
        if len(rows) < 30:
            continue
        s = share(rows); ind = share([r for r in rows if r["sponsor_group"] == "Industry"]); nih = share([r for r in rows if r["sponsor_group"] == "NIH"]); oth = share([r for r in rows if r["sponsor_group"] == "Universities, hospitals, other"])
        allus = [r for r in US if r["year"] == yv]
        trend.append({"year": yv, "trials": len(rows), "female_pct": s["female_pct"], "industry_female_pct": ind["female_pct"], "nih_female_pct": nih["female_pct"], "other_female_pct": oth["female_pct"],
                      "median_trial_female_pct": round(float(np.median([r["female"] / r["n_sex"] * 100 for r in rows])), 1),
                      "excl_preg_pct": pct(allus, "excl_preg"), "contra_pct": pct(allus, "contra"), "wocbp_pct": pct(allus, "wocbp"), "excl_lact_pct": pct(allus, "excl_lact"), "max_age_pct": round(100 * sum(1 for r in allus if r["max_age_y"] is not None and r["max_age_y"] < 100) / len(allus), 1),
                      "outcome_by_sex_pct": round(100 * sum(1 for r in allus if r["outcome_by_sex"]) / len(allus), 2)})
    # distribution of per-trial female share (open trials, non sex-specific)
    shares = [r["female"] / r["n_sex"] * 100 for r in gen]
    hist = np.histogram(shares, bins=list(range(0, 101, 10)))[0].tolist()
    # exclusions by phase and sponsor (all US trials)
    excl = {"by_phase": {p: {"trials": len(rs), "excl_preg_pct": pct(rs, "excl_preg"), "contra_pct": pct(rs, "contra"), "wocbp_pct": pct(rs, "wocbp"), "excl_lact_pct": pct(rs, "excl_lact"), "pregtest_pct": pct(rs, "pregtest")} for p in ("Phase 1", "Phase 2", "Phase 3", "Phase 4", "Not applicable") for rs in [[r for r in US if r["phase_group"] == p]]},
            "by_sponsor": {s: {"trials": len(rs), "excl_preg_pct": pct(rs, "excl_preg"), "contra_pct": pct(rs, "contra"), "wocbp_pct": pct(rs, "wocbp"), "excl_lact_pct": pct(rs, "excl_lact")} for s in ("Industry", "NIH", "Other US government", "Universities, hospitals, other") for rs in [[r for r in US if r["sponsor_group"] == s]]},
            "drug_trials": {"trials": len(rs), "excl_preg_pct": pct(rs, "excl_preg"), "contra_pct": pct(rs, "contra"), "wocbp_pct": pct(rs, "wocbp"), "excl_lact_pct": pct(rs, "excl_lact")} if (rs := [r for r in US if r["drug"] and r["sex"] != "MALE"]) else None,
            "non_drug_trials": {"trials": len(rs), "excl_preg_pct": pct(rs, "excl_preg"), "contra_pct": pct(rs, "contra"), "wocbp_pct": pct(rs, "wocbp"), "excl_lact_pct": pct(rs, "excl_lact")} if (rs := [r for r in US if not r["drug"] and r["sex"] != "MALE"]) else None,
            # diseases of older people, drug trials: still excluding by pregnancy and capping age
            "older_diseases": {dz: {"trials": len(rs), "excl_preg_pct": pct(rs, "excl_preg"), "contra_pct": pct(rs, "contra"), "max_age_pct": round(100 * sum(1 for r in rs if r["max_age_y"] is not None and r["max_age_y"] < 100) / len(rs), 1) if rs else None, "max_age_le75_pct": round(100 * sum(1 for r in rs if r["max_age_y"] is not None and r["max_age_y"] <= 75) / len(rs), 1) if rs else None} for dz in ("Alzheimer's and other dementias", "Parkinson's disease", "Osteoarthritis", "Macular degeneration", "Coronary heart disease", "Stroke", "COPD") for rs in [[r for r in US if dz in r["diseases"] and r["drug"]]]}}
    by_sex_reporting = {"trials": len(US), "n": sum(1 for r in US if r["outcome_by_sex"]), "pct": round(100 * sum(1 for r in US if r["outcome_by_sex"]) / len(US), 2),
                        "by_sponsor": {s: {"trials": len(rs), "n": sum(1 for r in rs if r["outcome_by_sex"]), "pct": round(100 * sum(1 for r in rs if r["outcome_by_sex"]) / len(rs), 2)} for s in ("Industry", "NIH", "Other US government", "Universities, hospitals, other") for rs in [[r for r in US if r["sponsor_group"] == s]]},
                        "nih_since_2016": {"trials": len(rs), "n": sum(1 for r in rs if r["outcome_by_sex"]), "pct": round(100 * sum(1 for r in rs if r["outcome_by_sex"]) / len(rs), 2)} if (rs := [r for r in US if r["sponsor_group"] == "NIH" and (r["year"] or 0) >= 2016]) else None,
                        "phase3_drug": {"trials": len(rs), "n": sum(1 for r in rs if r["outcome_by_sex"]), "pct": round(100 * sum(1 for r in rs if r["outcome_by_sex"]) / len(rs), 2)} if (rs := [r for r in US if r["phase_group"] == "Phase 3" and r["drug"]]) else None}
    aged_all = [r for r in US if r.get("age_tot")]
    age_overall = {"trials_with_age": len(aged_all), "over65_trial_pct": round(100 * sum(r["age65"] for r in aged_all) / sum(r["age_tot"] for r in aged_all), 1),
                   "over65_drug_phase3_pct": round(100 * sum(r["age65"] for r in rs) / sum(r["age_tot"] for r in rs), 1) if (rs := [r for r in aged_all if r["drug"] and r["phase_group"] == "Phase 3"]) else None,
                   "diseases_with_age": sum(1 for e in ranked if e.get("age_gap_pts") is not None),
                   "diseases_under_by_10": sum(1 for e in ranked if (e.get("age_gap_pts") or 0) >= 10),
                   "old_diseases": sorted([{"disease": e["disease"], "over65_trial_pct": e["over65_trial_pct"], "burden_65plus_pct": e["burden_65plus_pct"], "women_share_70plus": e["women_share_70plus"], "age_gap_pts": e["age_gap_pts"], "max_age_pct": e["max_age_pct"], "female_pct": e["female_pct"], "burden_female_pct": e["burden_female_pct"]} for e in ranked if e.get("age_gap_pts") is not None and e["burden_65plus_pct"] >= 50], key=lambda x: -x["age_gap_pts"])}
    sponsor_overall = {s: share([r for r in gen if r["sponsor_group"] == s]) for s in ("Industry", "NIH", "Other US government", "Universities, hospitals, other")}
    # same disease, different sponsor: diseases with >=10 industry and >=10 NIH/other trials
    sponsor_pairs = [{"disease": e["disease"], "industry": e["by_sponsor"]["Industry"]["female_pct"], "nih": e["by_sponsor"]["NIH"]["female_pct"], "other": e["by_sponsor"]["Universities, hospitals, other"]["female_pct"], "burden": e["burden_female_pct"], "n_industry": e["by_sponsor"]["Industry"]["trials"], "n_nih": e["by_sponsor"]["NIH"]["trials"], "n_other": e["by_sponsor"]["Universities, hospitals, other"]["trials"]}
                     for e in ranked if e["by_sponsor"]["Industry"]["trials"] >= 10 and e["by_sponsor"]["Universities, hospitals, other"]["trials"] >= 10]
    summary = {"burden_year": c3["burden_year"], "trials_total": len(trials), "trials_us": len(US), "trials_with_sex": sum(1 for r in trials if r["n_sex"]), "participants_us": int(sum(r["n_sex"] for r in US)), "female_pct_us_open": share(gen)["female_pct"],
               "n_diseases": len(ranked), "n_under": sum(1 for e in ranked if e["ratio"] < 0.9), "n_over": sum(1 for e in ranked if e["ratio"] > 1.1), "median_ratio_female_skew": round(float(np.median([e["ratio"] for e in ranked if e["skew"] == "female"])), 2) if any(e["skew"] == "female" for e in ranked) else None,
               "median_ratio_male_skew": round(float(np.median([e["ratio"] for e in ranked if e["skew"] == "male"])), 2) if any(e["skew"] == "male" for e in ranked) else None, "median_ratio_balanced": round(float(np.median([e["ratio"] for e in ranked if e["skew"] == "balanced"])), 2),
               "excl_preg_pct_us": pct(US, "excl_preg"), "contra_pct_us": pct(US, "contra"), "wocbp_pct_us": pct(US, "wocbp"), "excl_lact_pct_us": pct(US, "excl_lact"), "max_age_pct_us": round(100 * sum(1 for r in US if r["max_age_y"] is not None and r["max_age_y"] < 100) / len(US), 1),
               "female_only_trials_us": sum(1 for r in US if r["sex"] == "FEMALE"), "male_only_trials_us": sum(1 for r in US if r["sex"] == "MALE"),
               "male_only_nonsexspecific_us": sum(1 for r in US if r["sex"] == "MALE" and not set(r["diseases"]) & SEX_SPECIFIC), "female_only_nonsexspecific_us": sum(1 for r in US if r["sex"] == "FEMALE" and not set(r["diseases"]) & SEX_SPECIFIC),
               "share_hist": hist, "trials_fit": {"a": round(a1, 3), "b": round(b1, 3)}}
    out = {"generated": date.today().isoformat(), "summary": summary, "diseases": ranked, "sex_specific": [e for e in diseases if e.get("ratio") is None], "uncounted": uncounted, "trend": trend, "exclusions": excl, "by_sex_reporting": by_sex_reporting, "sponsor_overall": sponsor_overall, "sponsor_pairs": sponsor_pairs, "age": age_overall}
    json.dump(out, open(f"{SITE_DATA}/chapter4.json", "w"), indent=1)
    today = date.today().isoformat()
    new_sources = [
        {"id": "ctgov", "title": "ClinicalTrials.gov API v2: interventional studies with posted results", "publisher": "National Library of Medicine", "url": "https://clinicaltrials.gov/data-api/api", "retrieved": today, "note": f"{len(trials):,} studies retrieved; baseline participant counts by sex, eligibility criteria, sponsor, phase, conditions with MeSH terms."},
        {"id": "steinberg-2021", "title": "Analysis of female enrollment and participant sex by burden of disease in US clinical trials between 2000 and 2020", "publisher": "Steinberg J.R., Turner B.E., Weeks B.T. et al., JAMA Network Open 4(6), 2021. doi:10.1001/jamanetworkopen.2021.13749", "url": "https://doi.org/10.1001/jamanetworkopen.2021.13749", "retrieved": today},
        {"id": "fda-1993", "title": "Guideline for the study and evaluation of gender differences in the clinical evaluation of drugs", "publisher": "U.S. Food and Drug Administration, Federal Register 58(139), July 1993", "url": "https://www.fda.gov/regulatory-information/search-fda-guidance-documents/study-and-evaluation-gender-differences-clinical-evaluation-drugs", "retrieved": today, "note": "Lifted the 1977 exclusion of women of childbearing potential from early-phase trials."},
    ]
    sources = json.load(open(f"{SITE_DATA}/sources.json"))
    sources = [s for s in sources if s["id"] not in {n["id"] for n in new_sources}] + new_sources
    json.dump(sources, open(f"{SITE_DATA}/sources.json", "w"), indent=1)
    print("summary:", {k: v for k, v in summary.items() if k != "share_hist"})
    print("most under-represented:", [(e["disease"], e["female_pct"], e["burden_female_pct"], e["ratio"], e["trials"]) for e in ranked[:12]])
    print("most over-represented:", [(e["disease"], e["female_pct"], e["burden_female_pct"], e["ratio"], e["trials"]) for e in ranked[-8:]])
    print("sponsor overall:", sponsor_overall)
    print("by-sex reporting:", by_sex_reporting)
    print("exclusions:", excl["by_phase"], excl["drug_trials"], excl["non_drug_trials"]); print("older diseases:", excl["older_diseases"])
    print("trend:", [(t["year"], t["female_pct"], t["industry_female_pct"], t["nih_female_pct"], t["excl_preg_pct"], t["wocbp_pct"], t["max_age_pct"]) for t in trend])
    print("uncounted:", uncounted)
    print("sponsor pairs:", sponsor_pairs[:10])
    print("age:", {k: v for k, v in age_overall.items() if k != "old_diseases"}); print("old diseases:", age_overall["old_diseases"])
    print("trials per 100k DALYs, lowest:", [(e["disease"], e["trials_per_100k_dalys"], e["skew"]) for e in sorted(ranked, key=lambda e: e["trials_per_100k_dalys"])[:10]])
    print("period ratios:", [(e["disease"], e["by_period_ratio"]) for e in ranked[:8]])


if __name__ == "__main__":
    main()
