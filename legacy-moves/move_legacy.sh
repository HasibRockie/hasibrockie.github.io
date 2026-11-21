#!/bin/sh
# Run from the ROOT of your hasibrockie.github.io clone, AFTER copying the new files over it. Nothing is deleted from your history.
set -e
mkdir -p legacy
# originals (public content only) kept as backup
for f in data.json posts.json; do [ -f "$f" ] && cp -n "$f" "legacy/$f"; done
# stray / old files: moved, not deleted
[ -f robot.txt ] && git mv -k robot.txt legacy/robot.txt
[ -d data ]      && git mv -k data legacy/data-old
[ -d memory ]    && git mv -k memory legacy/memory-old
[ -f assets/js/site.js ] && git mv -k assets/js/site.js legacy/site.js.old
# PRIVATE: moments.json must NOT stay in a public repo. Keep a copy OFFLINE, then remove it from the working tree.
if [ -f moments.json ]; then
  cp moments.json "../moments.json.private-backup" && echo "Copied moments.json to ../moments.json.private-backup (keep it somewhere private)."
  git rm -q --cached moments.json 2>/dev/null || true; rm -f moments.json
fi
echo "Done. Review with: git status"
