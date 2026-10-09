"""Join snapshot enrollment with FAERS counts, compute the gap metric, and
write site/public/data/chapter1.json and sources.json."""
import csv
import json
import re
import statistics
from datetime import date

from common import CACHE, OUT, SITE_DATA

GAP = 15          # percentage points; mirrored in site/src/chapters/Chapter1.tsx
MIN_REPORTS = 100 # minimum sex-recorded FAERS reports for inclusion in scatter/table
MIN_USERS = 30    # minimum unweighted MEPS person-years to publish a users-by-sex share

# precedence rules: conditions whose words would otherwise be caught by a broader category
PRE_RULES = [
    ("Neurology", r"muscular dystrophy|duchenne"),
    ("Infectious disease", r"onchocerciasis|river blindness|hepatitis|parasit|helminth"),
    ("Oncology", r"leuk[ae]mia|myeloid|myelodysplastic"),
]
CATEGORIES = [
    ("Imaging & diagnostics", r"imaging|diagnostic|contrast agent|radiographic|visuali[sz]e|visual detection|pet scan|radiopharm|tracer|detect(?:ion)? of"),
    ("Immunology & dermatology", r"actinic keratosis|plaque psoriasis|atopic dermatitis|hidradenitis"),
    ("Oncology", r"\bcancer|tumou?r|leuk[ae]mia|lymphoma|myeloma|carcinoma|melanoma|sarcoma|neoplasm|metastatic|myelofibrosis|glioma|mastocytosis"),
    ("Infectious disease", r"infection|hiv\b|hepatitis|covid|sars-cov|bacteri|viral|virus|malaria|tuberculosis|fung|pneumonia|influenza|chagas|smallpox|anthrax|mycobact"),
    ("Cardiovascular", r"heart|cardi|hypertension|cholesterol|lipid|atrial|stroke|thrombo|embol|coronary|angina|amyloidosis|transthyretin|hypotension|cardiomyopathy"),
    ("Neurology", r"seizure|epilep|migraine|parkinson|alzheimer|multiple sclerosis|\bals\b|lateral sclerosis|neuro|myasthenia|dystrophy|huntington|narcolepsy|tardive|rett|spinal muscular|friedreich|chorea|ataxia"),
    ("Psychiatry", r"schizophren|depress|bipolar|adhd|attention deficit|insomnia|anxiety|psychos|postpartum|sleep|binge"),
    ("Metabolic & endocrine", r"diabet|obes|weight|thyroid|growth hormone|lipodystrophy|acromegaly|cushing|hypoparathyroid|hypophosphat|phenylketon|urea cycle|fabry|gaucher|pompe|lysosomal|homocyst|cholestasis|fatty liver|steatohepatitis|nash\b|mash\b|achondroplasia"),
    ("Immunology & dermatology", r"psoriasis|arthritis|dermatitis|lupus|crohn|colitis|eczema|urticaria|autoimmune|inflammat|alopecia|vitiligo|hidradenitis|spondylitis|eosinophilic|sjögren|sjogren|pemphigus|myositis|graft|keratosis|\bskin\b|acne|rosacea"),
    ("Hematology", r"an[ae]mia|hemophilia|haemophilia|sickle|platelet|thrombocytop|neutropenia|blood (?:cell|disorder|clot)|hemoglobin|thalassemia|iron overload|coagul|bleeding|hemolytic|paroxysmal nocturnal|von willebrand"),
    ("Respiratory", r"asthma|copd|pulmonary|cystic fibrosis|lung|bronch|respiratory|interstitial"),
    ("Women's health", r"contracept|menopaus|endometriosis|uterine|fibroid|pregnan|vaginal|vulvovaginal|hot flash|vasomotor|hypoactive sexual|preterm|postpartum"),
    ("Urology & nephrology", r"kidney|renal|bladder|urinary|prostat|erectile|dialysis|nephropathy|iga nephropathy|hyperkal|hyperoxaluria|cystinosis"),
    ("Ophthalmology", r"\beye|retin|macular|glaucoma|ocular|cornea|dry eye|myopia|uveitis|thyroid eye|vision"),
    ("Gastroenterology", r"constipation|bowel|gastro|reflux|nausea|vomiting|liver|biliary|cholangitis|pancrea|celiac|short bowel|diarrhea|crohn"),
]


