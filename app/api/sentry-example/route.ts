// app/api/sentry-example/route.ts
import * as Sentry from '@sentry/nextjs';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs'; // optional, but explicit

export function GET() {
  const err = new Error('Sentry Example API Route Error');
  Sentry.captureException(err);
  throw err; // forces a 500 and a Sentry Issue
}