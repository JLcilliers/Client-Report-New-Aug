'use client';
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.2 : 1.0,
  environment: process.env.NODE_ENV,
  replaysSessionSampleRate: 0.05, // 5% of sessions
  replaysOnErrorSampleRate: 1.0,  // 100% when errors occur
});