#!/bin/bash
# Run before making edits
echo "Checking current state..."
npm run lint 2>/dev/null || true
npm run type-check 2>/dev/null || true