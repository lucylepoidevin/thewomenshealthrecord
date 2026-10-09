"""Chapter 5: sent home without a name.

NHAMCS ED public-use files 2018-2022 (NCHS), adults 18+, non-injury visits.
For the common symptom complaints we estimate, by patient sex, how often the visit
ends with a symptom code (ICD-10 chapter R) rather than a named disease, how often
an anxiety or other psychiatric code is attached, what workup was done, and how
often the patient was back in the same ED within 72 hours. Design-based estimates
(PATWT, Taylor linearization over CSTRATM/CPSUM) and survey-weighted logistic
models with PSU-clustered errors. Writes site/public/data/chapter5.json.
"""
import glob
import json
import math
import re
from datetime import date

import numpy as np
import pandas as pd
import statsmodels.api as sm
import statsmodels.formula.api as smf

from build_chapter2 import AGE_BANDS, age_adjusted, compare, svy_ratio

# SEER sites both sexes get, with display names; subtypes and sex-specific sites left out
SEER_SITES = {
    "Lung and Bronchus": "Lung", "Colon and Rectum (including Appendix)": "Colon and rectum", "Urinary Bladder (Invasive & In Situ)": "Bladder", "Melanoma of the Skin": "Melanoma", "Non-Hodgkin Lymphoma": "Non-Hodgkin lymphoma",
    "Kidney and Renal Pelvis": "Kidney", "Pancreas": "Pancreas", "Thyroid": "Thyroid", "Oral Cavity and Pharynx": "Mouth and throat", "Stomach": "Stomach", "Liver and Intrahepatic Bile Duct": "Liver", "Esophagus": "Oesophagus",
    "Brain and Other Nervous System": "Brain", "Myeloma": "Myeloma", "Hodgkin Lymphoma": "Hodgkin lymphoma", "Larynx": "Larynx", "Soft Tissue including Heart": "Soft tissue", "Small Intestine": "Small intestine", "Anus, Anal Canal & Anorectum": "Anus",
    "Gallbladder": "Gallbladder", "Salivary Gland": "Salivary gland", "Mesothelioma": "Mesothelioma", "Bones and Joints": "Bone", "Eye and Orbit": "Eye",
}


def seer_table(path):
    rows = []
    x = pd.ExcelFile(path)
    for sh in x.sheet_names:
        df = pd.read_excel(x, sheet_name=sh, header=None)
        hdr = [i for i in range(len(df)) if str(df.iat[i, 0]).strip() == "Cancer Site"]
        if hdr:
            d = df.iloc[hdr[0] + 1:].copy(); d.columns = list(df.iloc[hdr[0]]); rows.append(d)
    t = pd.concat(rows)
    return t[t["Race/Ethnicity"] == "All Races / Ethnicities"]


def cancer():
    """Stage at diagnosis and median age at diagnosis by sex, SEER, for cancers both sexes get."""
    S = seer_table(f"{CACHE}/ch5/Stage_Distribution.xlsx"); M = seer_table(f"{CACHE}/ch5/Median_Age_at_Diagnosis.xlsx")
    out = []
    for site, label in SEER_SITES.items():
        g = S[S["Cancer Site"] == site]; ga = g[g["Age at Diagnosis"] == "All Ages"]
        f = ga[ga.Sex == "Female"]; m = ga[ga.Sex == "Male"]
        if f.empty or m.empty:
            continue
        def st(s, stage):
            r = s[s["Stage at Diagnosis"] == stage]; return float(r["Percent of Cases"].iloc[0]) if len(r) else None
        nf, nm = int(f["Number of Cases"].sum()), int(m["Number of Cases"].sum())
        fd, md, fl, ml = st(f, "Distant"), st(m, "Distant"), st(f, "Localized"), st(m, "Localized")
        if fd is None or md is None or min(nf, nm) < 2000:
            continue
        se = math.sqrt(fd * (100 - fd) / nf + md * (100 - md) / nm)
        sef, sem = math.sqrt(fd * (100 - fd) / nf), math.sqrt(md * (100 - md) / nm)
        # age-standardised to the pooled age distribution of the site (three bands)
        tot = 0; ws = {"Female": 0.0, "Male": 0.0}; ok = True
        for b in ("Ages < 50", "Ages 50-64", "Ages 65+"):
            gb = g[g["Age at Diagnosis"] == b]; nb = 0; d = {}
            for sex in ("Female", "Male"):
                s_ = gb[gb.Sex == sex]; dist = s_[s_["Stage at Diagnosis"] == "Distant"]
                if dist.empty:
                    ok = False; break
                d[sex] = float(dist["Percent of Cases"].iloc[0]); nb += int(s_["Number of Cases"].sum())
            if not ok:
                break
            tot += nb
            for sex in d:
                ws[sex] += d[sex] * nb
        adj = {"women": round(ws["Female"] / tot, 1), "men": round(ws["Male"] / tot, 1), "diff": round((ws["Female"] - ws["Male"]) / tot, 1)} if ok and tot else None
        mg = M[M["Cancer Site"] == site]; mf = mg[mg.Sex == "Female"]; mm = mg[mg.Sex == "Male"]
        med = {"women": float(mf["Median Age at Diagnosis"].iloc[0]), "men": float(mm["Median Age at Diagnosis"].iloc[0])} if len(mf) and len(mm) else None
        out.append({"site": site, "label": label, "cases_women": nf, "cases_men": nm,
                    "distant": {"women": {"est": round(fd, 1), "lo": round(fd - 1.96 * sef, 1), "hi": round(fd + 1.96 * sef, 1), "n": nf}, "men": {"est": round(md, 1), "lo": round(md - 1.96 * sem, 1), "hi": round(md + 1.96 * sem, 1), "n": nm}, "diff": round(fd - md, 1), "diff_lo": round(fd - md - 1.96 * se, 1), "diff_hi": round(fd - md + 1.96 * se, 1)},
                    "localized": {"women": round(fl, 1), "men": round(ml, 1)}, "distant_age_adjusted": adj, "median_age": med})
    out.sort(key=lambda r: -r["distant"]["diff"])
    later = [r for r in out if r["distant"]["diff_lo"] > 0]; earlier = [r for r in out if r["distant"]["diff_hi"] < 0]
    older = sum(1 for r in out if r["median_age"] and r["median_age"]["women"] > r["median_age"]["men"]); younger = sum(1 for r in out if r["median_age"] and r["median_age"]["women"] < r["median_age"]["men"])
    return {"sites": out, "n_sites": len(out), "n_women_later_stage": len(later), "n_women_earlier_stage": len(earlier), "n_women_older_at_dx": older, "n_women_younger_at_dx": younger,
            "years_stage": "2013–2022", "years_age": "2018–2022", "cases_total": int(sum(r["cases_women"] + r["cases_men"] for r in out))}
