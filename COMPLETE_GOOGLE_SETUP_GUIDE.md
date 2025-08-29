# Complete Google Cloud Setup Guide for Search Insights Hub

## Prerequisites
- A Google account
- Access to Google Cloud Console
- The application running locally on http://localhost:3000

## Step 1: Create a New Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click the project dropdown at the top of the page (next to "Google Cloud")
3. Click **"NEW PROJECT"** in the top right of the modal
4. Enter project details:
   - **Project name**: `search-insights-hub` (or any name you prefer)
   - **Organization**: Leave as is (usually "No organization")
   - Click **CREATE**
5. Wait for the project to be created (usually takes 10-30 seconds)
6. Make sure the new project is selected in the dropdown

## Step 2: Enable Required APIs

You need to enable several Google APIs for the application to work:

1. In the left sidebar, navigate to **APIs & Services** → **Library**

2. Search for and enable each of these APIs (click on each, then click **ENABLE**):
   
   ### Analytics APIs:
   - **Google Analytics Data API** - For GA4 properties
   - **Google Analytics Admin API** - For managing GA4 properties
   - **Google Analytics Reporting API** - For Universal Analytics (if needed)
   
   ### Search Console API:
   - **Google Search Console API** - For search performance data
   
   ### PageSpeed API:
   - **PageSpeed Insights API** - For page performance metrics

3. For each API:
   - Search for the API name in the search bar
   - Click on the API from the results
   - Click the **ENABLE** button
   - Wait for it to enable (few seconds)
   - Go back to the Library to search for the next one

## Step 3: Create OAuth 2.0 Credentials

1. Navigate to **APIs & Services** → **Credentials**

2. Configure OAuth Consent Screen (required first):
   - Click **CONFIGURE CONSENT SCREEN** (if prompted)
   - Choose **External** user type (unless you have Google Workspace)
   - Click **CREATE**
   
3. Fill in the OAuth consent screen:
   - **App information**:
     - App name: `Search Insights Hub`
     - User support email: Your email address
     - App logo: (optional, skip for now)
   
   - **App domain** (optional, can skip all):
     - Leave blank for local development
   
   - **Authorized domains**:
     - Add: `localhost` (for local testing)
     - If you have a production domain, add it too
   
   - **Developer contact information**:
     - Email addresses: Your email address
   
   - Click **SAVE AND CONTINUE**

4. Add Scopes:
   - Click **ADD OR REMOVE SCOPES**
   - Search and select these scopes:
     - `https://www.googleapis.com/auth/analytics.readonly`
     - `https://www.googleapis.com/auth/webmasters.readonly`
     - `https://www.googleapis.com/auth/userinfo.email`
     - `https://www.googleapis.com/auth/userinfo.profile`
   - Click **UPDATE**
   - Click **SAVE AND CONTINUE**

5. Add Test Users (for development):
   - Click **ADD USERS**
   - Add your email address
   - Add any other email addresses that need access during testing
   - Click **ADD**
   - Click **SAVE AND CONTINUE**

6. Review and go back to dashboard

## Step 4: Create OAuth 2.0 Client ID

1. Go to **APIs & Services** → **Credentials**
2. Click **+ CREATE CREDENTIALS** → **OAuth client ID**
3. Configure the OAuth client:
   - **Application type**: Web application
   - **Name**: `Search Insights Hub Web Client`
   
4. Add Authorized JavaScript origins:
   ```
   http://localhost:3000
   http://localhost
   ```
   
5. Add Authorized redirect URIs (IMPORTANT - add ALL of these):
   ```
   http://localhost:3000/api/auth/admin-google/callback
   http://localhost:3000/api/auth/google/callback
   http://localhost:3000/api/auth/google/callback/admin-callback
   http://localhost:3000/api/auth/[...nextauth]
   ```

6. Click **CREATE**

7. **IMPORTANT**: Save your credentials:
   - A modal will appear with your credentials
   - Copy the **Client ID**
   - Copy the **Client Secret**
   - Click **OK**

