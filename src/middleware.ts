import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const PENDING_INVITE_COOKIE = 'pending_invite';

export async function middleware(request: NextRequest): Promise<NextResponse> {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Refresh session — do not add logic between createServerClient and getUser()
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Unauthenticated user visiting /invite/[code] — save code in cookie so we can
  // redirect after signup + email confirmation (Supabase drops ?next from emailRedirectTo).
  const inviteMatch = pathname.match(/^\/invite\/([A-Za-z0-9]+)$/);
  if (!user && inviteMatch) {
    const res = NextResponse.redirect(
      new URL(`/auth/login?next=/invite/${inviteMatch[1]}`, request.url),
    );
    res.cookies.set(PENDING_INVITE_COOKIE, inviteMatch[1], { path: '/', maxAge: 60 * 60 * 24 * 3 });
    return res;
  }

  // Authenticated user with a pending invite cookie — redirect to the invite page
  // so they can accept it (handles the post-signup flow).
  const pendingInvite = request.cookies.get(PENDING_INVITE_COOKIE)?.value;
  if (user && pendingInvite && !pathname.startsWith('/invite/')) {
    const res = NextResponse.redirect(new URL(`/invite/${pendingInvite}`, request.url));
    res.cookies.delete(PENDING_INVITE_COOKIE);
    return res;
  }

  if (
    !user &&
    (pathname.startsWith('/dashboard') ||
      pathname.startsWith('/transactions') ||
      pathname.startsWith('/import') ||
      pathname.startsWith('/settings'))
  ) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
