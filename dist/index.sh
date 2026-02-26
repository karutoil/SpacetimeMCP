#!/bin/sh
# Get the directory where this script is located (package root)
SCRIPT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
exec node "$SCRIPT_DIR/dist/index.js" "$@"
