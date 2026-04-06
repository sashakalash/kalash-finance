import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Return the household_id for the given user.
 * If no household exists (e.g. signup trigger failed), calls the
 * setup_user_household() RPC (SECURITY DEFINER) as a recovery path.
 */
export async function getHouseholdId(supabase: SupabaseClient, userId: string): Promise<string> {
  const { data } = await supabase
    .from('household_members')
    .select('household_id')
    .eq('user_id', userId)
    .single();

  if (data) return data.household_id as string;

  // Recovery: trigger failed at signup — run SECURITY DEFINER RPC to bypass RLS
  const { error: rpcError } = await supabase.rpc('setup_user_household');
  if (rpcError) throw new Error(`Failed to create household: ${rpcError.message}`);

  const { data: recovered, error: retryError } = await supabase
    .from('household_members')
    .select('household_id')
    .eq('user_id', userId)
    .single();

  if (retryError || !recovered) throw new Error('Household setup failed');
  return recovered.household_id as string;
}
