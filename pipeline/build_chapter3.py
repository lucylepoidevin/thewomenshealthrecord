"""Chapter 3: NIH funding versus burden, by the sex a disease falls on.

Funding: NIH RCDC categorical spending (report.nih.gov), $ millions by fiscal year.
Burden:  WHO Global Health Estimates, DALYs ('000) by cause and sex, United States,
         for 2010, 2015, 2019, 2021, 2023.
Each NIH category is mapped to one or more WHO causes (MAPPING below). For each
disease: female share of DALYs, NIH $ per DALY, and the residual from a power-law
fit of funding on burden (as in Mirin 2021). Writes site/public/data/chapter3.json.
"""
import json
import math
from datetime import date

import numpy as np
import pandas as pd

from common import CACHE, SITE_DATA

CH3 = f"{CACHE}/ch3"
BURDEN_YEARS = [2010, 2015, 2019, 2021, 2023]
FY_FOR_BURDEN = {2010: ["Y2010NA"], 2015: ["Y2015"], 2019: ["Y2019"], 2021: ["Y2021"], 2023: ["Y2023"]}
LATEST_FY = "Y2024"
MIN_DALYS_K = 15  # thousands of US DALYs needed for a stable $/DALY

# disease label -> (list of NIH RCDC category names summed, list of WHO cause codes summed, note)
MAPPING = {
    "Alzheimer's and other dementias": (["Alzheimer's Disease including Alzheimer's Disease Related Dementias (AD/ADRD)"], [950], ""),
    "Anxiety disorders": (["Anxiety Disorders"], [880], ""),
    "Asthma": (["Asthma"], [1190], ""),
    "ADHD": (["Attention Deficit Hyperactivity Disorder (ADHD)"], [911], ""),
    "Autism": (["Autism"], [900], ""),
    "Bipolar disorder": (["Bipolar Disorder"], [840], ""),
    "Brain cancer": (["Brain Cancer"], [751], ""),
    "Breast cancer": (["Breast Cancer"], [700], ""),
    "Cervical cancer": (["Cervical Cancer"], [710], ""),
    "Cirrhosis and chronic liver disease": (["Chronic Liver Disease and Cirrhosis"], [1230], ""),
    "COPD": (["Chronic Obstructive Pulmonary Disease"], [1180], ""),
    "Colorectal cancer": (["Colorectal Cancer"], [650], ""),
    "Depression": (["Depression"], [830], ""),
    "Diabetes": (["Diabetes"], [800], ""),
    "Peptic ulcer": (["Digestive Diseases - (Peptic Ulcer)"], [1220], ""),
    "Gallbladder disease": (["Digestive Diseases - (Gallbladder)"], [1246], ""),
    "Down syndrome": (["Down Syndrome"], [1430], ""),
    "Eating disorders": (["Eating Disorders"], [890], ""),
    "Epilepsy": (["Epilepsy"], [970], ""),
    "Esophageal cancer": (["Esophageal Cancer"], [630], ""),
    "Hearing loss": (["Hearing Loss"], [1080], ""),
    "Coronary heart disease": (["Heart Disease - Coronary Heart Disease"], [1130], ""),
    "Hepatitis B": (["Hepatitis - B"], [190, 1231, 661], "burden includes cirrhosis and liver cancer due to hepatitis B"),
    "Hepatitis C": (["Hepatitis - C"], [200, 1232, 662], "burden includes cirrhosis and liver cancer due to hepatitis C"),
    "HIV/AIDS": (["HIV/AIDS"], [100], ""),
    "Hodgkin lymphoma": (["Hodgkin's Disease"], [761], ""),
    "Inflammatory bowel disease": (["Inflammatory Bowel Disease"], [1244], ""),
    "Kidney disease": (["Kidney Disease"], [1270], ""),
    "Liver cancer": (["Liver Cancer"], [660], ""),
    "Lung cancer": (["Lung Cancer"], [680], ""),
    "Lymphoma": (["Lymphoma"], [761, 762], ""),
    "Macular degeneration": (["Macular Degeneration"], [1060], ""),
    "Migraine": (["Migraine"], [990], ""),
    "Multiple sclerosis": (["Multiple Sclerosis"], [980], ""),
    "Osteoarthritis": (["Osteoarthritis"], [1360], ""),
    "Otitis media": (["Otitis Media"], [410], ""),
    "Ovarian cancer": (["Ovarian Cancer"], [730], ""),
    "Pancreatic cancer": (["Pancreatic Cancer"], [670], ""),
    "Parkinson's disease": (["Parkinson's Disease"], [960], ""),
    "Prostate cancer": (["Prostate Cancer"], [740], ""),
    "Rheumatoid arthritis": (["Rheumatoid Arthritis"], [1350], ""),
    "Schizophrenia": (["Schizophrenia"], [850], ""),
    "Sexually transmitted infections": (["Sexually Transmitted Infections"], [40], "excludes HIV"),
    "Sickle cell disease": (["Sickle Cell Disease"], [812], ""),
    "Skin cancer": (["Skin Cancer"], [690], ""),
    "Stomach cancer": (["Stomach Cancer"], [640], ""),
    "Stroke": (["Stroke"], [1140], ""),
    "Suicide and self-harm": (["Suicide"], [1610], ""),
    "Testicular cancer": (["Testicular Cancer"], [742], ""),
    "Uterine cancer": (["Uterine Cancer"], [720], ""),
    "Back and neck pain": (["Back Pain", "Neck Pain"], [1380], "two NIH categories summed"),
    "Alcohol use disorders": (["Alcoholism, Alcohol Use and Health"], [860], ""),
    "Drug use disorders": (["Drug Abuse (NIDA only)"], [870], ""),
    "Opioid use disorders": (["Opioid Misuse and Addiction"], [871], ""),
    "Cocaine use disorders": (["Cocaine"], [872], ""),
    "Amphetamine use disorders": (["Methamphetamine"], [873], ""),
    "Gynaecological diseases": (["Endometriosis", "Fibroid Tumors (Uterine)", "Polycystic Ovary Syndrome (PCOS)", "Vulvodynia", "Pelvic Inflammatory Disease"], [1320], "five NIH categories summed against WHO's single gynaecological-diseases cause"),
    "Infertility": (["Infertility"], [1310], ""),
    "Congenital heart disease": (["Congenital Heart Disease"], [1440], ""),
    "Neural tube defects": (["Spina Bifida"], [1410], ""),
    "Interpersonal violence": (["Homicide and Legal Interventions"], [1620], ""),
    "Unintentional injuries": (["Physical Injury - Accidents and Adverse Effects"], [1520], "both definitions are broad"),
    "Oral and dental disease": (["Dental, Oral, and Craniofacial Disease"], [1470], "NIH category also covers craniofacial research"),
    "Vision loss": (["Eye Disease and Disorders of Vision"], [1030, 1040, 1050, 1060, 1070], ""),
    "Pneumonia and influenza": (["Pneumonia and Influenza"], [390], "WHO cause is lower respiratory infections"),
    "Preterm birth": (["Preterm, Low Birth Weight and Health of the Newborn"], [500], ""),
    "Sudden infant death syndrome": (["Sudden Infant Death Syndrome"], [1505], ""),
    "Maternal conditions": (["Maternal Morbidity and Mortality"], [420], ""),
    "Tuberculosis": (["Tuberculosis"], [30], "NIH funding is largely for global disease; US burden is small"),
}
# conditions NIH funds that have no WHO burden estimate at all (mostly female-dominant)
UNCOUNTED = ["Fibromyalgia", "Chronic Fatigue Syndrome (ME/CFS)", "Lupus", "Interstitial Cystitis", "Temporomandibular Muscle/Joint Disorder (TMJD)", "Sjogren's Disease", "Scleroderma", "Postural Orthostatic Tachycardia Syndrome", "Osteoporosis", "Endometriosis", "Vulvodynia", "Polycystic Ovary Syndrome (PCOS)"]


