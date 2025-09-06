# Google Account Addition Debugging Report

## Issue Description
Google accounts were not appearing in the dashboard after being added through the OAuth flow.

## Root Cause
The OAuth callback was saving to the `Account` table, but the frontend API endpoint was reading from the `GoogleTokens` table, causing a mismatch.

## Solution Applied
Updated the OAuth callback route (`/api/auth/google/admin-callback/route.ts`) to save to the `GoogleTokens` table instead of the `Account` table.

### Code Changes
- Modified the callback to use `prisma.googleTokens.upsert()` instead of `prisma.account.upsert()`
- Updated the data structure to match the GoogleTokens table schema
- Used `google_sub` (Google's unique user ID) as the identifier
- Stored the email directly in the GoogleTokens record

## Testing Results
1. **OAuth Flow**: Successfully navigates through Google OAuth consent screens
2. **Authorization**: Properly handles unverified app warnings (development environment)
3. **Callback Processing**: The callback endpoint is reached after authorization

## Current Status
After applying the fix, there's still an "invalid_client" error occurring after the OAuth callback. This suggests additional issues:

### Possible Causes of invalid_client Error:
1. **Environment Variable Mismatch**: The production environment might not have the correct `GOOGLE_CLIENT_ID` or `GOOGLE_CLIENT_SECRET`
2. **Redirect URI Mismatch**: The redirect URI in Google Cloud Console might not match the production URL exactly
3. **Token Processing Issue**: There might be an error in how the tokens are being processed after receipt

## Next Steps
1. Verify environment variables in Vercel dashboard match Google Cloud Console
2. Check redirect URIs in Google Cloud Console include:
   - `https://searchsignal.online/api/auth/google/admin-callback`
   - `https://searchsignal.online/api/auth/callback/google`
3. Add more detailed error logging to the callback route to capture the exact failure point
4. Consider implementing a direct database check to verify if accounts are being saved despite the error

## Files Modified
- `/app/api/auth/google/admin-callback/route.ts` - Updated to use GoogleTokens table

## Deployment
- Changes pushed to GitHub and auto-deployed to Vercel
- Live URL: https://searchsignal.online

## Additional Notes
- The application uses unverified OAuth (shows warning screen) which is acceptable for development
- The GoogleTokens table uses BigInt for expires_at while Account table uses Int
- Both NextAuth and custom OAuth flows are present in the codebase, which may cause confusion