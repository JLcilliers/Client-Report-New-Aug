# Google Cloud Console Configuration Required

## Issue
The simple-admin authentication flow is failing with `redirect_uri_mismatch` error.

## Required Action
Add the following redirect URI to your OAuth 2.0 Client ID in Google Cloud Console:

### Go to Google Cloud Console
1. Navigate to: https://console.cloud.google.com/apis/credentials
2. Click on your OAuth 2.0 Client ID (the one configured for searchsignal.online)
3. Under "Authorized redirect URIs", add:
   - `https://searchsignal.online/api/auth/simple-admin`

## Current Status of Fixes

### ✅ Completed Fixes
1. **Login Redirect**: Now correctly redirects to `/admin/google-accounts` after login
2. **Token Auto-Refresh**: Added logic to automatically refresh expired tokens on page load
3. **Last Sync Display**: Fixed to show actual last sync time from reports
4. **Refresh Functionality**: Implemented proper data refresh that calls the correct API endpoint
5. **Database Models**: Added missing ContentQuality, PageAudit, and CwvMeasurement models for production
6. **TypeScript Errors**: Fixed all compilation errors for Vercel deployment

### 🔄 Testing Required After Google Cloud Update
Once you add the redirect URI, please test:
1. Simple admin login flow
2. Token auto-refresh (tokens should refresh automatically if expired)
3. Last Sync and Refresh button on `/admin` page
4. All report tabs to ensure data is fetching correctly
5. SEO Technical tab for actual scores (not placeholder 0 values)

## Environment Variables Verification
Ensure these are set in Vercel:
- `GOOGLE_CLIENT_SECRET` (use the correct one from your Google Cloud Console)
- All other variables from your environment configuration

## Notes
- The main Google OAuth flow (Sign in with Google) should work without additional changes
- The Quick Admin Access requires the redirect URI to be added
- All code fixes have been deployed to production