def categorize(ind):
    t = (ind or "").lower()
    for name, pat in PRE_RULES + CATEGORIES:
        if re.search(pat, t):
            return name
    return "Other"


GENERIC_FIX = {"artesunate": "artesunate", "tremfya": "guselkumab", "lenvima": "lenvatinib", "datroway": "datopotamab deruxtecan", "penpulimab-kcqx": "penpulimab", "izervay": "avacincaptad pegol",
               "flyrcado": "flurpiridaz F 18", "defencath": "taurolidine and heparin", "xacduro": "sulbactam and durlobactam", "wainua": "eplontersen"}
BRAND_FIX = {"drug-trials-snapshot-ga-68-psma-11": "Ga 68 PSMA-11", "drug-trials-snapshots-ga-68-dotatoc": "Ga 68 DOTATOC"}
MALE_RX = re.compile(r"prostat|duchenne|h(a)?emophilia|\bin men\b|\bmales?\b[^.]{0,30}only|testicular|erectile|hypogonadism|peyronie", re.I)
FEMALE_RX = re.compile(r"breast cancer|ovarian|postmenopausal|pregnan|vaginal|vaginosis|postpartum|\bwomen\b|endometriosis|contracept|uterine|cervical cancer|fallopian|rett syndrome|hypoactive sexual desire|menopaus|vulv", re.I)


def clean_generic(brand, slug, g):
    g = (g or "").strip()
    key = (brand or "").lower()
    if key in GENERIC_FIX:
        return GENERIC_FIX[key]
    g = re.sub(r"\s*\((?:pronounced|[a-z]{1,4}-[a-z\-]+)\)?\s*$", "", g, flags=re.I)  # trailing pronunciation guide
    if not g or re.search(r"^\s*n\s*=|\d+\s?mg|every \w+ weeks?|pronounc|injection$", g, re.I):
        return None
    return g


def sex_specific(ind, female_pct):
    t = ind or ""
    if female_pct is not None and female_pct <= 2 and (MALE_RX.search(t) or "boys" in t.lower() or female_pct == 0):
        return "male"
    if female_pct is not None and female_pct >= 98 and (FEMALE_RX.search(t) or female_pct == 100):
        return "female"
    if MALE_RX.search(t) and (female_pct or 0) < 10:
        return "male"
    if FEMALE_RX.search(t) and (female_pct or 0) > 90:
        return "female"
    return None


def num(v):
    try:
        return float(v)
    except (TypeError, ValueError):
        return None


