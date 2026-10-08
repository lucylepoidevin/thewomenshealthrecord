"""Chapter 6: the male default body.

Two measurements.
1. PubMed: for each year since 1996, rodent studies indexed as male-only, female-only
   or both sexes, overall, by field, and for NIH-funded papers; and human clinical
   trial reports by sex. From cache/ch6/pubmed_counts.json (fetch_pubmed.py).
2. FDA labels: for every chapter-1 drug, what the current label says about women's
   bodies: whether the pharmacokinetics were measured in men only, whether a sex
   difference was quantified, asserted absent, or not mentioned; what it says about
   pregnancy and lactation data; whether any dose differs by sex. From out/labels.jsonl.
Writes site/public/data/chapter6.json.
"""
import json
import re
from datetime import date

from common import CACHE, OUT, SITE_DATA
from fetch_pubmed import FIELDS, HUMAN, RODENT, SEX, YEARS

LAST_COMPARABLE = 2020  # NLM moved to automated MeSH indexing in 2021-22; the sex check tags are not comparable after this

# ---------- label classification
SENT = re.compile(r"(?<=[.;])\s+|\n+")
R = {
    "male_only_pk": re.compile(r"\b(healthy|normal) (adult )?male (subjects|volunteers|participants|individuals)\b|\bin (\d+ )?(healthy )?(male|men) (subjects|volunteers)\b|\b(male|men) (healthy )?volunteers\b|\bnot been studied in female", re.I),
    "quantified": re.compile(r"(\d+(\.\d+)?)\s?%[^.]{0,80}\b(higher|greater|lower|increased|decreased)\b[^.]{0,80}\b(females?|women|female (subjects|patients))\b|\b(females?|women)\b[^.]{0,80}(\d+(\.\d+)?)\s?%[^.]{0,40}\b(higher|greater|lower|increased|decreased)\b|\b(AUC|Cmax|exposure|clearance|concentrations?)\b[^.]{0,60}\b(\d+(\.\d+)?)[- ]?(%|fold)[^.]{0,60}\b(females?|women|sex|gender)\b|\b(females?|women)\b[^.]{0,60}\b(\d+(\.\d+)?)[- ]?fold\b", re.I),
    "difference": re.compile(r"\b(higher|greater|lower|increased|decreased|longer|shorter)\b[^.]{0,60}\b(in|among|for) (females?|women|female (subjects|patients|participants))\b|\b(females?|women)\b[^.]{0,60}\b(higher|greater|lower|increased|decreased)\b[^.]{0,60}\b(AUC|Cmax|exposure|clearance|concentration|half-life|plasma)\b|significant (sex|gender) differences? (were|was) (found|observed)|\b(sex|gender)\b[^.]{0,40}\b(was|is) a (significant|important) covariate", re.I),
    "no_difference": re.compile(r"\b(no|not|without) (clinically )?(significant|meaningful|relevant|important|notable|apparent)? ?(differences?|effects?|impact|influence|changes?)\b[^.]{0,120}\b(sex|gender)\b|\b(sex|gender)\b[^.]{0,120}\b(no|not|without|did not|does not|do not) (have |had |has )?(a |any )?(clinically )?(significant|meaningful|relevant|important|notable|apparent)? ?(differences?|effects?|impact|influence|alter|affect|changes?)|\bsimilar (in|between) (males and females|men and women|female and male|women and men)\b|\b(sex|gender)[^.]{0,40}\b(not|no) (clinically )?(relevant|significant)|\b(sex|gender) (had|has|have) (no|little|minimal) (effect|impact|influence)|not (affected|influenced|altered) by (sex|gender)|\b(sex|gender)\b[^.]{0,60}(no|not) (require|warrant)[^.]{0,20}(dose|dosage) adjust|\b(sex|gender)\b[^.]{0,40}\b(independent|unaffected)\b|independent of (age, )?(sex|gender)", re.I),
    "not_evaluated": re.compile(r"(effects?|impact|influence) of (sex|gender)[^.]{0,60}\b(not|has not|have not|was not|were not|cannot) (been )?(evaluated|studied|investigated|assessed|determined|established|characterized)|\b(sex|gender)\b[^.]{0,40}\b(not been (evaluated|studied|investigated)|unknown|not known)", re.I),
    "no_preg_data": re.compile(r"\b(no|insufficient|limited|not sufficient|not enough|inadequate|not adequate)\b (available |adequate |well-controlled |human |clinical )?(data|studies|information|experience)[^.]{0,100}\bpregnan|\bpregnan[^.]{0,120}\b(no|insufficient|limited|not sufficient|inadequate) (available |adequate |human )?(data|studies|information)|are no (adequate|available|human) (and well-controlled )?(studies|data)[^.]{0,80}pregnan|(data|experience) (with|on|from)[^.]{0,40}pregnan[^.]{0,40}(are |is )?(insufficient|limited|not sufficient)", re.I),
    "no_lact_data": re.compile(r"\b(no|insufficient|limited|not sufficient)\b (available |adequate )?(human |clinical )?(data|information|studies)[^.]{0,120}(breast ?milk|lactat|breastfe|nursing|milk production)|(breast ?milk|lactat|breastfe)[^.]{0,120}\b(no|insufficient|limited|not sufficient) (available |adequate )?(data|information)|(presence|excretion|levels?) of [^.]{0,80} in (human|breast) milk[^.]{0,60}(unknown|not known|no (data|information)|have not been|has not been)|(there is|there are) no (data|information)[^.]{0,80}(milk|lactat)|it is not known whether[^.]{0,80}(milk|lactat|nursing)", re.I),
    "sex_dose": re.compile(r"\b(recommended|starting|initial|maximum|total) (daily )?(dose|dosage)\b[^.]{0,80}\b(for|in) (women|females|female patients|adult females)\b|\b(women|females|female patients)\b[^.]{0,60}\b(recommended|starting|initial) (dose|dosage)\b|\bdose (adjustment|reduction|modification)\b[^.]{0,60}\b(based on|according to|by|for) (sex|gender|women|females)\b|\b(women|females)\b[^.]{0,40}\b(should|must) (receive|take|be started on|be given)\b[^.]{0,40}\b(lower|reduced|\d+ ?mg)\b|\bmg (for|in) (women|females)\b", re.I),
}
TRIAL_PCT = {d["slug"]: d for d in json.load(open(f"{SITE_DATA}/chapter1.json"))["drugs"]}


