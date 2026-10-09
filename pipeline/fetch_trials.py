"""Chapter 4: every interventional trial on ClinicalTrials.gov with posted results.

Pages through the v2 API (pageSize 1000) asking only for the fields we use, caches
each raw page in cache/ch4/pages/, and writes out/trials.jsonl: one compact record
per study with the baseline sex counts, eligibility, sponsor, phase, conditions
(with MeSH terms and ancestors) and whether any outcome was reported by sex.
Resumable: rerun to continue from the last cached page.
"""
import glob
import json
import os
import re
import time

import requests

from common import CACHE, OUT, UA

PAGES = f"{CACHE}/ch4/pages"
os.makedirs(PAGES, exist_ok=True)
FIELDS = ",".join([
    "NCTId", "StartDate", "PrimaryCompletionDate", "Phase", "LeadSponsorClass", "LeadSponsorName", "Condition", "ConditionMeshTerm", "ConditionAncestorTerm",
    "EligibilityCriteria", "Sex", "MinimumAge", "MaximumAge", "StdAge", "EnrollmentCount", "LocationCountry", "DesignAllocation", "DesignInterventionModel",
    "InterventionType", "OverallStatus", "ResultsFirstPostDate",
    "BaselineMeasureTitle", "BaselineMeasureParamType", "BaselineCategoryTitle", "BaselineMeasurementValue", "BaselineMeasurementGroupId", "BaselineGroupId", "BaselineGroupTitle",
    "BaselineDenomCountValue", "BaselineDenomCountGroupId",
    "OutcomeMeasureTitle", "OutcomeGroupTitle", "OutcomeGroupDescription",
])
FILTER = "AREA[HasResults]true AND AREA[StudyType]INTERVENTIONAL"
FEM = re.compile(r"\b(females?|women|woman|girls?)\b", re.I)
MAL = re.compile(r"\b(males?|men|man|boys?)\b", re.I)


def fetch_pages():
    done = sorted(glob.glob(f"{PAGES}/page_*.json"))
    token = None
    n = 0
    if done:
        last = json.load(open(done[-1]))
        token = last.get("nextPageToken")
        n = len(done)
        if not token:
            print(f"  all {n} pages cached")
            return
    while True:
        params = {"filter.advanced": FILTER, "fields": FIELDS, "pageSize": 1000, "countTotal": "true"}
        if token:
            params["pageToken"] = token
        for attempt in range(5):
            try:
                r = requests.get("https://clinicaltrials.gov/api/v2/studies", params=params, headers=UA, timeout=180)
                if r.status_code == 429:
                    time.sleep(30); continue
                r.raise_for_status()
                break
            except requests.RequestException as e:
                print("  retry", e); time.sleep(20 * (attempt + 1))
        else:
            raise SystemExit("gave up")
        d = r.json()
        with open(f"{PAGES}/page_{n:03d}.json", "w") as f:
            json.dump(d, f)
        n += 1
        print(f"  page {n}: {len(d['studies'])} studies, total {d.get('totalCount')}")
        token = d.get("nextPageToken")
        if not token:
            break
        time.sleep(1.0)


