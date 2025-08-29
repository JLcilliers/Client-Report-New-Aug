# Google OAuth Configuration Guide

## Required Redirect URIs

You need to add these **exact** redirect URIs to your Google Cloud Console OAuth 2.0 Client:

### For Local Development (localhost:3000)
```
http://localhost:3000/api/auth/admin-google/callback
http://localhost:3000/api/auth/google/callback
http://localhost:3000/api/auth/google/callback/admin-callback
```

### For Production (replace with your domain)
```
https://yourdomain.com/api/auth/admin-google/callback
https://yourdomain.com/api/auth/google/callback
https://yourdomain.com/api/auth/google/callback/admin-callback
```

## How to Add Redirect URIs

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Navigate to **APIs & Services** → **Credentials**
4. Click on your OAuth 2.0 Client ID
5. In the **Authorized redirect URIs** section, click **ADD URI**
6. Add each of the URIs listed above
7. Click **SAVE** at the bottom

## Current OAuth Client Details
- **Client ID**: 541713899299-psufaaimeh78cenjiio7irl6p5bakl5f.apps.googleusercontent.com
- **Project**: new-online-client-reporting

## Required APIs to Enable

Make sure these APIs are enabled in your Google Cloud Project:
- Google Analytics Data API
- Google Analytics Admin API
- Google Search Console API
- PageSpeed Insights API

## Testing the Authentication

1. Start the server: `npm start`
2. Open http://localhost:3000
3. Click "Sign in with Google"
4. You should be redirected to Google's OAuth consent screen
5. After authorization, you'll be redirected back to the admin panel

## Troubleshooting

### Error: redirect_uri_mismatch
- Make sure the redirect URI in Google Cloud Console **exactly** matches what the app is using
- For localhost, use `http://` not `https://`
- Check that you saved the changes in Google Cloud Console

### Error: Access blocked
- Make sure your OAuth consent screen is configured
- For testing, you can use "Test users" under OAuth consent screen
- Add your email as a test user

### Quick Admin Access
If you need immediate access without Google OAuth, click "Quick Admin Access (Demo)" on the login page.