'use client';

interface Props {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ProtectedError({ error, reset }: Props): React.ReactElement {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-6 text-center">
      <h2 className="text-xl font-semibold">Something went wrong</h2>
      <pre className="max-w-xl overflow-auto rounded bg-muted px-4 py-3 text-left text-sm text-muted-foreground">
        {error.message}
        {error.digest ? `\ndigest: ${error.digest}` : ''}
      </pre>
      <button
        onClick={reset}
        className="rounded bg-primary px-4 py-2 text-sm text-primary-foreground"
      >
        Try again
      </button>
    </div>
  );
}
