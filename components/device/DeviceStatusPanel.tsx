"use client";

import { useEffect, useState } from "react";
import { useRefreshAccessTokenMutation } from "@/redux/features/authApiSlice";
import useDeviceSocket, {
  normalizeConnectedDevice,
  type CommandResult,
  type ConnectedDevice,
} from "@/hooks/use-device-socket";

import { mintTraceId } from "@/lib/traceId";
import { createLogger } from "@/lib/logger";

type DeviceListItemProps = {
  device: ConnectedDevice;
  commandsReady: boolean;
  sendCommand: (
    deviceId: string,
    command: string,
    payload?: unknown,
    traceId?: string,
  ) => Promise<CommandResult>;
};

function DeviceListItem({
  device,
  commandsReady,
  sendCommand,
}: DeviceListItemProps) {
  const [expanded, setExpanded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [lastResult, setLastResult] = useState<string | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);

  const normalized = normalizeConnectedDevice(device) ?? device;
  const displayName = normalized.device_name.trim() || normalized.device_id;

  const runCommand = async (
    command: string,
    traceId: string,
    log: ReturnType<typeof createLogger>,
    stepPrefix: "ping" | "get_status",
  ) => {
    setBusy(true);
    setLastResult(null);
    setLastError(null);
    try {
      const response = await sendCommand(
        normalized.device_id,
        command,
        undefined,
        traceId,
      );
      if (response.error) {
        setLastError(response.error);
        log.error(`${stepPrefix}.ui.failed`, "Command returned error", {
          userMessage: response.error,
          metadata: { request_id: response.request_id },
        });
      } else {
        setLastResult(JSON.stringify(response.result, null, 2));
        log.info(`${stepPrefix}.ui.success`, "Command succeeded", {
          metadata: { request_id: response.request_id },
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Command failed";
      setLastError(message);
      log.error(`${stepPrefix}.ui.failed`, message, {
        userMessage: message,
      });
    } finally {
      setBusy(false);
    }
  };

  const handlePing = () => {
    const traceId = mintTraceId();
    const log = createLogger("relay.commands", traceId);
    log.info("click.ping", "Ping device clicked", {
      metadata: { device_id: normalized.device_id },
    });
    void runCommand("ping", traceId, log, "ping");
  };

  const handleGetStatus = () => {
    const traceId = mintTraceId();
    const log = createLogger("relay.commands", traceId);
    log.info("click.get_status", "Get status clicked", {
      metadata: { device_id: normalized.device_id },
    });
    void runCommand("get_status", traceId, log, "get_status");
  };

  return (
    <li className="text-sm text-gray-700 dark:text-gray-300">
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 shrink-0 rounded-full bg-green-500" />
        <button
          type="button"
          onClick={() => setExpanded((open) => !open)}
          className="truncate text-left font-medium hover:underline"
          aria-expanded={expanded}
        >
          {displayName}
        </button>
      </div>

      {expanded ? (
        <div className="mt-2 ml-4 space-y-2">
          <p className="break-all font-mono text-xs text-gray-500 dark:text-gray-400">
            {normalized.device_id}
          </p>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handlePing}
              disabled={busy || !commandsReady}
              className="rounded-md bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {busy ? "Sending…" : "Ping"}
            </button>
            <button
              type="button"
              onClick={handleGetStatus}
              disabled={busy || !commandsReady}
              className="rounded-md border border-gray-300 px-3 py-1 text-xs font-medium hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:hover:bg-gray-700"
            >
              Get status
            </button>
          </div>

          {!commandsReady ? (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Waiting for relay authentication…
            </p>
          ) : null}

          {lastError ? (
            <p className="text-xs text-red-600 dark:text-red-400">
              {lastError}
            </p>
          ) : null}

          {lastResult ? (
            <pre className="max-h-40 overflow-auto rounded bg-gray-100 p-2 text-xs text-gray-800 dark:bg-gray-900 dark:text-gray-200">
              {lastResult}
            </pre>
          ) : null}
        </div>
      ) : null}
    </li>
  );
}

export default function DeviceStatusPanel() {
  const [refreshAccessToken] = useRefreshAccessTokenMutation();
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [tokenError, setTokenError] = useState<string | null>(null);

  useEffect(() => {
    refreshAccessToken()
      .unwrap()
      .then((data) => {
        setAccessToken(data.access);
        setTokenError(null);
      })
      .catch(() => {
        setAccessToken(null);
        setTokenError("Could not obtain access token for relay.");
      });
  }, [refreshAccessToken]);

  const { connected, authenticated, devices, error, sendCommand } =
    useDeviceSocket(accessToken);

  const statusColor = authenticated
    ? "text-green-600"
    : connected
      ? "text-yellow-600"
      : "text-red-600";

  const statusLabel = authenticated
    ? "Connected to relay"
    : connected
      ? "Connecting…"
      : "Disconnected";

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 max-w-md mx-auto">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
        Connected Devices
      </h2>

      <p className={`text-sm font-medium mb-4 ${statusColor}`}>
        Relay: {statusLabel}
      </p>

      {(tokenError || error) && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3 mb-4">
          <p className="text-red-600 dark:text-red-400 text-sm">
            {tokenError || error}
          </p>
        </div>
      )}

      {devices.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No devices online. Pair a desktop app to see it here.
        </p>
      ) : (
        <ul className="space-y-2">
          {devices.map((device) => {
            const normalized =
              normalizeConnectedDevice(device) ??
              ({
                device_id: "unknown",
                device_name: "Unknown Device",
              } as const);
            return (
              <DeviceListItem
                key={normalized.device_id}
                device={normalized}
                commandsReady={connected && authenticated}
                sendCommand={sendCommand}
              />
            );
          })}
        </ul>
      )}
    </div>
  );
}
