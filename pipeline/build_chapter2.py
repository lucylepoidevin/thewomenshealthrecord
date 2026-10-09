"""Chapter 2: the pain gap in the emergency department.

NHAMCS ED public-use files 2018-2022 (NCHS). Adult visits (18+). For pain
complaints (reason for visit, RFV1) we estimate, by patient sex:
  share given an opioid in the ED / given or prescribed an opioid / given any analgesic,
  mean wait to first provider (minutes), share triaged urgent, admission, and workup items.
Design-based estimates: PATWT weights, Taylor linearization over CSTRATM/CPSUM.
Writes site/public/data/chapter2.json.
"""
import glob
import json
import math
import re
from datetime import date

import numpy as np
import pandas as pd

from common import CACHE, SITE_DATA

OPIOID = {"060", "191"}
ANALGESIC = {"058", "059", "060", "061", "062", "063", "191"}
GROUPS = [
    ("abdominal", "Abdominal pain", {15450, 15451, 15452, 15453}),
    ("chest", "Chest pain", {10500, 10501, 10502, 10503}),
    ("back", "Back pain", {19050, 19051, 19100, 19101}),
    ("headache", "Headache or migraine", {12100, 23650}),
    ("limb", "Neck, hip, leg or joint pain", {19001, 19151, 19201, 19251, 19301, 19351}),
    ("flank", "Flank, rib or groin pain", {10550, 10551, 10552, 10553}),
]
AGE_BANDS = [(18, 44), (45, 64), (65, 120)]


def load():
    frames = []
    for f in sorted(glob.glob(f"{CACHE}/nhamcs/*.dta"), key=str.lower):
        year = int(re.search(r"(20\d\d)", f).group(1))
        df = pd.read_stata(f, convert_categoricals=False)
        rx = [c for c in df.columns if re.match(r"RX\d+(CAT\d|V\dC\d)$", c)]
        gp = {int(re.search(r"\d+", c).group()): c for c in df.columns if re.match(r"GPMED\d+$", c)}
        codes = df[rx].astype(str)
        # per medication slot i: is it an opioid / analgesic, and was it given in the ED?
        op_any = np.zeros(len(df), bool); op_ed = np.zeros(len(df), bool)
        an_any = np.zeros(len(df), bool); an_ed = np.zeros(len(df), bool)
        for i, gcol in gp.items():
            cols_i = [c for c in rx if re.match(rf"RX{i}(CAT\d|V\dC\d)$", c)]
            if not cols_i:
                continue
            is_op = codes[cols_i].isin(OPIOID).any(axis=1).values
            is_an = codes[cols_i].isin(ANALGESIC).any(axis=1).values
            given = df[gcol].isin([1, 3]).values
            op_any |= is_op; op_ed |= is_op & given
            an_any |= is_an; an_ed |= is_an & given
        dx = df[["DIAG1", "DIAG2", "DIAG3", "DIAG4", "DIAG5"]].astype(str)
        d1 = dx["DIAG1"]
        out = pd.DataFrame({
            "mi": dx.apply(lambda r: r.str.match(r"I2[12]").any(), axis=1).values, "mi_primary": d1.str.match(r"I2[12]").values,
            "ihd1": d1.str.match(r"I2[0-5]").values, "psych1": d1.str.startswith("F").values, "sym1": d1.str.startswith("R").values,
            "dxcat": np.select([d1.str.match(r"I2[0-5]"), d1.str.startswith("I"), d1.str.startswith("K"), d1.str.startswith("M"), d1.str.startswith("J"), d1.str.startswith("F"), d1.str.match(r"R07"), d1.str.startswith("R")],
                               ["Ischaemic heart disease", "Other circulatory", "Digestive", "Musculoskeletal", "Respiratory", "Psychiatric", "Chest pain, unspecified", "Other symptom code"], "Other"),
            "cardenz": df["CARDENZ"], "ddimer": df["DDIMER"], "xray": df["XRAY"], "totdiag": df["TOTDIAG"], "lov": df["LOV"], "rfv2": df["RFV2"], "rfv3": df["RFV3"],
            "year": year, "sex": df["SEX"], "age": df["AGE"], "w": df["PATWT"], "strat": df["CSTRATM"], "psu": df["CPSUM"],
            "wait": df["WAITTIME"], "pain": df["PAINSCALE"], "rfv1": df["RFV1"], "triage": df["IMMEDR"], "ems": df["ARREMS"],
            "ekg": df["EKG"], "cardmon": df["CARDMON"], "ctab": df["CTAB"], "cthead": df["CTHEAD"], "anyimage": df["ANYIMAGE"],
            "admit": ((df["ADMITHOS"] == 1) | (df["OBSHOS"] == 1) | (df["TRANOTH"] == 1)).astype(int),  # admitted to this hospital, observation then admitted, or transferred; ADMIT is the unit type, not admission
            "op_any": op_any, "op_ed": op_ed, "an_any": an_any, "an_ed": an_ed,
        })
        frames.append(out)
        print(f"  {year}: {len(df):,} visits")
    d = pd.concat(frames, ignore_index=True)
    d = d[(d["age"] >= 18) & (d["w"] > 0)].copy()
    d["female"] = d["sex"] == 1  # NHAMCS codes SEX 1 = female, 2 = male
    d["severe"] = d["pain"].between(7, 10)
    d["urgent"] = d["triage"].isin([1, 2])
    d["admitted"] = d["admit"] == 1
    d["ekg_done"] = d["ekg"] == 1
    d["cardmon_done"] = d["cardmon"] == 1
    d["ctab_done"] = d["ctab"] == 1
    d["cthead_done"] = d["cthead"] == 1
    d["wait_ok"] = d["wait"] >= 0
    d["cardenz_done"] = d["cardenz"] == 1
    d["ddimer_done"] = d["ddimer"] == 1
    d["xray_done"] = d["xray"] == 1
    d["ems_yes"] = d["ems"] == 1
    d["esi1"] = d["triage"] == 1
    d["totdiag_ok"] = d["totdiag"].where(d["totdiag"] >= 0)
    d["lov_ok"] = d["lov"].where(d["lov"] >= 0)
    return d


