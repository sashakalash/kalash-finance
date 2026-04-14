import Link from 'next/link';
import type { Metadata } from 'next';
import { LoginForm } from '@/features/auth/components/LoginForm';

export const metadata: Metadata = { title: 'Sign in — Kalash Finance' };

interface Props {
  searchParams: Promise<{ next?: string }>;
}

export default async function LoginPage({ searchParams }: Props): Promise<React.ReactElement> {
  const { next } = await searchParams;

  return (
    <main className="flex min-h-svh items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-bold">Welcome back</h1>
          <p className="text-sm text-muted-foreground">Sign in to your account</p>
        </div>

        <LoginForm next={next} />

        <p className="text-center text-sm text-muted-foreground">
          No account?{' '}
          <Link
            href={next ? `/auth/signup?next=${encodeURIComponent(next)}` : '/auth/signup'}
            className="font-medium underline underline-offset-4"
          >
            Sign up
          </Link>
        </p>
      </div>
    </main>
  );
}
