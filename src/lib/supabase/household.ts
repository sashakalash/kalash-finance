import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Return the household_id for the given user.
 * Throws with a descriptive message if not found (should not happen after signup).
 */
export async function getHouseholdId(supabase: SupabaseClient, userId: string): Promise<string> {
  const { data, error } = await supabase
    .from('household_members')
    .select('household_id')
    .eq('user_id', userId)
    .single();

  if (error) throw new Error(`household_members query failed: ${error.message}`);
  if (!data) throw new Error(`No household found for user ${userId}`);

  return data.household_id as string;
}