def svy_ratio(d, dom, y):
    """Weighted mean of y over domain `dom`, with Taylor-linearized SE using strata/PSU."""
    dom = dom.values if hasattr(dom, "values") else dom
    yv = pd.to_numeric(y, errors="coerce").astype(float).values
    w = d["w"].values
    I = dom & ~np.isnan(yv)
    W = (w * I).sum()
    if W == 0 or I.sum() < 2:
        return None
    R = (w * I * np.nan_to_num(yv)).sum() / W
    z = w * I * (np.nan_to_num(yv) - R) / W
    df_ = pd.DataFrame({"s": d["strat"].values, "p": d["psu"].values, "z": z})
    var = 0.0
    for _, g in df_.groupby("s"):
        psu = g.groupby("p")["z"].sum()
        n = len(psu)
        if n > 1:
            var += n / (n - 1) * ((psu - psu.mean()) ** 2).sum()
    se = math.sqrt(var)
    return {"est": R, "se": se, "lo": R - 1.96 * se, "hi": R + 1.96 * se, "n": int(I.sum())}


def compare(d, dom, y, scale=100.0, nd=1):
    f = svy_ratio(d, dom & d["female"].values, y)
    m = svy_ratio(d, dom & ~d["female"].values, y)
    if not f or not m:
        return None
    diff = f["est"] - m["est"]
    dse = math.sqrt(f["se"] ** 2 + m["se"] ** 2)  # independent domains (approximation)
    r = lambda v: round(v * scale, nd)
    rel = lambda e: bool(e["n"] >= 30 and (e["est"] == 0 or e["se"] / abs(e["est"]) <= 0.30))  # NCHS presentation rule: 30+ records and relative SE under 30%
    return {"women": {"est": r(f["est"]), "lo": r(f["lo"]), "hi": r(f["hi"]), "n": f["n"], "reliable": rel(f)},
            "men": {"est": r(m["est"]), "lo": r(m["lo"]), "hi": r(m["hi"]), "n": m["n"], "reliable": rel(m)},
            "diff": r(diff), "diff_lo": r(diff - 1.96 * dse), "diff_hi": r(diff + 1.96 * dse)}


