import Link from 'next/link';
import type { Metadata } from 'next';
import { LoginForm } from '@/features/auth/LoginForm';

export const metadata: Metadata = { title: 'Sign in — Kalash Finance' };

export default function LoginPage(): React.ReactElement {
  return (
    <main className="flex min-h-svh items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-bold">Welcome back</h1>
          <p className="text-sm text-muted-foreground">Sign in to your account</p>
        </div>

        <LoginForm />

        <p className="text-center text-sm text-muted-foreground">
          No account?{' '}
          <Link href="/auth/signup" className="font-medium underline underline-offset-4">
            Sign up
          </Link>
        </p>
      </div>
    </main>
  );
}
