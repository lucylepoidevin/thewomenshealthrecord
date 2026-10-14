# Compare the before/after snapshots: numbers (as multisets) and citation ids must be identical per file.
import json, sys, collections
a = json.load(open(sys.argv[1])); b = json.load(open(sys.argv[2]))
bad = 0
for f in a:
    if f not in b: print("MISSING FILE", f); bad += 1; continue
    ca, cb = collections.Counter(a[f]['nums']), collections.Counter(b[f]['nums'])
    if ca != cb:
        gone = list((ca - cb).elements()); new = list((cb - ca).elements())
        print(f"NUMBERS {f}: removed {gone[:12]} added {new[:12]}"); bad += 1
    if a[f]['cites'] != b[f]['cites']:
        print(f"CITES {f}: {collections.Counter(a[f]['cites']) - collections.Counter(b[f]['cites'])} / {collections.Counter(b[f]['cites']) - collections.Counter(a[f]['cites'])}"); bad += 1
    if a[f]['jsx_tags'] != b[f]['jsx_tags']:
        print(f"JSX TAG COUNT {f}: {a[f]['jsx_tags']} -> {b[f]['jsx_tags']}"); bad += 1
print("files with differences:", bad)
