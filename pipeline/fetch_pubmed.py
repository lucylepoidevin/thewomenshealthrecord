"""Chapter 6: how often animal and human studies include females, by year and field.

PubMed E-utilities esearch counts (MeSH-indexed records). For each year we count
rodent studies indexed Male-only, Female-only, both, or neither, overall and in
seven fields, plus the NIH-funded subset. Writes cache/ch6/pubmed_counts.json.
"""
import json
import os
import time

import requests

from common import CACHE, UA

CH6 = f"{CACHE}/ch6"
os.makedirs(CH6, exist_ok=True)
PATH = f"{CH6}/pubmed_counts.json"
BASE = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi"
YEARS = list(range(1996, 2026))
RODENT = "(mice[MeSH] OR rats[MeSH])"
SEX = {
    "male_only": "male[MeSH] NOT female[MeSH]",
    "female_only": "female[MeSH] NOT male[MeSH]",
    "both": "male[MeSH] AND female[MeSH]",
    "any": "(male[MeSH] OR female[MeSH])",
    "all": "",
}
FIELDS = {
    "All rodent studies": "",
    "Neuroscience": "(neurosciences[MeSH] OR brain[MeSH] OR neurons[MeSH] OR nervous system diseases[MeSH])",
    "Pain": "(pain[MeSH] OR nociception[MeSH] OR hyperalgesia[MeSH] OR analgesics[MeSH])",
    "Cardiovascular": "(cardiovascular diseases[MeSH] OR cardiovascular system[MeSH])",
    "Immunology": "(immune system diseases[MeSH] OR immunity[MeSH] OR inflammation[MeSH])",
    "Pharmacology": "(pharmacokinetics[MeSH] OR drug evaluation, preclinical[MeSH] OR dose-response relationship, drug[MeSH])",
    "Metabolism and endocrine": "(metabolic diseases[MeSH] OR endocrine system diseases[MeSH] OR obesity[MeSH] OR diabetes mellitus[MeSH])",
    "Behaviour and psychiatry": "(behavior, animal[MeSH] OR mental disorders[MeSH] OR stress, psychological[MeSH])",
    "Reproduction and urogenital": "(reproduction[MeSH] OR urogenital system[MeSH] OR genital diseases[MeSH])",
}
HUMAN = {
    "Clinical trials (humans)": '"clinical trial"[pt] AND humans[MeSH]',
    "Randomised trials (humans)": '"randomized controlled trial"[pt] AND humans[MeSH]',
}


def count(term, cache):
    if term in cache:
        return cache[term]
    for attempt in range(6):
        try:
            r = requests.get(BASE, params={"db": "pubmed", "term": term, "rettype": "count", "retmode": "json", "tool": "womenshealthrecord", "email": "lucy.lepoidevin2@gmail.com"}, headers=UA, timeout=60)
            if r.status_code == 429:
                time.sleep(5); continue
            v = int(r.json()["esearchresult"]["count"])
            cache[term] = v
            time.sleep(0.4)
            return v
        except Exception as e:  # noqa: BLE001
            print("  retry", e); time.sleep(5 * (attempt + 1))
    raise SystemExit("pubmed gave up")


def main():
    cache = json.load(open(PATH)) if os.path.exists(PATH) else {}
    n0 = len(cache)
    for y in YEARS:
        for fname, fq in FIELDS.items():
            for sname, sq in SEX.items():
                parts = [RODENT, f"{y}[dp]"] + ([fq] if fq else []) + ([sq] if sq else [])
                count(" AND ".join(parts), cache)
            if fname == "All rodent studies":  # NIH-funded subset
                for sname, sq in SEX.items():
                    parts = [RODENT, f"{y}[dp]", '"NIH HHS"[gr]'] + ([sq] if sq else [])
                    count(" AND ".join(parts), cache)
        for hname, hq in HUMAN.items():
            for sname, sq in SEX.items():
                parts = [hq, f"{y}[dp]"] + ([sq] if sq else [])
                count(" AND ".join(parts), cache)
        json.dump(cache, open(PATH, "w"))
        print(f"  {y}: {len(cache) - n0} new queries so far")
    json.dump(cache, open(PATH, "w"))
    print("done", len(cache), "queries cached")


if __name__ == "__main__":
    main()
