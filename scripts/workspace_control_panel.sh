#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo
echo "Torah Scroll Navigator"
echo "1) Local preview"
echo "2) Deploy to GitHub Pages"
echo "3) Cancel"
echo
read -r -p "Choose an option [1-3]: " choice

case "$choice" in
  1)
    exec npm run local
    ;;
  2)
    exec npm run deploy
    ;;
  *)
    echo "Cancelled."
    ;;
esac