def classify(rec):
    pk = " ".join(str(rec.get(k, "")) for k in ("pharmacokinetics", "clinical_pharmacology"))
    pop = " ".join(str(rec.get(k, "")) for k in ("use_in_specific_populations", "pregnancy", "lactation", "nursing_mothers", "females_and_males_of_reproductive_potential"))
    dose = str(rec.get("dosage_and_administration", ""))
    sex_sents = [s for s in SENT.split(pk) if re.search(r"\b(sex|gender|females?|women|males?|men)\b", s, re.I) and len(s) < 600]
    out = {"male_only_pk": bool(R["male_only_pk"].search(pk)), "quantified": any(R["quantified"].search(s) for s in sex_sents), "difference": any(R["difference"].search(s) for s in sex_sents),
           "no_difference": any(R["no_difference"].search(s) for s in sex_sents), "not_evaluated": any(R["not_evaluated"].search(s) for s in sex_sents),
           "mentions_sex": bool(sex_sents), "no_preg_data": bool(R["no_preg_data"].search(pop)), "no_lact_data": bool(R["no_lact_data"].search(pop)), "sex_dose": bool(R["sex_dose"].search(dose)),
           "has_lactation_section": bool(rec.get("lactation") or rec.get("nursing_mothers")), "has_pregnancy_section": bool(rec.get("pregnancy"))}
    out["sex_statement"] = ("quantified difference" if out["quantified"] else "difference noted" if out["difference"] else "no difference asserted" if out["no_difference"] else "not evaluated" if out["not_evaluated"] else "mentioned, unclear" if out["mentions_sex"] else "silent")
    out["example"] = next((s.strip()[:300] for s in sex_sents if (R["quantified"].search(s) or R["difference"].search(s) or R["no_difference"].search(s) or R["not_evaluated"].search(s))), None)
    return out


