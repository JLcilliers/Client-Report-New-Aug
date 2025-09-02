# Deployment Checklist

## Pre-Deployment Validation

### Module Resolution Fixes Applied ✅
- [x] Removed duplicate `lib/prisma.ts` file that was causing conflicts
- [x] Standardized all imports to use `@/lib/db/prisma` consistently
- [x] Fixed inconsistent import patterns (named vs default imports)
- [x] Updated all failing route files:
  - `app/api/admin/database-check/route.ts`
  - `app/api/admin/debug-snapshot/route.ts` 
  - `app/api/admin/google-accounts/[id]/properties/route.ts`
  - `app/api/admin/google-accounts/[id]/refresh/route.ts`
  - `app/api/auth/google/admin-callback/route.ts`

### Build Validation ✅
- [x] TypeScript compilation passes without errors
- [x] Next.js build starts successfully
- [x] Webpack compilation completes successfully
- [x] All import paths resolve correctly

## Critical Files Status

### Database Layer
- ✅ `lib/db/prisma.ts` - Main Prisma client (only copy)
- ✅ All routes use consistent `import { prisma } from '@/lib/db/prisma'`

### Authentication 
- ✅ `lib/auth-options.ts` - NextAuth configuration
- ✅ `lib/google/refresh-token.ts` - Token refresh utilities

### Google API Integration
- ✅ All Google API routes have correct imports
- ✅ Token management utilities properly imported

## Environment Variables Required

```bash
# OAuth Configuration
GOOGLE_CLIENT_ID="your_google_client_id"
GOOGLE_CLIENT_SECRET="your_google_client_secret"

# Database
DATABASE_URL="your_production_database_url"
DIRECT_URL="your_direct_database_connection" # For Prisma migrations

# NextAuth
NEXTAUTH_SECRET="your_nextauth_secret"
NEXTAUTH_URL="https://your-domain.com"

# Optional APIs
PAGESPEED_API_KEY="your_pagespeed_api_key"
```

## Deployment Steps

### 1. Pre-Deploy
```bash
# Validate TypeScript
npx tsc --noEmit --skipLibCheck

# Test build locally
npm run build

# Run database migrations (if needed)
npx prisma migrate deploy
```

### 2. Vercel Configuration
```json
{
  "buildCommand": "prisma generate && next build",
  "installCommand": "npm ci",
  "framework": "nextjs"
}
```

### 3. Database Setup (Production)
```bash
# Generate Prisma client
npx prisma generate

# Apply database schema
npx prisma db push

# Or run migrations
npx prisma migrate deploy
```

## Post-Deployment Verification

### API Endpoints to Test
- [ ] `GET /api/admin/database-check` - Database connectivity
- [ ] `GET /api/admin/debug-snapshot` - System health 
- [ ] `GET /api/admin/google-accounts/[id]/properties` - Google API integration
- [ ] `POST /api/admin/google-accounts/[id]/refresh` - Token refresh
- [ ] `GET /api/auth/google/admin-callback` - OAuth flow

### Health Checks
- [ ] Application loads without 500 errors
- [ ] Database connections work
- [ ] Google OAuth flow completes
- [ ] API routes respond correctly
- [ ] No module resolution errors in logs

## Rollback Plan

If deployment fails:
1. Revert to previous deployment
2. Check Vercel build logs for specific errors
3. Verify all environment variables are set
4. Ensure database is accessible from production environment

## Common Issues & Solutions

### Module Not Found Errors
- **Problem**: `Cannot find module '@/lib/prisma'`
- **Solution**: Use `@/lib/db/prisma` instead - duplicate file was removed

### Prisma Client Errors
- **Problem**: `PrismaClient is not a constructor`
- **Solution**: Ensure consistent named imports: `import { prisma } from '@/lib/db/prisma'`

### Database Connection Issues
- **Problem**: Database connection fails in production
- **Solution**: Verify `DATABASE_URL` and `DIRECT_URL` environment variables

### Google OAuth Issues
- **Problem**: OAuth callback fails
- **Solution**: Verify redirect URIs in Google Cloud Console match production domain

## Security Checklist

- [ ] All sensitive environment variables are set in production
- [ ] Google OAuth redirect URIs are properly configured
- [ ] Database credentials use production values
- [ ] NEXTAUTH_SECRET is unique and secure
- [ ] HTTPS is enforced in production

---

**Last Updated**: 2025-09-02
**Fixed Issues**: Module resolution conflicts, import path inconsistencies, duplicate Prisma clients
**Status**: Ready for deployment ✅