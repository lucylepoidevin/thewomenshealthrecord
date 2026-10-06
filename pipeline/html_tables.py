"""Extract <table>s from HTML as lists of rows of cell strings, with the text
immediately preceding each table (caption / heading) for context."""
import html as htmllib
import re
from html.parser import HTMLParser


class _TP(HTMLParser):
    def __init__(self):
        super().__init__()
        self.tables, self._stack, self._cell, self._row = [], [], None, None
        self._text_before, self._buf = [], []

    def handle_starttag(self, tag, attrs):
        if tag == "table":
            self._stack.append({"before": "".join(self._buf)[-400:], "rows": []})
            self._buf = []
        elif tag == "tr" and self._stack:
            self._row = []
        elif tag in ("td", "th") and self._stack:
            self._cell = []
        elif tag == "br" and self._cell is not None:
            self._cell.append("\n")
        elif tag in ("script", "style"):
            self._skip = True

    def handle_endtag(self, tag):
        if tag in ("td", "th") and self._cell is not None and self._row is not None:
            self._row.append(re.sub(r"[ \t\r]+", " ", "".join(self._cell)).strip())
            self._cell = None
        elif tag == "tr" and self._row is not None and self._stack:
            if any(c for c in self._row):
                self._stack[-1]["rows"].append(self._row)
            self._row = None
        elif tag == "table" and self._stack:
            self.tables.append(self._stack.pop())
        elif tag in ("script", "style"):
            self._skip = False

    _skip = False

    def handle_data(self, data):
        if self._skip:
            return
        if self._cell is not None:
            self._cell.append(data)
        elif not self._stack:
            self._buf.append(data)
            if len(self._buf) > 200:
                self._buf = ["".join(self._buf)[-800:]]


def tables(html):
    p = _TP()
    p.feed(html)
    out = []
    for t in p.tables:
        before = htmllib.unescape(re.sub(r"\s+", " ", t["before"])).strip()
        rows = [[htmllib.unescape(c) for c in r] for r in t["rows"]]
        out.append({"before": before, "rows": rows})
    return out
