import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Check your email — Kalash Finance' };

export default function VerifyPage(): React.ReactElement {
  return (
    <main className="flex min-h-svh items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-4 text-center">
        <div className="text-4xl">📬</div>
        <h1 className="text-2xl font-bold">Check your email</h1>
        <p className="text-sm text-muted-foreground">
          We sent you a link to sign in. It expires in 10 minutes.
        </p>
        <Link href="/auth/login" className="text-sm underline underline-offset-4">
          Back to sign in
        </Link>
      </div>
    </main>
  );
}
