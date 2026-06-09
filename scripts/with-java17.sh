#!/usr/bin/env bash
set -euo pipefail

if [[ "$(uname)" == "Darwin" ]]; then
  if ! JAVA_HOME="$(/usr/libexec/java_home -v 17 2>/dev/null)"; then
    echo "JDK 17 is required for Android builds. Install with: brew install openjdk@17" >&2
    exit 1
  fi
  export JAVA_HOME
elif [[ -z "${JAVA_HOME:-}" ]]; then
  echo "Set JAVA_HOME to JDK 17 before running Android builds." >&2
  exit 1
fi

exec "$@"
