#!/usr/bin/env bash
set -euo pipefail

if [ "${EAS_BUILD_PLATFORM:-}" = "android" ]; then
  EXPO_ANDROID_NO_NATIVE_MAPBOX=1 npx expo prebuild --platform android --clean --no-install
else
  npx expo prebuild --platform ios --clean --no-install
fi