def load_rcdc():
    r = json.load(open(f"{CH3}/rcdc.json"))
    out = {}
    for rec in r:
        vals = {}
        for item in rec["data"]:
            try:
                vals[item["fY_Dataset"]] = float(str(item["amount"]).replace(",", ""))
            except (TypeError, ValueError):
                pass
        out[rec["dC_Name"]] = vals
    return out


def load_who(year, measure="daly"):
    df = pd.read_excel(f"{CH3}/who_{measure}_{year}.xlsx", sheet_name="All ages", header=None)
    col = [i for i in range(df.shape[1]) if str(df.iat[7, i]).strip() == "USA"][0]
    out = {}
    for i in range(9, df.shape[0]):
        sex, code, v = str(df.iat[i, 0]).strip(), df.iat[i, 1], df.iat[i, col]
        try:
            code = int(float(code))
            v = float(v)
        except (TypeError, ValueError):
            continue
        out.setdefault(code, {})[sex] = v
    return out  # code -> {Persons, Males, Females} in thousands of DALYs


def build_year(rcdc, who, fy_keys):
    rows = []
    for label, (cats, codes, note) in MAPPING.items():
        fund = 0.0
        ok = True
        for c in cats:
            v = None
            for k in fy_keys:
                v = rcdc.get(c, {}).get(k)
                if v is not None:
                    break
            if v is None:
                ok = False
            else:
                fund += v
        if not ok:
            continue
        f = sum(who.get(c, {}).get("Females", 0) for c in codes)
        m = sum(who.get(c, {}).get("Males", 0) for c in codes)
        tot = f + m
        if tot < MIN_DALYS_K or fund <= 0:
            continue
        rows.append({"disease": label, "nih_categories": cats, "who_codes": codes, "note": note,
                     "funding_m": round(fund, 1), "dalys_k": round(tot, 1), "female_share": round(f / tot * 100, 1),
                     "dollars_per_daly": round(fund * 1e6 / (tot * 1e3), 0)})
    # power-law fit: log10(funding) = a + b log10(dalys)
    x = np.log10([r["dalys_k"] for r in rows]); y = np.log10([r["funding_m"] for r in rows])
    b, a = np.polyfit(x, y, 1)
    for r, xi, yi in zip(rows, x, y):
        exp_log = a + b * xi
        r["expected_m"] = round(10 ** exp_log, 1)
        r["ratio_to_expected"] = round(10 ** (yi - exp_log), 2)
        r["skew"] = "female" if r["female_share"] >= 60 else "male" if r["female_share"] <= 40 else "balanced"
    return rows, {"a": round(a, 3), "b": round(b, 3)}


