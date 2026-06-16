import { randomBytes } from "crypto";
import * as Sentry from "@sentry/nextjs";

/** Generates a short, shareable error id for correlating logs with users. */
export function newErrorId(): string {
  return randomBytes(6).toString("hex");
}

/**
 * Reports an unexpected error to Sentry and the server logs, then returns the
 * Sentry event id so it can be shown to the user for support correlation.
 *
 * Deliberately never logs request tokens or secrets — only the error
 * message/stack. Falls back to a locally generated id if Sentry is disabled or
 * does not return an event id.
 */
export function captureError(context: string, err: unknown): string {
  const eventId = Sentry.captureException(err, { tags: { context } });
  const errorId = eventId || newErrorId();
  logError(errorId, context, err);
  return errorId;
}

/**
 * Logs an unexpected error server-side under a correlation id. Deliberately
 * never logs request tokens or secrets — only the error message/stack.
 */
export function logError(errorId: string, context: string, err: unknown): void {
  const message = err instanceof Error ? err.stack || err.message : String(err);
  console.error(`[${errorId}] ${context}: ${message}`);
}
