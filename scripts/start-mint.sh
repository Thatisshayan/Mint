#!/bin/bash
set -e
cd "$(dirname "$0")/.."

if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" || "$OSTYPE" == "win32" ]]; then
  ROOT="/c/AgentDevWork/repos/.mint/MINT"
  ( cd "$ROOT/backend" && node dist/index.js ) &
  ( cd "$ROOT/frontend" && npm run dev ) &
else
  ( cd backend && node dist/index.js ) &
  ( cd frontend && npm run dev ) &
fi

wait
