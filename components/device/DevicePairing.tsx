'use client';

import { useState, useEffect, useCallback } from 'react';
import { useStartPairingMutation } from '@/redux/features/authApiSlice';
import Spinner from '@/components/common/Spinner';

interface DevicePairingProps {
  onPairingComplete?: () => void;
}

export default function DevicePairing({ onPairingComplete }: DevicePairingProps) {
  const [startPairing, { isLoading }] = useStartPairingMutation();
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [expiresIn, setExpiresIn] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  const generateCode = useCallback(async () => {
    setError(null);
    try {
      const result = await startPairing().unwrap();
      setPairingCode(result.pairing_code);
      setExpiresIn(result.expires_in);
    } catch (err) {
      setError('Failed to generate pairing code. Please try again.');
      console.error('Pairing error:', err);
    }
  }, [startPairing]);

  // Countdown timer
  useEffect(() => {
    if (expiresIn <= 0) return;

    const timer = setInterval(() => {
      setExpiresIn((prev) => {
        if (prev <= 1) {
          setPairingCode(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [expiresIn]);

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 max-w-md mx-auto">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
        Pair Desktop App
      </h2>
      
      <p className="text-gray-600 dark:text-gray-300 mb-6">
        Enter this code in your desktop application to connect it to your account.
      </p>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3 mb-4">
          <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
        </div>
      )}

      {pairingCode ? (
        <div className="text-center">
          {/* Pairing Code Display */}
          <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-6 mb-4">
            <div className="font-mono text-4xl font-bold tracking-wider text-gray-900 dark:text-white">
              {pairingCode}
            </div>
          </div>

          {/* Expiration Timer */}
          <div className="flex items-center justify-center gap-2 text-gray-500 dark:text-gray-400 mb-4">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>
              Code expires in <strong>{formatTime(expiresIn)}</strong>
            </span>
          </div>

          {/* Regenerate Button */}
          <button
            onClick={generateCode}
            disabled={isLoading}
            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-medium disabled:opacity-50"
          >
            Generate new code
          </button>
        </div>
      ) : (
        <div className="text-center">
          <button
            onClick={generateCode}
            disabled={isLoading}
            className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Spinner sm />
                Generating...
              </>
            ) : (
              'Generate Pairing Code'
            )}
          </button>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
          How to pair:
        </h3>
        <ol className="text-sm text-gray-600 dark:text-gray-300 space-y-1 list-decimal list-inside">
          <li>Open the desktop application</li>
          <li>Click &quot;Connect to Web&quot;</li>
          <li>Enter the pairing code shown above</li>
          <li>Your device will appear in your device list</li>
        </ol>
      </div>
    </div>
  );
}
