import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Import — Kalash Finance' };

export default function ImportPage(): React.ReactElement {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Import</h1>
      <p className="text-muted-foreground">CSV import wizard — coming soon.</p>
    </div>
  );
}
