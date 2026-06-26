export type LogLevel = "debug" | "info" | "warn" | "error";

export type LogLayer =
  | "electron-main"
  | "desktop-app-frontend"
  | "main-frontend"
  | "relay"
  | "service-auth";

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  layer: LogLayer;
  feature: string;
  step: string;
  message: string;
  trace_id?: string;
  user_message?: string;
  metadata?: Record<string, unknown>;
}
