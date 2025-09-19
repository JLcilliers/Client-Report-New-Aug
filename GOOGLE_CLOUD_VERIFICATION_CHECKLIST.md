# Google Cloud Console Verification Checklist

## Your App Details
- **Project ID**: `search-insights-hub-25-aug`
- **Client ID**: `281498391609-8dgdr9pb3ppv2vlll0e7q18ahfoeuqru.apps.googleusercontent.com`

## ✅ Please Verify in Google Cloud Console

### 1. OAuth 2.0 Client Settings
Go to: **APIs & Services** → **Credentials** → Click on your OAuth 2.0 Client ID

#### Application Type
- [ ] Should be: **Web application**

#### Authorized JavaScript Origins
Add ALL of these:
- [ ] `https://searchsignal.online`
- [ ] `http://localhost:3000`

#### Authorized Redirect URIs
Add ALL of these EXACTLY as shown:
- [ ] `https://searchsignal.online/api/auth/google/admin-callback`
- [ ] `https://searchsignal.online/api/auth/google/callback`
- [ ] `http://localhost:3000/api/auth/google/admin-callback`
- [ ] `http://localhost:3000/api/auth/google/callback`

### 2. OAuth Consent Screen
Go to: **APIs & Services** → **OAuth consent screen**

#### Publishing Status
- [ ] Status should be: **In production** (not Testing)
- [ ] If it's in "Testing" mode, click "PUBLISH APP"

#### User Type
- [ ] Should be: **External** (unless this is internal only)

#### Authorized Domains
- [ ] Add: `searchsignal.online` (without https://)

#### Scopes
Verify these scopes are added:
- [ ] `.../auth/userinfo.email` (See email address)
- [ ] `.../auth/userinfo.profile` (See personal info)
- [ ] `.../auth/analytics.readonly` (View Google Analytics data)
- [ ] `.../auth/webmasters.readonly` (View Search Console data)

#### Test Users (if in Testing mode)
- [ ] Add your email: `johanlcilliers@gmail.com`

### 3. APIs Enabled
Go to: **APIs & Services** → **Enabled APIs**

Verify these are enabled:
- [ ] Google Analytics Data API
- [ ] Google Search Console API
- [ ] Google+ API (or Google Identity)
- [ ] PageSpeed Insights API

### 4. Domain Verification
Go to: **APIs & Services** → **Domain verification**

- [ ] Verify `searchsignal.online` is listed and verified

## 🔍 Common Issues & Solutions

### "Invalid Client" Error
This means the Client Secret doesn't match. In Vercel:
1. Copy the Client Secret from Google Cloud Console
2. Go to Vercel → Settings → Environment Variables
3. Update `GOOGLE_CLIENT_SECRET` with the exact value
4. Redeploy

### "Redirect URI Mismatch" Error
The EXACT redirect URI must match. Common mistakes:
- Missing trailing slash
- http vs https
- Different path structure

### "App Not Verified" Warning
If your app is verified but still showing warning:
1. Clear browser cache
2. Try incognito mode
3. Ensure OAuth consent screen is "In production" not "Testing"

## 📋 Required in Vercel Environment Variables

These MUST be set in Vercel (Settings → Environment Variables):

| Variable | Value | Notes |
|----------|-------|-------|
| `GOOGLE_CLIENT_ID` | `281498391609-8dgdr9pb3ppv2vlll0e7q18ahfoeuqru.apps.googleusercontent.com` | From Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | [Your secret from Google Console] | ⚠️ This is missing/incorrect |
| `NEXTAUTH_URL` | `https://searchsignal.online` | Your production URL |
| `NEXTAUTH_SECRET` | `/pkn+355+gLpWABVz0ErtEvsZVV7AamRwy/10rTeb34=` | For session encryption |

## 🚀 After Making Changes

1. **In Google Cloud Console**: Changes take effect immediately
2. **In Vercel**:
   - After updating environment variables, redeploy
   - Go to Deployments → Click ⋮ → Redeploy

## 🔧 Quick Test

After everything is configured:
1. Clear browser cookies for searchsignal.online
2. Go to https://searchsignal.online/login
3. Click "Sign in with Google"
4. Should redirect to Google OAuth
5. After approval, should land on /auth/success then /admin

## 📝 Notes

- The "Google hasn't verified this app" warning appears when the consent screen is in "Testing" mode
- If app is verified but still showing, it might be because you're not using a Google Workspace account
- For production use with multiple users, submit for verification in OAuth consent screen

## Still Not Working?

Use the **"Quick Admin Access (Demo)"** button while we troubleshoot OAuth.