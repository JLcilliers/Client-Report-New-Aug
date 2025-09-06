# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Search Insights Hub - A comprehensive SEO reporting platform that integrates with Google Analytics, Search Console, and PageSpeed Insights to provide automated client reporting.

## Essential Commands

```bash
# PRODUCTION DEPLOYMENT (Primary Workflow)
git add -A                 # Stage changes
git commit -m "message"    # Commit changes
git push origin main       # Deploy to Vercel automatically
# Live at: https://searchsignal.online

# Local Testing (Optional)
npm run dev                # Start local dev server for testing
npm run build              # Build for production locally
npm start                  # Start production server locally

# Database (Prisma with SQLite)
npm run prisma:generate    # Generate Prisma client
npm run prisma:migrate     # Run database migrations
npm run prisma:studio      # Open Prisma Studio GUI
npm run prisma:reset       # Reset database

# Testing & Automation
npm run test:auto          # Run automated test runner
npm run production:scan    # Scan for production readiness
npm run production:prepare # Run production scan + build

# Process Management (Windows)
taskkill //PID [PID] //F   # Kill process by PID
netstat -ano | findstr :3000  # Find process using port 3000
```

## Architecture & Key Components

### Authentication Flow
- **Google OAuth**: Primary authentication method via `/api/auth/admin-google/initiate` and `/api/auth/admin-google/callback`
- Tokens stored in HTTP-only cookies (`google_access_token`, `google_refresh_token`)
- Session validation via `/api/auth/check-session`

### Data Flow
1. User authenticates with Google OAuth
2. Fetch properties from Google Analytics/Search Console via `/api/google/fetch-properties`
3. Create reports linking clients to properties
4. Data fetched and cached for performance

### Database
- **Prisma ORM** with SQLite for local development
- Key models: `User`, `Report`, `ClientReport`, `Account`, `Session`
- Database file: `prisma/dev.db`

### API Endpoints Structure
- `/api/admin/*` - Admin-only endpoints (clients, reports, google-accounts)
- `/api/auth/*` - Authentication endpoints (Google OAuth flow)
- `/api/google/*` - Google API integration endpoints
- `/api/seo/*` - SEO analysis tools (meta-tags, robots, sitemap, etc.)
- `/api/reports/*` - Report management
- `/api/public/report/*` - Public report access

### Key Integrations
- **Google APIs**: Analytics Data API, Search Console API, PageSpeed Insights API
- **Google OAuth 2.0**: For authentication and API access
- Uses `googleapis` npm package for API interactions

### Environment Configuration
Critical environment variables:
- `GOOGLE_CLIENT_ID` - OAuth client ID
- `GOOGLE_CLIENT_SECRET` - OAuth client secret  
- `PAGESPEED_API_KEY` - PageSpeed Insights API key
- `DATABASE_URL` - SQLite database path
- `NEXTAUTH_SECRET` - NextAuth session secret

### Current Authentication State
The application currently bypasses Supabase and uses:
- Mock Supabase client in `lib/db/supabase.ts` (returns empty responses)
- Cookie-based authentication for Google OAuth tokens
- Prisma for actual data persistence

### Common Issues & Solutions

**Port 3000 Already in Use**
```bash
netstat -ano | findstr :3000  # Find PID
taskkill //PID [PID] //F      # Kill process
```

**Google OAuth Redirect Issues**
- Ensure redirect URIs in Google Cloud Console match exactly:
  - `http://localhost:3000/api/auth/admin-google/callback` (for local)
  - Add production URLs when deploying

**Properties Not Loading**
- Check Google OAuth token expiry
- Verify scopes include Analytics and Search Console access
- Ensure user has permissions for the properties

### Production Deployment Notes
- **Platform**: Vercel (auto-deploys from GitHub)
- **Live URL**: https://searchsignal.online
- **Workflow**: Push to GitHub → Vercel auto-deploys
- **Database**: PostgreSQL in production (not SQLite)
- **Environment Variables**: Set in Vercel dashboard, not locally
- Run `npm run production:scan` locally before pushing to check for issues
- Update redirect URIs in Google Cloud Console for production domain

### Automation Tools
- `automation/test-runner.js` - Automated testing with 50 retry iterations
- `automation/production-scanner.js` - Removes debug code, adds security features
- `automation/continuous-monitor.js` - Continuous monitoring tool

### Navigation Structure
Admin dashboard navigation (left sidebar):
- Dashboard - Connected clients overview
- Connections - Google account management  
- Properties - Analytics & Search Console properties
- Reports - Client report management with share functionality
- Settings - Application settings

Note: Clients and Analytics tabs have been removed from navigation as requested.

## AUTONOMOUS TESTING & SELF-CORRECTION INSTRUCTIONS

### Core Principle
When implementing features or fixing bugs:
1. ALWAYS make changes first
2. Test the changes by running the development server
3. Use browser automation to verify functionality
4. If tests fail, analyze the error and fix automatically
5. Repeat until all tests pass (up to 5 iterations)
6. Never ask for permission to fix issues - just fix them

### Testing Workflow
For every change:
1. Run `npm run dev` to start the development server
2. Use Playwright MCP to open browser and test the feature
3. Take screenshots for verification
4. Run automated tests with `npm test`
5. If errors occur, read logs, fix issues, and retry
6. Continue iterating until successful

### Browser Testing Requirements
- Always test actual user flows in the browser
- Verify visual elements are rendering correctly  
- Test interactions (clicks, form submissions, navigation)
- Check for console errors
- Validate API responses in Network tab
- Test both success and error scenarios

### Self-Correction Rules
- When an error occurs, analyze the stack trace immediately
- Fix the issue without asking for guidance
- Re-run tests after each fix
- Keep iterating until the feature works 100%
- Maximum 5 retry attempts before reporting persistent issues

### Quality Checks Before Completion
Before considering any task complete:
- [ ] Feature works in the browser
- [ ] No console errors
- [ ] All automated tests pass
- [ ] Code follows project conventions
- [ ] TypeScript has no errors
- [ ] Database migrations are applied if needed