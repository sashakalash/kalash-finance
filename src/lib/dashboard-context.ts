import { createClient } from '@/lib/supabase/server';
import { getHouseholdId } from '@/lib/supabase/household';
import { SupabaseClient, User } from '@supabase/supabase-js';

export async function getDashboardContext(): Promise<{
  supabase: SupabaseClient<any, 'public', 'public', any, any>;
  householdId: string;
  user: User;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  const householdId = await getHouseholdId(supabase, user.id);

  return { supabase, householdId, user };
}