def summarize(rows):
    def med(k, skew):
        v = [r[k] for r in rows if r["skew"] == skew]
        return round(float(np.median(v)), 2) if v else None
    fem = [r for r in rows if r["skew"] == "female"]; mal = [r for r in rows if r["skew"] == "male"]
    under_f = sum(1 for r in fem if r["ratio_to_expected"] < 1); under_m = sum(1 for r in mal if r["ratio_to_expected"] < 1)
    gap_f = sum(max(0.0, r["expected_m"] - r["funding_m"]) for r in fem)
    return {"n": len(rows), "n_female": len(fem), "n_male": len(mal), "n_balanced": len(rows) - len(fem) - len(mal),
            "median_dollars_per_daly": {"female": med("dollars_per_daly", "female"), "male": med("dollars_per_daly", "male"), "balanced": med("dollars_per_daly", "balanced")},
            "median_ratio_to_expected": {"female": med("ratio_to_expected", "female"), "male": med("ratio_to_expected", "male"), "balanced": med("ratio_to_expected", "balanced")},
            "share_underfunded": {"female": round(under_f / len(fem) * 100) if fem else None, "male": round(under_m / len(mal) * 100) if mal else None},
            "female_shortfall_m": round(gap_f), "total_funding_m": round(sum(r["funding_m"] for r in rows))}


