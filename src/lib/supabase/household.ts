import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Return the household_id for the given user.
 * Throws if the user has no household (should never happen after migration).
 */
export async function getHouseholdId(supabase: SupabaseClient, userId: string): Promise<string> {
  const { data, error } = await supabase
    .from('household_members')
    .select('household_id')
    .eq('user_id', userId)
    .single();

  if (error || !data) throw new Error('No household found for user');
  return data.household_id as string;
}
