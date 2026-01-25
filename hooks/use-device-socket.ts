import { useState, useEffect, useCallback, useRef } from 'react';

// =============================================================================
// Types
// =============================================================================

export interface DeviceStatus {
  device_id: string;
  status: 'online' | 'offline';
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
  devices: string[];
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
  options: UseDeviceSocketOptions = {}
) {
  const {
    relayUrl = process.env.NEXT_PUBLIC_RELAY_URL || 'wss://relay.localhost',
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
  const pendingCommandsRef = useRef<Map<string, {
    resolve: (result: CommandResult) => void;
    reject: (error: Error) => void;
    timeout: NodeJS.Timeout;
  }>>(new Map());

  // Cleanup function
  const cleanup = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    // Clear all pending commands
    pendingCommandsRef.current.forEach(({ reject, timeout }) => {
      clearTimeout(timeout);
      reject(new Error('Connection closed'));
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
      setState(prev => ({ ...prev, error: 'No access token provided' }));
      return;
    }

    cleanup();

    try {
      const ws = new WebSocket(relayUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('[DeviceSocket] Connected, authenticating...');
        setState(prev => ({ ...prev, connected: true, error: null }));
        
        // Send authentication message
        ws.send(JSON.stringify({
          type: 'auth',
          access_token: accessToken,
        }));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          switch (data.type) {
            case 'auth_success':
              console.log('[DeviceSocket] Authenticated');
              setState(prev => ({ ...prev, authenticated: true }));
              onAuthenticated?.();
              break;

            case 'auth_error':
              console.error('[DeviceSocket] Auth error:', data.error);
              setState(prev => ({
                ...prev,
                authenticated: false,
                error: data.error || 'Authentication failed',
              }));
              break;

            case 'device_list':
              console.log('[DeviceSocket] Device list:', data.devices);
              setState(prev => ({ ...prev, devices: data.devices || [] }));
              break;

            case 'device_status':
              console.log('[DeviceSocket] Device status:', data.device_id, data.status);
              if (data.status === 'online') {
                setState(prev => ({
                  ...prev,
                  devices: [...prev.devices.filter(id => id !== data.device_id), data.device_id],
                }));
                onDeviceOnline?.(data.device_id);
              } else {
                setState(prev => ({
                  ...prev,
                  devices: prev.devices.filter(id => id !== data.device_id),
                }));
                onDeviceOffline?.(data.device_id);
              }
              break;

            case 'response':
              console.log('[DeviceSocket] Command response:', data.request_id);
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

            case 'error':
              console.error('[DeviceSocket] Error:', data.error);
              setState(prev => ({ ...prev, error: data.error }));
              break;

            case 'pong':
              // Heartbeat response, ignore
              break;

            default:
              console.log('[DeviceSocket] Unknown message type:', data.type);
          }
        } catch (e) {
          console.error('[DeviceSocket] Failed to parse message:', e);
        }
      };

      ws.onclose = (event) => {
        console.log('[DeviceSocket] Disconnected:', event.code, event.reason);
        setState(prev => ({
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

      ws.onerror = (error) => {
        console.error('[DeviceSocket] WebSocket error:', error);
        setState(prev => ({ ...prev, error: 'Connection error' }));
      };
    } catch (error) {
      console.error('[DeviceSocket] Failed to connect:', error);
      setState(prev => ({ ...prev, error: 'Failed to connect' }));
    }
  }, [accessToken, relayUrl, cleanup, autoReconnect, reconnectDelay, onAuthenticated, onDeviceOnline, onDeviceOffline, onCommandResponse]);

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
    (deviceId: string, command: string, payload?: unknown, timeoutMs = 30000): Promise<CommandResult> => {
      return new Promise((resolve, reject) => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
          reject(new Error('Not connected'));
          return;
        }

        if (!state.authenticated) {
          reject(new Error('Not authenticated'));
          return;
        }

        const requestId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        // Set up timeout
        const timeout = setTimeout(() => {
          pendingCommandsRef.current.delete(requestId);
          reject(new Error('Command timeout'));
        }, timeoutMs);

        // Store pending command
        pendingCommandsRef.current.set(requestId, { resolve, reject, timeout });

        // Send command
        wsRef.current.send(JSON.stringify({
          type: 'command',
          device_id: deviceId,
          command,
          request_id: requestId,
          payload,
        }));
      });
    },
    [state.authenticated]
  );

  // Send ping to keep connection alive
  const ping = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'ping' }));
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
