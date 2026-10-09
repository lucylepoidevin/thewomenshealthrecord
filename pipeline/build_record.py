"""Cross-chapter record: for each condition, everything the three chapters know.
Writes site/public/data/record.json."""
import json
import re

from common import SITE_DATA

c1 = json.load(open(f"{SITE_DATA}/chapter1.json"))
c2 = json.load(open(f"{SITE_DATA}/chapter2.json"))
c3 = json.load(open(f"{SITE_DATA}/chapter3.json"))
c4 = json.load(open(f"{SITE_DATA}/chapter4.json"))
c5 = json.load(open(f"{SITE_DATA}/chapter5.json"))
c6 = json.load(open(f"{SITE_DATA}/chapter6.json"))
LABELS = {d["slug"]: d for d in c6["labels"]["drugs"]}
CANCER = {c["label"]: c for c in c5["cancer"]["sites"]}
CANCER_MAP = {"Lung cancer": "Lung", "Colorectal cancer": "Colon and rectum", "Pancreatic cancer": "Pancreas", "Stomach cancer": "Stomach", "Liver cancer": "Liver", "Esophageal cancer": "Oesophagus", "Skin cancer": "Melanoma", "Brain cancer": "Brain", "Lymphoma": "Non-Hodgkin lymphoma", "Hodgkin lymphoma": "Hodgkin lymphoma"}


def drug_rec(x):
    L = LABELS.get(x["slug"], {})
    return {"brand": x["brand"], "year": x["year"], "trial_female_pct": x["trial_female_pct"], "faers_n": x["faers_n"], "faers_female_pct": x["faers_female_pct"] if (x["faers_n"] or 0) >= 100 else None, "gap": x["gap"], "rate_ratio": x["rate_ratio"], "snapshot_url": x["snapshot_url"], "label_sex": L.get("sex_statement"), "label_no_preg": L.get("no_preg_data"), "label_no_lact": L.get("no_lact_data"), "label_flat": (not L["weight_based"]) if "weight_based" in L else None}

TRIALS = {d["disease"]: d for d in c4["diseases"] + c4["sex_specific"]}
TRIALS_UNC = {u["condition"]: u for u in c4["uncounted"]}
ED5 = {g["id"]: g for g in c5["groups"]}
UNC_NAMES = {"Fibromyalgia": "Fibromyalgia", "Chronic Fatigue Syndrome": "ME/CFS", "Lupus": "Lupus", "Interstitial Cystitis": "Interstitial cystitis", "Temporomandibular Muscle/Joint Disorder": "TMJD", "Sjogren's Disease": "Sjögren's disease", "Scleroderma": "Scleroderma", "Postural Orthostatic Tachycardia Syndrome": "POTS", "Osteoporosis": "Osteoporosis"}


def trial_rec(t):
    if not t:
        return None
    return {k: t.get(k) for k in ("trials", "participants", "female_pct", "burden_female_pct", "ratio", "rank", "excl_preg_pct", "contra_pct", "max_age_pct", "outcome_by_sex", "sex_specific")} | {"industry_female_pct": t["by_sponsor"]["Industry"]["female_pct"] if "by_sponsor" in t else None, "academic_female_pct": t["by_sponsor"]["Universities, hospitals, other"]["female_pct"] if "by_sponsor" in t else None, "n_ranked": len(c4["diseases"])}


def ed5_rec(cid):
    g = ED5.get(cid)
    if not g:
        return None
    return {"complaint": g["label"], "n": g["n"], "metrics": {k: g["metrics"].get(k) for k in ("symptom_dx", "anxiety_any", "tests_count", "anyimage", "admitted", "seen72")}}


