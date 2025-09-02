import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";

export const dynamic = "force-dynamic";

export function GET() {
  // This will be captured by Sentry
  throw new Error("Sentry Test: API Route Error (Intentional)");
}

export async function POST() {
  // Test manual capture
  Sentry.captureMessage("Sentry Test: Manual Message", "info");
  
  // Test with extra context
  Sentry.captureException(new Error("Sentry Test: Manual Exception"), {
    tags: {
      section: "api",
      test: true
    },
    extra: {
      timestamp: new Date().toISOString(),
      route: "/api/sentry-test"
    }
  });
  
  return NextResponse.json({ 
    message: "Sentry test messages sent", 
    check: "Visit your Sentry dashboard to verify" 
  });
}