from common import CACHE, SITE_DATA

GROUPS = [
    ("abdominal", "Abdominal pain", {15450, 15451, 15452, 15453}),
    ("chest", "Chest pain", {10500, 10501, 10502, 10503}),
    ("sob", "Shortness of breath", {14150}),
    ("headache", "Headache or migraine", {12100, 23650}),
    ("dizziness", "Dizziness or vertigo", {12250}),
    ("weakness", "Weakness or fatigue", {10200, 10201, 10150}),
    ("syncope", "Fainting", {10300}),
    ("palpitations", "Palpitations", {12600}),
    ("nausea", "Nausea or vomiting", {15250, 15300}),
    ("back", "Back pain", {19050, 19051, 19100, 19101}),
    ("flank", "Flank, rib or groin pain", {10550, 10551, 10552, 10553}),
    ("limb", "Neck, hip, leg or joint pain", {19001, 19151, 19201, 19251, 19301, 19351}),
]


def load():
    frames = []
    for f in sorted(glob.glob(f"{CACHE}/nhamcs/*.dta"), key=str.lower):
        year = int(re.search(r"(20\d\d)", f).group(1))
        df = pd.read_stata(f, convert_categoricals=False)
        dx = df[["DIAG1", "DIAG2", "DIAG3", "DIAG4", "DIAG5"]].astype(str).apply(lambda s: s.str.strip().str.upper())
        valid = dx.apply(lambda s: s.str.match(r"^[A-Z]\d"))  # real codes, not -9 / blank
        d1 = dx["DIAG1"]
        rng = lambda col, lo, hi: dx[col].str[:3].between(lo, hi) & valid[col]  # noqa: E731
        anyrng = lambda lo, hi: pd.concat([rng(c, lo, hi) for c in dx.columns], axis=1).any(axis=1)  # noqa: E731
        anystart = lambda ch: pd.concat([dx[c].str.startswith(ch) & valid[c] for c in dx.columns], axis=1).any(axis=1)  # noqa: E731
        n_valid = valid.sum(axis=1)
        n_sym = pd.concat([dx[c].str.startswith("R") & valid[c] for c in dx.columns], axis=1).sum(axis=1)
        n_z = pd.concat([dx[c].str.startswith("Z") & valid[c] for c in dx.columns], axis=1).sum(axis=1)
        out = pd.DataFrame({
            "year": year, "sex": df["SEX"], "age": df["AGE"], "w": df["PATWT"].astype(float), "strat": df["CSTRATM"], "psu": df["CPSUM"],
            "rfv1": df["RFV1"], "rfv2": df["RFV2"], "rfv3": df["RFV3"], "injury": df["INJURY"], "pain": df["PAINSCALE"], "triage": df["IMMEDR"], "ems": df["ARREMS"],
            "dx1_valid": valid["DIAG1"].values, "dx1": d1.values,
            "dxch": np.select([d1.str.startswith("R"), d1.str.startswith("I"), d1.str.startswith("J"), d1.str.startswith("K"), d1.str.startswith("F"), d1.str.startswith("G"), d1.str.startswith("N"), d1.str.startswith("M"), d1.str.match(r"^[AB]"), d1.str.startswith("O")],
                              ["Symptom code", "Heart and circulation", "Lungs and airways", "Digestive", "Mental health", "Nervous system", "Kidney, bladder, reproductive", "Muscles and bones", "Infection", "Pregnancy"], "Other"),
            "sym1": (d1.str.startswith("R") & valid["DIAG1"]).values,
            "sym_all": ((n_sym + n_z == n_valid) & (n_valid > 0)).values,  # nothing but symptom / encounter codes
            "psych_any": (anystart("F") & ~anyrng("F10", "F19") & ~anyrng("F00", "F09")).values,  # excludes substance and organic
            "anxiety_any": anyrng("F40", "F48").values,  # anxiety, stress, somatoform
            "anxiety1": (rng("DIAG1", "F40", "F48")).values,
            "depression_any": anyrng("F32", "F33").values,
            "rfv_anxiety": df[["RFV1", "RFV2", "RFV3"]].isin([11000, 11050]).any(axis=1).values,  # anxiety/nervousness, fears as a stated reason for visit
            "rfv_psych": df[["RFV1", "RFV2", "RFV3"]].apply(lambda c: c.between(11000, 11999)).any(axis=1).values,  # psychological or mental symptom as a stated reason
            "ihd_any": anyrng("I20", "I25").values, "mi_any": anyrng("I21", "I22").values, "pe_any": anyrng("I26", "I26").values, "hf_any": anyrng("I50", "I50").values, "af_any": anyrng("I48", "I48").values,
            "r07_1": (d1.str.startswith("R07")).values, "r10_1": (d1.str.startswith("R10")).values, "r51_1": (d1.str.startswith("R51")).values, "r06_1": (d1.str.startswith("R06")).values, "r42_1": (d1.str.startswith("R42")).values, "r53_1": (d1.str.startswith("R53")).values, "r55_1": (d1.str.startswith("R55")).values, "r00_1": (d1.str.startswith("R00")).values, "r11_1": (d1.str.startswith("R11")).values,
            "appendicitis": anyrng("K35", "K37").values, "gallbladder": anyrng("K80", "K83").values, "diverticulitis": anyrng("K57", "K57").values, "stone": anyrng("N20", "N23").values, "uti": (anyrng("N39", "N39") | anyrng("N10", "N10")).values,
            "gyn": anyrng("N70", "N99").values, "preg": anystart("O").values, "migraine": anyrng("G43", "G43").values, "headache_syndrome": anyrng("G44", "G44").values, "resp": anystart("J").values, "gerd": anyrng("K20", "K22").values,
            "stroke_tia": (anyrng("I60", "I69") | anyrng("G45", "G46")).values, "vestibular": anyrng("H81", "H83").values, "anaemia": anyrng("D50", "D64").values, "infection_any": (anystart("A") | anystart("B")).values,
            "totdiag": df["TOTDIAG"], "anyimage": df["ANYIMAGE"], "cbc": df["CBC"], "bmp": df["BMP"], "urine": df["URINE"], "pregtest": df["PREGTEST"],
            "cardenz": df["CARDENZ"], "ddimer": df["DDIMER"], "ekg": df["EKG"], "ctab": df["CTAB"], "cthead": df["CTHEAD"], "ultrasound": df["ULTRASND"] if "ULTRASND" in df else -9, "ctscan": df["CATSCAN"] if "CATSCAN" in df else -9,
            "admit": df["ADMIT"] if "ADMIT" in df else df["ADMITHOS"], "seen72": df["SEEN72"], "nofu": df["NOFU"], "retrned": df["RETRNED"], "lov": df["LOV"], "wait": df["WAITTIME"], "leftama": df["LEFTAMA"],
            "totchron": df["TOTCHRON"] if "TOTCHRON" in df else -9,
        })
        frames.append(out)
        print(f"  {year}: {len(df):,} visits")
    d = pd.concat(frames, ignore_index=True)
    d = d[(d["age"] >= 18) & (d["w"] > 0)].copy()
    d["female"] = d["sex"] == 1  # NHAMCS codes SEX 1 = female, 2 = male
    d["noninjury"] = d["injury"] == 0
    d["severe"] = d["pain"].between(7, 10)
    d["urgent"] = d["triage"].isin([1, 2])
    d["admitted"] = d["admit"] == 1
    d["anyimage_done"] = d["anyimage"] == 1
    d["cbc_done"] = d["cbc"] == 1
    d["bmp_done"] = d["bmp"] == 1
    d["urine_done"] = d["urine"] == 1
    d["pregtest_done"] = d["pregtest"] == 1
    d["cardenz_done"] = d["cardenz"] == 1
    d["ddimer_done"] = d["ddimer"] == 1
    d["ekg_done"] = d["ekg"] == 1
    d["ctab_done"] = d["ctab"] == 1
    d["cthead_done"] = d["cthead"] == 1
    d["ct_done"] = d["ctscan"] == 1
    d["us_done"] = d["ultrasound"] == 1
    d["blood_done"] = d["cbc_done"] | d["bmp_done"]
    d["seen72_ok"] = d["seen72"].isin([1, 2])
    d["seen72_yes"] = d["seen72"] == 1
    d["nofu_yes"] = d["nofu"] == 1
    d["retrned_yes"] = d["retrned"] == 1
    d["totdiag_ok"] = d["totdiag"].where(d["totdiag"] >= 0)
    d["no_tests"] = d["totdiag"] == 0
    d["lov_ok"] = d["lov"].where(d["lov"] >= 0)
    d["ems_yes"] = d["ems"] == 1
    d["named"] = d["dx1_valid"] & ~d["dx1"].str.match(r"^[RZ]")  # a disease, injury or other named condition as the primary diagnosis
    d["discharged"] = ~d["admitted"]
    return d


