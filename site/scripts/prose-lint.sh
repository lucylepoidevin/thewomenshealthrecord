#!/bin/sh
# Register lint: second-person address, rhetorical questions and a few idioms in displayed prose.
cd "$(dirname "$0")/.." || exit 1
echo "--- 'you' outside interactive instructions (review by hand)"
grep -rnoE "[^A-Za-z](you|your|yours|yourself)[^A-Za-z][^<{]{0,60}" src --include="*.tsx" | grep -viE "click|hover|select|paste|pick|drag|press|choose|tap|try|scroll|type" | cut -c1-140 | head -60
echo "--- question marks in prose"
grep -rnoE "[^<{\"']{20,}\?\s*(<|$)" src --include="*.tsx" | cut -c1-140 | head -20
echo "--- idioms"
grep -rnoiE "[^<]{0,40}(one-off|a flag, not a verdict|hold .{0,20} in your head|the fine print|levers?|ledger|in one frame|white on white|poke at|nobody|anyone could)[^<]{0,40}" src --include="*.tsx" | cut -c1-140 | head -20
