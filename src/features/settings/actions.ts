'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/supabase/auth';
import { getHouseholdId } from '@/lib/supabase/household';
import { CreateCategorySchema } from '@/types/zod';
import type { CreateCategoryInput } from '@/types/zod';

/** Generate a 6-char uppercase alphanumeric link code, valid for 10 minutes. */
export async function generateTelegramLinkCode(): Promise<string> {
  const { supabase, user } = await requireUser();
  const householdId = await getHouseholdId(supabase, user.id);

  const code = Array.from(crypto.getRandomValues(new Uint8Array(6)))
    .map((b) => '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'[b % 36])
    .join('');

  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  await supabase.from('telegram_links').upsert(
    {
      user_id: user.id,
      household_id: householdId,
      telegram_chat_id: 0,
      link_code: code,
      link_code_expires_at: expiresAt,
    },
    { onConflict: 'user_id', ignoreDuplicates: false },
  );

  return code;
}

/** Remove the Telegram link for the current user. */
export async function unlinkTelegram(): Promise<void> {
  const { supabase, user } = await requireUser();
  await supabase.from('telegram_links').delete().eq('user_id', user.id);
  revalidatePath('/(protected)/settings');
}

/** Create a new category. */
export async function createCategory(input: CreateCategoryInput): Promise<void> {
  const { supabase, user } = await requireUser();
  const householdId = await getHouseholdId(supabase, user.id);
  const data = CreateCategorySchema.parse(input);

  const { error } = await supabase.from('categories').insert({
    ...data,
    household_id: householdId,
    is_default: false,
  });

  if (error) throw new Error(error.message);
  revalidatePath('/(protected)/settings');
}

/** Delete a category (transactions will get category_id = NULL). */
export async function deleteCategory(id: string): Promise<void> {
  const { supabase, user } = await requireUser();
  const householdId = await getHouseholdId(supabase, user.id);
  await supabase.from('categories').delete().eq('id', id).eq('household_id', householdId);
  revalidatePath('/(protected)/settings');
}

/** Generate an invite link for the current user's household (owner only). */
export async function generateHouseholdInvite(): Promise<string> {
  const { supabase, user } = await requireUser();
  const householdId = await getHouseholdId(supabase, user.id);

  const code = Array.from(crypto.getRandomValues(new Uint8Array(8)))
    .map((b) => '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'[b % 36])
    .join('');

  const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(); // 72 hours

  const { error } = await supabase
    .from('households')
    .update({ invite_code: code, invite_expires_at: expiresAt })
    .eq('id', householdId);

  if (error) throw new Error(error.message);
  revalidatePath('/(protected)/settings');
  return code;
}

/** Accept an invite and join the household. */
export async function acceptHouseholdInvite(code: string): Promise<void> {
  const { supabase, user } = await requireUser();

  // Find the household by invite code
  const { data: household, error: hErr } = await supabase
    .from('households')
    .select('id, name, invite_expires_at')
    .eq('invite_code', code)
    .single();

  if (hErr || !household) throw new Error('Invalid invite code');
  if (new Date(household.invite_expires_at as string) < new Date()) {
    throw new Error('Invite link has expired');
  }

  // Get current household to clean up after moving
  const { data: currentMembership } = await supabase
    .from('household_members')
    .select('household_id')
    .eq('user_id', user.id)
    .single();

  const oldHouseholdId = currentMembership?.household_id as string | undefined;

  // Already in this household
  if (oldHouseholdId === household.id) {
    redirect('/dashboard');
  }

  // Join new household
  const { error: joinErr } = await supabase.from('household_members').insert({
    household_id: household.id,
    user_id: user.id,
    role: 'member',
    email: user.email ?? '',
  });

  if (joinErr) throw new Error(joinErr.message);

  // Leave old household
  if (oldHouseholdId) {
    await supabase
      .from('household_members')
      .delete()
      .eq('household_id', oldHouseholdId)
      .eq('user_id', user.id);

    // Delete old household if now empty (cascades categories etc.)
    await supabase.rpc('cleanup_empty_household', { hid: oldHouseholdId });
  }

  redirect('/dashboard');
}
