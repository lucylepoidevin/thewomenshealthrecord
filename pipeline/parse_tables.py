"""Enrollment by sex from a snapshot page's HTML tables."""
import re

from html_tables import tables

PAIR = re.compile(r"(\d[\d,]*)\s*\(\s*([\d.]+)\s*%?\s*\)")
FEM = re.compile(r"^\s*(female|females|women|woman|girls)\b", re.I)
MAL = re.compile(r"^\s*(male|males|men|man|boys)\b", re.I)
EXCLUDE = re.compile(r"efficacy|subgroup|adverse|response|endpoint|outcome|\bORR\b|hazard|\bHR\b|incidence|events|side effect|change from|percent change|by race|by age|by ethnicity|race\b.*number of patients|weight|dose", re.I)
INCLUDE = re.compile(r"demograph|baseline|characteristic|who participated|patients in the trial|participants", re.I)


def _last_value(cells):
    """Total column = last cell with a number. Returns (n, pct) with None where absent."""
    for c in reversed(cells):
        pairs = PAIR.findall(c)
        if pairs:
            return int(pairs[-1][0].replace(",", "")), float(pairs[-1][1])
        m = re.search(r"(\d[\d.]*)\s*%", c)
        if m:
            return None, float(m.group(1))
        m = re.search(r"\b(\d[\d,]*)\b", c)
        if m and not re.search(r"[A-Za-z]", c):
            return int(m.group(1).replace(",", "")), None
    return None


def _rows_by_sex(rows):
    """Yield (sex, cells-after-label) handling one-label-per-row, a leading 'Sex'
    or empty cell, and multi-line label cells ('Men\\nWomen' | '78 (46.4)\\n90 (53.6)')."""
    for r in rows:
        if not r:
            continue
        label_lines = [l.strip() for l in r[0].split("\n") if l.strip()]
        sex_lines = [l for l in label_lines if FEM.match(l) or MAL.match(l)]
        if len(sex_lines) >= 2:
            # transposed layout: values for each label are stacked in the other cells
            cols = []
            for c in r[1:]:
                parts = [l.strip() for l in c.split("\n") if l.strip()]
                if len(parts) < len(sex_lines):
                    parts = [p.strip() for p in re.findall(r"\d[\d,]*\s*\([^)]*\)|\d[\d.]*\s*%|\d[\d,]*", c)]
                cols.append(parts)
            for i, l in enumerate(sex_lines):
                sex = "f" if FEM.match(l) else "m"
                yield sex, [c[i] for c in cols if i < len(c)]
            continue
        idx = 0
        if (not r[0].strip() or re.match(r"^\s*(sex|gender)\b", r[0], re.I)) and len(r) > 1:
            idx = 1
        lab = r[idx]
        sex = "f" if FEM.match(lab) else "m" if MAL.match(lab) else None
        if sex:
            yield sex, r[idx + 1:]


def _header_counts(rows):
    """Fallback: column headers like 'Women N=68' / 'Men N=89' (safety-population tables)."""
    fn = mn = None
    for r in rows[:3]:
        for c in r:
            m = re.search(r"\b(women|female|females|men|male|males)\b[^0-9]{0,40}?N\s*=\s*(\d[\d,]*)", c, re.I)
            if m:
                n = int(m.group(2).replace(",", ""))
                if m.group(1).lower() in ("women", "female", "females"):
                    fn = n if fn is None else fn
                else:
                    mn = n if mn is None else mn
    return fn, mn


def parse_html_tables(html):
    """Returns {'female_n','male_n','method'} or {'female_pct_only',..} or None."""
    seen, F, M, pcts = set(), 0, 0, []
    for t in tables(html):
        head = " ".join(" ".join(r) for r in t["rows"][:2])
        ctx = t["before"] + " " + head
        if EXCLUDE.search(ctx) and not re.search(r"demograph|baseline", ctx, re.I):
            continue
        if re.search(r"efficacy analys|subgroup analys|adverse|response rate|by subgroup|endpoint", ctx, re.I):
            continue
        fn = mn = fp = mp = None
        got = False
        for sex, cells in _rows_by_sex(t["rows"]):
            v = _last_value(cells)
            if v is None:
                continue
            got = True
            if sex == "f":
                fn, fp = v
            else:
                mn, mp = v
        if not got:
            continue
        if fn is None and fp is not None and mn is not None and fp < 100:
            fn = round(mn * fp / (100 - fp))
        if mn is None and mp is not None and fn is not None and mp < 100:
            mn = round(fn * mp / (100 - mp))
        if fn is None and mn is not None and fp is None:
            fn = 0
        if mn is None and fn is not None and mp is None:
            mn = 0
        if fn is not None and mn is not None and fn + mn > 0:
            if (fn, mn) not in seen:
                seen.add((fn, mn))
                F += fn
                M += mn
        elif fp is not None:
            pcts.append(fp)
    if F + M > 0:
        return {"female_n": F, "male_n": M, "method": f"html({len(seen)})"}
    if pcts:
        return {"female_pct_only": pcts[0], "method": "html-pct"}
    for t in tables(html):
        fn, mn = _header_counts(t["rows"])
        if fn is not None and mn is not None and fn + mn > 0:
            return {"female_n": fn, "male_n": mn, "method": "html-header"}
    return None