def age_adjusted(d, dom, y):
    """Direct standardization of the sex-specific rates to the pooled age distribution of the domain."""
    tot = (d["w"] * dom).sum()
    out = {}
    for sex, label in ((True, "women"), (False, "men")):
        est = var = 0.0
        for lo, hi in AGE_BANDS:
            band = d["age"].between(lo, hi).values
            share = (d["w"] * (dom & band)).sum() / tot
            r = svy_ratio(d, dom & band & (d["female"].values == sex), y)
            if r:
                est += share * r["est"]; var += (share * r["se"]) ** 2
        out[label] = {"est": round(est * 100, 1), "lo": round((est - 1.96 * math.sqrt(var)) * 100, 1), "hi": round((est + 1.96 * math.sqrt(var)) * 100, 1)}
    out["diff"] = round(out["women"]["est"] - out["men"]["est"], 1)
    return out


def main():
    d = load()
    d["w"] = d["w"].astype(float)
    print(f"adult visits: {len(d):,} (weighted {d['w'].sum()/1e6:.0f}M)")
    pain_any = np.zeros(len(d), bool)
    groups = []
    for gid, label, codes in GROUPS:
        dom = d["rfv1"].isin(codes).values
        pain_any |= dom
        g = {"id": gid, "label": label, "n": int(dom.sum()), "n_women": int((dom & d["female"].values).sum()), "n_men": int((dom & ~d["female"].values).sum()),
             "weighted_visits_per_year": round((d["w"] * dom).sum() / d["year"].nunique() / 1e6, 2),
             "metrics": {
                 "opioid_ed": compare(d, dom, d["op_ed"]),
                 "opioid_any": compare(d, dom, d["op_any"]),
                 "analgesic_ed": compare(d, dom, d["an_ed"]),
                 "wait_mean": compare(d, dom & d["wait_ok"].values, d["wait"], scale=1.0, nd=1),
                 "severe_share": compare(d, dom & (d["pain"] >= 0).values, d["severe"]),
                 "urgent": compare(d, dom & (d["triage"] >= 1).values, d["urgent"]),
                 "admitted": compare(d, dom, d["admitted"]),
                 "opioid_ed_severe": compare(d, dom & d["severe"].values, d["op_ed"]),
                 "analgesic_ed_severe": compare(d, dom & d["severe"].values, d["an_ed"]),
                 "wait_mean_severe": compare(d, dom & d["severe"].values & d["wait_ok"].values, d["wait"], scale=1.0, nd=1),
             },
             "age_adjusted": {"opioid_ed": age_adjusted(d, dom, d["op_ed"]), "analgesic_ed": age_adjusted(d, dom, d["an_ed"])}}
        g["metrics"]["psych_dx"] = compare(d, dom, d["psych1"])
        g["metrics"]["symptom_dx"] = compare(d, dom, d["sym1"])
        g["metrics"]["tests_count"] = compare(d, dom, d["totdiag_ok"], scale=1.0, nd=1)
        g["metrics"]["ems"] = compare(d, dom & (d["ems"] >= 1).values, d["ems_yes"])
        if gid == "chest":
            g["metrics"]["ekg"] = compare(d, dom, d["ekg_done"]); g["metrics"]["cardmon"] = compare(d, dom, d["cardmon_done"])
            g["metrics"]["ekg_severe"] = compare(d, dom & d["severe"].values, d["ekg_done"])
            g["metrics"]["cardenz"] = compare(d, dom, d["cardenz_done"]); g["metrics"]["ddimer"] = compare(d, dom, d["ddimer_done"]); g["metrics"]["xray"] = compare(d, dom, d["xray_done"])
            g["metrics"]["ihd_dx"] = compare(d, dom, d["ihd1"])
            g["dx_mix"] = {c: compare(d, dom, d["dxcat"] == c) for c in ["Ischaemic heart disease", "Other circulatory", "Digestive", "Musculoskeletal", "Respiratory", "Psychiatric", "Chest pain, unspecified", "Other symptom code", "Other"]}
            g["ihd_dx_by_age"] = {f"{lo}-{hi if hi < 120 else '+'}": compare(d, dom & d["age"].between(lo, hi).values, d["ihd1"]) for lo, hi in AGE_BANDS}
        if gid == "abdominal":
            g["metrics"]["ctab"] = compare(d, dom, d["ctab_done"])
        if gid == "headache":
            g["metrics"]["cthead"] = compare(d, dom, d["cthead_done"])
        groups.append(g)
        print(f"  {label:28} n={g['n']:5}  opioid in ED: W {g['metrics']['opioid_ed']['women']['est']}% M {g['metrics']['opioid_ed']['men']['est']}%  wait W {g['metrics']['wait_mean']['women']['est']} M {g['metrics']['wait_mean']['men']['est']} min")

    by_score = []
    for s in range(0, 11):
        dom = pain_any & (d["pain"] == s).values
        c = compare(d, dom, d["op_ed"]); a = compare(d, dom, d["an_ed"])
        if c:
            by_score.append({"score": s, "opioid_ed": c, "analgesic_ed": a})
    allpain = {
        "n": int(pain_any.sum()), "n_women": int((pain_any & d["female"].values).sum()), "n_men": int((pain_any & ~d["female"].values).sum()),
        "metrics": {
            "opioid_ed": compare(d, pain_any, d["op_ed"]), "opioid_any": compare(d, pain_any, d["op_any"]), "analgesic_ed": compare(d, pain_any, d["an_ed"]),
            "wait_mean": compare(d, pain_any & d["wait_ok"].values, d["wait"], scale=1.0, nd=1),
            "severe_share": compare(d, pain_any & (d["pain"] >= 0).values, d["severe"]),
            "opioid_ed_severe": compare(d, pain_any & d["severe"].values, d["op_ed"]),
            "analgesic_ed_severe": compare(d, pain_any & d["severe"].values, d["an_ed"]),
            "wait_mean_severe": compare(d, pain_any & d["severe"].values & d["wait_ok"].values, d["wait"], scale=1.0, nd=1),
            "urgent": compare(d, pain_any & (d["triage"] >= 1).values, d["urgent"]),
            "ems": compare(d, pain_any & (d["ems"] >= 1).values, d["ems_yes"]),
            "psych_dx": compare(d, pain_any, d["psych1"]), "symptom_dx": compare(d, pain_any, d["sym1"]), "tests_count": compare(d, pain_any, d["totdiag_ok"], scale=1.0, nd=1),
        },
        "age_adjusted": {"opioid_ed": age_adjusted(d, pain_any, d["op_ed"]), "analgesic_ed": age_adjusted(d, pain_any, d["an_ed"]),
                         "opioid_ed_severe": age_adjusted(d, pain_any & d["severe"].values, d["op_ed"])},
        "within_triage": {str(t): compare(d, pain_any & (d["triage"] == t).values, d["op_ed"]) for t in (2, 3, 4)},
    }
    chest_codes = {10500, 10501, 10502, 10503}
    mi = d["mi"].values
    mi_primary = d["mi_primary"].values
    cc_chest = d["rfv1"].isin(chest_codes)
    any_chest = cc_chest | d["rfv2"].isin(chest_codes) | d["rfv3"].isin(chest_codes)
    heart = {
        "n": int(mi.sum()), "n_women": int((mi & d["female"].values).sum()), "n_men": int((mi & ~d["female"].values).sum()),
        "weighted_per_year_k": round((d["w"] * mi).sum() / d["year"].nunique() / 1e3),
        "metrics": {
            "age_mean": compare(d, mi, d["age"], scale=1.0, nd=1),
            "chief_complaint_chest": compare(d, mi, cc_chest), "any_chest": compare(d, mi, any_chest),
            "ems": compare(d, mi & (d["ems"] >= 1).values, d["ems_yes"]),
            "urgent": compare(d, mi & (d["triage"] >= 1).values, d["urgent"]), "esi1": compare(d, mi & (d["triage"] >= 1).values, d["esi1"]),
            "wait_mean": compare(d, mi & d["wait_ok"].values, d["wait"], scale=1.0, nd=1),
            "ekg": compare(d, mi, d["ekg_done"]), "cardenz": compare(d, mi, d["cardenz_done"]), "admitted": compare(d, mi, d["admitted"]),
            "lov_mean": compare(d, mi, d["lov_ok"], scale=1.0, nd=0),
        },
        "primary_only": {"n": int((mi & mi_primary).sum()), "n_women": int((mi & mi_primary & d["female"].values).sum()), "cardenz": compare(d, mi & mi_primary, d["cardenz_done"]), "urgent": compare(d, mi & mi_primary & (d["triage"] >= 1).values, d["urgent"]), "ems": compare(d, mi & mi_primary & (d["ems"] >= 1).values, d["ems_yes"])},
        "under_65": {"chief_complaint_chest": compare(d, mi & (d["age"] < 65).values, cc_chest), "urgent": compare(d, mi & (d["age"] < 65).values & (d["triage"] >= 1).values, d["urgent"]), "cardenz": compare(d, mi & (d["age"] < 65).values, d["cardenz_done"])},
    }
    # ---- explorer: complaint x age band x sex
    d["anyimage_done"] = d["anyimage"] == 1
    explorer = []
    for gid, label, codes in GROUPS + [("all", "Any pain complaint", None)]:
        gdom = pain_any if codes is None else d["rfv1"].isin(codes).values
        for lo, hi in AGE_BANDS + [(18, 120)]:
            dom = gdom & d["age"].between(lo, hi).values
            cell = {"complaint": gid, "age": f"{lo}-{hi}" if hi < 120 else (f"{lo}+" if lo > 18 else "all"), "n_women": int((dom & d["female"].values).sum()), "n_men": int((dom & ~d["female"].values).sum()),
                    "metrics": {
                        "severe_share": compare(d, dom & (d["pain"] >= 0).values, d["severe"]),
                        "urgent": compare(d, dom & (d["triage"] >= 1).values, d["urgent"]),
                        "ems": compare(d, dom & (d["ems"] >= 1).values, d["ems_yes"]),
                        "wait_mean": compare(d, dom & d["wait_ok"].values, d["wait"], scale=1.0, nd=0),
                        "analgesic_ed": compare(d, dom, d["an_ed"]),
                        "opioid_ed": compare(d, dom, d["op_ed"]),
                        "anyimage": compare(d, dom, d["anyimage_done"]),
                        "tests_count": compare(d, dom, d["totdiag_ok"], scale=1.0, nd=1),
                        "admitted": compare(d, dom, d["admitted"]),
                        "symptom_dx": compare(d, dom, d["sym1"]),
                        "lov_mean": compare(d, dom, d["lov_ok"], scale=1.0, nd=0),
                    }}
            explorer.append(cell)
    # ---- levers: what moves the urgency rating
    by_score_urgent = []
    for s_ in range(0, 11):
        dom = pain_any & (d["pain"] == s_).values & (d["triage"] >= 1).values
        c = compare(d, dom, d["urgent"])
        if c:
            by_score_urgent.append({"score": s_, "urgent": c})
    tri = pain_any & (d["triage"] >= 1).values
    levers = {
        "urgent_by_ambulance": {"ambulance": compare(d, tri & d["ems_yes"].values, d["urgent"]), "walk_in": compare(d, tri & (d["ems"] == 2).values, d["urgent"])},
        "urgent_severe_by_ambulance": {"ambulance": compare(d, tri & d["ems_yes"].values & d["severe"].values, d["urgent"]), "walk_in": compare(d, tri & (d["ems"] == 2).values & d["severe"].values, d["urgent"])},
        "wait_by_ambulance": {"ambulance": compare(d, pain_any & d["wait_ok"].values & d["ems_yes"].values, d["wait"], scale=1.0, nd=0), "walk_in": compare(d, pain_any & d["wait_ok"].values & (d["ems"] == 2).values, d["wait"], scale=1.0, nd=0)},
        "mi_urgent_by_complaint": {"said_chest_pain": compare(d, mi & cc_chest.values & (d["triage"] >= 1).values, d["urgent"]), "other_complaint": compare(d, mi & ~cc_chest.values & (d["triage"] >= 1).values, d["urgent"])},
        "mi_cardenz_by_complaint": {"said_chest_pain": compare(d, mi & cc_chest.values, d["cardenz_done"]), "other_complaint": compare(d, mi & ~cc_chest.values, d["cardenz_done"])},
    }
    out = {
        "generated": date.today().isoformat(), "years": [int(d["year"].min()), int(d["year"].max())],
        "heart_attack": heart, "explorer": explorer, "by_score_urgent": by_score_urgent, "levers": levers,
        "n_adult_visits": int(len(d)), "weighted_adult_visits_per_year_m": round(d["w"].sum() / d["year"].nunique() / 1e6, 1),
        "groups": groups, "all_pain": allpain, "by_score": by_score,
        "all_visits": {"opioid_ed": compare(d, np.ones(len(d), bool), d["op_ed"]), "wait_mean": compare(d, d["wait_ok"].values, d["wait"], scale=1.0, nd=1)},
    }
    # merge this chapter's sources into the shared sources.json
    today = date.today().isoformat()
    new_sources = [
        {"id": "chen-2008", "title": "Gender disparity in analgesic treatment of emergency department patients with acute abdominal pain", "publisher": "Chen E.H., Shofer F.S., Dean A.J. et al., Academic Emergency Medicine 15(5), 2008. doi:10.1111/j.1553-2712.2008.00100.x", "url": "https://doi.org/10.1111/j.1553-2712.2008.00100.x", "retrieved": today, "note": "Prospective cohort, 981 adults, one urban ED, April 2004 to January 2005."},
        {"id": "nhamcs", "title": f"National Hospital Ambulatory Medical Care Survey, emergency department public-use files {out['years'][0]}–{out['years'][1]}", "publisher": "National Center for Health Statistics, CDC", "url": "https://ftp.cdc.gov/pub/Health_Statistics/NCHS/Datasets/NHAMCS/", "retrieved": today, "note": f"{out['n_adult_visits']:,} sampled adult visits pooled; estimates weighted with PATWT, variances by Taylor linearization over CSTRATM and CPSUM."},
        {"id": "nhamcs-doc", "title": "NHAMCS 2022 emergency department public-use file documentation (reason-for-visit and Multum therapeutic class codes)", "publisher": "National Center for Health Statistics, CDC", "url": "https://ftp.cdc.gov/pub/Health_Statistics/NCHS/Dataset_Documentation/NHAMCS/doc22-ed-508.pdf", "retrieved": today},
    ]
    try:
        with open(f"{SITE_DATA}/sources.json", encoding="utf-8") as f:
            sources = json.load(f)
    except FileNotFoundError:
        sources = []
    sources = [s_ for s_ in sources if s_["id"] not in {n["id"] for n in new_sources}] + new_sources
    with open(f"{SITE_DATA}/sources.json", "w", encoding="utf-8") as f:
        json.dump(sources, f, indent=1)
    with open(f"{SITE_DATA}/chapter2.json", "w", encoding="utf-8") as f:
        json.dump(out, f, indent=1, default=lambda o: float(o) if isinstance(o, (np.floating, np.integer)) else str(o))
    m = allpain["metrics"]
    h = heart["metrics"]
    print(f"heart attack n={heart['n']} (W {heart['n_women']} / M {heart['n_men']}): chest complaint W {h['chief_complaint_chest']['women']['est']} M {h['chief_complaint_chest']['men']['est']}; urgent W {h['urgent']['women']['est']} M {h['urgent']['men']['est']}; enzymes W {h['cardenz']['women']['est']} M {h['cardenz']['men']['est']}; EMS W {h['ems']['women']['est']} M {h['ems']['men']['est']}")
    print("levers:", {k: {kk: (vv["women"]["est"], vv["men"]["est"]) if vv else None for kk, vv in v.items()} for k, v in levers.items()})
    print("urgent by score:", [(b["score"], b["urgent"]["women"]["est"], b["urgent"]["men"]["est"]) for b in by_score_urgent])
    print(f"all pain visits n={allpain['n']}: opioid in ED W {m['opioid_ed']['women']['est']}% M {m['opioid_ed']['men']['est']}% (diff {m['opioid_ed']['diff']} [{m['opioid_ed']['diff_lo']}, {m['opioid_ed']['diff_hi']}]); severe-pain opioid W {m['opioid_ed_severe']['women']['est']} M {m['opioid_ed_severe']['men']['est']}; wait W {m['wait_mean']['women']['est']} M {m['wait_mean']['men']['est']}")
    print("age-adjusted opioid_ed:", allpain["age_adjusted"]["opioid_ed"])
    print("by score:", [(b["score"], b["opioid_ed"]["women"]["est"], b["opioid_ed"]["men"]["est"]) for b in by_score])


if __name__ == "__main__":
    main()