def main():
    d = load()
    base = d["noninjury"].values & d["dx1_valid"].values  # adult, non-injury, with a recorded primary diagnosis
    print(f"adult visits {len(d):,}; non-injury with a diagnosis {base.sum():,} (weighted {(d['w']*base).sum()/d['year'].nunique()/1e6:.1f}M/yr)")

    def metrics(dom):
        return {
            "symptom_dx": compare(d, dom, d["sym1"]), "symptom_only": compare(d, dom, d["sym_all"]), "named_dx": compare(d, dom, d["named"]),
            "anxiety_any": compare(d, dom, d["anxiety_any"]), "psych_any": compare(d, dom, d["psych_any"]),
            "tests_count": compare(d, dom, d["totdiag_ok"], scale=1.0, nd=2), "no_tests": compare(d, dom, d["no_tests"]), "anyimage": compare(d, dom, d["anyimage_done"]), "ct": compare(d, dom, d["ct_done"]), "blood": compare(d, dom, d["blood_done"]),
            "ekg": compare(d, dom, d["ekg_done"]), "cardenz": compare(d, dom, d["cardenz_done"]),
            "admitted": compare(d, dom, d["admitted"]), "seen72": compare(d, dom & d["seen72_ok"].values, d["seen72_yes"]), "nofu": compare(d, dom, d["nofu_yes"]), "retrned": compare(d, dom, d["retrned_yes"]),
            "lov_mean": compare(d, dom, d["lov_ok"], scale=1.0, nd=0), "severe_share": compare(d, dom & (d["pain"] >= 0).values, d["severe"]), "urgent": compare(d, dom & (d["triage"] >= 1).values, d["urgent"]),
            "symptom_dx_discharged": compare(d, dom & d["discharged"].values, d["sym1"]),
            "symptom_dx_no_imaging": compare(d, dom & ~d["anyimage_done"].values, d["sym1"]), "symptom_dx_imaging": compare(d, dom & d["anyimage_done"].values, d["sym1"]),
            "symptom_dx_tests_0": compare(d, dom & (d["totdiag"] == 0).values, d["sym1"]), "symptom_dx_tests_1_3": compare(d, dom & d["totdiag"].between(1, 3).values, d["sym1"]), "symptom_dx_tests_4": compare(d, dom & (d["totdiag"] >= 4).values, d["sym1"]),
        }

    groups = []
    sym_any = np.zeros(len(d), bool)
    for gid, label, codes in GROUPS:
        dom = base & d["rfv1"].isin(codes).values
        sym_any |= dom
        g = {"id": gid, "label": label, "n": int(dom.sum()), "n_women": int((dom & d["female"].values).sum()), "n_men": int((dom & ~d["female"].values).sum()),
             "weighted_visits_per_year_k": round((d["w"] * dom).sum() / d["year"].nunique() / 1e3), "metrics": metrics(dom),
             "age_adjusted": {"symptom_dx": age_adjusted(d, dom, d["sym1"]), "anxiety_any": age_adjusted(d, dom, d["anxiety_any"]), "seen72": age_adjusted(d, dom & d["seen72_ok"].values, d["seen72_yes"]), "anyimage": age_adjusted(d, dom, d["anyimage_done"])},
             "by_age": {f"{lo}-{hi}" if hi < 120 else f"{lo}+": {"symptom_dx": compare(d, dom & d["age"].between(lo, hi).values, d["sym1"]), "anxiety_any": compare(d, dom & d["age"].between(lo, hi).values, d["anxiety_any"]), "seen72": compare(d, dom & d["age"].between(lo, hi).values & d["seen72_ok"].values, d["seen72_yes"]), "n_women": int((dom & d["age"].between(lo, hi).values & d["female"].values).sum()), "n_men": int((dom & d["age"].between(lo, hi).values & ~d["female"].values).sum())} for lo, hi in AGE_BANDS}}
        # what the visit was called instead: complaint-specific named diagnoses
        named = {
            "chest": [("Chest pain, unspecified (R07)", "r07_1"), ("Coronary disease or heart attack", "ihd_any"), ("Anxiety or stress disorder", "anxiety_any"), ("Reflux or oesophageal", "gerd"), ("Respiratory disease", "resp"), ("Pulmonary embolism", "pe_any"), ("Heart failure", "hf_any"), ("Atrial fibrillation", "af_any")],
            "abdominal": [("Abdominal pain, unspecified (R10)", "r10_1"), ("Appendicitis", "appendicitis"), ("Gallbladder or bile duct", "gallbladder"), ("Diverticulitis", "diverticulitis"), ("Kidney stone", "stone"), ("Urinary infection", "uti"), ("Gynaecological", "gyn"), ("Pregnancy-related", "preg"), ("Anxiety or stress disorder", "anxiety_any")],
            "headache": [("Headache, unspecified (R51)", "r51_1"), ("Migraine", "migraine"), ("Other headache syndrome", "headache_syndrome"), ("Stroke or TIA", "stroke_tia"), ("Anxiety or stress disorder", "anxiety_any")],
            "sob": [("Shortness of breath, unspecified (R06)", "r06_1"), ("Respiratory disease", "resp"), ("Heart failure", "hf_any"), ("Pulmonary embolism", "pe_any"), ("Coronary disease or heart attack", "ihd_any"), ("Anxiety or stress disorder", "anxiety_any")],
            "dizziness": [("Dizziness, unspecified (R42)", "r42_1"), ("Inner-ear (vestibular) disorder", "vestibular"), ("Stroke or TIA", "stroke_tia"), ("Anaemia", "anaemia"), ("Anxiety or stress disorder", "anxiety_any")],
            "weakness": [("Weakness or malaise, unspecified (R53)", "r53_1"), ("Infection", "infection_any"), ("Stroke or TIA", "stroke_tia"), ("Anaemia", "anaemia"), ("Anxiety or stress disorder", "anxiety_any")],
            "syncope": [("Fainting, unspecified (R55)", "r55_1"), ("Atrial fibrillation", "af_any"), ("Coronary disease or heart attack", "ihd_any"), ("Anxiety or stress disorder", "anxiety_any")],
            "palpitations": [("Palpitations, unspecified (R00)", "r00_1"), ("Atrial fibrillation", "af_any"), ("Coronary disease or heart attack", "ihd_any"), ("Anxiety or stress disorder", "anxiety_any")],
            "nausea": [("Nausea or vomiting, unspecified (R11)", "r11_1"), ("Infection", "infection_any"), ("Gallbladder or bile duct", "gallbladder"), ("Pregnancy-related", "preg"), ("Anxiety or stress disorder", "anxiety_any")],
        }.get(gid)
        if named:
            g["named"] = [{"label": lab, "cmp": compare(d, dom, d[col])} for lab, col in named]
        g["dx_mix"] = {c: compare(d, dom, d["dxch"] == c) for c in ["Symptom code", "Heart and circulation", "Lungs and airways", "Digestive", "Mental health", "Nervous system", "Kidney, bladder, reproductive", "Muscles and bones", "Infection", "Pregnancy", "Other"]}
        groups.append(g)
        m = g["metrics"]
        print(f"  {label:28} n={g['n']:5}  symptom dx W {m['symptom_dx']['women']['est']} M {m['symptom_dx']['men']['est']} | anxiety W {m['anxiety_any']['women']['est']} M {m['anxiety_any']['men']['est']} | 72h return W {m['seen72']['women']['est'] if m['seen72'] else '-'} M {m['seen72']['men']['est'] if m['seen72'] else '-'} | tests W {m['tests_count']['women']['est']} M {m['tests_count']['men']['est']}")

    overall = {"n": int(base.sum()), "n_women": int((base & d["female"].values).sum()), "n_men": int((base & ~d["female"].values).sum()), "metrics": metrics(base),
               "age_adjusted": {"symptom_dx": age_adjusted(d, base, d["sym1"]), "anxiety_any": age_adjusted(d, base, d["anxiety_any"]), "seen72": age_adjusted(d, base & d["seen72_ok"].values, d["seen72_yes"])},
               "by_year": [{"year": int(y), "symptom_dx": compare(d, base & (d["year"] == y).values, d["sym1"]), "anxiety_any": compare(d, base & (d["year"] == y).values, d["anxiety_any"])} for y in sorted(d["year"].unique())]}
    symptoms = {"n": int(sym_any.sum()), "n_women": int((sym_any & d["female"].values).sum()), "n_men": int((sym_any & ~d["female"].values).sum()),
                "weighted_visits_per_year_m": round((d["w"] * sym_any).sum() / d["year"].nunique() / 1e6, 1), "metrics": metrics(sym_any),
                "age_adjusted": {"symptom_dx": age_adjusted(d, sym_any, d["sym1"]), "anxiety_any": age_adjusted(d, sym_any, d["anxiety_any"]), "seen72": age_adjusted(d, sym_any & d["seen72_ok"].values, d["seen72_yes"]), "anyimage": age_adjusted(d, sym_any, d["anyimage_done"]), "tests_count": None},
                "by_age": {f"{lo}-{hi}" if hi < 120 else f"{lo}+": {"symptom_dx": compare(d, sym_any & d["age"].between(lo, hi).values, d["sym1"]), "anxiety_any": compare(d, sym_any & d["age"].between(lo, hi).values, d["anxiety_any"]), "seen72": compare(d, sym_any & d["age"].between(lo, hi).values & d["seen72_ok"].values, d["seen72_yes"]), "anyimage": compare(d, sym_any & d["age"].between(lo, hi).values, d["anyimage_done"]), "tests_count": compare(d, sym_any & d["age"].between(lo, hi).values, d["totdiag_ok"], scale=1.0, nd=2)} for lo, hi in AGE_BANDS},
                "by_year": [{"year": int(y), "symptom_dx": compare(d, sym_any & (d["year"] == y).values, d["sym1"]), "anxiety_any": compare(d, sym_any & (d["year"] == y).values, d["anxiety_any"]), "seen72": compare(d, sym_any & (d["year"] == y).values & d["seen72_ok"].values, d["seen72_yes"])} for y in sorted(d["year"].unique())],
                # symptom label by how much workup was done
                "by_tests": [{"tests": lab, "symptom_dx": compare(d, sym_any & dom_t, d["sym1"]), "anxiety_any": compare(d, sym_any & dom_t, d["anxiety_any"])} for lab, dom_t in (("0", (d["totdiag"] == 0).values), ("1-3", d["totdiag"].between(1, 3).values), ("4-6", d["totdiag"].between(4, 6).values), ("7+", (d["totdiag"] >= 7).values))],
                # the return visit: who came back within 72 hours, by what they had been told
                "return_by_label": {"symptom_code": compare(d, sym_any & d["seen72_ok"].values & d["sym1"].values, d["seen72_yes"]), "named_dx": compare(d, sym_any & d["seen72_ok"].values & d["named"].values, d["seen72_yes"])},
                }
    # ---- the anxiety label: baselines and what was checked first
    cardio = base & d["rfv1"].isin({10500, 10501, 10502, 10503, 14150, 12600, 10300, 12250}).values  # chest, breath, palpitations, fainting, dizziness
    anx_dom = sym_any & d["anxiety_any"].values
    anxiety = {
        "n_cardio": int(cardio.sum()),
        "baseline_rfv_anxiety": compare(d, base, d["rfv_anxiety"]),  # share of all non-injury visits where anxiety was a stated reason
        "baseline_rfv_psych": compare(d, base, d["rfv_psych"]),
        "baseline_injury_anxiety_code": compare(d, (d["injury"] == 1).values & d["dx1_valid"].values, d["anxiety_any"]),  # incidental anxiety coding on injury visits
        "symptom_visits_anxiety_code": compare(d, sym_any, d["anxiety_any"]),
        "symptom_visits_anxiety_code_no_rfv": compare(d, sym_any & ~d["rfv_psych"].values, d["anxiety_any"]),  # label attached though the patient did not mention it
        "symptom_visits_anxiety_primary": compare(d, sym_any, d["anxiety1"]),
        "symptom_visits_depression_code": compare(d, sym_any, d["depression_any"]),
        "symptom_visits_psych_code": compare(d, sym_any, d["psych_any"]),
        "cardio_anxiety_code": compare(d, cardio, d["anxiety_any"]),
        "cardio_anxiety_by_age": {f"{lo}-{hi}" if hi < 120 else f"{lo}+": compare(d, cardio & d["age"].between(lo, hi).values, d["anxiety_any"]) for lo, hi in AGE_BANDS},
        "cardio_anxiety_age_adjusted": age_adjusted(d, cardio, d["anxiety_any"]),
        # among cardiorespiratory complaints that were labelled anxiety: was the heart checked?
        "cardio_labelled_anxiety": {"n_women": int((cardio & d["anxiety_any"].values & d["female"].values).sum()), "n_men": int((cardio & d["anxiety_any"].values & ~d["female"].values).sum()),
                                    "ekg": compare(d, cardio & d["anxiety_any"].values, d["ekg_done"]), "cardenz": compare(d, cardio & d["anxiety_any"].values, d["cardenz_done"]), "anyimage": compare(d, cardio & d["anxiety_any"].values, d["anyimage_done"]),
                                    "tests_count": compare(d, cardio & d["anxiety_any"].values, d["totdiag_ok"], scale=1.0, nd=1), "admitted": compare(d, cardio & d["anxiety_any"].values, d["admitted"]), "lov_mean": compare(d, cardio & d["anxiety_any"].values, d["lov_ok"], scale=1.0, nd=0)},
        "cardio_not_labelled": {"ekg": compare(d, cardio & ~d["anxiety_any"].values, d["ekg_done"]), "cardenz": compare(d, cardio & ~d["anxiety_any"].values, d["cardenz_done"]), "tests_count": compare(d, cardio & ~d["anxiety_any"].values, d["totdiag_ok"], scale=1.0, nd=1), "admitted": compare(d, cardio & ~d["anxiety_any"].values, d["admitted"])},
        "by_complaint": [{"id": gid, "label": label, "anxiety_any": compare(d, base & d["rfv1"].isin(codes).values, d["anxiety_any"]), "anxiety_no_rfv": compare(d, base & d["rfv1"].isin(codes).values & ~d["rfv_psych"].values, d["anxiety_any"])} for gid, label, codes in GROUPS],
    }
    # explorer cells: complaint x age x sex
    explorer = []
    for gid, label, codes in GROUPS + [("all", "Any of these complaints", None)]:
        gdom = sym_any if codes is None else base & d["rfv1"].isin(codes).values
        for lo, hi in AGE_BANDS + [(18, 120)]:
            dom = gdom & d["age"].between(lo, hi).values
            explorer.append({"complaint": gid, "age": f"{lo}-{hi}" if hi < 120 else (f"{lo}+" if lo > 18 else "all"), "n_women": int((dom & d["female"].values).sum()), "n_men": int((dom & ~d["female"].values).sum()),
                             "metrics": {"symptom_dx": compare(d, dom, d["sym1"]), "anxiety_any": compare(d, dom, d["anxiety_any"]), "psych_any": compare(d, dom, d["psych_any"]), "tests_count": compare(d, dom, d["totdiag_ok"], scale=1.0, nd=1), "anyimage": compare(d, dom, d["anyimage_done"]), "ct": compare(d, dom, d["ct_done"]), "blood": compare(d, dom, d["blood_done"]),
                                         "admitted": compare(d, dom, d["admitted"]), "seen72": compare(d, dom & d["seen72_ok"].values, d["seen72_yes"]), "lov_mean": compare(d, dom, d["lov_ok"], scale=1.0, nd=0), "urgent": compare(d, dom & (d["triage"] >= 1).values, d["urgent"])}})

    # ---- adjusted models
    dd = d[sym_any].copy()
    dd["complaint"] = "other"
    for gid, _, codes in GROUPS:
        dd.loc[dd["rfv1"].isin(codes), "complaint"] = gid
    dd["age_band"] = pd.cut(dd["age"], [17, 44, 64, 200], labels=["18-44", "45-64", "65+"])
    dd["femalei"] = dd["female"].astype(int); dd["yearf"] = dd["year"].astype(str)
    dd["sym_i"] = dd["sym1"].astype(int); dd["anx_i"] = dd["anxiety_any"].astype(int); dd["s72_i"] = dd["seen72_yes"].astype(int); dd["psy_i"] = dd["psych_any"].astype(int); dd["img_i"] = dd["anyimage_done"].astype(int); dd["adm_i"] = dd["admitted"].astype(int)
    dd["tests"] = dd["totdiag_ok"]; dd["ems_i"] = dd["ems_yes"].astype(int); dd["pain_rec"] = dd["pain"].where(dd["pain"] >= 0); dd["tri"] = dd["triage"].where(dd["triage"] >= 1); dd["chron"] = dd["totchron"].where(dd["totchron"] >= 0)

    def fit(df, formula, label, note=""):
        need = [v for v in ("tests", "pain_rec", "tri", "chron") if v in formula]
        df = df.dropna(subset=need)
        res = smf.glm(formula, data=df, family=sm.families.Binomial(), freq_weights=df["w"] / df["w"].mean()).fit(cov_type="cluster", cov_kwds={"groups": df["psu"].astype(str) + "_" + df["strat"].astype(str)})
        b, se = res.params["femalei"], res.bse["femalei"]
        o = {"label": label, "note": note, "n": int(len(df)), "or": round(float(np.exp(b)), 2), "lo": round(float(np.exp(b - 1.96 * se)), 2), "hi": round(float(np.exp(b + 1.96 * se)), 2), "p": round(float(res.pvalues["femalei"]), 3), "formula": formula}
        print(f"  {label:70} OR {o['or']} [{o['lo']}, {o['hi']}] p={o['p']} n={o['n']}")
        return o
    print("Adjusted odds ratios, women vs men:")
    models = {
        "symptom_raw": fit(dd, "sym_i ~ femalei", "Left with a symptom code: unadjusted"),
        "symptom_adj": fit(dd, "sym_i ~ femalei + C(age_band) + C(complaint) + yearf", "… adjusted for age band, complaint, year"),
        "symptom_adj_workup": fit(dd, "sym_i ~ femalei + C(age_band) + C(complaint) + yearf + tests + img_i + tri + ems_i", "… plus tests ordered, imaging, triage level, ambulance"),
        "symptom_adj_workup_chron": fit(dd, "sym_i ~ femalei + C(age_band) + C(complaint) + yearf + tests + img_i + tri + ems_i + chron", "… plus number of chronic conditions", "2020 onward only; earlier files lack the count"),
        "symptom_discharged_adj": fit(dd[dd["discharged"]], "sym_i ~ femalei + C(age_band) + C(complaint) + yearf + tests + img_i + tri + ems_i", "Symptom code among those sent home: adjusted for age, complaint, year, workup"),
        "anxiety_raw": fit(dd, "anx_i ~ femalei", "Anxiety or stress code attached: unadjusted"),
        "anxiety_adj": fit(dd, "anx_i ~ femalei + C(age_band) + C(complaint) + yearf + tests + img_i + tri + ems_i", "… adjusted for age, complaint, year, workup"),
        "anxiety_adj_no_rfv": fit(dd[~dd["rfv_psych"]], "anx_i ~ femalei + C(age_band) + C(complaint) + yearf + tests + img_i + tri + ems_i", "… same, excluding visits where the patient mentioned anxiety or a psychological symptom"),
        "anxiety_adj_pain": fit(dd, "anx_i ~ femalei + C(age_band) + C(complaint) + yearf + tests + img_i + tri + ems_i + pain_rec", "… plus reported pain score", "visits with a recorded pain score"),
        "anxiety_cardio_adj": fit(dd[dd["complaint"].isin(["chest", "sob", "palpitations", "syncope", "dizziness"])], "anx_i ~ femalei + C(age_band) + C(complaint) + yearf + tests + img_i + tri + ems_i", "Anxiety code, heart-and-breath complaints: adjusted for age, complaint, year, workup"),
        "anxiety_cardio_older_adj": fit(dd[dd["complaint"].isin(["chest", "sob", "palpitations", "syncope", "dizziness"]) & (dd["age"] >= 65)], "anx_i ~ femalei + C(complaint) + yearf + tests + img_i + tri + ems_i", "… aged 65 and over"),
        "psych_adj": fit(dd, "psy_i ~ femalei + C(age_band) + C(complaint) + yearf + tests + img_i + tri + ems_i", "Any psychiatric code attached: adjusted for age, complaint, year, workup"),
        "imaging_adj": fit(dd, "img_i ~ femalei + C(age_band) + C(complaint) + yearf + tri + ems_i + pain_rec", "Any imaging: adjusted for age, complaint, year, triage, ambulance, pain score", "visits with a recorded pain score"),
        "admitted_adj": fit(dd, "adm_i ~ femalei + C(age_band) + C(complaint) + yearf + tri + ems_i", "Admitted: adjusted for age, complaint, year, triage, ambulance"),
        "return72_raw": fit(dd[dd["seen72_ok"]], "s72_i ~ femalei", "Back in the same ED within 72 hours: unadjusted"),
        "return72_adj": fit(dd[dd["seen72_ok"]], "s72_i ~ femalei + C(age_band) + C(complaint) + yearf", "… adjusted for age band, complaint, year"),
    }
    for gid, label, _ in GROUPS:
        sub = dd[dd["complaint"] == gid]
        if sub["sym_i"].sum() > 30:
            models[f"symptom_adj_{gid}"] = fit(sub, "sym_i ~ femalei + C(age_band) + yearf + tests + img_i + tri + ems_i", f"Symptom code, {label.lower()}: adjusted for age, year, workup")

    ca = cancer()
    print("cancer:", {k: v for k, v in ca.items() if k != "sites"}); print("  later stage for women:", [(r["label"], r["distant"]["diff"]) for r in ca["sites"] if r["distant"]["diff_lo"] > 0]); print("  earliest:", [(r["label"], r["distant"]["diff"]) for r in ca["sites"][-5:]])
    out = {"generated": date.today().isoformat(), "years": [int(d["year"].min()), int(d["year"].max())], "n_adult_visits": int(len(d)), "overall": overall, "cancer": ca, "symptoms": symptoms, "anxiety": anxiety, "groups": groups, "explorer": explorer,
           "models": models, "models_note": "Survey-weighted logistic regressions (weights normalised to mean 1); standard errors clustered on stratum x PSU. Odds ratio for female patients relative to male."}
    with open(f"{SITE_DATA}/chapter5.json", "w", encoding="utf-8") as f:
        json.dump(out, f, indent=1, default=lambda o: float(o) if isinstance(o, (np.floating, np.integer)) else str(o))
    today = date.today().isoformat()
    new_sources = [
        {"id": "nimh-anxiety", "title": "Any anxiety disorder: prevalence of any anxiety disorder among U.S. adults", "publisher": "National Institute of Mental Health, from the National Comorbidity Survey Replication (2001–2003)", "url": "https://www.nimh.nih.gov/health/statistics/any-anxiety-disorder", "retrieved": today, "note": "Past-year prevalence 23.4% of women, 14.3% of men."},
        {"id": "westergaard-2019", "title": "Population-wide analysis of differences in disease progression patterns in men and women", "publisher": "Westergaard D., Moseley P., Sørup F.K.H., Baldi P., Brunak S., Nature Communications 10, 666 (2019). doi:10.1038/s41467-019-08475-9", "url": "https://doi.org/10.1038/s41467-019-08475-9", "retrieved": today, "note": "Danish registries, 6.9 million people, 1994–2015; women diagnosed later than men for the majority of 770 diseases, about four years on average."},
        {"id": "seer-stage", "title": "SEER*Explorer data archive: stage distribution of SEER incidence cases by sex, 2013–2022 (November 2024 submission)", "publisher": "Surveillance, Epidemiology, and End Results Program, National Cancer Institute", "url": "https://seer.cancer.gov/statistics-network/explorer/archive.html", "retrieved": today, "note": "SEER summary stage (localized, regional, distant, unstaged); All Races, by sex and age band; 22 registries."},
        {"id": "seer-age", "title": "SEER*Explorer data archive: median age at diagnosis by sex, 2018–2022 (November 2024 submission)", "publisher": "Surveillance, Epidemiology, and End Results Program, National Cancer Institute", "url": "https://seer.cancer.gov/statistics-network/explorer/archive.html", "retrieved": today},
        {"id": "cohn-2014", "title": "Sex disparities in diagnosis of bladder cancer after initial presentation with hematuria: a nationwide claims-based investigation", "publisher": "Cohn J.A., Vekhter B., Lyttle C., Steinberg G.D., Large M.C., Cancer 120(4), 2014. doi:10.1002/cncr.28416", "url": "https://doi.org/10.1002/cncr.28416", "retrieved": today, "note": "7,649 insured adults with haematuria later diagnosed with bladder cancer, 2004–2010: mean 85.4 days to diagnosis for women against 73.6 for men; women 2.3 times as likely to be diagnosed with a urinary infection first."},
        {"id": "nhamcs-icd", "title": "ICD-10-CM chapter XVIII: symptoms, signs and abnormal clinical and laboratory findings, not elsewhere classified (R00–R99)", "publisher": "National Center for Health Statistics, CDC", "url": "https://www.cdc.gov/nchs/icd/icd-10-cm/index.html", "retrieved": today, "note": "A visit 'ends with a symptom code' when its first-listed diagnosis is in this chapter."},
    ]
    sources = json.load(open(f"{SITE_DATA}/sources.json", encoding="utf-8"))
    sources = [s for s in sources if s["id"] not in {n["id"] for n in new_sources}] + new_sources
    json.dump(sources, open(f"{SITE_DATA}/sources.json", "w", encoding="utf-8"), indent=1)
    o = overall["metrics"]; s = symptoms["metrics"]
    print(f"overall non-injury: symptom dx W {o['symptom_dx']['women']['est']} M {o['symptom_dx']['men']['est']} (age-adj {overall['age_adjusted']['symptom_dx']}); anxiety W {o['anxiety_any']['women']['est']} M {o['anxiety_any']['men']['est']}")
    print(f"symptom complaints n={symptoms['n']}: symptom dx W {s['symptom_dx']['women']['est']} M {s['symptom_dx']['men']['est']} diff {s['symptom_dx']['diff']} [{s['symptom_dx']['diff_lo']},{s['symptom_dx']['diff_hi']}]; tests W {s['tests_count']['women']['est']} M {s['tests_count']['men']['est']}; imaging W {s['anyimage']['women']['est']} M {s['anyimage']['men']['est']}; 72h W {s['seen72']['women']['est']} M {s['seen72']['men']['est']}; admitted W {s['admitted']['women']['est']} M {s['admitted']['men']['est']}")
    print("by tests:", [(b["tests"], b["symptom_dx"]["women"]["est"], b["symptom_dx"]["men"]["est"]) for b in symptoms["by_tests"]])
    print("return by label:", {k: (v["women"]["est"], v["men"]["est"]) for k, v in symptoms["return_by_label"].items() if v})
    a = anxiety
    print("baselines: rfv anxiety", (a["baseline_rfv_anxiety"]["women"]["est"], a["baseline_rfv_anxiety"]["men"]["est"]), "injury anxiety code", (a["baseline_injury_anxiety_code"]["women"]["est"], a["baseline_injury_anxiety_code"]["men"]["est"]), "symptom visits anxiety", (a["symptom_visits_anxiety_code"]["women"]["est"], a["symptom_visits_anxiety_code"]["men"]["est"]), "no rfv", (a["symptom_visits_anxiety_code_no_rfv"]["women"]["est"], a["symptom_visits_anxiety_code_no_rfv"]["men"]["est"]), "primary", (a["symptom_visits_anxiety_primary"]["women"]["est"], a["symptom_visits_anxiety_primary"]["men"]["est"]), "depression", (a["symptom_visits_depression_code"]["women"]["est"], a["symptom_visits_depression_code"]["men"]["est"]), "psych", (a["symptom_visits_psych_code"]["women"]["est"], a["symptom_visits_psych_code"]["men"]["est"]))
    print("cardio anxiety by age:", {k: (v["women"]["est"], v["men"]["est"], v["diff_lo"], v["diff_hi"]) for k, v in a["cardio_anxiety_by_age"].items()}, "adj", a["cardio_anxiety_age_adjusted"])
    print("labelled anxiety workup:", {k: (v["women"]["est"], v["men"]["est"]) for k, v in a["cardio_labelled_anxiety"].items() if isinstance(v, dict)}, "not labelled:", {k: (v["women"]["est"], v["men"]["est"]) for k, v in a["cardio_not_labelled"].items() if v})
    print("by age:", {k: (v["symptom_dx"]["women"]["est"], v["symptom_dx"]["men"]["est"], v["anxiety_any"]["women"]["est"], v["anxiety_any"]["men"]["est"]) for k, v in symptoms["by_age"].items()})


if __name__ == "__main__":
    main()
