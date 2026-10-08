# Data pipeline

Three scripts, run in order from this folder with the virtualenv active:

```bash
python -m venv .venv && .venv/bin/pip install -r requirements.txt
.venv/bin/python fetch_snapshots.py   # FDA Drug Trials Snapshots -> out/snapshots_raw.csv
.venv/bin/python fetch_faers.py       # openFDA FAERS counts by sex -> out/faers_raw.csv
.venv/bin/python build_chapter1.py    # -> ../site/public/data/chapter1.json + sources.json
```

Later chapters, each writing its own `../site/public/data/chapterN.json` and merging its sources:

```bash
.venv/bin/python build_chapter2.py; .venv/bin/python models_chapter2.py   # NHAMCS ED files in cache/nhamcs/
.venv/bin/python build_chapter3.py; .venv/bin/python sensitivity_chapter3.py  # NIH RCDC + WHO GHE in cache/ch3/
.venv/bin/python fetch_trials.py;   .venv/bin/python build_chapter4.py    # ClinicalTrials.gov v2 (76 pages cached in cache/ch4/pages/)
.venv/bin/python build_chapter5.py                                        # NHAMCS again: symptom codes, anxiety codes, 72-hour returns
.venv/bin/python fetch_pubmed.py;   .venv/bin/python fetch_labels.py; .venv/bin/python build_chapter6.py  # PubMed counts + openFDA labels
.venv/bin/python build_record.py;   .venv/bin/python export_data.py       # cross-chapter record page and open-data CSVs
```

All HTTP responses are cached in `cache/` (git-ignored). Delete it to refresh.
Set `OPENFDA_API_KEY` (free from open.fda.gov) if you hit the 1,000 requests/day limit.
Thresholds (`GAP`, `MIN_REPORTS`) live at the top of `build_chapter1.py` and are mirrored in `site/src/chapters/Chapter1.tsx`.
