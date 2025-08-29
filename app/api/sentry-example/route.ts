// app/api/sentry-example/route.ts
import * as Sentry from '@sentry/nextjs';

export const dynamic = 'force-dynamic';

export function GET() {
  // Deliberately throw to verify Sentry server capture
  const err = new Error('Sentry Example API Route Error');
  Sentry.captureException(err); // extra safety; Sentry also catches uncaught errors
  throw err;
}