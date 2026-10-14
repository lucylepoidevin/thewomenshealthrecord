# Snapshot every number literal and citation id in the prose files so an editing pass can be verified.
import re, glob, json, sys
files = sorted(glob.glob('src/**/*.tsx', recursive=True)) + ['src/lib/chapters.ts', 'src/experiments/list.ts']
out = {}
for f in files:
    s = open(f).read()
    nums = re.findall(r'(?<![A-Za-z_\-#/\.\w])\d[\d,\.]*%?', s)
    cites = re.findall(r'<(?:Cite|C|Src)\b[^>]*\bid=["\']([^"\']+)["\']', s)
    out[f] = {'nums': sorted(nums), 'cites': sorted(cites), 'jsx_tags': len(re.findall(r'<[A-Za-z]', s))}
json.dump(out, open(sys.argv[1], 'w'))
print(len(files), 'files snapshotted')
