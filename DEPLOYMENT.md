# Deployment Guide

## Production Deployment (PostgreSQL)

This application uses **SQLite for local development** and **PostgreSQL for production**.

### Vercel Deployment

The `vercel.json` file is already configured with the correct build command that will:
1. Copy the PostgreSQL schema for production
2. Generate the Prisma client
3. Build the Next.js application

### Required Environment Variables for Production

Set these in your Vercel project settings:

```env
# Database (PostgreSQL)
DATABASE_URL="postgresql://user:password@host:5432/database?schema=public"
DIRECT_URL="postgresql://user:password@host:5432/database?schema=public"

# NextAuth
NEXTAUTH_URL=https://searchsignal.online
NEXTAUTH_SECRET=your-secret-key-here

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Google API Keys
PAGESPEED_API_KEY=your-pagespeed-api-key

# Optional: Sentry
SENTRY_DSN=your-sentry-dsn
```

### Database Migration

For the first deployment, you'll need to run migrations on your production database:

```bash
# Set your production DATABASE_URL
export DATABASE_URL="your-production-postgresql-url"

# Use the production schema
cp prisma/schema.production.prisma prisma/schema.prisma

# Run migrations
npx prisma migrate deploy
```

### Local Development vs Production

- **Local Development**: Uses SQLite (`prisma/schema.prisma`)
- **Production**: Uses PostgreSQL (`prisma/schema.production.prisma`)

The build process automatically handles this switch via the custom build command in `vercel.json`.

### Testing Production Build Locally

To test the production build locally:

```bash
npm run build:production
```

This will use the PostgreSQL schema and build the application as it would in production.

### Verify Deployment

After deployment, test these endpoints:

1. Main app: https://searchsignal.online
2. Test page: https://searchsignal.online/test-google
3. API endpoint: https://searchsignal.online/api/google-accounts
4. OAuth callback: https://searchsignal.online/api/auth/callback/google

### Troubleshooting

If you encounter database issues:

1. Ensure PostgreSQL environment variables are set correctly
2. Check that the database migrations have been applied
3. Verify the GoogleAccount model has proper @db.Text annotations in production
4. Check Vercel function logs for detailed error messages