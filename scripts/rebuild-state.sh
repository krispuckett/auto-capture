#!/bin/bash
# rebuild-state.sh — Wrapper that runs rebuild-state.js
# Daily logs are truth. State file is a derived cache.
node "$(dirname "$0")/rebuild-state.js"
