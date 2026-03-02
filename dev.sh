#!/bin/bash
export PATH="/Users/jamis/.local/share/mise/installs/node/20.19.5/bin:$PATH"
cd "$(dirname "$0")"
exec /Users/jamis/.local/share/mise/installs/pnpm/10.20.0/pnpm dev
