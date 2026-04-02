'use server';

import { revalidatePath } from 'next/cache';
import { requireUser } from '@/lib/supabase/auth';
import { CreateCategorySchema } from '@/types/zod';
import type { CreateCategoryInput } from '@/types/zod';

/** Generate a 6-char uppercase alphanumeric link code, valid for 10 minutes. */
export async function generateTelegramLinkCode(): Promise<string> {
  const { supabase, user } = await requireUser();

  const code = Array.from(crypto.getRandomValues(new Uint8Array(6)))
    .map((b) => '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'[b % 36])
    .join('');

  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  // Upsert: one row per user
  await supabase.from('telegram_links').upsert(
    {
      user_id: user.id,
      telegram_chat_id: 0, // placeholder; overwritten on link
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
  const data = CreateCategorySchema.parse(input);

  const { error } = await supabase.from('categories').insert({
    ...data,
    user_id: user.id,
    is_default: false,
  });

  if (error) throw new Error(error.message);
  revalidatePath('/(protected)/settings');
}

/** Delete a category (transactions will get category_id = NULL). */
export async function deleteCategory(id: string): Promise<void> {
  const { supabase, user } = await requireUser();
  await supabase.from('categories').delete().eq('id', id).eq('user_id', user.id);
  revalidatePath('/(protected)/settings');
}
