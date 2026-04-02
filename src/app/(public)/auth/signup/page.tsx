import Link from 'next/link';
import type { Metadata } from 'next';
import { SignupForm } from '@/features/auth/SignupForm';

export const metadata: Metadata = { title: 'Sign up — Kalash Finance' };

export default function SignupPage(): React.ReactElement {
  return (
    <main className="flex min-h-svh items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-bold">Create account</h1>
          <p className="text-sm text-muted-foreground">Start tracking your finances</p>
        </div>

        <SignupForm />

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link href="/auth/login" className="font-medium underline underline-offset-4">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