def main():
    rcdc = load_rcdc()
    who21 = load_who(2021)
    rows, fit = build_year(rcdc, who21, [LATEST_FY])
    # disability share of burden (YLD / DALY) per disease, from the WHO YLD file
    try:
        yld = load_who(2021, "yld")
        for r in rows:
            y = sum(yld.get(c, {}).get("Persons", 0) for c in r["who_codes"])
            r["disability_share"] = round(y / (r["dalys_k"]) * 100, 1) if r["dalys_k"] else None
    except FileNotFoundError:
        for r in rows:
            r["disability_share"] = None
    # ranks and "same burden, different money" comparators for the most underfunded female-skewed diseases
    by_ratio = sorted(rows, key=lambda r: r["ratio_to_expected"])
    for i, r in enumerate(by_ratio):
        r["rank_by_ratio"] = i + 1  # 1 = most underfunded
    comparators = []
    for f in sorted([r for r in rows if r["skew"] == "female"], key=lambda r: r["ratio_to_expected"])[:5]:
        near = [r for r in rows if r["disease"] != f["disease"] and 1 / 1.6 <= r["dalys_k"] / f["dalys_k"] <= 1.6]
        near = sorted(near, key=lambda r: -r["dollars_per_daly"])[:6]
        comparators.append({"disease": f["disease"], "dalys_k": f["dalys_k"], "funding_m": f["funding_m"], "per_daly": f["dollars_per_daly"], "female_share": f["female_share"],
                            "others": [{"disease": r["disease"], "dalys_k": r["dalys_k"], "funding_m": r["funding_m"], "per_daly": r["dollars_per_daly"], "female_share": r["female_share"], "skew": r["skew"]} for r in near]})
    summary = summarize(rows)
    print(f"diseases: {summary['n']} (female-skewed {summary['n_female']}, male-skewed {summary['n_male']}, balanced {summary['n_balanced']}); fit b={fit['b']}")
    print("median $/DALY:", summary["median_dollars_per_daly"], "| median ratio to expected:", summary["median_ratio_to_expected"], "| underfunded share:", summary["share_underfunded"], "| female shortfall $M:", summary["female_shortfall_m"])
    trend = []
    for by in BURDEN_YEARS:
        rws, ft = build_year(rcdc, load_who(by), FY_FOR_BURDEN[by])
        s_ = summarize(rws)
        trend.append({"year": by, "fy": FY_FOR_BURDEN[by][0].replace("Y", "FY").replace("NA", ""), "n": s_["n"], **{k: s_[k] for k in ("median_dollars_per_daly", "median_ratio_to_expected", "share_underfunded", "female_shortfall_m")}})
        print(f"  {by}: n={s_['n']} median ratio F {s_['median_ratio_to_expected']['female']} M {s_['median_ratio_to_expected']['male']} | underfunded F {s_['share_underfunded']['female']}% M {s_['share_underfunded']['male']}%")
    hist_keys = ["Y2008", "Y2009NA", "Y2010NA", "Y2011", "Y2012", "Y2013", "Y2014", "Y2015", "Y2016", "Y2017", "Y2018", "Y2019", "Y2020", "Y2021", "Y2022", "Y2023", "Y2024", "Y2025"]
    for r in rows:
        r["history"] = [{"fy": int(k[1:5]), "funding_m": round(sum(rcdc.get(c, {}).get(k, 0) for c in r["nih_categories"]), 1)} for k in hist_keys]
    LABELS = {"Fibromyalgia": "Fibromyalgia", "Chronic Fatigue Syndrome (ME/CFS)": "Chronic fatigue syndrome (ME/CFS)", "Lupus": "Lupus", "Interstitial Cystitis": "Interstitial cystitis",
              "Temporomandibular Muscle/Joint Disorder (TMJD)": "Temporomandibular joint disorder (TMJD)", "Sjogren's Disease": "Sjögren's disease", "Scleroderma": "Scleroderma",
              "Postural Orthostatic Tachycardia Syndrome": "Postural orthostatic tachycardia syndrome (POTS)", "Osteoporosis": "Osteoporosis", "Endometriosis": "Endometriosis", "Vulvodynia": "Vulvodynia",
              "Polycystic Ovary Syndrome (PCOS)": "Polycystic ovary syndrome (PCOS)"}
    uncounted = [{"category": c, "label": LABELS.get(c, c), "funding_m": round(rcdc.get(c, {}).get(LATEST_FY, 0), 1)} for c in UNCOUNTED if rcdc.get(c, {}).get(LATEST_FY)]
    out = {"generated": date.today().isoformat(), "funding_fy": 2024, "burden_year": 2021, "fit": fit, "min_dalys_k": MIN_DALYS_K,
           "diseases": sorted(rows, key=lambda r: -r["dalys_k"]), "summary": summary, "trend": trend, "uncounted": uncounted, "comparators": comparators}
    with open(f"{SITE_DATA}/chapter3.json", "w", encoding="utf-8") as f:
        json.dump(out, f, indent=1, default=lambda o: float(o))
    today = date.today().isoformat()
    new_sources = [
        {"id": "mirin-2021", "title": "Gender disparity in the funding of diseases by the U.S. National Institutes of Health", "publisher": "Mirin A.A., Journal of Women's Health 30(7), 2021. doi:10.1089/jwh.2020.8682", "url": "https://doi.org/10.1089/jwh.2020.8682", "retrieved": today},
        {"id": "nih-rcdc", "title": "Estimates of funding for various research, condition, and disease categories (RCDC), FY2008–FY2025", "publisher": "National Institutes of Health, RePORT", "url": "https://report.nih.gov/funding/categorical-spending", "retrieved": today, "note": "Pulled from the page's JSON API; amounts in millions of dollars. Categories overlap and are not additive."},
        {"id": "who-ghe", "title": "Global Health Estimates: DALYs by cause, age and sex, by country, 2010–2023 (United States)", "publisher": "World Health Organization", "url": "https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates/global-health-estimates-leading-causes-of-dalys", "retrieved": today, "note": "DALYs in thousands; All ages sheet; Males and Females rows."},
    ]
    try:
        sources = json.load(open(f"{SITE_DATA}/sources.json"))
    except FileNotFoundError:
        sources = []
    sources = [s for s in sources if s["id"] not in {n["id"] for n in new_sources}] + new_sources
    json.dump(sources, open(f"{SITE_DATA}/sources.json", "w"), indent=1)
    print("\nfemale-skewed, sorted by ratio to expected:")
    for r in sorted([r for r in rows if r["skew"] == "female"], key=lambda r: r["ratio_to_expected"]):
        print(f"  {r['disease']:34} F{r['female_share']:5.1f}%  ${r['dollars_per_daly']:>7,.0f}/DALY  ratio {r['ratio_to_expected']:5.2f}  (${r['funding_m']:,.0f}M, {r['dalys_k']:,.0f}k DALYs)")
    print("male-skewed:")
    for r in sorted([r for r in rows if r["skew"] == "male"], key=lambda r: r["ratio_to_expected"]):
        print(f"  {r['disease']:34} F{r['female_share']:5.1f}%  ${r['dollars_per_daly']:>7,.0f}/DALY  ratio {r['ratio_to_expected']:5.2f}  (${r['funding_m']:,.0f}M, {r['dalys_k']:,.0f}k DALYs)")
    print("uncounted:", [(u["category"], u["funding_m"]) for u in uncounted])
    print("disability share vs $/DALY (female-skewed):", [(r["disease"], r["disability_share"], r["dollars_per_daly"]) for r in rows if r["skew"] == "female"])
    import statistics
    hi = [r["dollars_per_daly"] for r in rows if (r["disability_share"] or 0) >= 70]; lo = [r["dollars_per_daly"] for r in rows if (r["disability_share"] or 100) <= 30]
    print(f"median $/DALY: mostly-disability diseases (YLD>=70%) {statistics.median(hi):.0f} (n={len(hi)}) vs mostly-fatal (YLD<=30%) {statistics.median(lo):.0f} (n={len(lo)})")
    for c in comparators:
        print(f"  {c['disease']} (${c['per_daly']:.0f}/DALY, {c['dalys_k']:.0f}k): " + "; ".join(f"{o['disease']} ${o['per_daly']:.0f}" for o in c["others"]))


if __name__ == "__main__":
    main()
