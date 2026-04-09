#!/usr/bin/env bash
set -euo pipefail

URL="${1:-http://127.0.0.1:4173}"
DEV_DIR="/Applications/Xcode.app/Contents/Developer"

xrun() {
  if [ -d "$DEV_DIR" ]; then
    DEVELOPER_DIR="$DEV_DIR" xcrun "$@"
  else
    xcrun "$@"
  fi
}

if ! command -v xcrun >/dev/null 2>&1; then
  echo "xcrun לא נמצא. התקן Xcode."
  exit 1
fi

open -a Simulator >/dev/null 2>&1 || true

booted_udid="$(xrun simctl list devices available | awk '/iPhone/ && /Booted/ { if (match($0, /\(([0-9A-F-]+)\)/, a)) { print a[1]; exit } }')"

if [ -z "$booted_udid" ]; then
  target_udid="$(xrun simctl list devices available | awk '/iPhone/ && /Shutdown/ { if (match($0, /\(([0-9A-F-]+)\)/, a)) { print a[1]; exit } }')"

  if [ -z "$target_udid" ]; then
    echo "לא נמצא מכשיר iPhone זמין ב-Simulator."
    echo "פתח Xcode > Settings > Platforms והתקן iOS Simulator runtime."
    exit 1
  fi

  xrun simctl boot "$target_udid" >/dev/null 2>&1 || true
fi

xrun simctl bootstatus booted -b >/dev/null 2>&1 || true
xrun simctl openurl booted "$URL"

echo "Opened in iPhone Simulator: $URL"