def parse_study(s):
    p = s.get("protocolSection", {}); r = s.get("resultsSection", {}); dv = s.get("derivedSection", {})
    ident = p.get("identificationModule", {}); st = p.get("statusModule", {}); sp = p.get("sponsorCollaboratorsModule", {}).get("leadSponsor", {})
    cm = p.get("conditionsModule", {}); dm = p.get("designModule", {}); el = p.get("eligibilityModule", {})
    cb = dv.get("conditionBrowseModule", {})
    locs = p.get("contactsLocationsModule", {}).get("locations", [])
    countries = sorted({l.get("country") for l in locs if l.get("country")})
    bm = r.get("baselineCharacteristicsModule", {})
    groups = {g["id"]: g.get("title", "") for g in bm.get("groups", [])}
    total_ids = [gid for gid, t in groups.items() if t.strip().lower() in ("total", "all participants", "overall", "all subjects", "total participants")]
    female = male = None; param = None
    for m in bm.get("measures", []):
        t = m.get("title", "").lower()
        if not (t.startswith("sex") or t.startswith("gender")):
            continue
        param = m.get("paramType")
        if param not in ("COUNT_OF_PARTICIPANTS", "NUMBER", None):
            continue
        f = {}; ml = {}
        for c in m.get("classes", []):
            for cat in c.get("categories", []):
                ct = (cat.get("title") or "").strip().lower()
                tgt = f if ct in ("female", "women", "girls", "woman", "females") else ml if ct in ("male", "men", "boys", "man", "males") else None
                if tgt is None:
                    continue
                for x in cat.get("measurements", []):
                    try:
                        tgt[x["groupId"]] = tgt.get(x["groupId"], 0) + float(x.get("value"))
                    except (TypeError, ValueError):
                        pass
        if not f and not ml:
            continue
        if total_ids and total_ids[0] in f or (total_ids and total_ids[0] in ml):
            female = f.get(total_ids[0], 0.0); male = ml.get(total_ids[0], 0.0)
        else:
            female = sum(f.values()); male = sum(ml.values())
        break
    # age: >=65 share from the standard categorical measure; mean age from the continuous one (total group preferred)
    age65 = age_tot = None; age_mean = None
    for m in bm.get("measures", []):
        t = m.get("title", "").lower()
        if not t.startswith("age"):
            continue
        if m.get("paramType") == "COUNT_OF_PARTICIPANTS":
            f65 = {}; ftot = {}
            for c in m.get("classes", []):
                for cat in c.get("categories", []):
                    ct = (cat.get("title") or "").strip().lower()
                    for x in cat.get("measurements", []):
                        try:
                            v = float(x.get("value"))
                        except (TypeError, ValueError):
                            continue
                        ftot[x["groupId"]] = ftot.get(x["groupId"], 0) + v
                        if ct.startswith(">=65") or ct.startswith("≥65") or ct.startswith("65") or "65 and over" in ct or ct.startswith("> 84") or ct.startswith(">84") or ct.startswith("85"):
                            f65[x["groupId"]] = f65.get(x["groupId"], 0) + v
            if ftot and any(("65" in (cat.get("title") or "")) for c in m.get("classes", []) for cat in c.get("categories", [])):
                gid = total_ids[0] if total_ids and total_ids[0] in ftot else None
                age65 = f65.get(gid, 0.0) if gid else sum(f65.values()); age_tot = ftot[gid] if gid else sum(ftot.values())
        elif m.get("paramType") in ("MEAN", "MEDIAN") and age_mean is None and "year" in (m.get("unitOfMeasure") or "years").lower():
            vals = {}
            for c in m.get("classes", []):
                for cat in c.get("categories", []):
                    for x in cat.get("measurements", []):
                        try:
                            vals[x["groupId"]] = float(x.get("value"))
                        except (TypeError, ValueError):
                            pass
            if vals:
                age_mean = vals.get(total_ids[0]) if total_ids and total_ids[0] in vals else sum(vals.values()) / len(vals)
    # was any outcome reported in groups named by sex? Require at least one female-named group and one
    # male-named group, and no group that names both (a 'Male and Female' cohort is not a split).
    by_sex = False
    for om in r.get("outcomeMeasuresModule", {}).get("outcomeMeasures", []):
        gs = [g.get("title", "") for g in om.get("groups", [])]
        fem = [t for t in gs if FEM.search(t) and not MAL.search(t)]; mal = [t for t in gs if MAL.search(t) and not FEM.search(t)]
        if fem and mal:
            by_sex = True
            break
    return {
        "nct": ident.get("nctId"), "start": st.get("startDateStruct", {}).get("date"), "completed": st.get("primaryCompletionDateStruct", {}).get("date"),
        "results_posted": st.get("resultsFirstPostDateStruct", {}).get("date"), "status": st.get("overallStatus"),
        "sponsor_class": sp.get("class"), "sponsor": sp.get("name"), "phases": dm.get("phases", []), "allocation": dm.get("designInfo", {}).get("allocation"),
        "model": dm.get("designInfo", {}).get("interventionModel"), "enrollment": dm.get("enrollmentInfo", {}).get("count"),
        "intervention_types": sorted({i.get("type") for i in p.get("armsInterventionsModule", {}).get("interventions", []) if i.get("type")}),
        "conditions": cm.get("conditions", []), "mesh": [m["term"] for m in cb.get("meshes", [])], "ancestors": [a["term"] for a in cb.get("ancestors", [])],
        "sex": el.get("sex"), "min_age": el.get("minimumAge"), "max_age": el.get("maximumAge"), "std_ages": el.get("stdAges", []), "criteria": el.get("eligibilityCriteria", ""),
        "countries": countries, "us": "United States" in countries,
        "female": female, "male": male, "sex_param": param, "outcome_by_sex": by_sex, "age65": age65, "age_tot": age_tot, "age_mean": age_mean,
    }


def parse_all():
    n = 0
    with open(f"{OUT}/trials.jsonl", "w") as out:
        for f in sorted(glob.glob(f"{PAGES}/page_*.json")):
            for s in json.load(open(f))["studies"]:
                out.write(json.dumps(parse_study(s)) + "\n"); n += 1
    print(f"  wrote {n} studies to out/trials.jsonl")


if __name__ == "__main__":
    fetch_pages()
    parse_all()
