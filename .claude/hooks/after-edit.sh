#!/bin/bash
# Run after making edits
echo "Validating changes..."
npm run prettier --write $1 2>/dev/null || true
npm run lint:fix $1 2>/dev/null || true
npm run type-check 2>/dev/null || true