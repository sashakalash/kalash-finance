'use server';

import { revalidatePath } from 'next/cache';
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

  const { error } = await supabase.from('telegram_links').upsert(
    {
      user_id: user.id,
      household_id: householdId,
      link_code: code,
      link_code_expires_at: expiresAt,
    },
    { onConflict: 'user_id', ignoreDuplicates: false },
  );

  if (error) throw new Error(error.message);
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

/** Accept an invite and join the household. Returns an error message or null on success. */
export async function acceptHouseholdInvite(code: string): Promise<{ error: string | null }> {
  const { supabase, user } = await requireUser();

  const { data, error: rpcErr } = await supabase.rpc('accept_household_invite', {
    invite_code_input: code,
    calling_user_id: user.id,
    calling_user_email: user.email ?? '',
  });

  if (rpcErr) return { error: rpcErr.message };
  if (data) return { error: data as string };

  return { error: null };
}
