'use client';

import { FallbackProps } from 'react-error-boundary';

export function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  const errorMessage =
    error instanceof Error
      ? error.message
      : typeof error === 'string'
        ? error
        : 'An unknown error occurred';
  return (
    <div className="rounded border border-red-200 bg-red-50 p-4 text-sm text-red-700">
      Something went wrong. <pre>{errorMessage}</pre>
      <button onClick={resetErrorBoundary} className="underline font-medium hover:text-red-800">
        Try again
      </button>
    </div>
  );
}
