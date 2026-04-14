import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const rawNext = searchParams.get('next') ?? '';
  const next = rawNext.replace(/^\/\([^)]+\)/, '');

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // If the user signed up from an invite link, their pending_invite is stored
      // in user metadata. Redirect to the invite page so they can accept.
      const pendingInvite = data.user?.user_metadata?.pending_invite as string | undefined;
      const destination = next || (pendingInvite ? `/invite/${pendingInvite}` : '/dashboard');
      return NextResponse.redirect(`${origin}${destination}`);
    }
  }

  return NextResponse.redirect(`${origin}/auth/login?error=auth_callback_failed`);
}
