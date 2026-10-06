"""Enrollment by sex from a snapshot page's HTML tables."""
import re

from html_tables import tables

PAIR = re.compile(r"(\d[\d,]*)\s*\(\s*([\d.]+)\s*%?\s*\)")
FEM = re.compile(r"^\s*(female|females|women|woman|girls)\b", re.I)
MAL = re.compile(r"^\s*(male|males|men|man|boys)\b", re.I)
EXCLUDE = re.compile(r"efficacy|subgroup|adverse|response|endpoint|outcome|\bORR\b|hazard|\bHR\b|incidence|events|side effect|change from|percent change|by race|by age|by ethnicity|race\b.*number of patients|weight|dose|mortality|survival|death|cure|remission|responders", re.I)
INCLUDE = re.compile(r"demograph|baseline|characteristic|who participated|patients in the trial|participants", re.I)


def _pairs_in(cells):
    """All (n, pct) values found across cells, in column order."""
    out = []
    for c in cells:
        for n, pct in PAIR.findall(c):
            out.append((int(n.replace(",", "")), float(pct)))
    return out


def _row_value(cells, has_total_col):
    """Return (n, pct) for a labelled Sex row.
    Columns are usually per-arm with a Total column last; if there is no Total
    column the arms are summed. Bare-number rows ('2822', '45') are read as
    count then percent, taking the largest number as the count."""
    if any("/" in c for c in cells):
        return None  # n/N (%) outcome rows are not enrollment
    pairs = _pairs_in(cells)
    if pairs:
        # a bare-number Total cell after the arm pairs, e.g. '90 (55%)', '73 (45%)', '163'
        tail = [c for c in cells if c.strip() and not PAIR.search(c) and not re.search(r"[A-Za-z%]", c)]
        if tail:
            m = re.search(r"\d[\d,]*", tail[-1])
            if m and int(m.group().replace(",", "")) >= max(n for n, _ in pairs):
                return (int(m.group().replace(",", "")), None)
        if len(pairs) == 1:
            return pairs[0]
        last = pairs[-1]
        rest = sum(n for n, _ in pairs[:-1])
        if has_total_col or abs(last[0] - rest) <= 1:
            return last
        return (sum(n for n, _ in pairs), None)
    nums = []
    pct = None
    for c in cells:
        if re.search(r"[A-Za-z]", c):
            continue
        m = re.search(r"(\d[\d.]*)\s*%", c)
        if m:
            pct = float(m.group(1))
            continue
        for tok in re.findall(r"\d[\d,]*(?:\.\d+)?", c):
            nums.append(float(tok.replace(",", "")))
    if nums:
        n = max(nums)
        if n == int(n):
            return int(n), pct
        return None, n if n <= 100 else None
    if pct is not None:
        return None, pct
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


def _norm_caption(ctx):
    """Caption with table numbers and population qualifiers removed, to spot the
    same trial reported for two populations (safety vs efficacy)."""
    parts = re.split(r"table\s*\d+\s*[.:]?", ctx, flags=re.I)
    c = parts[-1] if len(parts) > 1 else ctx
    c = re.sub(r"\(?(safety|efficacy|full analysis|intent[- ]to[- ]treat|itt|mitt|fas|rs|pooled|all)\s*(population|set|analysis set)?\)?", " ", c, flags=re.I)
    c = re.sub(r"[^a-z]+", " ", c.lower()).strip()
    return c[-80:]


def parse_html_tables(html):
    """Returns {'female_n','male_n','method'} or {'female_pct_only',..} or None."""
    found = []  # (caption_norm, fn, mn, fp)
    for t in tables(html):
        head = " ".join(" ".join(r) for r in t["rows"][:2])
        ctx = t["before"][-160:] + " " + head
        if EXCLUDE.search(ctx) and not re.search(r"demograph|baseline", ctx, re.I):
            continue
        if re.search(r"efficacy analys|subgroup analys|adverse|response rate|by subgroup|endpoint|responders", ctx, re.I):
            continue
        has_total = bool(re.search(r"\b(total|overall|all patients|all participants|pooled|combined)\b", head, re.I))
        fn = mn = fp = mp = None
        got = False
        for sex, cells in _rows_by_sex(t["rows"]):
            v = _row_value(cells, has_total)
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
        found.append((_norm_caption(t["before"][-160:]), fn, mn, fp))

    # same trial reported for several populations -> keep the largest; distinct trials -> sum
    groups = {}
    for cap, fn, mn, fp in found:
        if fn is None or mn is None or fn + mn == 0:
            continue
        g = groups.setdefault(cap, [])
        if (fn, mn) not in g:
            g.append((fn, mn))
    F = M = 0
    for g in groups.values():
        fn, mn = max(g, key=lambda x: x[0] + x[1])
        F += fn
        M += mn
    if F + M > 0:
        return {"female_n": F, "male_n": M, "method": f"html({len(groups)})"}
    pcts = [fp for _, _, _, fp in found if fp is not None]
    if pcts:
        return {"female_pct_only": pcts[0], "method": "html-pct"}
    for t in tables(html):
        fn, mn = _header_counts(t["rows"])
        if fn is not None and mn is not None and fn + mn > 0:
            return {"female_n": fn, "male_n": mn, "method": "html-header"}
    return None
