# Data pipeline

Three scripts, run in order from this folder with the virtualenv active:

```bash
python -m venv .venv && .venv/bin/pip install -r requirements.txt
.venv/bin/python fetch_snapshots.py   # FDA Drug Trials Snapshots -> out/snapshots_raw.csv
.venv/bin/python fetch_faers.py       # openFDA FAERS counts by sex -> out/faers_raw.csv
.venv/bin/python build_chapter1.py    # -> ../site/public/data/chapter1.json + sources.json
```

All HTTP responses are cached in `cache/` (git-ignored). Delete it to refresh.
Set `OPENFDA_API_KEY` (free from open.fda.gov) if you hit the 1,000 requests/day limit.
Thresholds (`GAP`, `MIN_REPORTS`) live at the top of `build_chapter1.py` and are mirrored in `site/src/chapters/Chapter1.tsx`.
