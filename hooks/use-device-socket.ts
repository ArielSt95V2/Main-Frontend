import { useState, useEffect, useCallback, useRef } from "react";
import { createLogger } from "@/lib/logger";

// =============================================================================
// Types
// =============================================================================

export interface DeviceStatus {
  device_id: string;
  status: "online" | "offline";
}

export interface ConnectedDevice {
  device_id: string;
  device_name: string;
}

/** Normalize relay payloads (objects or legacy string IDs). */
export function normalizeConnectedDevice(
  entry: unknown,
): ConnectedDevice | null {
  if (typeof entry === "string") {
    return { device_id: entry, device_name: entry };
  }
  if (entry && typeof entry === "object" && "device_id" in entry) {
    const record = entry as { device_id: unknown; device_name?: unknown };
    const deviceId = String(record.device_id);
    const deviceName =
      typeof record.device_name === "string" && record.device_name.trim()
        ? record.device_name
        : deviceId;
    return { device_id: deviceId, device_name: deviceName };
  }
  return null;
}

function normalizeConnectedDevices(entries: unknown): ConnectedDevice[] {
  if (!Array.isArray(entries)) return [];
  return entries
    .map(normalizeConnectedDevice)
    .filter((d): d is ConnectedDevice => d !== null);
}

export interface CommandResult {
  device_id: string;
  request_id: string;
  result?: unknown;
  error?: string;
}

export interface DeviceSocketState {
  connected: boolean;
  authenticated: boolean;
  devices: ConnectedDevice[];
  error: string | null;
}

export interface UseDeviceSocketOptions {
  /** Relay WebSocket URL (defaults to NEXT_PUBLIC_RELAY_URL env var) */
  relayUrl?: string;
  /** Callback when authentication succeeds */
  onAuthenticated?: () => void;
  /** Callback when a device comes online */
  onDeviceOnline?: (deviceId: string) => void;
  /** Callback when a device goes offline */
  onDeviceOffline?: (deviceId: string) => void;
  /** Callback when a command response is received */
  onCommandResponse?: (response: CommandResult) => void;
  /** Auto-reconnect on disconnect (default: true) */
  autoReconnect?: boolean;
  /** Reconnect delay in ms (default: 3000) */
  reconnectDelay?: number;
}

// =============================================================================
// Hook
// =============================================================================

