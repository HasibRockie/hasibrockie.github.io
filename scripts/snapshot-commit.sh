#!/bin/sh
# Commits the snapshot files only if they changed. Also makes one tiny heartbeat commit when the repo has been quiet for 45+ days,
# because GitHub disables scheduled workflows after about 60 days without repository activity.
set -eu
FILES="data.json posts.json posts-index.json site-settings.json sitemap.xml"
git config user.name  "github-actions[bot]"
git config user.email "41898282+github-actions[bot]@users.noreply.github.com"
for f in $FILES; do [ -f "$f" ] && git add -f "$f"; done
push() { git push || { git pull --rebase --autostash && git push; }; }
if git diff --cached --quiet; then
  last=$(git log -1 --format=%ct); now=$(date +%s); age=$(( (now - last) / 86400 ))
  if [ "$age" -ge 45 ]; then
    date -u +%F > .snapshot-heartbeat; git add -f .snapshot-heartbeat
    git commit -q -m "chore: heartbeat (keeps the scheduled workflow active)"; push; echo "heartbeat committed (repo quiet for ${age} days)"
  else echo "No changes (last commit ${age} days ago)."; fi
else
  git commit -q -m "chore: content snapshot $(date -u +%F)"; push; echo "Snapshot committed."
fi
