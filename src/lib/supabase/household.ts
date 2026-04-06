import type { SupabaseClient } from '@supabase/supabase-js';

const DEFAULT_CATEGORIES = [
  { name: 'Food & Dining', icon: '🍔', color: '#ef4444' },
  { name: 'Transport', icon: '🚗', color: '#f59e0b' },
  { name: 'Shopping', icon: '🛍', color: '#8b5cf6' },
  { name: 'Entertainment', icon: '🎬', color: '#ec4899' },
  { name: 'Utilities', icon: '💡', color: '#06b6d4' },
  { name: 'Health', icon: '🏥', color: '#10b981' },
  { name: 'Transfers', icon: '->', color: '#94a3b8' },
  { name: 'Fees', icon: '🏦', color: '#64748b' },
  { name: 'Income', icon: '💰', color: '#22c55e' },
  { name: 'Other', icon: '📦', color: '#6b7280' },
];

/**
 * Return the household_id for the given user.
 * If no household exists (e.g. signup trigger failed), creates one as a recovery path.
 */
export async function getHouseholdId(supabase: SupabaseClient, userId: string): Promise<string> {
  const { data } = await supabase
    .from('household_members')
    .select('household_id')
    .eq('user_id', userId)
    .single();

  if (data) return data.household_id as string;

  // Recovery: trigger failed at signup — create household + seed categories now
  const { data: household, error: householdError } = await supabase
    .from('households')
    .insert({ name: 'My Household' })
    .select('id')
    .single();

  if (householdError || !household) throw new Error('Failed to create household');

  const householdId = household.id as string;

  await supabase.from('household_members').insert({
    household_id: householdId,
    user_id: userId,
    role: 'owner',
  });

  await supabase
    .from('categories')
    .insert(DEFAULT_CATEGORIES.map((c) => ({ ...c, household_id: householdId, is_default: true })));

  return householdId;
}