def main():
    with open(f"{OUT}/snapshots_raw.csv", encoding="utf-8") as f:
        snaps = list(csv.DictReader(f))
    with open(f"{OUT}/faers_raw.csv", encoding="utf-8") as f:
        faers = {r["slug"]: r for r in csv.DictReader(f)}
    meps = {}
    try:
        with open(f"{OUT}/meps_users.csv", encoding="utf-8") as f:
            meps = {r["slug"]: r for r in csv.DictReader(f)}
    except FileNotFoundError:
        pass

    # Fallback for pages Wayback failed to serve or we could not parse (2015-21 only):
    # the Carmeli et al. compilation, flagged per drug as enrollment_source.
    carmeli = {}
    try:
        acc = {}
        with open(f"{CACHE}/carmeli_2015-21.csv", encoding="utf-8-sig") as f:
            for r in csv.DictReader(f):
                try:
                    b = re.sub(r"-\d+$", "", r["Brand_Name"].upper().strip())
                    fem, n = float(r["Female"]), float(r["Enrollment"] or 0)
                except ValueError:
                    continue
                a = acc.setdefault(b, [0.0, 0.0, r["Indication_long"] or r["Indication"], int(r["Approval_Year"])])
                a[0] += fem * n
                a[1] += n
        carmeli = {b: (a[0] / a[1], a[1], a[2], a[3]) for b, a in acc.items() if a[1] > 0}
    except FileNotFoundError:
        pass

    drugs, skipped, n_fallback = [], [], 0
    for r in snaps:
        fn, mn = num(r.get("female_n")), num(r.get("male_n"))
        src = "fda-snapshot"
        if (fn is None or mn is None) and num(r.get("female_pct_only")) is not None and (num(r.get("total_n")) or 0) >= 10:
            pct, tot = num(r.get("female_pct_only")), num(r.get("total_n"))
            fn, mn = pct / 100 * tot, (100 - pct) / 100 * tot
        if fn is None or mn is None or fn + mn < 10:
            key = (r.get("brand") or r["slug"].split("snapshots-")[-1].split("snapshot-")[-1]).upper().replace("-", " ").strip()
            c = carmeli.get(key)
            if c and c[1] > 0:
                fn, mn = c[0] / 100 * c[1], (100 - c[0]) / 100 * c[1]
                r = {**r, "brand": key, "indication": r.get("indication") or c[2], "approval_date": r.get("approval_date") or str(c[3])}
                src, n_fallback = "carmeli-2023", n_fallback + 1
            else:
                skipped.append((r["slug"], r.get("method")))
                continue
        trial_pct = fn / (fn + mn) * 100
        brand = (r.get("brand") or "").strip()
        if not brand or len(brand) > 40:
            m = re.search(r"snapshots?-(?:drug-)?([a-z0-9]+)", r["slug"])
            brand = m.group(1).upper() if m else r["slug"]
        brand = re.sub(r"\s*\(.*?\)", "", brand).strip()
        c = carmeli.get(brand.upper())
        if c and not r.get("indication"):
            r = {**r, "indication": c[2]}
        if c and not r.get("approval_date"):
            r = {**r, "approval_date": str(c[3])}
        r = {**r, "brand": brand}
        fa = faers.get(r["slug"]) or {}
        ff, fm = num(fa.get("female")), num(fa.get("male"))
        faers_n = int(ff + fm) if ff is not None and fm is not None else None
        faers_pct = ff / (ff + fm) * 100 if faers_n else None
        mp = meps.get(r["slug"]) or {}
        mu = (int(mp["female_n"]) + int(mp["male_n"])) if mp else 0
        mfw, mmw = (num(mp.get("female_w")) or 0), (num(mp.get("male_w")) or 0)
        rate_ratio = rr_lo = rr_hi = None
        if mu >= MIN_USERS and faers_n and faers_n >= MIN_REPORTS and ff and fm and mfw and mmw:
            rate_ratio = (ff / fm) / (mfw / mmw)
            # interval: binomial sampling error of the (weighted) female share of users,
            # using the unweighted person-year count as n; FAERS counts are large enough to ignore
            p_ = mfw / (mfw + mmw)
            se = (p_ * (1 - p_) / mu) ** 0.5
            lo, hi = max(0.01, p_ - 1.96 * se), min(0.99, p_ + 1.96 * se)
            rr_lo, rr_hi = (ff / fm) / (hi / (1 - hi)), (ff / fm) / (lo / (1 - lo))
        yr = re.search(r"\d{4}", r.get("approval_date") or "")
        drugs.append({
            "slug": r["slug"],
            "brand": BRAND_FIX.get(r["slug"]) or ((r.get("brand") or r["slug"]).title() if (r.get("brand") or "").isupper() else (r.get("brand") or r["slug"])),
            "generic": clean_generic(r.get("brand"), r["slug"], r.get("generic")),
            "sex_specific": sex_specific(r.get("indication"), round(trial_pct, 1)),
            "year": int(yr.group()) if yr else None,
            "indication": r.get("indication") or None,
            "category": categorize(r.get("indication")),
            "trial_n": int(fn + mn),
            "trial_female_pct": round(trial_pct, 1),
            "faers_n": faers_n,
            "faers_female_pct": round(faers_pct, 1) if faers_pct is not None else None,
            "faers_serious_n": None,
            "faers_serious_female_pct": None,
            "gap": round(faers_pct - trial_pct, 1) if faers_pct is not None and faers_n >= MIN_REPORTS else None,  # no gap on tiny counts
            "meps_users_n": mu or None,
            "meps_female_pct": round(mfw / (mfw + mmw) * 100, 1) if mu >= MIN_USERS and mfw + mmw else None,
            "rate_ratio": round(rate_ratio, 2) if rate_ratio else None,
            "rate_ratio_lo": round(rr_lo, 2) if rr_lo else None,
            "rate_ratio_hi": round(rr_hi, 2) if rr_hi else None,
            "snapshot_url": r["url"],
            "enrollment_source": src,
        })

    with_faers = [d for d in drugs if d["faers_n"] and d["faers_n"] >= MIN_REPORTS and not d["sex_specific"]]  # sex-specific drugs cannot have a meaningful gap
    with_rate = sorted([d for d in drugs if d["rate_ratio"]], key=lambda d: -d["rate_ratio"])
    zm = meps.get("zolpidem") or {}
    zmu = (int(zm["female_n"]) + int(zm["male_n"])) if zm else 0
    quad = [d for d in with_faers if d["trial_female_pct"] < 50 and d["gap"] >= GAP]
    years = [d["year"] for d in drugs if d["year"]]
    z = faers.get("zolpidem", {})
    zf, zm_, zu = int(num(z.get("female")) or 0), int(num(z.get("male")) or 0), int(num(z.get("unknown")) or 0)
    out = {
        "generated": date.today().isoformat(),
        "faers_last_updated": z.get("last_updated") or next((faers[k].get("last_updated") for k in faers if faers[k].get("last_updated")), None),
        "zolpidem": {"female": zf, "male": zm_, "unknown": zu, "total": zf + zm_ + zu},
        "faers_overall": {k: int(num(faers["__all__"].get(k)) or 0) for k in ("female", "male", "unknown")} if "__all__" in faers else None,
        "zolpidem_meps": ({"users_n": zmu,
                           "female_pct": round(num(zm["female_w"]) / (num(zm["female_w"]) + num(zm["male_w"])) * 100, 1),
                           "rate_ratio": round((zf / zm_) / (num(zm["female_w"]) / num(zm["male_w"])), 2)}
                          if zmu >= MIN_USERS and zm_ and num(zm["male_w"]) else None),
        "pk": [
            {"label": "Immediate-release 10 mg", "female": 15, "male": 3},
            {"label": "Extended-release 12.5 mg", "female": 33, "male": 25},
        ],
        "drugs": sorted(drugs, key=lambda d: d["trial_female_pct"]),
        "summary": {
            "n_drugs": len(drugs),
            "n_with_faers": len(with_faers),
            "median_trial_female_pct": round(statistics.median(d["trial_female_pct"] for d in drugs), 1),
            "n_under_30": sum(1 for d in drugs if d["trial_female_pct"] < 30),
            "n_under_40": sum(1 for d in drugs if d["trial_female_pct"] < 40),
            "n_gap_quadrant": len(quad),
            "n_with_rate": len(with_rate),
            "n_rate_over_1_5": sum(1 for d in with_rate if d["rate_ratio"] >= 1.5),
            "n_rate_under_1": sum(1 for d in with_rate if d["rate_ratio"] < 1),
            "median_rate_ratio": round(statistics.median(d["rate_ratio"] for d in with_rate), 2) if with_rate else None,
            "median_gap": round(statistics.median(d["gap"] for d in quad), 1) if quad else 0,
            "years": [min(years), max(years)] if years else [2015, 2025],
        },
        "params": {"gap_threshold_points": GAP, "min_reports": MIN_REPORTS, "min_meps_users": MIN_USERS, "meps_years": "2018-2024", "n_enrollment_from_carmeli": n_fallback},
    }
    with open(f"{SITE_DATA}/chapter1.json", "w", encoding="utf-8") as f:
        json.dump(out, f, indent=1)

    today = date.today().isoformat()
    sources = [
        {"id": "fda-dsc-2013", "title": "Drug Safety Communication: Risk of next-morning impairment after use of insomnia drugs; FDA requires lower recommended doses for certain drugs containing zolpidem", "publisher": "U.S. Food and Drug Administration, 10 January 2013", "url": "https://www.fda.gov/files/drugs/published/Drug-Safety-Communication--Risk-of-next-morning-impairment-after-use-of-insomnia-drugs--FDA-requires-lower-recommended-doses-for-certain-drugs-containing-zolpidem-%28Ambien--Ambien-CR--Edluar--and-Zolpimist%29.pdf", "retrieved": today},
        {"id": "fda-qa-2013", "title": "Questions and Answers: Risk of next-morning impairment after use of insomnia drugs", "publisher": "U.S. Food and Drug Administration", "url": "https://www.fda.gov/drugs/drug-safety-and-availability/questions-and-answers-risk-next-morning-impairment-after-use-insomnia-drugs-fda-requires-lower", "retrieved": today},
        {"id": "fda-snapshots", "title": "Drug Trials Snapshots", "publisher": "U.S. Food and Drug Administration", "url": "https://www.fda.gov/drugs/drug-approvals-and-databases/drug-trials-snapshots", "retrieved": today, "note": f"{len(drugs)} individual snapshot pages parsed; per-drug URLs are linked from the table."},
        {"id": "fda-snapshots-archive", "title": "Drug Trials Snapshots index, archived capture of 27 January 2023", "publisher": "Internet Archive Wayback Machine", "url": "https://web.archive.org/web/20230127052325/https://www.fda.gov/drugs/drug-approvals-and-databases/drug-trials-snapshots", "retrieved": today, "note": "Used for 2015–2022 snapshot pages no longer on the live FDA index."},
        {"id": "openfda-faers", "title": "openFDA Drug Adverse Event API (FDA Adverse Event Reporting System)", "publisher": "U.S. Food and Drug Administration", "url": "https://open.fda.gov/apis/drug/event/", "retrieved": today, "note": f"Counts of reports by patient sex per drug; data release {out['faers_last_updated']}. Reports of unknown sex excluded."},
        {"id": "meps", "title": "Medical Expenditure Panel Survey, Household Component: Prescribed Medicines files (HC-206A, 213A, 220A, 229A, 239A, 248A, 254A) and Full Year Consolidated files (HC-209, 216, 224, 233, 243, 251, 256), 2018–2024", "publisher": "Agency for Healthcare Research and Quality", "url": "https://meps.ahrq.gov/mepsweb/data_stats/download_data_files.jsp", "retrieved": today, "note": f"Persons with at least one fill, by sex, pooled 2018–2024 and weighted with the person weight; published only for drugs with at least {MIN_USERS} unweighted person-years."},
        {"id": "carmeli-2023", "title": "FDA Drug Trials Snapshots Data Explorer (dataset, 2015–2021)", "publisher": "Carmeli A. et al., Patterns (2023); GitHub / Zenodo record 7373942", "url": "https://github.com/arielcarmeli/FDA-Drug-Trial-Snapshots-Data-Explorer", "retrieved": today, "note": f"Used to cross-check our parsed figures, and as the enrollment source for {n_fallback} 2015–2021 drugs whose archived FDA page could not be retrieved or parsed (flagged per drug in the data file)."},
    ]
    try:  # keep other chapters' entries
        with open(f"{SITE_DATA}/sources.json", encoding="utf-8") as f:
            others = [s_ for s_ in json.load(f) if s_["id"] not in {x["id"] for x in sources}]
    except FileNotFoundError:
        others = []
    with open(f"{SITE_DATA}/sources.json", "w", encoding="utf-8") as f:
        json.dump(sources + others, f, indent=1)

    print(f"enrollment from Carmeli fallback: {n_fallback}")
    print(f"with MEPS rate ratio: {len(with_rate)}; " + ", ".join(f"{d['brand']} {d['rate_ratio']}" for d in with_rate[:10]))
    print(f"drugs: {len(drugs)}  with FAERS>={MIN_REPORTS}: {len(with_faers)}  in corner: {len(quad)}  skipped: {len(skipped)}")
    print("summary:", json.dumps(out["summary"]))
    from collections import Counter
    print("categories:", Counter(d["category"] for d in drugs).most_common())
    if skipped:
        print("skipped:", skipped[:30])


if __name__ == "__main__":
    main()
