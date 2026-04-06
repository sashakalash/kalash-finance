import { createServerClient } from '@supabase/ssr';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

export async function createClient(): Promise<SupabaseClient> {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Server Component — cookies are read-only, ignore
          }
        },
      },
    },
  );
}

/** Service-role client — bypasses RLS. Server-side only. Never expose to client. */
export function createServiceClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY env var');
  return createSupabaseClient(url, key, { auth: { persistSession: false } });
}
