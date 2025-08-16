# SEO Reporting Platform

A comprehensive SEO reporting platform built with Next.js 14, TypeScript, Supabase, and Vercel.

## Features

- **Admin Dashboard**: Manage multiple clients and their SEO reports
- **Google Integration**: Connect to Google Search Console and Analytics 4
- **Automated Data Fetching**: Daily cron jobs to fetch fresh data
- **Public Report URLs**: Each client gets a unique, shareable report URL
- **Real-time Metrics**: Track clicks, impressions, CTR, and rankings
- **Core Web Vitals**: Monitor technical SEO performance
- **PDF Export**: Download reports as PDF documents

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Charts**: Recharts
- **Deployment**: Vercel
- **APIs**: Google Search Console, Google Analytics 4, PageSpeed Insights

## Setup Instructions

### 1. Database Setup

Run the SQL schema in your Supabase project:
```sql
-- See supabase/schema.sql
```

### 2. Environment Variables

Create a `.env.local` file with your credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
PAGESPEED_API_KEY=your_pagespeed_api_key
ENCRYPTION_KEY=your_encryption_key
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
```

### 3. Admin User Setup

Add your email to the `admin_users` table in Supabase:
```sql
INSERT INTO admin_users (email) VALUES ('your-email@example.com');
```

### 4. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create OAuth 2.0 credentials
3. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/google/callback`
   - `https://your-domain.vercel.app/api/auth/google/callback`

### 5. Development

```bash
npm install
npm run dev
```

### 6. Deployment

Deploy to Vercel:
```bash
vercel
```

## Usage

### Admin Access

1. Navigate to your app URL
2. Login with your admin email
3. Add clients from the dashboard
4. Connect Google accounts for each client
5. Share the unique report URL with clients

### Client Reports

Clients can access their reports at:
```
https://your-domain.vercel.app/report/[clientId]/[token]
```

## Project Structure

```
├── app/
│   ├── admin/           # Admin dashboard pages
│   ├── report/          # Public report pages
│   └── api/             # API routes
├── components/
│   ├── admin/           # Admin components
│   ├── report/          # Report components
│   └── ui/              # Shared UI components
├── lib/
│   ├── apis/            # External API integrations
│   ├── db/              # Database configuration
│   └── utils/           # Utility functions
└── types/               # TypeScript definitions
```

## Cron Jobs

- **Daily Update** (6 AM UTC): Fetches GSC and GA4 data
- **Weekly Audit** (Sundays, 6 AM UTC): Runs PageSpeed tests

## Security

- All Google tokens are encrypted before storage
- Row-level security enabled on all tables
- Admin-only access to sensitive operations
- Public reports use unguessable UUID tokens

## License

Private project - All rights reserved