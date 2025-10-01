# Search Insights Hub - Client Reporting Platform

A comprehensive SEO reporting platform that integrates with Google Analytics, Search Console, and PageSpeed Insights to provide automated client reporting.

## Features

### 🚀 Core Features
- **Google OAuth Integration** - Secure authentication with Google accounts
- **Multi-Account Support** - Manage multiple Google accounts and properties
- **Automated Data Fetching** - Real-time data from Google Analytics GA4 and Search Console
- **Interactive Dashboards** - Comprehensive reporting with charts and visualizations
- **Date Range Analytics** - Week, month, year, and custom date range comparisons
- **Shareable Reports** - Generate secure, shareable report links for clients

### 📊 Reporting Capabilities
- **Search Console Metrics** - Clicks, impressions, CTR, average position
- **Analytics Data** - Sessions, users, bounce rate, engagement metrics
- **PageSpeed Insights** - Core Web Vitals and performance metrics
- **Traffic Analysis** - Channel breakdown and conversion tracking
- **Actionable Insights** - AI-generated recommendations with priority scoring
- **Technical SEO** - Meta tags, robots.txt, sitemap analysis

### 📈 Visualizations
- **Interactive Charts** - Recharts-powered visualizations
- **Trend Analysis** - Performance over time with comparison periods
- **Traffic Distribution** - Source breakdown with percentage analysis
- **Competitive Intelligence** - Industry benchmarking
- **Impact vs Effort Matrix** - Prioritized task recommendations

## Tech Stack

- **Framework**: Next.js 14 with TypeScript
- **Database**: Prisma ORM with SQLite (local) / PostgreSQL (production)
- **Authentication**: Custom Google OAuth implementation
- **Styling**: Tailwind CSS + shadcn/ui components
- **Charts**: Recharts library
- **APIs**: Google Analytics Data API, Search Console API, PageSpeed Insights API
- **Deployment**: Vercel (recommended)

## Environment Variables

Create a `.env.local` file with the following variables:

```env
# Database
DATABASE_URL="file:./dev.db"

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret_here

# Google OAuth Credentials
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Google API Keys
PAGESPEED_API_KEY=your_pagespeed_api_key

# Google Service Account
GOOGLE_SERVICE_ACCOUNT_EMAIL=your_service_account_email
GOOGLE_PROJECT_ID=your_google_project_id

# Application Settings
APP_URL=http://localhost:3000
NEXT_PUBLIC_URL=http://localhost:3000
NODE_ENV=development
```

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- Google Cloud Console project with Analytics and Search Console APIs enabled
- Google OAuth 2.0 credentials

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/JLcilliers/Client-Report-New-Aug.git
cd Client-Report-New-Aug
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env.local
# Edit .env.local with your actual values
```

4. **Set up the database**
```bash
npx prisma migrate dev
npx prisma generate
```

5. **Start the development server**
```bash
npm run dev
```

6. **Open your browser**
Navigate to [http://localhost:3000](http://localhost:3000)

## Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable the following APIs:
   - Google Analytics Data API
   - Google Search Console API
   - PageSpeed Insights API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/admin-google/callback` (development)
   - `https://yourdomain.com/api/auth/admin-google/callback` (production)

## Database Schema

The application uses Prisma with the following main models:
- `User` - User accounts with Google profile information
- `Account` - OAuth account linking with Google
- `ClientReport` - Client report configurations
- `ReportCache` - Cached report data for performance

## API Endpoints

### Authentication
- `POST /api/auth/admin-google/initiate` - Start OAuth flow
- `GET /api/auth/admin-google/callback` - OAuth callback
- `GET /api/auth/check-session` - Verify session

### Reports
- `GET /api/admin/reports` - List all reports
- `POST /api/reports/create` - Create new report
- `GET /api/public/report/[slug]` - Public report access
- `POST /api/public/report/[slug]/refresh` - Refresh report data

### Google APIs
- `GET /api/google/fetch-properties` - Get user's properties
- `GET /api/admin/google-accounts` - List connected accounts

## Deployment

### Vercel (Recommended)

1. **Prepare for deployment**
```bash
npm run build
```

2. **Install Vercel CLI**
```bash
npm install -g vercel
```

3. **Deploy**
```bash
vercel login
vercel
```

4. **Set up production database**
   - Use Vercel Postgres, Supabase, or PlanetScale
   - Update `DATABASE_URL` in Vercel environment variables

5. **Configure environment variables**
   - Copy all variables from `.env.local` to Vercel dashboard
   - Update URLs to your production domain

6. **Run migrations**
```bash
vercel env pull
npx prisma migrate deploy
```

## Usage

### Admin Dashboard
1. Navigate to `/admin` 
2. Connect your Google account via OAuth
3. Select Analytics and Search Console properties
4. Create reports for your clients

### Client Reports
1. Create a new report from the admin dashboard
2. Configure date ranges and metrics
3. Share the generated URL with clients
4. Reports auto-refresh and provide real-time insights

### Features Overview
- **Connections**: Manage Google account connections
- **Properties**: View available Analytics and Search Console properties  
- **Reports**: Create and manage client reports
- **Insights**: AI-powered recommendations and action items

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, please open an issue on GitHub or contact [your-email@example.com].

---

Built with ❤️ using Next.js, TypeScript, and Claude Code
<!-- Deploy trigger: Thu, Aug 28, 2025 12:37:37 PM -->
// Force deployment