# disease -> (keywords matched against chapter-1 indication text, chapter-2 complaint id)
LINKS = {
    "Migraine": (r"migraine", "headache"), "Depression": (r"depress", None), "Anxiety disorders": (r"anxiety", None), "Bipolar disorder": (r"bipolar", None),
    "Schizophrenia": (r"schizophren", None), "Eating disorders": (r"binge|anorexia|bulimia", None), "ADHD": (r"attention deficit|adhd", None), "Autism": (r"autis", None),
    "Alzheimer's and other dementias": (r"alzheimer|dementia", None), "Parkinson's disease": (r"parkinson", None), "Epilepsy": (r"seizure|epilep", None), "Multiple sclerosis": (r"multiple sclerosis", None),
    "Asthma": (r"asthma", None), "COPD": (r"copd|chronic obstructive", None), "Diabetes": (r"diabet", None), "Coronary heart disease": (r"coronary|heart attack|myocardial|cardiovascular|angina", "chest"), "Stroke": (r"stroke", None),
    "Hypertension": (r"hypertension|blood pressure", None), "Kidney disease": (r"kidney disease|\brenal (disease|impairment|failure|insufficiency)|nephropathy|dialysis", None), "Cirrhosis and chronic liver disease": (r"cirrhosis|liver disease|steatohepatitis|cholangitis", None),
    "Hepatitis B": (r"hepatitis b", None), "Hepatitis C": (r"hepatitis c", None), "HIV/AIDS": (r"\bhiv\b", None), "Tuberculosis": (r"tuberculosis", None), "Sexually transmitted infections": (r"chlamydia|gonorrh|syphilis|genital herpes|trichomon", None),
    "Breast cancer": (r"breast cancer", None), "Ovarian cancer": (r"ovarian", None), "Cervical cancer": (r"cervical cancer", None), "Uterine cancer": (r"endometrial|uterine", None), "Prostate cancer": (r"prostate", None),
    "Lung cancer": (r"lung cancer|non-small cell|small cell", None), "Colorectal cancer": (r"colorectal|colon cancer|rectal cancer", None), "Pancreatic cancer": (r"pancrea", None), "Liver cancer": (r"hepatocellular|liver cancer", None),
    "Stomach cancer": (r"gastric|stomach cancer", None), "Esophageal cancer": (r"esophag", None), "Skin cancer": (r"melanoma|skin cancer|squamous cell carcinoma|basal cell", None), "Brain cancer": (r"glioma|glioblastoma|brain tumor", None),
    "Lymphoma": (r"(?<!hodgkin )lymphoma(?! kinase)", None), "Hodgkin lymphoma": (r"(?<!non-)hodgkin", None), "Rheumatoid arthritis": (r"rheumatoid", None), "Osteoarthritis": (r"osteoarthritis", "limb"), "Back and neck pain": (r"back pain", "back"),
    "Inflammatory bowel disease": (r"crohn|ulcerative colitis|inflammatory bowel", "abdominal"), "Peptic ulcer": (r"ulcer|h\. pylori|helicobacter", "abdominal"), "Gallbladder disease": (r"gallbladder|biliary", "abdominal"),
    "Gynaecological diseases": (r"endometriosis|fibroid|polycystic|vulvodynia|pelvic|menorrhag|uterine bleeding", None), "Infertility": (r"infertil|ovulation|ivf", None), "Maternal conditions": (r"(?<!prevent )pregnan|postpartum|preterm", None),
    "Sickle cell disease": (r"sickle", None), "Macular degeneration": (r"macular", None), "Hearing loss": (r"hearing loss|hearing impair", None), "Vision loss": (r"retinal|retinopathy|retinitis|glaucoma|myopia|dry eye|macular", None),
    "Opioid use disorders": (r"opioid use|opioid dependence|opioid overdose", None), "Alcohol use disorders": (r"alcohol (use|dependence|withdrawal)|alcoholism", None), "Drug use disorders": (r"substance use|drug dependence", None),
    "Suicide and self-harm": (r"suicid", None), "Interpersonal violence": (None, None), "Unintentional injuries": (None, None), "Oral and dental disease": (r"dental|periodont", None), "Pneumonia and influenza": (r"pneumonia|influenza", None),
}
recs = []
for d in c3["diseases"]:
    kw, cid = LINKS.get(d["disease"], (None, None))
    drugs = []
    if kw:
        for x in c1["drugs"]:
            if re.search(kw, (x["indication"] or "") + " " + x["brand"], re.I):
                drugs.append(drug_rec(x))
    drugs.sort(key=lambda x: x["trial_female_pct"])
    ed = None
    if cid:
        g = next((g for g in c2["groups"] if g["id"] == cid), None)
        if g:
            ed = {"complaint": g["label"], "n": g["n"], "metrics": {k: g["metrics"].get(k) for k in ("severe_share", "urgent", "ems", "wait_mean", "analgesic_ed", "opioid_ed", "opioid_ed_severe", "admitted")}}
    recs.append({"disease": d["disease"], "funding": {"funding_m": d["funding_m"], "dalys_k": d["dalys_k"], "female_share": d["female_share"], "dollars_per_daly": d["dollars_per_daly"], "ratio_to_expected": d["ratio_to_expected"], "rank_by_ratio": d["rank_by_ratio"], "n_ranked": c3["summary"]["n"], "skew": d["skew"]},
                 "drugs": drugs, "ed": ed, "trials": trial_rec(TRIALS.get(d["disease"])), "cancer": CANCER.get(CANCER_MAP.get(d["disease"], "")), "ed_label": ed5_rec({"headache": "headache", "chest": "chest", "abdominal": "abdominal", "limb": "limb", "back": "back"}.get(cid or "", None))})
for u in c3["uncounted"]:
    name = re.sub(r"\s*\(.*?\)", "", u["category"])
    label = u.get("label", name)
    kw = {"Fibromyalgia": r"fibromyalgia", "Chronic Fatigue Syndrome": r"fatigue syndrome", "Lupus": r"lupus", "Interstitial Cystitis": r"interstitial cystitis|bladder pain", "Temporomandibular Muscle/Joint Disorder": r"temporomandibular", "Scleroderma": r"sclerod|systemic sclerosis", "Postural Orthostatic Tachycardia Syndrome": r"tachycardia syndrome", "Osteoporosis": r"osteoporosis", "Endometriosis": r"endometriosis", "Vulvodynia": r"vulvodynia", "Polycystic Ovary Syndrome": r"polycystic"}.get(name)
    drugs = []
    if kw:
        for x in c1["drugs"]:
            if re.search(kw, (x["indication"] or ""), re.I):
                drugs.append(drug_rec(x))
    tu = TRIALS_UNC.get(UNC_NAMES.get(name, label))
    recs.append({"disease": label, "funding": {"funding_m": u["funding_m"], "uncounted": True}, "drugs": drugs, "ed": None, "trials": {"trials": tu["trials"], "participants": tu["participants"], "female_pct": tu["female_pct"], "sex_specific": tu["sex_specific"], "uncounted": True} if tu else None, "ed_label": None})
recs.sort(key=lambda r: r["disease"])
json.dump({"generated": c3["generated"], "conditions": recs}, open(f"{SITE_DATA}/record.json", "w"), indent=1)
print(f"{len(recs)} conditions;", "with drugs:", sum(1 for r in recs if r["drugs"]), "| with ED data:", sum(1 for r in recs if r["ed"]), "| with trials:", sum(1 for r in recs if r["trials"]))
print("drug matches sample:", [(r["disease"], len(r["drugs"])) for r in recs if r["drugs"]][:20])
