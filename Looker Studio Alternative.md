# Complete Cloud Code Implementation Guide - Looker Studio Alternative

## CRITICAL: Checkpoint & Recovery System

### Before Starting - Set Up Your Safety Net

```bash
# CREATE THESE FOLDERS IN YOUR PROJECT ROOT
mkdir checkpoints
mkdir backups
mkdir working-features

# CREATE VERSION CONTROL FILE
echo '{
  "version": "0.0.1",
  "lastWorkingCheckpoint": null,
  "lockedFeatures": [],
  "currentPhase": "setup"
}' > project-state.json
```

### Checkpoint System Instructions for Cloud Code

**EVERY TIME something works, run this:**
```bash
# Create checkpoint
cp -r . ./checkpoints/checkpoint-$(date +%Y%m%d-%H%M%S)
# Update project-state.json with working feature
```

**IF something breaks, run this:**
```bash
# Revert to last checkpoint
cp -r ./checkpoints/[last-checkpoint]/* .
```

---

## PHASE 1: Project Foundation (Checkpoint After Each Step)

### Step 1.1: Initialize Next.js Project

```bash
# Run this exact command - DO NOT modify
npx create-next-app@latest analytics-dashboard --typescript --tailwind --app --src-dir --import-alias "@/*"

# When prompted, answer:
# TypeScript: Yes
# ESLint: Yes
# Tailwind CSS: Yes
# src/ directory: Yes
# App Router: Yes
# Import alias: Yes (keep @/*)

cd analytics-dashboard
```

**CHECKPOINT 1.1**: If the folder `analytics-dashboard` exists with `package.json`, save checkpoint.

### Step 1.2: Install Core Dependencies

```bash
# Install in this EXACT order - some packages depend on others
npm install next-auth@beta
npm install @prisma/client prisma
npm install recharts tremor-react
npm install react-grid-layout
npm install zustand
npm install @upstash/redis
npm install axios
npm install date-fns
npm install lucide-react
```

**VERIFY**: Run `npm list` - if no errors, proceed. If errors, run `npm audit fix`.

**CHECKPOINT 1.2**: Run `npm run dev` - if it starts on port 3000, save checkpoint.

### Step 1.3: Environment Configuration

Create `.env.local` file:
```bash
# NEVER commit this file to GitHub
touch .env.local
```

Add to `.env.local`:
```env
# Google OAuth - LEAVE BLANK FOR NOW
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=generate-32-char-string-here
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Database - LEAVE BLANK FOR NOW
DATABASE_URL=

# Redis Cache - LEAVE BLANK FOR NOW
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# API Keys - LEAVE BLANK FOR NOW
PAGESPEED_API_KEY=
```

**CHECKPOINT 1.3**: File created successfully.

---

## PHASE 2: Project Structure (Lock This Once Working)

### Step 2.1: Create Folder Structure

```bash
# Run these commands from project root
mkdir -p src/app/api/auth/[...nextauth]
mkdir -p src/app/api/google/{analytics,search-console,business,pagespeed}
mkdir -p src/app/dashboard/{components,widgets,filters}
mkdir -p src/lib/{auth,db,cache,google}
mkdir -p src/components/ui
mkdir -p src/store
mkdir -p src/types
mkdir -p src/utils
```

### Step 2.2: Create Base Configuration Files

Create `src/lib/config.ts`:
```typescript
// DO NOT MODIFY once working
export const APP_CONFIG = {
  name: 'Analytics Dashboard',
  version: '1.0.0',
  apis: {
    googleAnalytics: {
      enabled: false, // Set true when ready
      endpoint: 'https://analyticsdata.googleapis.com',
      scopes: ['https://www.googleapis.com/auth/analytics.readonly']
    },
    searchConsole: {
      enabled: false,
      endpoint: 'https://www.googleapis.com/webmasters/v3',
      scopes: ['https://www.googleapis.com/auth/webmasters.readonly']
    },
    pagespeed: {
      enabled: false,
      endpoint: 'https://www.googleapis.com/pagespeedonline/v5'
    },
    businessProfile: {
      enabled: false,
      endpoint: 'https://mybusinessaccountmanagement.googleapis.com',
      scopes: ['https://www.googleapis.com/auth/business.manage']
    }
  },
  cache: {
    ttl: {
      realtime: 60, // 1 minute
      standard: 3600, // 1 hour
      daily: 86400 // 24 hours
    }
  }
} as const;
```

**CHECKPOINT 2.2**: If file saves without TypeScript errors, lock this file.

---

## PHASE 3: Authentication System (Critical - Test Thoroughly)

### Step 3.1: Create NextAuth Configuration