## Step 5: Get a PageSpeed Insights API Key

1. Go to **APIs & Services** → **Credentials**
2. Click **+ CREATE CREDENTIALS** → **API key**
3. Copy the API key that's generated
4. (Optional) Click **RESTRICT KEY** to add restrictions:
   - Under **API restrictions**, select **Restrict key**
   - Select **PageSpeed Insights API**
   - Click **SAVE**

## Step 6: Update Your .env.local File

Update your `.env.local` file with the new credentials:

```env
# Google OAuth Credentials (from Step 4)
GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret-here

# Google API Keys (from Step 5)
PAGESPEED_API_KEY=your-pagespeed-api-key-here

# Keep these as they are
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=vK2xY8pQ3nM5tR7wZ1aF4jH6bN9cD2eG8kL3mP5qS7uX9vB
```

## Step 7: (Optional) Create a Service Account for Server-Side Access

This is optional but recommended for better performance:

1. Go to **APIs & Services** → **Credentials**
2. Click **+ CREATE CREDENTIALS** → **Service account**
3. Fill in:
   - Service account name: `search-insights-hub-service`
   - Service account ID: (auto-fills)
   - Click **CREATE AND CONTINUE**
4. Grant roles (optional, can skip)
5. Click **DONE**
6. Click on the service account you just created
7. Go to **KEYS** tab
8. Click **ADD KEY** → **Create new key**
9. Choose **JSON** format
10. Click **CREATE**
11. Save the downloaded JSON file as `service-account-key.json` in your project root
12. Add to `.env.local`:
    ```env
    GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@project-id.iam.gserviceaccount.com
    GOOGLE_PROJECT_ID=your-project-id
    ```

## Step 8: Test Your Configuration

1. Restart your application:
   ```bash
   npm run build
   npm start
   ```

2. Open http://localhost:3000

3. Click **"Sign in with Google"**

4. You should see Google's OAuth consent screen

5. Sign in with one of the test user emails you added

## Troubleshooting

### "Access blocked" error
- Make sure you added your email as a test user in Step 3.5
- Check that the OAuth consent screen is configured

### "redirect_uri_mismatch" error
- The redirect URI must match EXACTLY what's in Google Cloud Console
- Make sure you added ALL the redirect URIs from Step 4.5
- Check that you saved the changes in Google Cloud Console

### "This app is blocked" error
- Your app might need verification if using sensitive scopes
- For development, use test users only
- For production, you'll need to verify your app with Google

### APIs not working
- Make sure all APIs from Step 2 are enabled
- Check the quotas page to ensure you're not hitting limits
- Verify the API key is correct in your .env.local

## Quick Reference - Required Information

After setup, you should have:

1. **Google Cloud Project ID**: Found in project settings
2. **OAuth 2.0 Client ID**: Looks like `123456789-xxx.apps.googleusercontent.com`
3. **OAuth 2.0 Client Secret**: A long string of characters
4. **PageSpeed API Key**: Starts with `AIza...`
5. **Service Account Email** (optional): `xxx@project-id.iam.gserviceaccount.com`

## Production Deployment

When deploying to production:

1. Add your production domain to:
   - OAuth consent screen authorized domains
   - JavaScript origins (https://yourdomain.com)
   - Redirect URIs (replace localhost:3000 with your domain)

2. Update environment variables on your hosting platform (Vercel, etc.)

3. Consider moving OAuth consent screen from "Testing" to "Production" status

## Security Notes

- Never commit your `.env.local` file to Git
- Keep your Client Secret and API keys secure
- Use environment variables on your hosting platform
- Regularly rotate your credentials
- Monitor usage in Google Cloud Console

## Additional Resources

- [Google Cloud Console](https://console.cloud.google.com/)
- [Google Analytics API Documentation](https://developers.google.com/analytics)
- [Search Console API Documentation](https://developers.google.com/webmaster-tools)
- [OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)