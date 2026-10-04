#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

DEFAULT_MESSAGE="Deploy $(date '+%Y-%m-%d %H:%M:%S %Z')"
MESSAGE="${1:-$DEFAULT_MESSAGE}"
ASSET_VERSION="$(date '+%Y%m%d%H%M%S')"
PAGES_URL="https://doronlevy6.github.io/young-golomb/"

node --check app.js
bash -n "$0"

python3 - "$ASSET_VERSION" <<'PY'
from pathlib import Path
import re
import sys

asset_version = sys.argv[1]
path = Path("index.html")
text = path.read_text()
text = re.sub(r'(app\.js\?v=)[^"\']+', rf'\g<1>{asset_version}', text)
text = re.sub(r'(directory\.js\?v=)[^"\']+', rf'\g<1>{asset_version}', text)
text = re.sub(r'(styles\.css\?v=)[^"\']+', rf'\g<1>{asset_version}', text)
path.write_text(text)
PY

grep -q "styles.css?v=$ASSET_VERSION" index.html
grep -q "app.js?v=$ASSET_VERSION" index.html
if grep -q '\${1}' index.html; then
  echo "Invalid asset path found in index.html" >&2
  exit 1
fi

git add -A

if git diff --cached --quiet; then
  echo "No new changes to commit. Pushing current HEAD to origin/main..."
else
  git commit -m "$MESSAGE"
fi

git push origin HEAD:main

echo "Waiting for GitHub Pages to serve asset version $ASSET_VERSION..."
for attempt in $(seq 1 18); do
  if curl -fsSL "${PAGES_URL}index.html?deploy_check=${ASSET_VERSION}_${attempt}" | grep -q "app.js?v=$ASSET_VERSION"; then
    echo "GitHub Pages is serving version $ASSET_VERSION"
    exit 0
  fi
  sleep 5
done

echo "GitHub Pages did not serve version $ASSET_VERSION within the wait window." >&2
exit 1
