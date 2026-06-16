import * as Sentry from "@sentry/nextjs";
import { scrubSentryEvent } from "@/lib/sentryScrub";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  sendDefaultPii: true,
  tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.1,
  // includeLocalVariables is deliberately left off: it would attach stack-frame
  // locals to captured errors, which in the auth path means the OAuth token set
  // and the STATE_SECRET-signed values. Keep secrets out of Sentry.
  enableLogs: true,
  beforeSend: scrubSentryEvent,
  beforeSendTransaction: scrubSentryEvent,
});
