'use server';

import { requireUser } from '@/lib/supabase/auth';
import { getHouseholdId } from '@/lib/supabase/household';

/** Return the set of transaction hashes already in the DB for this household. */
export async function fetchExistingHashes(): Promise<Set<string>> {
  const { supabase, user } = await requireUser();
  const householdId = await getHouseholdId(supabase, user.id);

  const { data, error } = await supabase
    .from('transactions')
    .select('hash')
    .eq('household_id', householdId)
    .not('hash', 'is', null);

  if (error) throw new Error(error.message);

  return new Set((data ?? []).map((r) => r.hash as string));
}
