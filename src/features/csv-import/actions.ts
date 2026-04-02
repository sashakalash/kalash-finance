'use server';

import { requireUser } from '@/lib/supabase/auth';

/** Return the set of transaction hashes already in the DB for this user. */
export async function fetchExistingHashes(): Promise<Set<string>> {
  const { supabase, user } = await requireUser();

  const { data, error } = await supabase
    .from('transactions')
    .select('hash')
    .eq('user_id', user.id)
    .not('hash', 'is', null);

  if (error) throw new Error(error.message);

  return new Set((data ?? []).map((r) => r.hash as string));
}
