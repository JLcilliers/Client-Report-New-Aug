# Quick Fix: Google OAuth Access Denied (403)

## The Issue
You're getting "Error 403: access_denied" because your email (johanlcilliers@gmail.com) is not listed as a test user in the Google Cloud Console.

## Quick Solution (2 minutes)

1. **Open Google Cloud Console**
   - Go to: https://console.cloud.google.com/
   - Make sure project "search-insights-hub-25-aug" is selected (top dropdown)

2. **Navigate to OAuth Consent Screen**
   - In left sidebar: **APIs & Services** → **OAuth consent screen**

3. **Add Your Email as Test User**
   - Scroll down to **"Test users"** section
   - Click **"+ ADD USERS"** button
   - Enter: `johanlcilliers@gmail.com`
   - Click **"ADD"**
   - Click **"SAVE"** if there's a save button

4. **Test the Login**
   - Go back to: http://localhost:3000
   - Click **"Sign in with Google"**
   - It should now work!

## Why This Happened
When an OAuth app is in "Testing" mode (not published), only emails explicitly added as test users can access it. This is a Google security feature to prevent unauthorized access during development.

## Alternative: Publishing Status
If you want anyone with a Google account to access it:
1. Go to OAuth consent screen
2. Click **"PUBLISH APP"** button
3. Note: This may require Google verification for sensitive scopes

## Current Configuration
- **Project**: search-insights-hub-25-aug
- **Client ID**: 281498391609-8dgdr9pb3ppv2vlll0e7q18ahfoeuqru.apps.googleusercontent.com
- **Status**: Testing (requires test users)

## Still Having Issues?
If adding your email as a test user doesn't work:
1. Clear browser cookies for accounts.google.com
2. Try incognito/private browsing mode
3. Make sure you saved the changes in Google Cloud Console