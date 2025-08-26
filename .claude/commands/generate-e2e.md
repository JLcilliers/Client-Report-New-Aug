Generate and run E2E tests for: $ARGUMENTS

1. Start the dev server
2. Use Playwright MCP to:
   - Navigate through the feature
   - Record all interactions
   - Extract DOM selectors
3. Generate Playwright test code based on recordings
4. Save test to `__tests__/e2e/`
5. Run the generated test immediately
6. If test fails:
   - Analyze failure
   - Fix selectors or logic
   - Re-run until passing
7. Commit the working test