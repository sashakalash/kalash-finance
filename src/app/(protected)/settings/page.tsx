import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Settings — Kalash Finance' };

export default function SettingsPage(): React.ReactElement {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Settings</h1>
      <p className="text-muted-foreground">Categories + Telegram link — coming soon.</p>
    </div>
  );
}
