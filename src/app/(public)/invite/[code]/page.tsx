import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AcceptInviteButton } from '@/features/settings/AcceptInviteButton';

export const metadata: Metadata = { title: 'Join Household — Kalash Finance' };

interface Props {
  params: Promise<{ code: string }>;
}

export default async function InvitePage({ params }: Props): Promise<React.ReactElement> {
  const { code } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(`/auth/login?next=/invite/${code}`);

  // Look up the household by invite code
  const { data: household } = await supabase
    .from('households')
    .select('id, name, invite_expires_at')
    .eq('invite_code', code)
    .maybeSingle();

  const isValid =
    household && household.invite_expires_at
      ? new Date(household.invite_expires_at) > new Date()
      : false;

  if (!isValid) {
    return (
      <main className="flex min-h-svh items-center justify-center p-4">
        <div className="w-full max-w-sm space-y-4 text-center">
          <h1 className="text-2xl font-bold">Invalid invite</h1>
          <p className="text-sm text-muted-foreground">
            This invite link has expired or is no longer valid.
          </p>
          <a href="/settings" className="text-sm underline underline-offset-4">
            Back to settings
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-svh items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6 text-center">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">You&apos;re invited</h1>
          <p className="text-sm text-muted-foreground">
            Join <span className="font-medium text-foreground">{household.name}</span> to share
            transactions and budgets with your household.
          </p>
        </div>

        <AcceptInviteButton code={code} />

        <p className="text-xs text-muted-foreground">
          Signed in as <span className="font-medium">{user.email}</span>
        </p>
      </div>
    </main>
  );
}
