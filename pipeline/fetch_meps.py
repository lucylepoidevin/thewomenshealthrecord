"""Prescription users by sex from MEPS (Medical Expenditure Panel Survey), AHRQ.

Pools the 2018-2024 Prescribed Medicines files (one row per fill) joined to the
Full Year Consolidated files (person sex, survey weight). For each snapshot
drug, counts the persons with at least one fill, by sex, matching the fill's
reported name the same way the FAERS query did: brand name (RXNAME) for drugs
queried by brand, generic ingredient (RXDRGNAM) for drugs queried by generic.
Writes pipeline/out/meps_users.csv. Files: meps.ahrq.gov, public use.
"""
import csv
import os
import re

import pandas as pd

from common import OUT, CACHE

YEARS = {2018: ("h206a", "h209", "PERWT18F"), 2019: ("h213a", "h216", "PERWT19F"), 2020: ("h220a", "h224", "PERWT20F"),
         2021: ("h229a", "h233", "PERWT21F"), 2022: ("h239a", "h243", "PERWT22F"), 2023: ("h248a", "h251", "PERWT23F"),
         2024: ("h254a", "h256", "PERWT24F")}
MIN_PERSONS = 30  # unweighted person-years needed to publish a sex share
MEPS = os.path.join(CACHE, "meps")
SALTS = r"\b(tartrate|chloride|hydrochloride|sodium|sulfate|acetate|mesylate|maleate|fumarate|citrate|phosphate|succinate|besylate|dihydrochloride|injection|tablets?)\b"


def load_year(year):
    rxf, fyf, wt = YEARS[year]
    rx = pd.read_stata(os.path.join(MEPS, rxf + ".dta"), convert_categoricals=False, columns=["DUPERSID", "RXNAME", "RXDRGNAM"])
    fy = pd.read_stata(os.path.join(MEPS, fyf + ".dta"), convert_categoricals=False, columns=["DUPERSID", "SEX", wt])
    fy = fy.rename(columns={wt: "WT"})
    df = rx.merge(fy, on="DUPERSID", how="inner")
    df["YEAR"] = year
    df["RXNAME"] = df["RXNAME"].fillna("").str.upper()
    df["RXDRGNAM"] = df["RXDRGNAM"].fillna("").str.upper()
    return df


def brand_token(brand):
    b = re.sub(r"\s*\(.*?\)", "", brand or "").upper().strip()
    return b.split("/")[0].split()[0] if b else ""


def generic_token(generic):
    g = re.split(r"[,;]| AND ", (generic or "").upper())[0]
    g = re.sub(SALTS, "", g, flags=re.I).strip()
    g = re.sub(r"[-/]", " ", g)
    words = g.split()
    if not words:
        return ""
    if words[0] == "INSULIN" and len(words) > 1:
        return " ".join(words[:2])
    return words[0]


def name_regex(tok):
    """Word-bounded match; separators in the token match '-', '/' or a space."""
    return r"\b" + r"[-/ ]".join(re.escape(w) for w in tok.split()) + r"\b"


def single_brand_molecule(df, gen_tok, brand_tok):
    """True when every fill of this molecule is recorded under this brand or the
    generic name itself, so the generic rows can be counted for the brand."""
    names = df.loc[df["RXDRGNAM"].str.contains(name_regex(gen_tok), regex=True), "RXNAME"].unique()
    for n in names:
        if brand_tok and re.search(name_regex(brand_tok), n):
            continue
        if re.search(name_regex(gen_tok), n):
            continue
        return False
    return True


def users_by_sex(df, mask):
    sub = df[mask]
    if sub.empty:
        return 0, 0, 0.0, 0.0
    persons = sub.drop_duplicates(["YEAR", "DUPERSID"])
    f = persons[persons["SEX"] == 2]
    m = persons[persons["SEX"] == 1]
    return len(f), len(m), float(f["WT"].sum()), float(m["WT"].sum())


def main():
    df = pd.concat([load_year(y) for y in YEARS], ignore_index=True)
    print(f"MEPS fills pooled {min(YEARS)}-{max(YEARS)}: {len(df):,} rows, {df.drop_duplicates(['YEAR','DUPERSID']).shape[0]:,} person-years")
    with open(f"{OUT}/snapshots_raw.csv", encoding="utf-8") as f:
        snaps = list(csv.DictReader(f))
    with open(f"{OUT}/faers_raw.csv", encoding="utf-8") as f:
        how = {r["slug"]: r["query"] for r in csv.DictReader(f)}
    rows = []
    for r in snaps + [{"slug": "zolpidem", "brand": "", "generic": "zolpidem"}]:
        q = how.get(r["slug"]) or ("generic" if r["slug"] == "zolpidem" else "brand")
        gen = generic_token(r.get("generic"))
        br = brand_token(r.get("brand")) or (re.search(r"snapshots?-(?:drug-)?([a-z0-9]+)", r["slug"]) or [None, ""])[1].upper()
        if br == "INSULIN":
            br = ""
        if q == "generic":
            tok, mask = gen, (df["RXDRGNAM"].str.contains(name_regex(gen), regex=True) if len(gen) >= 3 else None)
        else:
            if len(br) < 3:
                continue
            mask = df["RXNAME"].str.contains(name_regex(br), regex=True)
            tok = br
            if len(gen) >= 4 and mask.any() and single_brand_molecule(df, gen, br):  # generic rows only extend a brand already seen
                mask = mask | df["RXDRGNAM"].str.contains(name_regex(gen), regex=True)
                tok = f"{br}|{gen}"
                q = "brand+generic"
        if mask is None:
            continue
        fn, mn, fw, mw = users_by_sex(df, mask)
        if fn + mn == 0:
            continue
        rows.append({"slug": r["slug"], "match": q, "token": tok, "female_n": fn, "male_n": mn,
                     "female_w": round(fw), "male_w": round(mw),
                     "female_pct_w": round(fw / (fw + mw) * 100, 1) if fw + mw else None})
    with open(f"{OUT}/meps_users.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=["slug", "match", "token", "female_n", "male_n", "female_w", "male_w", "female_pct_w"])
        w.writeheader()
        w.writerows(rows)
    big = [x for x in rows if x["female_n"] + x["male_n"] >= MIN_PERSONS]
    print(f"drugs with any MEPS users: {len(rows)}; with >={MIN_PERSONS} person-years: {len(big)}")
    for x in sorted(big, key=lambda x: -(x["female_n"] + x["male_n"]))[:12]:
        print(f"  {x['token']:14} n={x['female_n']+x['male_n']:5}  women {x['female_pct_w']}%")


if __name__ == "__main__":
    main()
