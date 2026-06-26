import type { LogEntry, LogLevel } from "@/contracts/logEntry";

export type LoggerOptions = {
  traceId?: string;
  userMessage?: string;
  metadata?: Record<string, unknown>;
};

function emit(
  feature: string,
  traceId: string | undefined,
  level: LogLevel,
  step: string,
  message: string,
  opts?: LoggerOptions,
) {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    layer: "main-frontend",
    feature,
    step,
    message,
  };
  const tid = opts?.traceId ?? traceId;
  if (tid) entry.trace_id = tid;
  if (opts?.userMessage) entry.user_message = opts.userMessage;
  if (opts?.metadata) entry.metadata = opts.metadata;

  const line = JSON.stringify(entry);
  if (level === "debug") console.log(line);
  else if (level === "info") console.info(line);
  else console[level](line);
}

/** Context-bound logger — strategy §6.3 (web: JSON to browser console). */
export function createLogger(feature: string, traceId?: string) {
  return {
    debug: (step: string, message: string, opts?: LoggerOptions) =>
      emit(feature, traceId, "debug", step, message, opts),
    info: (step: string, message: string, opts?: LoggerOptions) =>
      emit(feature, traceId, "info", step, message, opts),
    warn: (step: string, message: string, opts?: LoggerOptions) =>
      emit(feature, traceId, "warn", step, message, opts),
    error: (step: string, message: string, opts?: LoggerOptions) =>
      emit(feature, traceId, "error", step, message, opts),
  };
}
