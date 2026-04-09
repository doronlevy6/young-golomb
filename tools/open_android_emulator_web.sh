#!/usr/bin/env bash
set -euo pipefail

URL="${1:-http://10.0.2.2:4173}"
SDK_ROOT="${ANDROID_SDK_ROOT:-$HOME/Library/Android/sdk}"
ADB_BIN="$SDK_ROOT/platform-tools/adb"
EMULATOR_BIN="$SDK_ROOT/emulator/emulator"

if [ ! -x "$ADB_BIN" ]; then
  echo "adb לא נמצא: $ADB_BIN"
  echo "בדוק התקנת Android SDK."
  exit 1
fi

if [ ! -x "$EMULATOR_BIN" ]; then
  echo "emulator לא נמצא: $EMULATOR_BIN"
  echo "בדוק התקנת Android SDK Emulator."
  exit 1
fi

device_count="$("$ADB_BIN" devices | awk 'NR>1 && $2=="device" { c++ } END { print c+0 }')"

if [ "$device_count" -eq 0 ]; then
  avd_name="$("$EMULATOR_BIN" -list-avds | head -n 1)"
  if [ -z "$avd_name" ]; then
    echo "לא נמצא AVD. צור מכשיר ב-Android Studio > Device Manager."
    exit 1
  fi

  "$EMULATOR_BIN" -avd "$avd_name" >/tmp/torah-android-emulator.log 2>&1 &
fi

"$ADB_BIN" wait-for-device >/dev/null 2>&1

for _ in $(seq 1 180); do
  booted="$("$ADB_BIN" shell getprop sys.boot_completed 2>/dev/null | tr -d '\r')"
  if [ "$booted" = "1" ]; then
    break
  fi
  sleep 1
done

"$ADB_BIN" shell am start -a android.intent.action.VIEW -d "$URL" >/dev/null 2>&1 || true

echo "Opened in Android Emulator: $URL"
