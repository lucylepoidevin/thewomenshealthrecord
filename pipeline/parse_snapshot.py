"""Parse a Drug Trials Snapshot page (plain text) into enrollment counts by sex.

Strategy, in order:
 1. Narrative sentence: "N (x%) male patients and N (y%) female patients".
 2. Baseline-demographics tables only (not efficacy/adverse-event subgroup tables):
    find the 'Sex' block inside each demographics table region and take the
    Total column (the last "N (pct)" pair) for Male/Men and Female/Women.
    Regions that repeat the same (female, male) pair are counted once.
 3. "All patients were women/men" style statements.
 4. Percent-only tables ("Male 45% Female 55%").
"""
import re

PAIR = re.compile(r"(\d[\d,]*)\s*\(\s*([\d.]+)\s*%?\s*\)")
FEM = r"(?:Female|Females|Women|Woman|Girls)"
MAL = r"(?:Male|Males|Men|Man|Boys)"
STOP = r"(?=\b(?:Race|Age|Ethnicity|Region|Country|Weight|Body|Hispanic|White|Black|Asian|Source)\b|Table\s+\d|$)"


def _n(s):
    return int(s.replace(",", ""))


def _row_total(label, block):
    """Return (n, pct) for a labelled row inside a Sex block, using the last pair (Total column)."""
    m = re.search(r"\b" + label + r"\b\s*,?\s*(?:n\s*\(%\))?\s*((?:\s*\d[\d,]*\s*\(\s*[\d.]+\s*%?\s*\)|\s*\d[\d,]*%|\s*\d[\d,]*(?![\d.,]*\s*[(%/]))+)", block)
    if not m:
        return None
    chunk = m.group(1)
    pairs = PAIR.findall(chunk)
    if pairs:
        return _n(pairs[-1][0]), float(pairs[-1][1])
    pcts = re.findall(r"(\d[\d.]*)\s*%", chunk)
    if pcts:
        return None, float(pcts[-1])
    nums = re.findall(r"\d[\d,]*", chunk)
    if nums:
        return _n(nums[-1]), None
    return None


def demographic_regions(text):
    """Substrings of the page that are baseline-demographics tables."""
    regions = []
    for m in re.finditer(r"Table\s*\d+[.:]?\s*[^.]{0,160}?(?:Demographic|Baseline Characteristic|Patient Characteristic)[^.]{0,160}", text, re.I):
        start = m.start()
        nxt = re.search(r"Table\s*\d+[.:]|Source:|MORE INFO", text[start + 20:])
        end = start + 20 + (nxt.start() if nxt else 3000)
        regions.append(text[start:min(end, start + 4000)])
    # Pages without table captions: a 'Demographic' heading followed by Sex
    if not regions:
        for m in re.finditer(r"Demographic[^.]{0,200}?Sex", text, re.I):
            regions.append(text[m.start(): m.start() + 2500])
    return regions


def parse_sex(text):
    """Returns dict with female_n, male_n (ints) or female_pct_only, plus method; or None."""
    # 1. narrative sentence
    s = re.search(r"(\d[\d,]*)\s*\((\d+(?:\.\d+)?)%\)\s*(male|female|men|women)\s*(?:patients|participants|subjects)?\s*and\s*(\d[\d,]*)\s*\((\d+(?:\.\d+)?)%\)\s*(male|female|men|women)", text, re.I)
    if s:
        a_n, _, a_s, b_n, _, b_s = s.groups()
        d = {}
        d["f" if a_s.lower() in ("female", "women") else "m"] = _n(a_n)
        d["f" if b_s.lower() in ("female", "women") else "m"] = _n(b_n)
        if "f" in d and "m" in d:
            return {"female_n": d["f"], "male_n": d["m"], "method": "sentence"}

    # 2. demographics tables
    seen, F, M, pct_only = set(), 0, 0, []
    for reg in demographic_regions(text):
        sx = re.search(r"\bSex\b[^A-Za-z]{0,20}(.*?)" + STOP, reg, re.S)
        block = sx.group(1) if sx else None
        if not block:
            # table without an explicit 'Sex' header but with Male/Female rows
            sx = re.search(r"((?:\b" + FEM + r"\b|\b" + MAL + r"\b).{0,200})" + STOP, reg, re.S)
            block = sx.group(1) if sx else None
        if not block:
            continue
        f = _row_total(FEM, block)
        m = _row_total(MAL, block)
        if f is None and m is None:
            continue
        fn = f[0] if f else None
        mn = m[0] if m else None
        if fn is None and f and f[1] is not None and mn is not None and f[1] < 100:
            fn = round(mn * f[1] / (100 - f[1]))
        if mn is None and m and m[1] is not None and fn is not None and m[1] < 100:
            mn = round(fn * m[1] / (100 - m[1]))
        if fn is None and mn is not None and f is None:
            fn = 0
        if mn is None and fn is not None and m is None:
            mn = 0
        if fn is not None and mn is not None:
            if (fn, mn) in seen or fn + mn == 0:
                continue
            seen.add((fn, mn))
            F += fn
            M += mn
        elif f and f[1] is not None:
            pct_only.append(f[1])
    if F + M > 0:
        return {"female_n": F, "male_n": M, "method": f"tables({len(seen)})"}
    if pct_only:
        return {"female_pct_only": pct_only[0], "method": "pct"}

    # 3. single-sex statements
    if re.search(r"\bAll (?:of the )?(?:patients|participants|subjects|women)\b[^.]{0,80}\bwere (?:women|female)|\b(?:only|all) women\b|premenopausal women|postmenopausal women|pregnan", text, re.I) and not re.search(r"\bmen\b|\bmale", text[: text.find("Who participated") + 3000] if "Who participated" in text else text, re.I):
        return {"female_pct_only": 100.0, "method": "all-female"}
    if re.search(r"\bAll (?:of the )?(?:patients|participants|subjects)\b[^.]{0,80}\bwere (?:men|male)|\b(?:only|all) men\b", text, re.I):
        return {"female_pct_only": 0.0, "method": "all-male"}

    # 4. percent-only anywhere near a Sex label
    sx = re.search(r"\bSex\b[^A-Za-z]{0,20}(.{0,200})", text)
    if sx:
        f = re.search(r"\b" + FEM + r"\b\s*(\d[\d.]*)\s*%", sx.group(1))
        if f:
            return {"female_pct_only": float(f.group(1)), "method": "pct"}
    return None
