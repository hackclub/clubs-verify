import { randomBytes } from "crypto";

/** Generates a short, shareable error id for correlating logs with users. */
export function newErrorId(): string {
  return randomBytes(6).toString("hex");
}

/**
 * Logs an unexpected error server-side under a correlation id. Deliberately
 * never logs request tokens or secrets — only the error message/stack.
 */
export function logError(errorId: string, context: string, err: unknown): void {
  const message = err instanceof Error ? err.stack || err.message : String(err);
  console.error(`[${errorId}] ${context}: ${message}`);
}
