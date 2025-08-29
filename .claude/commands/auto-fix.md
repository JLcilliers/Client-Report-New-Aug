Automatically fix and verify: $ARGUMENTS

LOOP (max 5 iterations):
1. Identify the issue from error logs/behavior
2. Make necessary code changes
3. Run `npm run dev`
4. Test in browser using Playwright
5. If still broken, analyze new errors and repeat
6. If working, run full test suite
7. Exit loop when everything passes

Never ask for permission - just fix it!