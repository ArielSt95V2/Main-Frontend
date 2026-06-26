/** Mint a per-action correlation id (UUID v4). */
export function mintTraceId(): string {
  return crypto.randomUUID();
}

export function traceRequestHeaders(
  traceId?: string,
): Record<string, string> | undefined {
  if (!traceId) return undefined;
  return { "X-Request-ID": traceId };
}