Create `src/lib/auth/auth-options.ts`:
```typescript
import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';

// CRITICAL: This handles all authentication
export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
      authorization: {
        params: {
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code',
          scope: [
            'openid',
            'email', 
            'profile',
            'https://www.googleapis.com/auth/analytics.readonly',
            'https://www.googleapis.com/auth/webmasters.readonly'
          ].join(' ')
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, account, user }) {
      // Store tokens securely
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.expiresAt = account.expires_at;
      }
      return token;
    },
    async session({ session, token }) {
      // Pass tokens to session
      session.accessToken = token.accessToken as string;
      session.error = token.error as string;
      return session;
    }
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error'
  },
  debug: true // Set false in production
};
```

### Step 3.2: Create Auth Route Handler

Create `src/app/api/auth/[...nextauth]/route.ts`:
```typescript
import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
```

**TEST 3.2**: Run `npm run dev`, navigate to `/api/auth/signin` - should see NextAuth page.

**CHECKPOINT 3**: If auth page loads, LOCK these files.

---

## PHASE 4: Database Setup (Can Skip Initially)

### Step 4.1: Initialize Prisma

```bash
npx prisma init
```

Create `prisma/schema.prisma`:
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String?
  image         String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  dashboards    Dashboard[]
}

model Dashboard {
  id            String    @id @default(cuid())
  name          String
  config        Json
  userId        String
  user          User      @relation(fields: [userId], references: [id])
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  @@index([userId])
}
```

**NOTE**: Database optional for MVP - can use local storage initially.

---

## PHASE 5: Basic Dashboard UI (Visual Confirmation)

### Step 5.1: Create Dashboard Layout

Create `src/app/dashboard/page.tsx`:
```typescript
'use client';

import { useState, useEffect } from 'react';

