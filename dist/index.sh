#!/bin/sh
# Resolve the real script path (handles symlinks)
REAL_PATH="$(readlink -f "$0" 2>/dev/null || echo "$0")"
# Get the directory containing the script
SCRIPT_DIR="$(cd "$(dirname "$REAL_PATH")" && pwd)"
# Go up one level from dist to package root
PACKAGE_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
exec node "$PACKAGE_DIR/dist/index.js" "$@"
