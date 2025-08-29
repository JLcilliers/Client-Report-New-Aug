import * as Sentry from '@sentry/nextjs';

export function register() {
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (!dsn) return;

  const common = { 
    dsn, 
    environment: process.env.SENTRY_ENVIRONMENT || process.env.VERCEL_ENV || 'production',
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.2 : 1.0,
  };

  if (process.env.NEXT_RUNTIME === 'nodejs') {
    Sentry.init(common);
  }
  if (process.env.NEXT_RUNTIME === 'edge') {
    Sentry.init(common);
  }
}