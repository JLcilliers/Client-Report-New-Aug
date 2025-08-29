# Google OAuth Setup Instructions

## Update Google Cloud Console Redirect URIs

You need to update your Google OAuth 2.0 Client ID to include the new callback URL for admin connections.

### Steps:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project: "online client reporting"
3. Navigate to **APIs & Services** > **Credentials**
4. Click on your OAuth 2.0 Client ID (the one ending in ...dbm2s.apps.googleusercontent.com)
5. In the **Authorized redirect URIs** section, add these URIs:
   - `http://localhost:3000/api/auth/google/admin-callback` (for local development)
   - `https://online-client-reporting.vercel.app/api/auth/google/admin-callback` (for production)
6. Click **Save**

## Create Database Table

Run the SQL in `supabase/create-admin-connections-table.sql` in your Supabase SQL Editor:

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **SQL Editor**
4. Copy and paste the contents of `supabase/create-admin-connections-table.sql`
5. Click **Run**

## Environment Variables on Vercel

Make sure these environment variables are set in your Vercel project:

- `GOOGLE_CLIENT_ID` - Your Google OAuth Client ID
- `GOOGLE_CLIENT_SECRET` - Your Google OAuth Client Secret
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key (for server-side operations)

## Testing the Connection

1. Go to `/admin/connections` in your deployed app
2. Click "Connect Google Account"
3. Authorize the requested permissions
4. You should be redirected back with a success message

## Permissions Requested

The app requests the following Google API scopes:
- **Google Search Console** - Full access to manage and view Search Console data
- **Google Analytics** - Full access to manage and view Analytics data
- **User Info** - Basic profile information (email, name)