import { redirect } from 'next/navigation';
import { TopLoader } from '@/components/layout/TopLoader';
import { createClient } from '@/lib/supabase/server';
import { DesktopSidebar } from '@/components/layout/DesktopSidebar';
import { MobileNav } from '@/components/layout/MobileNav';
import { getHouseholdId } from '@/lib/supabase/household';
import { DEFAULT_CATEGORIES } from '@/lib/constants';

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}): Promise<React.ReactElement> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/auth/login');

  // Seed missing default categories
  try {
    const householdId = await getHouseholdId(supabase, user.id);
    const { data: existing } = await supabase
      .from('categories')
      .select('name')
      .eq('household_id', householdId);

    const existingNames = new Set((existing ?? []).map((c) => c.name));
    const missing = DEFAULT_CATEGORIES.filter((c) => !existingNames.has(c.name));

    if (missing.length > 0) {
      await supabase
        .from('categories')
        .insert(missing.map((c) => ({ ...c, household_id: householdId })));
    }
  } catch {
    // Non-fatal — app works without categories
  }

  return (
    <>
      <TopLoader />
      <div className="flex h-screen overflow-hidden pt-[env(safe-area-inset-top)] landscape:max-lg:pl-10 lg:pt-0">
        {/* Desktop sidebar with toggle */}
        <DesktopSidebar />

        {/* Main content */}
        <main className="flex min-h-0 flex-1 flex-col pb-[calc(4rem+env(safe-area-inset-bottom))] landscape:pb-0 lg:pb-0">
          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-4 md:p-6">{children}</div>
        </main>

        {/* Mobile bottom nav */}
        <MobileNav />
      </div>
    </>
  );
}
