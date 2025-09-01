# Google Analytics & Search Console Data Fetching Documentation

## Overview
This document explains how the application pulls Google Analytics and Search Console data after authentication.

## Authentication Flow
1. User authenticates via Google OAuth 2.0
2. Access tokens and refresh tokens are stored in:
   - HTTP-only cookies (`google_access_token`, `google_refresh_token`)
   - Database (Prisma `Account` model for persistent storage)

## Data Fetching Process

### 1. Google Analytics Data (`fetch-analytics.ts`)

**Endpoint**: `/api/data/fetch-analytics`  
**Method**: POST

**Process**:
1. Receives `propertyId`, `startDate`, and `endDate` in request body
2. Retrieves Google OAuth tokens from cookies
3. Creates OAuth2Client instance with credentials
4. Refreshes access token if needed
5. Uses Google Analytics Data API v1beta to fetch:
   - Summary metrics (users, sessions, pageviews, bounce rate, etc.)
   - Traffic sources by channel
   - Top 10 pages with metrics
   - Daily data for trends

**Key API Calls**:
```javascript
analyticsData.properties.runReport({
  property: `properties/${propertyId}`,
  requestBody: {
    dateRanges: [{ startDate, endDate }],
    dimensions: ['date', 'sessionDefaultChannelGroup'],
    metrics: ['sessions', 'activeUsers', 'newUsers', 'bounceRate', 'averageSessionDuration', 'screenPageViews']
  },
  auth: oauth2Client
})
```

### 2. Search Console Data (`fetch-search-console.ts`)

**Endpoint**: `/api/data/fetch-search-console`  
**Method**: POST

**Process**:
1. Receives `reportId` or `properties` array and `dateRange` in request body
2. Retrieves Google OAuth tokens from cookies
3. Refreshes token using Google OAuth2 token endpoint
4. For each Search Console property:
   - Fetches overall metrics (clicks, impressions, CTR, position)
   - Fetches data by date for trends
   - Fetches top 10 pages
   - Fetches top 20 search queries
5. Stores results in database cache (24-hour expiry)

**Key API Calls**:
```javascript
fetch(`https://www.googleapis.com/webmasters/v3/sites/${siteUrl}/searchAnalytics/query`, {
  method: "POST",
  headers: { Authorization: `Bearer ${accessToken}` },
  body: JSON.stringify({
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
    dimensions: ['date', 'page', 'query'],
    rowLimit: 1000
  })
})
```

### 3. Comprehensive Metrics (`fetch-comprehensive-metrics.ts`)

**Endpoint**: `/api/data/fetch-comprehensive-metrics`  
**Method**: POST

**Process**:
1. Receives `reportId` and `googleAccountId` in request body
2. Fetches Google account credentials from database
3. Sets up OAuth2 client and refreshes token if expired
4. Fetches data for multiple time periods:
   - Current (last 7 days)
   - Previous week (8-14 days ago)
   - Previous month (31-60 days ago)
   - Year ago (365 days ago)
5. Calculates week-over-week, month-over-month, and year-over-year comparisons
6. Saves aggregated data to database

### 4. Fetching Google Properties (`fetch-google-properties.ts`)

**Endpoint**: `/api/google/fetch-properties`  
**Method**: GET

**Process**:
1. Gets user session with Google tokens
2. Fetches Search Console sites from: `https://www.googleapis.com/webmasters/v3/sites`
3. Fetches GA4 properties from: `https://analyticsadmin.googleapis.com/v1beta/accountSummaries`
4. Returns combined list of available properties

### 5. PageSpeed Insights (`pagespeed.ts`)

**Endpoint**: `/api/data/pagespeed`  
**Method**: POST

**Process**:
1. Receives `url` and `strategy` (mobile/desktop) in request body
2. Calls PageSpeed Insights API with optional API key
3. Extracts and formats:
   - Lighthouse scores (performance, accessibility, best practices, SEO)
   - Core Web Vitals (LCP, FID, CLS, FCP, INP, TTFB)
   - Top 5 opportunities for improvement
   - Top 5 diagnostic issues

## Token Management (`google-tokens.ts`)

**Key Functions**:
- `getAccessTokenForAccount(accountId, userId)`: 
  - Retrieves access token from database
  - Checks expiration (with 60-second buffer)
  - Refreshes token if expired using refresh token
  - Updates database with new token and expiry

## Required Environment Variables

```env
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
PAGESPEED_API_KEY=your_pagespeed_api_key (optional)
NEXT_PUBLIC_URL=http://localhost:3000
DATABASE_URL=file:./dev.db
```

## API Scopes Required

For full functionality, the following Google OAuth scopes are needed:
- `https://www.googleapis.com/auth/analytics.readonly`
- `https://www.googleapis.com/auth/webmasters.readonly`
- `https://www.googleapis.com/auth/analytics.admin.readonly` (for property listing)

## Data Storage

- **Temporary Cache**: Cookies for active session tokens
- **Persistent Storage**: Prisma database with models:
  - `Account`: Stores OAuth tokens and metadata
  - `ClientReport`: Links reports to properties
  - `ReportCache`: Caches fetched data with expiry

## Error Handling

All endpoints include:
- Token refresh attempts before API calls
- Graceful fallbacks for missing permissions
- Detailed error messages for debugging
- HTTP status codes for different error types:
  - 401: Authentication required/failed
  - 400: Invalid request parameters
  - 404: Resource not found
  - 500: Server/API errors

## Rate Limiting Considerations

- Google Analytics Data API: 50,000 requests per day
- Search Console API: 200 queries per minute
- PageSpeed Insights API: 25,000 queries per day (with API key)
- Token refresh: No specific limit but should be minimized

## Usage Example

```javascript
// Fetch Analytics Data
const response = await fetch('/api/data/fetch-analytics', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    propertyId: '123456789',
    startDate: '2024-01-01',
    endDate: '2024-01-31'
  })
});

// Fetch Search Console Data
const response = await fetch('/api/data/fetch-search-console', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    properties: ['https://example.com'],
    dateRange: 'last30days'
  })
});
```