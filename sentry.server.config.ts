import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Performance Monitoring
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
  
  // Release tracking
  environment: process.env.NODE_ENV,
  
  // Debugging
  debug: process.env.NODE_ENV === "development",
  
  beforeSend(event, hint) {
    // Don't send events in development unless explicitly enabled
    if (process.env.NODE_ENV === "development" && !process.env.SENTRY_ENABLED) {
      return null;
    }
    
    // Redact sensitive data
    if (event.request?.cookies) {
      event.request.cookies = "[REDACTED]";
    }
    
    // Remove tokens from extra data
    if (event.extra) {
      const sanitized = { ...event.extra };
      delete sanitized.access_token;
      delete sanitized.refresh_token;
      delete sanitized.id_token;
      event.extra = sanitized;
    }
    
    return event;
  },
});