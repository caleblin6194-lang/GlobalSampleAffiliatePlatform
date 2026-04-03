'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

function stringifyUnknown(value: unknown): string {
  if (typeof value === 'string') return value;
  if (value instanceof Error) return value.message;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

export default function CreatorChannelsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    const report = async () => {
      try {
        await fetch('/api/client-errors', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            source: 'creator/channels/error-boundary',
            timestamp: new Date().toISOString(),
            message: error?.message ?? 'Unknown client error',
            digest: error?.digest ?? null,
            stack: error?.stack ?? null,
          }),
        });
      } catch {
        // Do not throw from an error boundary reporter.
      }
    };

    void report();
  }, [error]);

  return (
    <div className="max-w-3xl space-y-4 rounded-lg border bg-card p-6">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 text-destructive" />
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">This page ran into an error.</h2>
          <p className="text-sm text-muted-foreground">
            Please retry. If it happens again, send this message to support.
          </p>
        </div>
      </div>

      <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
        {stringifyUnknown(error?.message || 'Unknown error')}
      </div>

      <div className="flex items-center gap-3">
        <Button onClick={reset} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Retry
        </Button>
      </div>
    </div>
  );
}
