"""Shared helpers: cached HTTP fetching and HTML-to-text."""
import hashlib
import html as htmllib
import json
import os
import re
import time

import requests

HERE = os.path.dirname(os.path.abspath(__file__))
CACHE = os.path.join(HERE, "cache")
OUT = os.path.join(HERE, "out")
SITE_DATA = os.path.join(HERE, "..", "site", "public", "data")
os.makedirs(CACHE, exist_ok=True)
os.makedirs(OUT, exist_ok=True)
os.makedirs(SITE_DATA, exist_ok=True)

UA = {"User-Agent": "Mozilla/5.0 (TheWomensHealthRecord research pipeline; contact via site)"}


def fetch(url, params=None, retries=3, sleep=1.0, as_json=False):
    """GET with on-disk cache. Returns text (or parsed JSON)."""
    key = hashlib.sha1((url + json.dumps(params or {}, sort_keys=True)).encode()).hexdigest()
    path = os.path.join(CACHE, key + (".json" if as_json else ".html"))
    if os.path.exists(path):
        with open(path, encoding="utf-8") as f:
            return json.load(f) if as_json else f.read()
    if os.environ.get("CACHE_ONLY"):
        return None
    last = None
    for attempt in range(retries):
        try:
            r = requests.get(url, params=params, headers=UA, timeout=60)
            if r.status_code == 404:
                return None
            if r.status_code == 429:
                time.sleep(10 * (attempt + 1))
                continue
            r.raise_for_status()
            body = r.json() if as_json else r.text
            with open(path, "w", encoding="utf-8") as f:
                if as_json:
                    json.dump(body, f)
                else:
                    f.write(body)
            time.sleep(sleep)
            return body
        except requests.RequestException as e:  # noqa: PERF203
            last = e
            time.sleep(45 * (attempt + 1))  # Wayback blocks bursts; back off hard
    print(f"  !! failed {url}: {last}")
    return None


def html_to_text(s):
    t = re.sub(r"<script.*?</script>|<style.*?</style>", " ", s, flags=re.S)
    t = re.sub(r"<[^>]+>", " ", t)
    t = htmllib.unescape(t)
    return re.sub(r"\s+", " ", t).strip()
