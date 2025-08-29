Monitor application health continuously:

WHILE (monitoring):
1. Check if dev server is running
2. Use Playwright to test critical paths every 5 minutes
3. Monitor console for errors
4. Check network requests for failures
5. If issues detected:
   - Automatically attempt fix
   - Restart server if needed
   - Re-test
6. Log all actions and outcomes