export default function DashboardPage() {
  const [status, setStatus] = useState('Loading...');
  
  useEffect(() => {
    // Test that component mounts
    setStatus('Dashboard Ready');
    console.log('Dashboard mounted successfully');
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Analytics Dashboard
        </h1>
        
        {/* Status Indicator - KEEP THIS FOR TESTING */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <p className="text-sm text-gray-600">System Status:</p>
          <p className="text-lg font-semibold text-green-600">{status}</p>
        </div>

        {/* Placeholder for widgets */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold mb-2">Widget 1</h3>
            <p className="text-gray-600">Placeholder</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold mb-2">Widget 2</h3>
            <p className="text-gray-600">Placeholder</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold mb-2">Widget 3</h3>
            <p className="text-gray-600">Placeholder</p>
          </div>
        </div>
      </div>
    </div>
  );
}
```

**TEST 5.1**: Navigate to `/dashboard` - should see the layout.

**CHECKPOINT 5**: If dashboard displays, LOCK this basic structure.

---

## PHASE 6: Google API Integration (Test Each Separately)

### Step 6.1: Create API Test Endpoints

Create `src/app/api/test-connection/route.ts`:
```typescript
import { NextResponse } from 'next/server';

// Test endpoint - verify APIs are accessible
export async function GET() {
  const results = {
    analytics: false,
    searchConsole: false,
    pagespeed: false,
    timestamp: new Date().toISOString()
  };

  try {
    // Test Google Analytics
    if (process.env.GOOGLE_CLIENT_ID) {
      results.analytics = true;
    }

    // Test PageSpeed (no auth required)
    if (process.env.PAGESPEED_API_KEY) {
      const response = await fetch(
        `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=https://google.com&key=${process.env.PAGESPEED_API_KEY}`
      );
      results.pagespeed = response.ok;
    }

    return NextResponse.json({ success: true, results });
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      results 
    });
  }
}
```

**TEST 6.1**: Visit `/api/test-connection` - should return JSON with status.

### Step 6.2: Create Google Analytics Data Fetcher

Create `src/lib/google/analytics.ts`:
```typescript
// INCREMENTAL APPROACH - Start simple
export class GoogleAnalyticsService {
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  // Start with basic test
  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(
        'https://analyticsdata.googleapis.com/v1beta/properties',
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`
          }
        }
      );
      return response.ok;
    } catch {
      return false;
    }
  }

  // Add methods incrementally after test works
  async getBasicReport(propertyId: string) {
    // Implement after testConnection works
    return null;
  }
}
```

**CHECKPOINT 6**: Save after EACH working API connection.

---

## PHASE 7: Data Visualization (Test with Mock Data First)

### Step 7.1: Create Sample Chart Component

Create `src/app/dashboard/components/SampleChart.tsx`:
```typescript
'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// ALWAYS TEST WITH MOCK DATA FIRST
const mockData = [
  { name: 'Mon', value: 400 },
  { name: 'Tue', value: 300 },
  { name: 'Wed', value: 600 },
  { name: 'Thu', value: 800 },
  { name: 'Fri', value: 500 }
];

export default function SampleChart() {
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">Sample Traffic Chart</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={mockData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="value" stroke="#3B82F6" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
```

**TEST 7.1**: Import into dashboard - if chart renders, proceed.

---

## PHASE 8: Error Recovery System

### Step 8.1: Create Error Boundary

Create `src/components/ErrorBoundary.tsx`:
```typescript
'use client';

import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('ErrorBoundary caught:', error, errorInfo);
    // Log to external service if needed
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="p-4 bg-red-50 border border-red-200 rounded">
            <h2 className="text-red-800 font-semibold">Something went wrong</h2>
            <p className="text-red-600 text-sm mt-2">
              {this.state.error?.message}
            </p>
            <button
              onClick={() => this.setState({ hasError: false })}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Try Again
            </button>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
```

### Step 8.2: Wrap Critical Components

Update dashboard to use error boundaries:
```typescript
import { ErrorBoundary } from '@/components/ErrorBoundary';

// Wrap each widget
<ErrorBoundary>
  <SampleChart />
</ErrorBoundary>
```

---

## PHASE 9: Progressive Feature Addition

### Feature Addition Protocol

**For EACH new feature:**

1. **Create feature flag** in `config.ts`:
```typescript
features: {
  googleAnalytics: false,  // Set true when ready
  searchConsole: false,
  realtimeData: false,
  customCalculations: false
}
```

2. **Test in isolation** before integrating:
```typescript
// Always create test file first
// src/tests/feature-name.test.ts
```

3. **Add with conditional rendering**:
```typescript
{config.features.googleAnalytics && <AnalyticsWidget />}
```

---

## CRITICAL TROUBLESHOOTING GUIDE

### If Cloud Code Gets Stuck

1. **Check current phase**:
```bash
cat project-state.json
```

2. **Run diagnostic**:
```bash
npm run build
# If fails, note EXACT error message
```

3. **Rollback if needed**:
```bash
# List checkpoints
ls -la checkpoints/
# Restore specific checkpoint
cp -r checkpoints/[checkpoint-name]/* .
```

### Common Issues & Solutions

| Issue | Solution | Checkpoint to Revert |
|-------|----------|---------------------|
| "Module not found" | Run `npm install [module]` | CHECKPOINT 1.2 |
| TypeScript errors | Check tsconfig.json | CHECKPOINT 2.2 |
| Auth not working | Verify env variables | CHECKPOINT 3 |
| API rate limited | Implement caching | CHECKPOINT 6 |
| Chart not rendering | Use mock data first | CHECKPOINT 7.1 |

---

## DEPLOYMENT CHECKLIST

### Before Pushing to GitHub

```bash
# 1. Remove all console.logs
grep -r "console.log" src/

# 2. Set debug to false
# In auth-options.ts: debug: false

# 3. Check environment variables
# Ensure .env.local is in .gitignore

# 4. Build test
npm run build

# 5. Type check
npx tsc --noEmit
```

### Vercel Deployment

```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Login
vercel login

# 3. Deploy (answer prompts)
vercel

# 4. Set environment variables in Vercel Dashboard
# Go to: Settings > Environment Variables
```

---

## RECOVERY COMMANDS REFERENCE

```bash
# Full reset (nuclear option)
rm -rf node_modules package-lock.json
npm install

# Clear Next.js cache
rm -rf .next

# Reset database (if using)
npx prisma migrate reset

# Check what changed
git status
git diff

# Create backup before major change
tar -czf backup-$(date +%Y%m%d).tar.gz .

# Test build without deploying
npm run build && npm run start
```

---

## SUCCESS INDICATORS

✅ **Phase 1**: Dev server runs on localhost:3000  
✅ **Phase 2**: No TypeScript errors  
✅ **Phase 3**: Can navigate to /api/auth/signin  
✅ **Phase 4**: Database migrations run (optional)  
✅ **Phase 5**: Dashboard page loads  
✅ **Phase 6**: API test endpoint returns JSON  
✅ **Phase 7**: Chart renders with mock data  
✅ **Phase 8**: Error boundary catches errors  
✅ **Phase 9**: Features toggle on/off correctly  

---

## FINAL NOTES FOR CLOUD CODE

1. **NEVER** modify working checkpointed files without backup
2. **ALWAYS** test with mock data before real API calls
3. **INCREMENTALLY** add features - don't try everything at once
4. **DOCUMENT** any deviations from this guide in `CHANGES.md`
5. **COMMIT** to Git after each successful checkpoint

Remember: It's better to have a simple working dashboard than a complex broken one. Start minimal, test everything, expand gradually.