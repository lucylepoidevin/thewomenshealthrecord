"""Cross-chapter record: for each condition, everything the three chapters know.
Writes site/public/data/record.json."""
import json
import re

from common import SITE_DATA

c1 = json.load(open(f"{SITE_DATA}/chapter1.json"))
c2 = json.load(open(f"{SITE_DATA}/chapter2.json"))
c3 = json.load(open(f"{SITE_DATA}/chapter3.json"))

# disease -> (keywords matched against chapter-1 indication text, chapter-2 complaint id)
LINKS = {
    "Migraine": (r"migraine", "headache"), "Depression": (r"depress", None), "Anxiety disorders": (r"anxiety", None), "Bipolar disorder": (r"bipolar", None),
    "Schizophrenia": (r"schizophren", None), "Eating disorders": (r"binge|anorexia|bulimia", None), "ADHD": (r"attention deficit|adhd", None), "Autism": (r"autis", None),
    "Alzheimer's and other dementias": (r"alzheimer|dementia", None), "Parkinson's disease": (r"parkinson", None), "Epilepsy": (r"seizure|epilep", None), "Multiple sclerosis": (r"multiple sclerosis", None),
    "Asthma": (r"asthma", None), "COPD": (r"copd|chronic obstructive", None), "Diabetes": (r"diabet", None), "Coronary heart disease": (r"coronary|heart attack|myocardial|cardiovascular|angina", "chest"), "Stroke": (r"stroke", None),
    "Hypertension": (r"hypertension|blood pressure", None), "Kidney disease": (r"kidney disease|renal|nephropathy|dialysis", None), "Cirrhosis and chronic liver disease": (r"cirrhosis|liver disease|steatohepatitis|cholangitis", None),
    "Hepatitis B": (r"hepatitis b", None), "Hepatitis C": (r"hepatitis c", None), "HIV/AIDS": (r"\bhiv\b", None), "Tuberculosis": (r"tuberculosis", None), "Sexually transmitted infections": (r"chlamydia|gonorrh|syphilis|genital herpes|trichomon", None),
    "Breast cancer": (r"breast cancer", None), "Ovarian cancer": (r"ovarian", None), "Cervical cancer": (r"cervical cancer", None), "Uterine cancer": (r"endometrial|uterine", None), "Prostate cancer": (r"prostate", None),
    "Lung cancer": (r"lung cancer|non-small cell|small cell", None), "Colorectal cancer": (r"colorectal|colon", None), "Pancreatic cancer": (r"pancrea", None), "Liver cancer": (r"hepatocellular|liver cancer", None),
    "Stomach cancer": (r"gastric|stomach cancer", None), "Esophageal cancer": (r"esophag", None), "Skin cancer": (r"melanoma|skin cancer|squamous cell carcinoma|basal cell", None), "Brain cancer": (r"glioma|glioblastoma|brain tumor", None),
    "Lymphoma": (r"lymphoma", None), "Hodgkin lymphoma": (r"hodgkin", None), "Rheumatoid arthritis": (r"rheumatoid", None), "Osteoarthritis": (r"osteoarthritis", "limb"), "Back and neck pain": (r"back pain", "back"),
    "Inflammatory bowel disease": (r"crohn|ulcerative colitis|inflammatory bowel", "abdominal"), "Peptic ulcer": (r"ulcer|h\. pylori|helicobacter", "abdominal"), "Gallbladder disease": (r"gallbladder|biliary", "abdominal"),
    "Gynaecological diseases": (r"endometriosis|fibroid|polycystic|vulvodynia|pelvic|menorrhag|uterine bleeding", None), "Infertility": (r"infertil|ovulation|ivf", None), "Maternal conditions": (r"pregnan|postpartum|preterm", None),
    "Sickle cell disease": (r"sickle", None), "Macular degeneration": (r"macular", None), "Hearing loss": (r"hearing", None), "Vision loss": (r"retin|glaucoma|myopia|dry eye", None),
    "Opioid use disorders": (r"opioid use|opioid dependence|opioid overdose", None), "Alcohol use disorders": (r"alcohol", None), "Drug use disorders": (r"substance use|drug dependence", None),
    "Suicide and self-harm": (r"suicid", None), "Interpersonal violence": (None, None), "Unintentional injuries": (None, None), "Oral and dental disease": (r"dental|periodont", None), "Pneumonia and influenza": (r"pneumonia|influenza", None),
}
recs = []
for d in c3["diseases"]:
    kw, cid = LINKS.get(d["disease"], (None, None))
    drugs = []
    if kw:
        for x in c1["drugs"]:
            if re.search(kw, (x["indication"] or "") + " " + x["brand"], re.I):
                drugs.append({"brand": x["brand"], "year": x["year"], "trial_female_pct": x["trial_female_pct"], "faers_female_pct": x["faers_female_pct"], "gap": x["gap"], "rate_ratio": x["rate_ratio"], "snapshot_url": x["snapshot_url"]})
    drugs.sort(key=lambda x: x["trial_female_pct"])
    ed = None
    if cid:
        g = next((g for g in c2["groups"] if g["id"] == cid), None)
        if g:
            ed = {"complaint": g["label"], "n": g["n"], "metrics": {k: g["metrics"].get(k) for k in ("severe_share", "urgent", "ems", "wait_mean", "analgesic_ed", "opioid_ed", "opioid_ed_severe", "admitted")}}
    recs.append({"disease": d["disease"], "funding": {"funding_m": d["funding_m"], "dalys_k": d["dalys_k"], "female_share": d["female_share"], "dollars_per_daly": d["dollars_per_daly"], "ratio_to_expected": d["ratio_to_expected"], "rank_by_ratio": d["rank_by_ratio"], "n_ranked": c3["summary"]["n"], "skew": d["skew"]},
                 "drugs": drugs, "ed": ed})
for u in c3["uncounted"]:
    name = re.sub(r"\s*\(.*?\)", "", u["category"])
    label = u.get("label", name)
    kw = {"Fibromyalgia": r"fibromyalgia", "Chronic Fatigue Syndrome": r"fatigue syndrome", "Lupus": r"lupus", "Interstitial Cystitis": r"interstitial cystitis|bladder pain", "Temporomandibular Muscle/Joint Disorder": r"temporomandibular", "Scleroderma": r"sclerod|systemic sclerosis", "Postural Orthostatic Tachycardia Syndrome": r"tachycardia syndrome", "Osteoporosis": r"osteoporosis", "Endometriosis": r"endometriosis", "Vulvodynia": r"vulvodynia", "Polycystic Ovary Syndrome": r"polycystic"}.get(name)
    drugs = []
    if kw:
        for x in c1["drugs"]:
            if re.search(kw, (x["indication"] or ""), re.I):
                drugs.append({"brand": x["brand"], "year": x["year"], "trial_female_pct": x["trial_female_pct"], "faers_female_pct": x["faers_female_pct"], "gap": x["gap"], "rate_ratio": x["rate_ratio"], "snapshot_url": x["snapshot_url"]})
    recs.append({"disease": label, "funding": {"funding_m": u["funding_m"], "uncounted": True}, "drugs": drugs, "ed": None})
recs.sort(key=lambda r: r["disease"])
json.dump({"generated": c3["generated"], "conditions": recs}, open(f"{SITE_DATA}/record.json", "w"), indent=1)
print(f"{len(recs)} conditions;", "with drugs:", sum(1 for r in recs if r["drugs"]), "| with ED data:", sum(1 for r in recs if r["ed"]))
print("drug matches sample:", [(r["disease"], len(r["drugs"])) for r in recs if r["drugs"]][:20])
