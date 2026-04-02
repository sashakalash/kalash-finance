import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { TelegramLinkCard } from '@/features/settings/TelegramLinkCard';
import { CategoryManager } from '@/features/settings/CategoryManager';
import type { Category, TelegramLink } from '@/types';

export const metadata: Metadata = { title: 'Settings — Kalash Finance' };

export default async function SettingsPage(): Promise<React.ReactElement> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const [{ data: catData }, { data: telegramData }] = await Promise.all([
    supabase.from('categories').select('*').eq('user_id', user.id).order('name'),
    supabase
      .from('telegram_links')
      .select('telegram_chat_id, telegram_username')
      .eq('user_id', user.id)
      .maybeSingle(),
  ]);

  const categories = (catData ?? []) as Category[];
  const telegramLink = telegramData as Pick<
    TelegramLink,
    'telegram_chat_id' | 'telegram_username'
  > | null;

  // A link is "active" when chat_id is non-zero (code was exchanged)
  const isLinked = Boolean(telegramLink && telegramLink.telegram_chat_id !== 0);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      <div className="grid gap-4 max-w-2xl">
        <TelegramLinkCard
          isLinked={isLinked}
          telegramUsername={telegramLink?.telegram_username ?? null}
        />

        <CategoryManager categories={categories} />

        <div className="rounded-lg border p-4 text-sm text-muted-foreground">
          <p>
            Signed in as <span className="font-medium text-foreground">{user.email}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
