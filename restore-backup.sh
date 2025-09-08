#!/bin/bash

echo "========================================"
echo "RESTORE TO BACKUP: January 7, 2025"
echo "========================================"
echo ""
echo "This will restore your project to the backup point:"
echo "Tag: backup-2025-01-07-no-pricing"
echo ""
echo "WARNING: This will overwrite any changes made after the backup!"
echo ""
read -p "Are you sure you want to restore? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Restore cancelled."
    exit 0
fi

echo ""
echo "Fetching latest tags from remote..."
git fetch --tags

echo ""
echo "Checking out main branch..."
git checkout main

echo ""
echo "Creating safety branch with current state..."
git branch "backup-before-restore-$(date +%Y%m%d-%H%M%S)"

echo ""
echo "Restoring to backup point..."
git reset --hard backup-2025-01-07-no-pricing

echo ""
echo "========================================"
echo "RESTORE COMPLETE!"
echo "========================================"
echo ""
echo "Next steps:"
echo "1. Run 'npm install' to ensure dependencies are correct"
echo "2. Test locally with 'npm run dev'"
echo "3. When ready, push to GitHub with: git push --force origin main"
echo ""
echo "NOTE: A safety branch was created with your previous state."
echo ""