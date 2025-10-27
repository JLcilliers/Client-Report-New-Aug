# API Architecture Documentation
## SEO Reporting Platform - Comprehensive API Reference

**Document Version:** 1.0
**Last Updated:** 2025-10-06
**Platform:** Next.js 14 App Router
**Total Endpoints:** 136

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Architecture Overview](#architecture-overview)
3. [Authentication & Authorization](#authentication--authorization)
4. [API Endpoint Catalog](#api-endpoint-catalog)
5. [Data Models & Schema](#data-models--schema)
6. [Request/Response Patterns](#requestresponse-patterns)
7. [Error Handling](#error-handling)
8. [API Design Patterns](#api-design-patterns)
9. [Data Flow Architecture](#data-flow-architecture)
10. [Security Considerations](#security-considerations)
11. [Performance & Caching](#performance--caching)
12. [Recommendations](#recommendations)

---

## Executive Summary

The SEO Reporting Platform is a comprehensive Next.js 14 application built with the App Router architecture, featuring 136 API endpoints organized into 8 primary functional areas. The platform integrates with Google Analytics, Google Search Console, and PageSpeed Insights to provide automated SEO reporting, keyword tracking, and performance monitoring.

### Key Statistics
- **Total API Routes:** 136 endpoints
- **Authentication Methods:** Google OAuth 2.0, JWT sessions, Cookie-based tokens
- **Database:** PostgreSQL with Prisma ORM (Production), SQLite (Development)
- **API Style:** RESTful with Next.js Route Handlers
- **Primary Integrations:** Google Analytics Data API, Google Search Console API, PageSpeed Insights API

### Critical Findings
1. **No API Versioning** - All endpoints lack version control
2. **Mixed Authentication Patterns** - Cookie-based, session-based, and token-based auth coexist
3. **Inconsistent Error Handling** - No standardized error response format
4. **No Rate Limiting** - Except for cron job (Bearer token auth)
5. **Extensive Debug/Test Endpoints** - 30+ test endpoints in production codebase

---

## Architecture Overview

### Technology Stack
```
Framework: Next.js 14 (App Router)
Language: TypeScript
ORM: Prisma
Database: PostgreSQL (Production) / SQLite (Development)
Authentication: NextAuth.js
API Style: RESTful Route Handlers
Deployment: Vercel
Live URL: https://searchsignal.online
```

### Directory Structure
```
app/api/
├── accounts/                    # User account management
├── admin/                       # Admin operations (clients, reports, google accounts)
├── ai-visibility/               # AI visibility tracking
├── analytics/                   # Google Analytics integration
├── auth/                        # Authentication & OAuth flows
├── cron/                        # Scheduled jobs
├── data/                        # Data fetching endpoints
├── debug/                       # Debug utilities
├── google/                      # Google API integrations
├── google-accounts/             # Google account management
├── health/                      # Health check
├── ping/                        # Simple ping endpoint
├── public/                      # Public report access (no auth)
├── reports/                     # Report management
├── search-console/              # Search Console integration
├── sentry-example/              # Error monitoring test
├── sentry-test/                 # Error monitoring test
├── seo/                         # SEO analysis tools
├── test/                        # Test endpoints
└── test-oauth/                  # OAuth testing
```

### API Route Distribution
| Category | Count | Description |
|----------|-------|-------------|
| Admin Operations | 23 | Client management, Google accounts, reports |
| Authentication | 15 | OAuth flows, session management |
| Google Integrations | 8 | Properties, connections, token management |
| SEO Analysis | 16 | Technical SEO, performance, audits |
| Reports | 10 | Report CRUD, data fetching |
| Public Access | 4 | Shareable report access |
| Data Fetching | 6 | Analytics, Search Console data |
| Test/Debug | 30 | Development and debugging |
| Utilities | 5 | Health, ping, cron |
| AI Visibility | 1 | AI platform tracking |
| Analytics | 1 | Google Analytics properties |
| Search Console | 1 | Sites listing |
| Accounts | 1 | Account management |

---

## Authentication & Authorization

### Authentication Methods

#### 1. Google OAuth 2.0 (Primary)
```typescript
// Configuration: lib/auth-options-simple.ts
Provider: GoogleProvider
Strategy: JWT
Scopes:
  - openid
  - email
  - profile
  - https://www.googleapis.com/auth/analytics.readonly
  - https://www.googleapis.com/auth/webmasters.readonly

Access Type: offline (for refresh tokens)
Prompt: consent select_account
```

**OAuth Flow Endpoints:**
- `POST /api/auth/[...nextauth]` - NextAuth.js handler
- `GET /api/auth/google/callback` - OAuth callback
- `GET /api/auth/google/admin-callback` - Admin OAuth callback
- `POST /api/auth/google/add-account` - Add additional Google account

#### 2. Cookie-Based Authentication
```typescript
Cookies:
  - google_access_token: Google OAuth access token
  - google_refresh_token: Google OAuth refresh token
  - google_user_email: User email identifier

Storage: HTTP-only cookies
Expiration: Based on Google token expiry
```

#### 3. Session-Based Authentication
```typescript
// NextAuth.js sessions
Strategy: JWT
Session Storage: In-memory (JWT tokens)
Session Check: GET /api/auth/check-session
```

#### 4. Cron Job Authentication
```typescript
// POST /api/cron/update-keywords
Authorization: Bearer {CRON_SECRET}
Header: Authorization: Bearer {token}
Environment Variable: CRON_SECRET
```

### Authentication Patterns by Endpoint Category

| Category | Auth Method | Implementation |
|----------|-------------|----------------|
| Admin Endpoints | Cookie + User validation | `getCurrentUser()` helper |
| Public Endpoints | None | Publicly accessible |
| Google API Endpoints | Cookie or Account-based tokens | Token refresh if expired |
| Test/Debug Endpoints | Mixed (some none, some cookie) | Development only |
| Cron Endpoints | Bearer token | `CRON_SECRET` validation |
| Report Endpoints | Mixed (public for sharing, auth for management) | Depends on operation |

### Token Management

#### Token Storage (Database)
```prisma
model GoogleTokens {
  google_sub: String
  access_token: String
  refresh_token: String
  expires_at: BigInt
  scope: String
}

model GoogleAccount {
  email: String
  accessToken: String
  refreshToken: String
  expiresAt: Int
}
```

#### Token Refresh Logic
```typescript
// lib/google/refresh-token.ts
export async function getValidGoogleToken(accountId: string): Promise<string | null>
  1. Fetch token from GoogleTokens table
  2. Check if expires_at > current time
  3. If expired, refresh using refresh_token
  4. Update database with new tokens
  5. Return valid access_token
```

### Authorization Patterns

#### User-Level Authorization
```typescript
// Helper function in many admin endpoints
async function getCurrentUser() {
  const cookieStore = cookies()
  const userEmail = cookieStore.get('google_user_email')?.value

  if (!userEmail) return null

  const user = await prisma.user.findFirst({
    where: { email: decodeURIComponent(userEmail) }
  })

  return user
}
```

#### Report Access Authorization
```typescript
// Public reports use shareable tokens
// No auth required for: GET /api/public/report/[slug]
// Auth required for:
//   - Report creation
//   - Report editing
//   - Report deletion
//   - Data refresh
```

---

## API Endpoint Catalog

### 1. Authentication Endpoints (`/api/auth/*`)

#### Core Auth
| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/auth/[...nextauth]` | GET, POST | None | NextAuth.js handler (sign in, callback, session) |
| `/api/auth/check-session` | GET | Cookie | Validate current session |
| `/api/auth/logout` | POST | Cookie | Logout user |
| `/api/auth/remember-me` | POST | Cookie | Set remember me cookie |

#### Google OAuth
| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/auth/google/callback` | GET | None | Google OAuth callback handler |
| `/api/auth/google/admin-callback` | GET | None | Admin Google OAuth callback |
| `/api/auth/google/add-account` | POST | Cookie | Add additional Google account |
| `/api/auth/callback/google` | GET | None | Alternative callback route |
| `/api/auth/callback/google/admin-callback` | GET | None | Nested admin callback |

#### Development/Debug Auth
| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/auth/demo-login` | POST | None | Demo account login |
| `/api/auth/dev-login` | POST | None | Development login |
| `/api/auth/simple-admin` | POST | None | Simple admin login |
| `/api/auth/debug-callback` | GET | None | Debug OAuth callback |
| `/api/auth/test-db` | GET | None | Test database connection |
| `/api/auth/test-oauth` | GET | None | Test OAuth configuration |

#### Utility Auth
| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/auth/cleanup-sessions` | POST | Cookie | Clean up old sessions |
| `/api/auth/sync-tokens` | POST | Cookie | Sync Google tokens |

---

### 2. Admin Endpoints (`/api/admin/*`)

#### Client Management
| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/admin/clients` | GET | Cookie | List all clients |
| `/api/admin/clients` | POST | Cookie | Create new client |
| `/api/admin/clients/[id]` | GET | Cookie | Get client details |
| `/api/admin/clients/[id]` | PATCH | Cookie | Update client |
| `/api/admin/clients/[id]` | DELETE | Cookie | Delete client (cascading) |

#### Client Keywords
| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/admin/clients/[id]/keywords` | GET | Cookie | List client keywords |
| `/api/admin/clients/[id]/keywords` | POST | Cookie | Add keyword to track |
| `/api/admin/clients/[id]/keywords/[keywordId]` | GET | Cookie | Get keyword details |
| `/api/admin/clients/[id]/keywords/[keywordId]` | PATCH | Cookie | Update keyword |
| `/api/admin/clients/[id]/keywords/[keywordId]` | DELETE | Cookie | Remove keyword |

#### Client Competitors
| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/admin/clients/[id]/competitors` | GET | Cookie | List competitors |
| `/api/admin/clients/[id]/competitors` | POST | Cookie | Add competitor |
| `/api/admin/clients/[id]/competitors/[competitorId]` | GET | Cookie | Get competitor details |
| `/api/admin/clients/[id]/competitors/[competitorId]` | PATCH | Cookie | Update competitor |
| `/api/admin/clients/[id]/competitors/[competitorId]` | DELETE | Cookie | Remove competitor |

#### Google Account Management
| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/admin/google-accounts` | GET | Cookie | List all Google accounts |
| `/api/admin/google-accounts` | POST | Cookie | Add Google account (not implemented) |
| `/api/admin/google-accounts/connect` | GET | Cookie | Initiate Google account connection |
| `/api/admin/google-accounts/callback` | GET | None | Google account OAuth callback |
| `/api/admin/google-accounts/refresh-all` | POST | Cookie | Refresh all account tokens |
| `/api/admin/google-accounts/[id]` | GET | Cookie | Get account details |
| `/api/admin/google-accounts/[id]` | PATCH | Cookie | Update account |
| `/api/admin/google-accounts/[id]` | DELETE | Cookie | Delete account |
| `/api/admin/google-accounts/[id]/refresh` | POST | Cookie | Refresh specific account token |
| `/api/admin/google-accounts/[id]/tokeninfo` | GET | Cookie | Get token information |
| `/api/admin/google-accounts/[id]/properties` | GET | Cookie | Get account properties |

#### Admin Reports
| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/admin/reports` | GET | Cookie | List all reports |
| `/api/admin/reports/[reportId]` | GET | Cookie | Get report details |
| `/api/admin/reports/[reportId]` | PATCH | Cookie | Update report |
| `/api/admin/reports/[reportId]` | DELETE | Cookie | Delete report |
| `/api/admin/reports/[reportId]/keywords` | GET | Cookie | Get report keywords |
| `/api/admin/reports/[reportId]/keywords` | POST | Cookie | Add keyword to report |
| `/api/admin/reports/[reportId]/keywords/[keywordId]` | PATCH | Cookie | Update report keyword |
| `/api/admin/reports/[reportId]/keywords/[keywordId]` | DELETE | Cookie | Remove report keyword |

#### Admin Utilities
| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/admin/database-check` | GET | Cookie | Check database connection |
| `/api/admin/debug-snapshot` | GET | Cookie | Get system debug snapshot |
| `/api/admin/disconnect-google` | POST | Cookie | Disconnect Google account |
| `/api/admin/migrate` | POST | Cookie | Run database migrations |

---

### 3. Google Integration Endpoints (`/api/google/*`)

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/google/properties` | POST | Cookie | Fetch Google properties (Analytics + Search Console) |
| `/api/google/properties/[accountId]` | GET | Cookie | Get properties for specific account |
| `/api/google/fetch-properties` | POST | Cookie | Alternative properties fetch |
| `/api/google/connections/[accountId]` | GET | Cookie | Get connection details |
| `/api/google/connections/[accountId]` | DELETE | Cookie | Remove connection |
| `/api/google/debug-token` | GET | Cookie | Debug Google token |

---

### 4. SEO Analysis Endpoints (`/api/seo/*`)

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/seo/meta-tags` | POST | None | Analyze page meta tags |
| `/api/seo/robots` | POST | None | Check robots.txt |
| `/api/seo/sitemap` | POST | None | Validate sitemap |
| `/api/seo/ssl` | POST | None | Check SSL certificate |
| `/api/seo/structured-data` | POST | None | Validate structured data |
| `/api/seo/mobile-usability` | POST | None | Test mobile usability |
| `/api/seo/core-web-vitals` | POST | None | Measure Core Web Vitals |
| `/api/seo/page-speed-comprehensive` | POST | None | Comprehensive PageSpeed test |
| `/api/seo/content-analysis` | POST | None | Analyze content quality |
| `/api/seo/link-analysis` | POST | None | Analyze internal/external links |
| `/api/seo/crawlability-analysis` | POST | None | Check site crawlability |
| `/api/seo/duplicate-content-404` | POST | None | Find duplicate content and 404s |
| `/api/seo/technical-audit` | POST | None | Full technical SEO audit |
| `/api/seo/whois` | POST | None | Domain WHOIS lookup |

---

### 5. Report Management Endpoints (`/api/reports/*`)

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/reports` | GET | None | List reports (stub) |
| `/api/reports/create` | POST | Cookie | Create new report |
| `/api/reports/route` | GET | None | Reports list endpoint |
| `/api/reports/by-id` | GET | Cookie | Get report by ID |
| `/api/reports/generate` | POST | Cookie | Generate report |
| `/api/reports/refresh` | POST | Cookie | Refresh report data |
| `/api/reports/get-seo-data` | POST | Cookie | Get SEO data |
| `/api/reports/save-seo-data` | POST | Cookie | Save SEO data |
| `/api/reports/agency-updates` | GET | Cookie | Get agency updates |

#### Report-Specific Endpoints
| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/reports/[slug]/competitors` | GET | Mixed | Get competitors for report |
| `/api/reports/[slug]/competitors` | POST | Mixed | Add competitor to report |
| `/api/reports/[slug]/competitors/[id]` | PATCH | Mixed | Update competitor |
| `/api/reports/[slug]/competitors/[id]` | DELETE | Mixed | Delete competitor |
| `/api/reports/[slug]/action-plans` | GET | Mixed | List action plans |
| `/api/reports/[slug]/action-plans` | POST | Mixed | Create action plan |
| `/api/reports/[slug]/action-plans/[planId]` | GET | Mixed | Get action plan |
| `/api/reports/[slug]/action-plans/[planId]` | PATCH | Mixed | Update action plan |
| `/api/reports/[slug]/action-plans/[planId]` | DELETE | Mixed | Delete action plan |
| `/api/reports/[slug]/executive-summary` | GET | Mixed | Get executive summary |
| `/api/reports/[slug]/ai-visibility` | GET | Mixed | Get AI visibility metrics |

---

### 6. Public Access Endpoints (`/api/public/*`)

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/public/report/[slug]` | GET | None | Get public report by slug |
| `/api/public/report/[slug]/data` | GET | None | Get report data |
| `/api/public/report/[slug]/refresh` | POST | None | Refresh report (public) |
| `/api/public/report/[slug]/keywords/refresh` | POST | None | Refresh keywords |

---

### 7. Data Fetching Endpoints (`/api/data/*`)

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/data/fetch-analytics` | POST | Cookie/Token | Fetch Google Analytics data |
| `/api/data/fetch-search-console` | POST | Cookie/Token | Fetch Search Console data |
| `/api/data/fetch-comprehensive-metrics` | POST | Cookie/Token | Fetch all metrics |
| `/api/data/pagespeed` | POST | Cookie/Token | Fetch PageSpeed data |
| `/api/data/[clientId]` | GET | Cookie | Get client data |
| `/api/data/ensure-table` | POST | Cookie | Ensure database table exists |

---

### 8. Cron Job Endpoints (`/api/cron/*`)

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/cron/update-keywords` | POST | Bearer Token | Weekly keyword update job |
| `/api/cron/update-keywords` | GET | None (Dev only) | Manual trigger in development |

**Cron Job Details:**
- **Schedule:** Weekly (configured in Vercel)
- **Authentication:** `Authorization: Bearer ${CRON_SECRET}`
- **Function:** Updates all active keywords for all clients
- **Rate Limiting:** 1 second between clients, 100ms between keywords
- **Features:**
  - Fetches Search Console data for each keyword
  - Calculates position changes
  - Creates keyword alerts for significant changes
  - Logs execution to database

---

### 9. Debug & Test Endpoints (`/api/debug/*`, `/api/test/*`)

#### Debug Endpoints
| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/debug/check-connection` | GET | None | Check database connection |
| `/api/debug/check-setup` | GET | None | Verify environment setup |
| `/api/debug/check-tables` | GET | None | List database tables |
| `/api/debug/check-token` | GET | Cookie | Verify Google token |
| `/api/debug/cookies` | GET | None | List all cookies |
| `/api/debug/oauth-config` | GET | None | Show OAuth configuration |
| `/api/debug/report-creation` | POST | None | Debug report creation |
| `/api/debug/session` | GET | Cookie | Show session data |

#### Test Endpoints
| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/test/analytics` | GET | None | Test Analytics API |
| `/api/test/analytics-check` | GET | None | Check Analytics setup |
| `/api/test/analytics-test` | GET | None | Alternative Analytics test |
| `/api/test/check-env` | GET | None | Check environment variables |
| `/api/test/check-tables` | GET | None | Verify database tables |
| `/api/test/data-validation` | GET | None | Validate data integrity |
| `/api/test/db-check` | GET | None | Database connection test |
| `/api/test/direct-auth` | GET | None | Test direct authentication |
| `/api/test/fetch-data` | GET | None | Test data fetching |
| `/api/test/fix-report-properties` | POST | None | Fix report properties |
| `/api/test/google-auth` | GET | None | Test Google authentication |
| `/api/test/list-reports` | GET | None | List all reports (test) |
| `/api/test/oauth-debug` | GET | None | Debug OAuth flow |
| `/api/test/oauth-production-test` | GET | None | Test production OAuth |
| `/api/test/oauth-url` | GET | None | Generate OAuth URL |
| `/api/test/oauth-verify` | GET | None | Verify OAuth tokens |
| `/api/test/pagespeed` | GET | None | Test PageSpeed API |
| `/api/test/production-oauth` | GET | None | Production OAuth test |
| `/api/test/search-console` | GET | None | Test Search Console API |
| `/api/test/simple-reports` | GET | None | Simple reports list |
| `/api/test/verify-oauth` | GET | None | Verify OAuth configuration |
| `/api/test/verify-property-storage` | GET | None | Verify property storage |
| `/api/test/verify-search-console` | GET | None | Verify Search Console setup |

---

### 10. Utility Endpoints

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/health` | GET | None | Health check endpoint |
| `/api/ping` | GET | None | Simple ping endpoint |
| `/api/accounts` | GET | None | Account management (stub) |
| `/api/analytics/properties` | GET | Cookie | Get Analytics properties |
| `/api/search-console/sites` | GET | None | Get Search Console sites (stub) |
| `/api/google-accounts` | GET | None | Google accounts list |
| `/api/ai-visibility/check-citations` | POST | Cookie | Check AI citations |
| `/api/sentry-example` | GET | None | Sentry error example |
| `/api/sentry-test` | GET | None | Sentry test endpoint |
| `/api/test-env` | GET | None | Test environment variables |
| `/api/test-oauth` | GET | None | Test OAuth flow |
| `/api/test-oauth/callback` | GET | None | OAuth test callback |

---

## Data Models & Schema

### Core Models

#### User Model
```prisma
model User {
  id             String
  email          String @unique
  emailVerified  DateTime?
  name           String?
  image          String?

  // Relations
  accounts       Account[]
  sessions       Session[]
  reports        Report[]
  clientReports  ClientReport[]
  googleTokens   GoogleTokens[]
  googleAccounts GoogleAccount[]
}
```

#### ClientReport Model (Primary Report Entity)
```prisma
model ClientReport {
  id                      String
  clientName              String
  reportName              String
  googleAccountId         String
  ga4PropertyId           String
  searchConsolePropertyId String
  shareableLink           String @unique
  shareableId             String @unique
  isActive                Boolean
  refreshInterval         String
  userId                  String

  // Relations
  user                    User
  accessLogs              ReportAccessLog[]
  cache                   ReportCache[]
  seoAudits               SEOAudit[]
  competitors             Competitor[]
  keywords                Keyword[]
  keywordGroups           KeywordGroup[]
  keywordCannibalization  KeywordCannibalization[]
  aiVisibility            AIVisibilityProfile?
}
```

#### Keyword Model
```prisma
model Keyword {
  id                    String
  clientReportId        String
  keyword               String
  searchVolume          Int?
  difficulty            Int?
  priority              Int
  targetUrl             String?
  trackingStatus        String
  tags                  String?

  // Relations
  clientReport          ClientReport
  performanceHistory    KeywordPerformance[]
  variations            KeywordVariation[]
  competitorRankings    CompetitorKeywordRank[]
  alerts                KeywordAlert[]
}
```

#### KeywordPerformance Model
```prisma
model KeywordPerformance {
  id                    String
  keywordId             String
  weekStartDate         DateTime
  weekEndDate           DateTime
  avgPosition           Float
  bestPosition          Int
  impressions           Int
  clicks                Int
  ctr                   Float
  rankingUrl            String?
  featuredSnippet       Boolean
  siteLinks             Boolean
  peopleAlsoAsk         Boolean
  dataSource            String

  keyword               Keyword
}
```

### Supporting Models

#### GoogleTokens
```prisma
model GoogleTokens {
  id            String
  google_sub    String
  email         String?
  access_token  String
  refresh_token String
  scope         String?
  expires_at    BigInt
  userId        String?
  user          User?
}
```

#### GoogleAccount
```prisma
model GoogleAccount {
  id           String
  userId       String
  email        String @unique
  accessToken  String
  refreshToken String?
  expiresAt    Int?
  scope        String?
  user         User
}
```

#### SEOAudit
```prisma
model SEOAudit {
  id                   String
  reportId             String?
  clientReportId       String?
  domain               String
  url                  String
  overallScore         Int
  performanceScore     Int
  seoScore             Int
  accessibilityScore   Int
  securityScore        Int
  mobileScore          Int
  coreWebVitals        String? // JSON
  pageSpeedMetrics     String? // JSON
  mobileUsability      String? // JSON
  crawlabilityData     String? // JSON
  metaTagsAnalysis     String? // JSON
  structuredData       String? // JSON
  securityChecks       String? // JSON
  technicalIssues      String? // JSON
  recommendations      String? // JSON
  auditedAt            DateTime
}
```

#### ReportCache
```prisma
model ReportCache {
  id        String
  reportId  String
  dataType  String // 'ga4', 'searchConsole', 'webVitals', 'combined'
  data      String // JSON string
  cachedAt  DateTime
  expiresAt DateTime
  report    ClientReport
}
```

#### Competitor
```prisma
model Competitor {
  id              String
  clientReportId  String
  name            String
  domain          String
  notes           String?
  addedAt         DateTime
  lastAnalyzed    DateTime?
  clientReport    ClientReport
}
```

### AI Visibility Models

#### AIVisibilityProfile
```prisma
model AIVisibilityProfile {
  id                    String
  clientReportId        String @unique
  lastUpdated           DateTime
  overallScore          Float
  sentimentScore        Float
  shareOfVoice          Float
  citationCount         Int
  accuracyScore         Float

  clientReport          ClientReport
  platformMetrics       AIPlatformMetric[]
  citations             AICitation[]
  queries               AIQueryInsight[]
  recommendations       AIRecommendation[]
  trends                AIVisibilityTrend[]
  competitors           AICompetitorAnalysis[]
}
```

#### AIPlatformMetric
```prisma
model AIPlatformMetric {
  id                    String
  profileId             String
  platform              String // google_ai, chatgpt, perplexity, claude, gemini
  visibilityScore       Float
  citationCount         Int
  sentimentScore        Float
  prominenceScore       Float
  lastChecked           DateTime
  responseData          Json?
  profile               AIVisibilityProfile
}
```

---

## Request/Response Patterns

### Standard Success Response
```typescript
{
  success: true,
  data: any,
  message?: string,
  timestamp?: string
}
```

### Standard Error Response
```typescript
{
  error: string,
  details?: string,
  code?: string,
  status?: number
}
```

### Common Request Patterns

#### 1. Client Creation
```typescript
POST /api/admin/clients
Content-Type: application/json

{
  "name": "Client Name",
  "domain": "example.com",
  "googleAccountId": "account_id", // optional
  "ga4PropertyId": "properties/123456", // optional
  "searchConsolePropertyId": "sc-domain:example.com" // optional
}

Response:
{
  "client": {
    "id": "clx...",
    "name": "Client Name",
    "domain": "example.com",
    "report_token": "abc123...",
    "slug": "abc123...",
    "created_at": "2025-10-06T...",
    "updated_at": "2025-10-06T..."
  },
  "message": "Client created successfully",
  "existing": false
}
```

#### 2. Google Properties Fetch
```typescript
POST /api/google/properties
Content-Type: application/json

{
  "connectionId": "google_account_id"
}

Response:
{
  "searchConsole": [
    {
      "siteUrl": "sc-domain:example.com",
      "permissionLevel": "siteOwner"
    }
  ],
  "analytics": [
    {
      "name": "Account Name",
      "id": "accounts/123",
      "properties": [
        {
          "name": "properties/123456",
          "id": "123456",
          "displayName": "Example Property"
        }
      ]
    }
  ]
}
```

#### 3. Analytics Data Fetch
```typescript
POST /api/data/fetch-analytics
Content-Type: application/json

{
  "propertyId": "123456",
  "startDate": "2025-09-01",
  "endDate": "2025-10-01",
  "accountId": "google_account_id", // optional
  "reportId": "report_id" // optional
}

Response:
{
  "success": true,
  "analytics": {
    "summary": {
      "users": 1234,
      "sessions": 2345,
      "pageviews": 5678,
      "bounceRate": 45.67,
      "avgSessionDuration": 123.45,
      "newUsers": 567
    },
    "trafficSources": [
      {
        "source": "Organic Search",
        "users": 678,
        "sessions": 890,
        "percentage": 38.0
      }
    ],
    "topPages": [
      {
        "page": "/home",
        "sessions": 456,
        "users": 345,
        "bounceRate": 34.5,
        "avgSessionDuration": 156.7
      }
    ],
    "dailyData": []
  },
  "propertyId": "properties/123456",
  "dateRange": {
    "startDate": "2025-09-01",
    "endDate": "2025-10-01"
  }
}
```

#### 4. Search Console Data Fetch
```typescript
POST /api/data/fetch-search-console
Content-Type: application/json

{
  "propertyId": "sc-domain:example.com",
  "startDate": "2025-09-01",
  "endDate": "2025-10-01",
  "accountId": "google_account_id"
}

Response:
{
  "success": true,
  "searchConsole": {
    "summary": {
      "clicks": 1234,
      "impressions": 45678,
      "ctr": 2.7,
      "position": 12.5
    },
    "topQueries": [
      {
        "query": "example keyword",
        "clicks": 123,
        "impressions": 2345,
        "ctr": 5.24,
        "position": 8.5
      }
    ],
    "topPages": [
      {
        "page": "https://example.com/page",
        "clicks": 234,
        "impressions": 3456,
        "ctr": 6.77,
        "position": 7.2
      }
    ]
  },
  "propertyId": "sc-domain:example.com",
  "dateRange": {
    "startDate": "2025-09-01",
    "endDate": "2025-10-01"
  }
}
```

#### 5. SEO Meta Tags Analysis
```typescript
POST /api/seo/meta-tags
Content-Type: application/json

{
  "url": "https://example.com"
}

Response:
{
  "url": "https://example.com",
  "title": {
    "content": "Example Website - Home",
    "length": 25,
    "issues": []
  },
  "description": {
    "content": "This is an example website description...",
    "length": 145,
    "issues": []
  },
  "keywords": "example, website, seo",
  "canonical": "https://example.com/",
  "robots": "index, follow",
  "openGraph": {
    "title": "Example Website",
    "description": "...",
    "image": "https://example.com/og-image.jpg",
    "url": "https://example.com",
    "type": "website",
    "siteName": "Example",
    "issues": []
  },
  "twitter": {
    "card": "summary_large_image",
    "title": "Example Website",
    "description": "...",
    "image": "https://example.com/twitter-image.jpg",
    "site": "@example",
    "creator": "@example",
    "issues": []
  },
  "viewport": "width=device-width, initial-scale=1",
  "charset": "utf-8",
  "language": "en",
  "structuredData": [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": "Example"
    }
  ],
  "headings": {
    "h1": ["Main Heading"],
    "h2": ["Subheading 1", "Subheading 2"],
    "h3": ["Sub-subheading 1"],
    "hierarchy_issues": []
  },
  "images": {
    "total": 15,
    "withoutAlt": 2,
    "issues": ["2 images without alt text"]
  },
  "links": {
    "internal": 45,
    "external": 8,
    "nofollow": 3,
    "issues": []
  },
  "issues": [],
  "recommendations": [
    "Add Open Graph tags for better social sharing"
  ],
  "seoScore": 87
}
```

#### 6. Keyword Creation
```typescript
POST /api/admin/clients/[id]/keywords
Content-Type: application/json

{
  "keyword": "example keyword",
  "priority": 1,
  "targetUrl": "https://example.com/page",
  "searchVolume": 1200,
  "difficulty": 45
}

Response:
{
  "success": true,
  "keyword": {
    "id": "clx...",
    "keyword": "example keyword",
    "priority": 1,
    "trackingStatus": "active",
    "targetUrl": "https://example.com/page",
    "searchVolume": 1200,
    "difficulty": 45,
    "createdAt": "2025-10-06T..."
  }
}
```

#### 7. Competitor Addition
```typescript
POST /api/reports/[slug]/competitors
Content-Type: application/json

{
  "name": "Competitor Name",
  "domain": "competitor.com",
  "notes": "Main competitor in industry"
}

Response:
{
  "id": "clx...",
  "clientReportId": "clx...",
  "name": "Competitor Name",
  "domain": "competitor.com",
  "notes": "Main competitor in industry",
  "addedAt": "2025-10-06T...",
  "createdAt": "2025-10-06T...",
  "updatedAt": "2025-10-06T..."
}
```

#### 8. Public Report Access
```typescript
GET /api/public/report/[slug]

Response:
{
  "id": "clx...",
  "name": "Client SEO Report",
  "clientName": "Client Name",
  "slug": "abc123...",
  "shareableLink": "https://searchsignal.online/report/abc123...",
  "search_console_properties": ["sc-domain:example.com"],
  "analytics_properties": ["properties/123456"],
  "isActive": true,
  "refreshInterval": "weekly",
  "created_at": "2025-09-01T...",
  "updated_at": "2025-10-01T...",
  "cachedData": {
    // Cached analytics and search console data
  },
  "keywordPerformance": {
    "keywords": [
      {
        "query": "example keyword",
        "clicks": 123,
        "impressions": 2345,
        "ctr": 5.24,
        "position": 8.5,
        "previousPosition": 9.2,
        "positionChange": 0.7,
        "rankingPage": "https://example.com/page"
      }
    ],
    "improved": [...],
    "declined": [...],
    "new": [...],
    "stats": {
      "total": 45,
      "improved": 12,
      "declined": 8,
      "new": 5
    }
  }
}
```

---

## Error Handling

### Error Response Patterns

The platform uses inconsistent error handling across endpoints. Common patterns include:

#### Pattern 1: Simple Error Object
```typescript
{
  "error": "Error message"
}
```

#### Pattern 2: Error with Details
```typescript
{
  "error": "Error message",
  "details": "Detailed error information"
}
```

#### Pattern 3: Error with Status Code
```typescript
{
  "error": "Error message",
  "details": "Detailed error information",
  "code": "ERROR_CODE",
  "status": 500
}
```

#### Pattern 4: Prisma-Specific Errors
```typescript
{
  "error": "Database error",
  "details": "Detailed error message",
  "code": "P2025", // Prisma error code
  "meta": {
    "field_name": "field",
    "model_name": "Model"
  }
}
```

### HTTP Status Codes Used

| Status Code | Usage |
|-------------|-------|
| 200 | Successful GET/POST/PATCH |
| 201 | Resource created successfully |
| 400 | Bad request (missing parameters, validation errors) |
| 401 | Unauthorized (no valid token/session) |
| 404 | Resource not found |
| 409 | Conflict (duplicate resource) |
| 500 | Internal server error |
| 501 | Not implemented |

### Common Error Scenarios

#### 1. Authentication Errors
```typescript
Status: 401
{
  "error": "Authentication required",
  "details": "No valid Google tokens found"
}

{
  "error": "Unauthorized"
}

{
  "error": "Google authentication required",
  "details": "No valid Google tokens found"
}
```

#### 2. Validation Errors
```typescript
Status: 400
{
  "error": "Name and domain are required"
}

{
  "error": "URL is required"
}

{
  "error": "Invalid domain format. Please enter a valid domain like example.com"
}
```

#### 3. Not Found Errors
```typescript
Status: 404
{
  "error": "Report not found"
}

{
  "error": "Client not found"
}

{
  "error": "Connection not found"
}
```

#### 4. Conflict Errors
```typescript
Status: 409
{
  "error": "A competitor with this domain already exists for this brand"
}
```

#### 5. Database Errors
```typescript
Status: 500
{
  "error": "Failed to fetch clients",
  "details": "Prisma error message"
}

Status: 400
{
  "error": "Cannot delete client due to existing dependencies in Model",
  "details": "Foreign key constraint failed on field: field_name",
  "code": "P2003",
  "meta": {...}
}
```

#### 6. External API Errors
```typescript
Status: 500
{
  "error": "Failed to fetch Analytics data",
  "details": "Google API error message",
  "code": 403,
  "status": 403
}

{
  "error": "Failed to refresh Google token"
}

Status: 401
{
  "error": "Failed to fetch page"
}
```

### Error Logging

Most endpoints use console logging for errors:
```typescript
console.error('Error message:', error);
console.error('[Context] Error details:', error.message);
```

Some endpoints use structured logging:
```typescript
await prisma.log.create({
  data: {
    level: 'error',
    source: 'api/endpoint',
    message: 'Error description',
    meta: {
      error: error.message,
      stack: error.stack
    }
  }
});
```

---

## API Design Patterns

### 1. Route Handler Pattern (Next.js 14 App Router)
All API routes use Next.js 14 App Router route handlers:
```typescript
// app/api/endpoint/route.ts
export async function GET(request: NextRequest) { }
export async function POST(request: NextRequest) { }
export async function PATCH(request: NextRequest) { }
export async function DELETE(request: NextRequest) { }
```

### 2. Dynamic Route Parameters
```typescript
// app/api/resource/[id]/route.ts
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
}

// With async params (Next.js 15 compatible)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
}
```

### 3. Database Access Pattern
```typescript
import { getPrisma } from '@/lib/db/prisma';

export async function GET() {
  const prisma = getPrisma();
  const data = await prisma.model.findMany();
  return NextResponse.json(data);
}
```

### 4. Authentication Pattern
```typescript
async function getCurrentUser() {
  const cookieStore = cookies();
  const userEmail = cookieStore.get('google_user_email')?.value;
  if (!userEmail) return null;
  return await prisma.user.findFirst({ where: { email: decodeURIComponent(userEmail) } });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }
  // Proceed with authenticated logic
}
```

### 5. Token Validation Pattern
```typescript
import { getValidGoogleToken } from '@/lib/google/refresh-token';

export async function POST(request: NextRequest) {
  const { accountId } = await request.json();
  const accessToken = await getValidGoogleToken(accountId);

  if (!accessToken) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  // Use token for Google API calls
}
```

### 6. Google API Integration Pattern
```typescript
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

const oauth2Client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  `${process.env.NEXT_PUBLIC_URL}/api/auth/callback`
);

oauth2Client.setCredentials({ access_token: accessToken });

const analyticsData = google.analyticsdata('v1beta');
const response = await analyticsData.properties.runReport({
  property: `properties/${propertyId}`,
  requestBody: { ... },
  auth: oauth2Client
});
```

### 7. Caching Pattern
```typescript
// Check cache first
const cache = await prisma.reportCache.findFirst({
  where: {
    reportId: reportId,
    dataType: 'combined',
    expiresAt: { gt: new Date() }
  },
  orderBy: { cachedAt: 'desc' }
});

if (cache) {
  return JSON.parse(cache.data);
}

// Fetch fresh data
const freshData = await fetchData();

// Store in cache
await prisma.reportCache.create({
  data: {
    reportId: reportId,
    dataType: 'combined',
    data: JSON.stringify(freshData),
    expiresAt: new Date(Date.now() + 3600000) // 1 hour
  }
});
```

### 8. Error Handling Pattern
```typescript
export async function POST(request: NextRequest) {
  try {
    // Logic
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: "Error message", details: error.message },
      { status: 500 }
    );
  }
}
```

### 9. Cascading Delete Pattern
```typescript
// Manual cascading deletion to avoid foreign key constraints
export async function DELETE(request: NextRequest, { params }) {
  try {
    // Delete nested relations first (deepest first)
    await prisma.nestedModel.deleteMany({ where: { parentId: params.id } });
    await prisma.relatedModel.deleteMany({ where: { parentId: params.id } });

    // Finally delete parent
    await prisma.parentModel.delete({ where: { id: params.id } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.code === 'P2003') {
      return NextResponse.json(
        { error: "Foreign key constraint failed" },
        { status: 400 }
      );
    }
    throw error;
  }
}
```

### 10. Stub/Placeholder Pattern
Many endpoints are stubs returning minimal data:
```typescript
export async function GET() {
  return Response.json({
    success: true,
    endpoint: 'Endpoint Name',
    timestamp: new Date().toISOString()
  });
}
```

### 11. Dynamic Configuration
```typescript
export const dynamic = 'force-dynamic'; // Disable static optimization
export const runtime = 'nodejs'; // Use Node.js runtime
export const maxDuration = 60; // Maximum execution time
```

---

## Data Flow Architecture

### 1. Authentication Flow

```
User → /api/auth/[...nextauth] (Google OAuth)
  ↓
Google OAuth Consent Screen
  ↓
/api/auth/google/callback
  ↓
Store tokens in cookies:
  - google_access_token
  - google_refresh_token
  - google_user_email
  ↓
Create/Update User in database
  ↓
Create GoogleTokens record
  ↓
Redirect to dashboard
```

### 2. Report Creation Flow

```
User → /api/admin/clients (POST)
  ↓
Validate user authentication
  ↓
Check for Google account
  ↓
Generate shareableId & shareableLink
  ↓
Create ClientReport in database
  ↓
Return client details with shareable link
```

### 3. Data Fetching Flow (Analytics)

```
User → /api/data/fetch-analytics (POST)
  ↓
Extract accountId or reportId
  ↓
Get valid Google token (refresh if expired)
  ↓
Call Google Analytics Data API
  ↓
Process and aggregate data
  ↓
Return formatted analytics data
```

### 4. Data Fetching Flow (Search Console)

```
User → /api/data/fetch-search-console (POST)
  ↓
Get valid Google token
  ↓
Call Search Console API
  ↓
Aggregate clicks, impressions, CTR, position
  ↓
Return formatted search console data
```

### 5. Keyword Tracking Flow (Cron Job)

```
Cron trigger → /api/cron/update-keywords (POST)
  ↓
Validate Bearer token
  ↓
Get all active clients with tracked keywords
  ↓
For each client:
  ↓
  Get valid Google token
    ↓
    For each keyword:
      ↓
      Fetch Search Console data
      ↓
      Get previous performance
      ↓
      Calculate position change
      ↓
      Create KeywordPerformance record
      ↓
      Check for alerts (±5 positions, first page)
      ↓
      Rate limit (100ms)
  ↓
  Rate limit (1000ms)
  ↓
Log execution to database
  ↓
Return summary
```

### 6. Public Report Access Flow

```
Anonymous User → /api/public/report/[slug] (GET)
  ↓
Find report by shareableId
  ↓
Check for cached data
  ↓
If cached: Return cached data
  ↓
If not cached:
  ↓
  Fetch keyword performance
  ↓
  Process and aggregate
  ↓
  Return report data (no sensitive info)
```

### 7. SEO Analysis Flow

```
User → /api/seo/meta-tags (POST)
  ↓
Fetch target URL
  ↓
Parse HTML with Cheerio
  ↓
Extract meta tags, Open Graph, Twitter Cards
  ↓
Analyze headings, images, links
  ↓
Calculate SEO score
  ↓
Return analysis with recommendations
```

### 8. Token Refresh Flow

```
API call requires Google token
  ↓
Call getValidGoogleToken(accountId)
  ↓
Fetch GoogleTokens record
  ↓
Check if expires_at > current time
  ↓
If valid: Return access_token
  ↓
If expired:
    ↓
    Call Google OAuth token endpoint
    ↓
    POST with refresh_token
    ↓
    Receive new access_token and expires_at
    ↓
    Update GoogleTokens record
    ↓
    Return new access_token
```

### 9. Google Properties Fetch Flow

```
User → /api/google/properties (POST)
  ↓
Get connection from database
  ↓
Check if token expired
  ↓
If expired: Refresh token
  ↓
Fetch Search Console sites
  ↓
Fetch Analytics accounts
  ↓
For each Analytics account:
  ↓
  Fetch properties
  ↓
Return aggregated properties
```

### 10. Competitor Analysis Flow

```
User → /api/reports/[slug]/competitors (POST)
  ↓
Find report by slug or ID
  ↓
Validate domain format
  ↓
Check for existing competitor with same domain
  ↓
If exists: Return 409 Conflict
  ↓
If not: Create Competitor record
  ↓
Return competitor details
```

---

## Security Considerations

### 1. Authentication Vulnerabilities

**Issue:** Cookie-based authentication without CSRF protection
```typescript
// Cookies stored without httpOnly or secure flags in some places
cookieStore.set('google_access_token', token); // Missing security flags
```

**Recommendation:**
- Use httpOnly, secure, and sameSite flags for all cookies
- Implement CSRF tokens for state-changing operations
- Consider migrating to NextAuth.js sessions entirely

### 2. No API Rate Limiting

**Issue:** No rate limiting on most endpoints
- Only cron job has Bearer token authentication
- Public endpoints have no rate limiting
- Could lead to DoS attacks or abuse

**Recommendation:**
- Implement rate limiting with next-rate-limit or similar
- Add per-IP limits for public endpoints
- Add per-user limits for authenticated endpoints
- Consider using Vercel Edge Config for distributed rate limiting

### 3. Exposed Debug Endpoints

**Issue:** 30+ debug/test endpoints in production
```typescript
// These endpoints should not be in production:
/api/test/*
/api/debug/*
/api/auth/dev-login
/api/auth/demo-login
```

**Recommendation:**
- Remove all debug endpoints from production builds
- Use environment variable checks:
  ```typescript
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  ```

### 4. Token Exposure

**Issue:** Tokens stored in cookies without encryption
- Access tokens stored as plain text
- Refresh tokens stored as plain text
- No token rotation

**Recommendation:**
- Encrypt sensitive tokens before storing
- Implement token rotation
- Use short-lived access tokens (15 minutes)
- Store tokens in database only, not cookies

### 5. No Input Validation

**Issue:** Limited input validation on many endpoints
```typescript
// Missing validation:
const { url } = await request.json();
// No check for valid URL format before fetch
```

**Recommendation:**
- Use Zod or Yup for request validation
- Validate all user inputs
- Sanitize HTML/SQL inputs
- Check file types and sizes for uploads

### 6. SQL Injection via Prisma

**Issue:** While Prisma prevents SQL injection, dynamic queries could be risky
```typescript
// Safe (Prisma parameterized)
await prisma.user.findFirst({ where: { email: userEmail } });

// But watch for:
await prisma.$queryRaw`SELECT * FROM users WHERE email = ${userEmail}`;
```

**Recommendation:**
- Avoid $queryRaw and $executeRaw
- Use Prisma's type-safe query builders
- If raw queries needed, use Prisma.sql template literals

### 7. CORS Configuration

**Issue:** No explicit CORS configuration visible
- Could allow cross-origin requests from any domain
- No preflight request handling

**Recommendation:**
- Configure CORS explicitly in next.config.js
- Whitelist specific origins
- Set appropriate headers:
  ```typescript
  Access-Control-Allow-Origin: https://searchsignal.online
  Access-Control-Allow-Methods: GET, POST, PUT, DELETE
  Access-Control-Allow-Headers: Content-Type, Authorization
  ```

### 8. Environment Variable Exposure

**Issue:** Health endpoint exposes environment variable presence
```typescript
GET /api/health
{
  "hasGoogleClientId": true,
  "hasGoogleClientSecret": true,
  // ...
}
```

**Recommendation:**
- Remove environment variable checks from public endpoints
- Use internal monitoring tools instead

### 9. No API Versioning

**Issue:** All endpoints lack versioning
- Breaking changes affect all users immediately
- No graceful deprecation path

**Recommendation:**
- Implement versioning: `/api/v1/*`, `/api/v2/*`
- Document breaking changes
- Maintain backward compatibility for at least 2 versions

### 10. Missing Security Headers

**Recommendation:** Add security headers in next.config.js:
```typescript
headers: async () => [
  {
    source: '/:path*',
    headers: [
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy', value: 'geolocation=(), microphone=(), camera=()' },
      {
        key: 'Content-Security-Policy',
        value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; ..."
      }
    ]
  }
]
```

---

## Performance & Caching

### Caching Strategy

#### 1. Database-Level Caching
```prisma
model ReportCache {
  id        String
  reportId  String
  dataType  String // 'ga4', 'searchConsole', 'webVitals', 'combined'
  data      String // JSON
  cachedAt  DateTime
  expiresAt DateTime
}
```

**Usage:**
- Analytics data cached for 1 hour
- Search Console data cached for 1 hour
- Combined report data cached for 1 hour

**Implementation:**
```typescript
// Check cache
const cache = await prisma.reportCache.findFirst({
  where: {
    reportId: reportId,
    dataType: 'combined',
    expiresAt: { gt: new Date() }
  },
  orderBy: { cachedAt: 'desc' }
});

if (cache) {
  return JSON.parse(cache.data);
}

// Fetch and cache
const data = await fetchData();
await prisma.reportCache.create({
  data: {
    reportId,
    dataType: 'combined',
    data: JSON.stringify(data),
    expiresAt: new Date(Date.now() + 3600000) // 1 hour
  }
});
```

#### 2. HTTP Cache Headers
Most endpoints use:
```typescript
{ headers: { 'Cache-Control': 'no-store' } }
```

This disables caching, which is not optimal for performance.

**Recommendation:** Use appropriate cache headers:
```typescript
// For static data:
{ headers: { 'Cache-Control': 'public, max-age=3600, s-maxage=3600' } }

// For user-specific data:
{ headers: { 'Cache-Control': 'private, max-age=300' } }

// For frequently changing data:
{ headers: { 'Cache-Control': 'no-cache, must-revalidate' } }
```

#### 3. Next.js Route Caching
Some routes use dynamic configuration:
```typescript
export const dynamic = 'force-dynamic'; // Disable static optimization
```

**Issue:** This disables Next.js optimizations for routes that could be cached.

**Recommendation:**
- Only use `dynamic = 'force-dynamic'` when necessary
- Use ISR (Incremental Static Regeneration) for public reports:
  ```typescript
  export const revalidate = 3600; // Revalidate every hour
  ```

### Performance Optimizations

#### 1. Database Query Optimization

**Current Issues:**
- N+1 query problems in some endpoints
- Missing indexes on frequently queried fields
- Large JSON fields stored as text

**Recommendations:**
```typescript
// Use `include` to fetch related data in one query
const report = await prisma.clientReport.findUnique({
  where: { id: reportId },
  include: {
    keywords: {
      include: {
        performanceHistory: { take: 10 }
      }
    },
    competitors: true
  }
});

// Add database indexes
@@index([reportId, createdAt])
@@index([userId, isActive])
@@index([trackingStatus])
```

#### 2. Rate Limiting for External APIs

**Current Implementation:**
```typescript
// Cron job rate limiting
await new Promise(resolve => setTimeout(resolve, 1000)); // 1s between clients
await new Promise(resolve => setTimeout(resolve, 100));   // 100ms between keywords
```

**Issue:** Fixed delays, not adaptive

**Recommendation:**
- Use token bucket algorithm
- Implement retry with exponential backoff
- Queue external API requests

#### 3. Parallel vs Sequential Processing

**Good Example (Parallel):**
```typescript
const [keywordResponse, pageResponse] = await Promise.all([
  fetch(searchConsoleUrl1),
  fetch(searchConsoleUrl2)
]);
```

**Bad Example (Sequential):**
```typescript
const keywordResponse = await fetch(searchConsoleUrl1);
const pageResponse = await fetch(searchConsoleUrl2);
```

**Recommendation:**
- Use Promise.all() for independent operations
- Use Promise.allSettled() to handle partial failures

#### 4. Data Transfer Optimization

**Issue:** Large responses without pagination
```typescript
// Returns all keywords without pagination
const keywords = await prisma.keyword.findMany({
  where: { clientReportId: reportId }
});
```

**Recommendation:**
```typescript
// Implement cursor-based pagination
const keywords = await prisma.keyword.findMany({
  where: { clientReportId: reportId },
  take: 50,
  skip: page * 50,
  orderBy: { createdAt: 'desc' }
});

return {
  data: keywords,
  pagination: {
    page,
    pageSize: 50,
    total: await prisma.keyword.count({ where: { clientReportId: reportId } })
  }
};
```

#### 5. JSON Serialization

**Issue:** Large JSON fields in database
```prisma
coreWebVitals        String?  @db.Text
pageSpeedMetrics     String?  @db.Text
```

**Recommendation:**
- Use Prisma's `Json` type for better performance
- Index JSON fields if querying nested properties
- Consider separate tables for frequently accessed nested data

---

## Recommendations

### Priority 1: Critical Security Fixes

1. **Remove Debug Endpoints from Production**
   - Delete or gate all `/api/test/*` and `/api/debug/*` endpoints
   - Add environment checks:
     ```typescript
     if (process.env.NODE_ENV === 'production') {
       return NextResponse.json({ error: 'Not found' }, { status: 404 });
     }
     ```

2. **Implement API Rate Limiting**
   - Use `@upstash/ratelimit` with Vercel KV
   - Add per-IP limits for public endpoints
   - Add per-user limits for authenticated endpoints
   ```typescript
   import { Ratelimit } from '@upstash/ratelimit';
   import { Redis } from '@upstash/redis';

   const ratelimit = new Ratelimit({
     redis: Redis.fromEnv(),
     limiter: Ratelimit.slidingWindow(10, '10 s'),
   });
   ```

3. **Secure Cookie Configuration**
   ```typescript
   cookies().set('token', value, {
     httpOnly: true,
     secure: process.env.NODE_ENV === 'production',
     sameSite: 'strict',
     maxAge: 3600
   });
   ```

4. **Add Input Validation**
   ```typescript
   import { z } from 'zod';

   const schema = z.object({
     url: z.string().url(),
     name: z.string().min(1).max(100),
     domain: z.string().regex(/^([a-z0-9-]+\.)*[a-z0-9-]+\.[a-z]{2,}$/i)
   });

   const validated = schema.parse(await request.json());
   ```

### Priority 2: API Architecture Improvements

5. **Implement API Versioning**
   ```
   Current: /api/reports
   New:     /api/v1/reports
   ```
   - Version all endpoints
   - Document breaking changes
   - Maintain v1 for 6-12 months after v2 release

6. **Standardize Error Responses**
   ```typescript
   interface APIError {
     error: {
       code: string;        // 'VALIDATION_ERROR', 'NOT_FOUND', etc.
       message: string;     // Human-readable message
       details?: any;       // Additional context
       timestamp: string;   // ISO timestamp
       path: string;        // Request path
     }
   }
   ```

7. **Add Response Wrappers**
   ```typescript
   interface APIResponse<T> {
     success: boolean;
     data?: T;
     error?: APIError;
     meta?: {
       pagination?: PaginationInfo;
       cached?: boolean;
       cacheExpiry?: string;
     };
   }
   ```

### Priority 3: Performance Optimizations

8. **Implement Request/Response Compression**
   ```typescript
   // next.config.js
   module.exports = {
     compress: true,
   };
   ```

9. **Add Database Indexes**
   ```prisma
   @@index([reportId, createdAt])
   @@index([userId, trackingStatus])
   @@index([shareableId])
   @@index([weekStartDate])
   ```

10. **Implement Pagination**
    ```typescript
    interface PaginationParams {
      page: number;
      pageSize: number;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    }
    ```

### Priority 4: Developer Experience

11. **Add OpenAPI/Swagger Documentation**
    ```typescript
    // Use @asteasolutions/zod-to-openapi
    import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';

    const registry = new OpenAPIRegistry();
    registry.registerPath({
      method: 'get',
      path: '/api/v1/reports',
      description: 'List all reports',
      responses: {
        200: {
          description: 'Success',
          content: {
            'application/json': {
              schema: ReportListSchema
            }
          }
        }
      }
    });
    ```

12. **Add Request/Response Logging**
    ```typescript
    // Middleware for logging
    export async function middleware(request: NextRequest) {
      const start = Date.now();
      const response = await next(request);
      const duration = Date.now() - start;

      await prisma.log.create({
        data: {
          level: 'info',
          source: request.nextUrl.pathname,
          message: `${request.method} ${request.nextUrl.pathname}`,
          meta: {
            duration,
            status: response.status
          }
        }
      });

      return response;
    }
    ```

13. **Create API Client SDK**
    ```typescript
    // Generate TypeScript SDK from OpenAPI spec
    // or create manual SDK:

    class SEOReportingClient {
      constructor(private apiKey: string, private baseUrl: string) {}

      async getReports() {
        return this.request<Report[]>('/v1/reports');
      }

      async createReport(data: CreateReportInput) {
        return this.request<Report>('/v1/reports', {
          method: 'POST',
          body: JSON.stringify(data)
        });
      }

      private async request<T>(path: string, options?: RequestInit): Promise<T> {
        const response = await fetch(`${this.baseUrl}${path}`, {
          ...options,
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            ...options?.headers
          }
        });

        if (!response.ok) {
          throw new APIError(await response.json());
        }

        return response.json();
      }
    }
    ```

### Priority 5: Monitoring & Observability

14. **Add Sentry Integration (Already Partial)**
    - Complete Sentry setup for all endpoints
    - Add custom breadcrumbs
    - Track performance metrics

15. **Add Health Checks**
    ```typescript
    GET /api/health
    {
      "status": "healthy",
      "checks": {
        "database": "healthy",
        "googleApi": "healthy",
        "cache": "healthy"
      },
      "version": "1.0.0",
      "uptime": 123456
    }
    ```

16. **Add Analytics Dashboard**
    - Track API usage per endpoint
    - Monitor error rates
    - Track response times
    - Monitor rate limit hits

---

## Appendix A: Complete Endpoint Reference

[See API Endpoint Catalog section for detailed list]

## Appendix B: Database Schema Reference

[See Data Models & Schema section for complete schema]

## Appendix C: Environment Variables

Required environment variables:

```env
# Database
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

# NextAuth
NEXTAUTH_SECRET="..."
NEXTAUTH_URL="https://searchsignal.online"

# Google OAuth
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."

# Google APIs
PAGESPEED_API_KEY="..."

# Cron Jobs
CRON_SECRET="..."

# Application
NEXT_PUBLIC_APP_URL="https://searchsignal.online"
NEXT_PUBLIC_SUPABASE_URL="..." # (Mock, not used)
SUPABASE_SERVICE_ROLE_KEY="..." # (Mock, not used)
```

---

## Document Change Log

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-10-06 | Initial comprehensive API documentation |

---

**End of Document**