export default function useDeviceSocket(
  accessToken: string | null,
  options: UseDeviceSocketOptions = {},
) {
  const {
    relayUrl = process.env.NEXT_PUBLIC_RELAY_URL || "wss://localhost/relay/",
    onAuthenticated,
    onDeviceOnline,
    onDeviceOffline,
    onCommandResponse,
    autoReconnect = true,
    reconnectDelay = 3000,
  } = options;

  const [state, setState] = useState<DeviceSocketState>({
    connected: false,
    authenticated: false,
    devices: [],
    error: null,
  });

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingCommandsRef = useRef<
    Map<
      string,
      {
        resolve: (result: CommandResult) => void;
        reject: (error: Error) => void;
        timeout: NodeJS.Timeout;
      }
    >
  >(new Map());

  // Cleanup function
  const cleanup = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    // Clear all pending commands
    pendingCommandsRef.current.forEach(({ reject, timeout }) => {
      clearTimeout(timeout);
      reject(new Error("Connection closed"));
    });
    pendingCommandsRef.current.clear();

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  // Connect to relay
  const connect = useCallback(() => {
    if (!accessToken) {
      setState((prev) => ({ ...prev, error: "No access token provided" }));
      return;
    }

    cleanup();
    const wsUrl = relayUrl.endsWith("/") ? relayUrl : `${relayUrl}/`;
    const ws = new WebSocket(wsUrl);
    try {
      wsRef.current = ws;

      ws.onopen = () => {
        setState((prev) => ({ ...prev, connected: true, error: null }));

        // Send authentication message
        ws.send(
          JSON.stringify({
            type: "auth",
            access_token: accessToken,
          }),
        );
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          switch (data.type) {
            case "auth_success":
              setState((prev) => ({ ...prev, authenticated: true }));
              onAuthenticated?.();
              break;

            case "auth_error":
              console.error("[DeviceSocket] Auth error:", data.error);
              setState((prev) => ({
                ...prev,
                authenticated: false,
                error: data.error || "Authentication failed",
              }));
              break;

            case "device_list":
              setState((prev) => ({
                ...prev,
                devices: normalizeConnectedDevices(data.devices),
              }));
              break;

            case "device_status":
              console.log(
                "[DeviceSocket] Device status:",
                data.device_id,
                data.status,
              );
              if (data.status === "online") {
                const online = normalizeConnectedDevice({
                  device_id: data.device_id,
                  device_name: data.device_name,
                });
                if (online) {
                  setState((prev) => ({
                    ...prev,
                    devices: [
                      ...prev.devices.filter(
                        (d) => d.device_id !== online.device_id,
                      ),
                      online,
                    ],
                  }));
                }
                onDeviceOnline?.(data.device_id);
              } else {
                setState((prev) => ({
                  ...prev,
                  devices: prev.devices.filter(
                    (d) => d.device_id !== data.device_id,
                  ),
                }));
                onDeviceOffline?.(data.device_id);
              }
              break;

            case "response":
              const pending = pendingCommandsRef.current.get(data.request_id);
              if (pending) {
                clearTimeout(pending.timeout);
                pendingCommandsRef.current.delete(data.request_id);
                pending.resolve({
                  device_id: data.device_id,
                  request_id: data.request_id,
                  result: data.result,
                  error: data.error,
                });
              }
              onCommandResponse?.(data);
              break;

            case "error":
              console.error("[DeviceSocket] Error:", data.error);
              setState((prev) => ({
                ...prev,
                error:
                  typeof data.error === "string"
                    ? data.error
                    : "Connection error",
              }));
              break;

            case "pong":
              // Heartbeat response, ignore
              break;

            default:
          }
        } catch (e) {
          console.error("[DeviceSocket] Failed to parse message:", e);
        }
      };

      ws.onclose = (event) => {
        setState((prev) => ({
          ...prev,
          connected: false,
          authenticated: false,
          devices: [],
        }));
        wsRef.current = null;

        // Auto-reconnect if enabled and not a normal close
        if (autoReconnect && event.code !== 1000 && accessToken) {
          console.log(`[DeviceSocket] Reconnecting in ${reconnectDelay}ms...`);
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectDelay);
        }
      };

      ws.onerror = () => {
        // Browser WebSocket error events carry no useful detail (often Strict Mode / reconnect).
        setState((prev) =>
          prev.error ? prev : { ...prev, error: "Connection error" },
        );
      };
    } catch (error) {
      console.error("[DeviceSocket] Failed to connect:", error);
      setState((prev) => ({ ...prev, error: "Failed to connect" }));
    }
  }, [
    accessToken,
    relayUrl,
    cleanup,
    autoReconnect,
    reconnectDelay,
    onAuthenticated,
    onDeviceOnline,
    onDeviceOffline,
    onCommandResponse,
  ]);

  // Disconnect from relay
  const disconnect = useCallback(() => {
    cleanup();
    setState({
      connected: false,
      authenticated: false,
      devices: [],
      error: null,
    });
  }, [cleanup]);

  // Send a command to a device
  const sendCommand = useCallback(
    (
      deviceId: string,
      command: string,
      payload?: unknown,
      traceId?: string,
      timeoutMs = 30000,
    ): Promise<CommandResult> => {
      return new Promise((resolve, reject) => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
          reject(new Error("Not connected"));
          return;
        }

        if (!state.authenticated) {
          reject(new Error("Not authenticated"));
          return;
        }

        const requestId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        if (traceId) {
          const log = createLogger("relay.commands", traceId);
          log.info("command.send", "Sending relay command", {
            metadata: { command, request_id: requestId, device_id: deviceId },
          });
        }
        // Set up timeout
        const timeout = setTimeout(() => {
          pendingCommandsRef.current.delete(requestId);
          reject(new Error("Command timeout"));
        }, timeoutMs);

        // Store pending command
        pendingCommandsRef.current.set(requestId, { resolve, reject, timeout });

        // Send command
        wsRef.current.send(
          JSON.stringify({
            type: "command",
            device_id: deviceId,
            command,
            request_id: requestId,
            payload,
            ...(traceId ? { trace_id: traceId } : {}),
          }),
        );
      });
    },
    [state.authenticated],
  );

  // Send ping to keep connection alive
  const ping = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "ping" }));
    }
  }, []);

  // Connect when accessToken changes
  useEffect(() => {
    if (accessToken) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      cleanup();
    };
  }, [accessToken, connect, disconnect, cleanup]);

  // Heartbeat to keep connection alive
  useEffect(() => {
    if (!state.authenticated) return;

    const interval = setInterval(() => {
      ping();
    }, 30000);

    return () => clearInterval(interval);
  }, [state.authenticated, ping]);

  return {
    ...state,
    connect,
    disconnect,
    sendCommand,
    ping,
  };
}
