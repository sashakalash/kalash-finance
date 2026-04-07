import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getHouseholdId } from '@/lib/supabase/household';
import { TelegramLinkCard } from '@/features/settings/TelegramLinkCard';
import { CategoryManager } from '@/features/settings/CategoryManager';
import { HouseholdCard } from '@/features/settings/HouseholdCard';
import type { Category, Household, HouseholdMember, TelegramLink } from '@/types';

export const metadata: Metadata = { title: 'Settings — Kalash Finance' };

export default async function SettingsPage(): Promise<React.ReactElement> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const householdId = await getHouseholdId(supabase, user.id);

  const [
    { data: catData },
    { data: telegramData },
    { data: householdData },
    { data: membersData },
  ] = await Promise.all([
    supabase.from('categories').select('*').eq('household_id', householdId).order('name'),
    supabase
      .from('telegram_links')
      .select('telegram_chat_id, telegram_username')
      .eq('user_id', user.id)
      .maybeSingle(),
    supabase
      .from('households')
      .select('id, name, invite_code, invite_expires_at, created_at')
      .eq('id', householdId)
      .single(),
    supabase
      .from('household_members')
      .select('household_id, user_id, role, email, joined_at')
      .eq('household_id', householdId)
      .order('joined_at'),
  ]);

  const categories = (catData ?? []) as Category[];
  const telegramLink = telegramData as Pick<
    TelegramLink,
    'telegram_chat_id' | 'telegram_username'
  > | null;
  const household = householdData as Household | null;
  const members = (membersData ?? []) as HouseholdMember[];

  const isLinked = Boolean(telegramLink && telegramLink.telegram_chat_id !== 0);
  const isOwner = members.find((m) => m.user_id === user.id)?.role === 'owner';

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      <div className="grid gap-4 max-w-2xl">
        {household && (
          <HouseholdCard
            household={household}
            members={members}
            currentUserId={user.id}
            isOwner={isOwner}
          />
        )}

        <TelegramLinkCard
          isLinked={isLinked}
          telegramUsername={telegramLink?.telegram_username ?? null}
        />

        <CategoryManager categories={categories} />
      </div>
    </div>
  );
}
