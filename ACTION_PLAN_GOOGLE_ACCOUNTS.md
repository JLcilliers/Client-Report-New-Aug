# Action Plan: Fix Google Account Addition Issue

## Summary
The Google account addition feature is partially fixed but still has an "invalid_client" error after OAuth callback.

## Completed Actions
✅ Fixed database table mismatch (Account vs GoogleTokens)
✅ Deployed fix to production via Vercel
✅ Tested OAuth flow on live site

## Immediate Actions Required

### 1. Verify Vercel Environment Variables
Go to Vercel Dashboard and check these environment variables:
- `GOOGLE_CLIENT_ID` - Must match Google Cloud Console
- `GOOGLE_CLIENT_SECRET` - Must match Google Cloud Console  
- `DATABASE_URL` - Should point to production PostgreSQL
- `NEXTAUTH_URL` - Should be `https://searchsignal.online`
- `NEXTAUTH_SECRET` - Should be set

### 2. Update Google Cloud Console
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your project
3. Go to APIs & Services > Credentials
4. Edit your OAuth 2.0 Client ID
5. Add these Authorized redirect URIs:
   - `https://searchsignal.online/api/auth/google/admin-callback`
   - `https://searchsignal.online/api/auth/callback/google`
   - `http://localhost:3000/api/auth/google/admin-callback` (for local testing)
   - `http://localhost:3000/api/auth/callback/google` (for local testing)

### 3. Debug the Callback Error
Add enhanced error logging to capture the exact failure point:

```typescript
// In /api/auth/google/admin-callback/route.ts
try {
  const tokenResponse = await oauth2Client.getToken(code);
  // Log the full response
  console.log('[OAuth] Token response:', JSON.stringify(tokenResponse, null, 2));
} catch (error) {
  // Log detailed error information
  console.error('[OAuth] Token exchange error:', {
    error: error.message,
    code: error.code,
    details: error.response?.data
  });
}
```

### 4. Test Direct Database Access
Create a test endpoint to verify database connectivity:

```typescript
// /api/test/db-check/route.ts
export async function GET() {
  try {
    const accounts = await prisma.googleTokens.findMany();
    return NextResponse.json({ 
      success: true, 
      count: accounts.length,
      accounts: accounts.map(a => ({ 
        id: a.id, 
        email: a.email 
      }))
    });
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    });
  }
}
```

### 5. Verify OAuth Scopes
Ensure the OAuth consent screen in Google Cloud Console has these scopes:
- `https://www.googleapis.com/auth/userinfo.email`
- `https://www.googleapis.com/auth/userinfo.profile`
- `https://www.googleapis.com/auth/analytics.readonly`
- `https://www.googleapis.com/auth/webmasters.readonly`

## Alternative Solution
If the issue persists, consider implementing a simplified OAuth flow:

1. Use NextAuth.js exclusively for authentication
2. Store Google tokens in the NextAuth Account table
3. Update the frontend to read from the Account table
4. Remove the custom OAuth implementation

## Testing Checklist
- [ ] Environment variables verified in Vercel
- [ ] Redirect URIs updated in Google Cloud Console
- [ ] Enhanced logging deployed
- [ ] Database connectivity confirmed
- [ ] OAuth scopes verified
- [ ] Test account successfully added
- [ ] Account appears in dashboard
- [ ] Properties can be fetched

## Contact Information
- Google Cloud Console: https://console.cloud.google.com
- Vercel Dashboard: https://vercel.com/dashboard
- Live Site: https://searchsignal.online

## Notes
- The "invalid_client" error typically indicates OAuth configuration issues
- Vercel environment variables require redeployment to take effect
- Google OAuth changes can take up to 5 minutes to propagate