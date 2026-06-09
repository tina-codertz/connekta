#!/usr/bin/env bash
set -euo pipefail

if [ -d node_modules/hermes-compiler/hermesc ]; then
  find node_modules/hermes-compiler/hermesc -name hermesc -type f -exec chmod +x {} + 2>/dev/null || true
fi

if [ -d node_modules/react-native/sdks/hermesc ]; then
  find node_modules/react-native/sdks/hermesc -name hermesc -type f -exec chmod +x {} + 2>/dev/null || true
fi