def labels():
    rows = []
    for line in open(f"{OUT}/labels.jsonl"):
        rec = json.loads(line)
        d = TRIAL_PCT.get(rec["slug"])
        if not rec["found"] or not d:
            continue
        c = classify(rec)
        rows.append({"slug": rec["slug"], "brand": rec["brand"], "year": d["year"], "category": d["category"], "trial_female_pct": d["trial_female_pct"], "faers_female_pct": d["faers_female_pct"], "label_date": rec.get("effective_time"), **c})
    n = len(rows)
    pct = lambda k, rs=rows: round(100 * sum(1 for r in rs if r[k]) / len(rs), 1) if rs else None  # noqa: E731
    stmt = {s: sum(1 for r in rows if r["sex_statement"] == s) for s in ("quantified difference", "difference noted", "no difference asserted", "not evaluated", "mentioned, unclear", "silent")}
    low = [r for r in rows if r["trial_female_pct"] < 30 and r["trial_female_pct"] > 0]; mid = [r for r in rows if 30 <= r["trial_female_pct"] < 50]; high = [r for r in rows if r["trial_female_pct"] >= 50]
    by_trial = {"under 30% women": {"n": len(low), "no_difference_pct": pct("no_difference", low), "quantified_pct": pct("quantified", low), "not_evaluated_pct": pct("not_evaluated", low), "silent_pct": round(100 * sum(1 for r in low if r["sex_statement"] == "silent") / len(low), 1) if low else None},
                "30–49% women": {"n": len(mid), "no_difference_pct": pct("no_difference", mid), "quantified_pct": pct("quantified", mid), "not_evaluated_pct": pct("not_evaluated", mid), "silent_pct": round(100 * sum(1 for r in mid if r["sex_statement"] == "silent") / len(mid), 1) if mid else None},
                "50% or more women": {"n": len(high), "no_difference_pct": pct("no_difference", high), "quantified_pct": pct("quantified", high), "not_evaluated_pct": pct("not_evaluated", high), "silent_pct": round(100 * sum(1 for r in high if r["sex_statement"] == "silent") / len(high), 1) if high else None}}
    cats = {}
    for cat in sorted({r["category"] for r in rows}):
        rs = [r for r in rows if r["category"] == cat]
        if len(rs) >= 8:
            cats[cat] = {"n": len(rs), "no_preg_data_pct": pct("no_preg_data", rs), "no_lact_data_pct": pct("no_lact_data", rs), "no_difference_pct": pct("no_difference", rs), "quantified_pct": pct("quantified", rs), "male_only_pk_pct": pct("male_only_pk", rs), "trial_female_pct_median": round(sorted(r["trial_female_pct"] for r in rs)[len(rs) // 2], 1)}
    by_year = [{"year": y, "n": len(rs), "no_preg_data_pct": pct("no_preg_data", rs), "no_lact_data_pct": pct("no_lact_data", rs), "no_difference_pct": pct("no_difference", rs), "quantified_pct": pct("quantified", rs)} for y in range(2015, 2027) for rs in [[r for r in rows if r["year"] == y]] if len(rs) >= 10]
    return {"n": n, "statements": stmt, "male_only_pk_pct": pct("male_only_pk"), "male_only_pk_n": sum(1 for r in rows if r["male_only_pk"]), "quantified_pct": pct("quantified"), "difference_pct": pct("difference"), "no_difference_pct": pct("no_difference"), "not_evaluated_pct": pct("not_evaluated"),
            "no_preg_data_pct": pct("no_preg_data"), "no_lact_data_pct": pct("no_lact_data"), "sex_dose_pct": pct("sex_dose"), "sex_dose_n": sum(1 for r in rows if r["sex_dose"]), "sex_dose_brands": [r["brand"] for r in rows if r["sex_dose"]],
            "quantified_brands": [{"brand": r["brand"], "example": r["example"], "trial_female_pct": r["trial_female_pct"]} for r in rows if r["quantified"]], "male_only_brands": [{"brand": r["brand"], "trial_female_pct": r["trial_female_pct"], "category": r["category"]} for r in rows if r["male_only_pk"]],
            "by_trial_share": by_trial, "by_category": cats, "by_year": by_year, "drugs": rows}


# ---------- PubMed
def pubmed():
    cache = json.load(open(f"{CACHE}/ch6/pubmed_counts.json"))

    def get(parts):
        return cache.get(" AND ".join(parts))

    def row(y, base_parts):
        vals = {s: get(base_parts + [f"{y}[dp]"] + ([q] if q else [])) if s != "all" else get(base_parts + [f"{y}[dp]"]) for s, q in SEX.items()}
        # the year clause sits after the field clause in fetch_pubmed: rebuild the exact string
        return vals

    def series(name, extra):
        out = []
        for y in [y for y in YEARS if y <= LAST_COMPARABLE]:
            parts = [RODENT, f"{y}[dp]"] + ([extra] if extra else [])
            vals = {}
            for s, q in SEX.items():
                vals[s] = cache.get(" AND ".join(parts + ([q] if q else [])))
            if vals.get("any") in (None, 0) or vals.get("all") is None:
                continue
            anyv = vals["any"]
            out.append({"year": y, "n": vals["all"], "n_sexed": anyv, "male_only_pct": round(100 * vals["male_only"] / anyv, 1), "female_only_pct": round(100 * vals["female_only"] / anyv, 1), "both_pct": round(100 * vals["both"] / anyv, 1), "includes_female_pct": round(100 * (vals["female_only"] + vals["both"]) / anyv, 1), "sexed_pct": round(100 * anyv / vals["all"], 1)})
        return out
    fields = {name: series(name, q) for name, q in FIELDS.items()}
    nih = series("NIH-funded rodent studies", '"NIH HHS"[gr]')
    human = {}
    for hname, hq in HUMAN.items():
        out = []
        for y in [y for y in YEARS if y <= LAST_COMPARABLE]:
            parts = [hq, f"{y}[dp]"]
            vals = {s: cache.get(" AND ".join(parts + ([q] if q else []))) for s, q in SEX.items()}
            if not vals.get("any"):
                continue
            out.append({"year": y, "n": vals["all"], "n_sexed": vals["any"], "male_only_pct": round(100 * vals["male_only"] / vals["any"], 1), "female_only_pct": round(100 * vals["female_only"] / vals["any"], 1), "both_pct": round(100 * vals["both"] / vals["any"], 1)})
        human[hname] = out
    latest = {name: s[-1] for name, s in fields.items() if s}
    return {"fields": fields, "nih": nih, "human": human, "latest": latest, "years": [YEARS[0], LAST_COMPARABLE], "last_comparable": LAST_COMPARABLE}


def main():
    out = {"generated": date.today().isoformat(), "labels": labels(), "pubmed": pubmed()}
    json.dump(out, open(f"{SITE_DATA}/chapter6.json", "w"), indent=1)
    today = date.today().isoformat()
    new_sources = [
        {"id": "pubmed", "title": "PubMed E-utilities: record counts by year for MeSH-indexed rodent and human studies by sex", "publisher": "National Library of Medicine", "url": "https://www.ncbi.nlm.nih.gov/books/NBK25501/", "retrieved": today, "note": "Queries combine Mice/Rats MeSH headings with the Male and Female check tags; field subsets use MeSH headings listed on the methods page. Years after 2020 are excluded: NLM's move to automated MeSH indexing changed how the sex check tags are applied."},
        {"id": "openfda-label", "title": "openFDA Drug Labeling API (Structured Product Labeling)", "publisher": "U.S. Food and Drug Administration", "url": "https://open.fda.gov/apis/drug/label/", "retrieved": today, "note": "Current prescribing information for each chapter-1 drug, matched by brand name; sections 8 and 12.3 text-mined with the rules in the pipeline."},
        {"id": "beery-2011", "title": "Sex bias in neuroscience and biomedical research", "publisher": "Beery A.K., Zucker I., Neuroscience & Biobehavioral Reviews 35(3), 2011. doi:10.1016/j.neubiorev.2010.07.002", "url": "https://doi.org/10.1016/j.neubiorev.2010.07.002", "retrieved": today, "note": "Hand survey of 2009 papers in ten fields: male bias in eight."},
        {"id": "nih-sabv", "title": "NIH policy on sex as a biological variable (NOT-OD-15-102)", "publisher": "National Institutes of Health, 2015; in effect for applications from 25 January 2016", "url": "https://grants.nih.gov/grants/guide/notice-files/NOT-OD-15-102.html", "retrieved": today},
        {"id": "science-2026-pain", "title": "Sex-specific mechanisms of chronic pain", "publisher": "Venkataraman A., Midavaine É., Ingraham H.A., Science, 1 October 2026. doi:10.1126/science.aeh4468", "url": "https://doi.org/10.1126/science.aeh4468", "retrieved": today, "note": "Review; the microglia-versus-T-cell finding it summarises is from Sorge et al., Nature Neuroscience 2015."},
        {"id": "sorge-2015", "title": "Different immune cells mediate mechanical pain hypersensitivity in male and female mice", "publisher": "Sorge R.E., Mapplebeck J.C.S., Rosen S. et al., Nature Neuroscience 18, 2015. doi:10.1038/nn.4053", "url": "https://doi.org/10.1038/nn.4053", "retrieved": today},
    ]
    sources = json.load(open(f"{SITE_DATA}/sources.json"))
    sources = [s for s in sources if s["id"] not in {n["id"] for n in new_sources}] + new_sources
    json.dump(sources, open(f"{SITE_DATA}/sources.json", "w"), indent=1)
    L = out["labels"]; P = out["pubmed"]
    print("labels:", {k: v for k, v in L.items() if k not in ("drugs", "quantified_brands", "male_only_brands", "by_category", "by_year")})
    print("quantified:", [(b["brand"], b["trial_female_pct"], b["example"][:120] if b["example"] else None) for b in L["quantified_brands"]])
    print("male-only PK:", L["male_only_brands"]); print("by category:", L["by_category"]); print("by year:", L["by_year"])
    print("pubmed latest:", P["latest"]); print("nih:", P["nih"][-3:] if P["nih"] else None); print("human:", {k: v[-2:] for k, v in P["human"].items()})
    for name, s in P["fields"].items():
        if s:
            print(f"  {name:28}", [(r["year"], r["male_only_pct"], r["includes_female_pct"]) for r in s if r["year"] in (2000, 2009, 2015, 2019, 2023, 2024, 2025)])


if __name__ == "__main__":
    main()
