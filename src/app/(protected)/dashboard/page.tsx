import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { getHouseholdId } from '@/lib/supabase/household';
import { redirect } from 'next/navigation';
import { StatsGrid } from '@/features/dashboard/StatsGrid';
import { SpendingByCategoryChart } from '@/features/dashboard/SpendingByCategoryChart';
import { MonthlyTrendsChart } from '@/features/dashboard/MonthlyTrendsChart';
import { RecentTransactions } from '@/features/dashboard/RecentTransactions';
import {
  fetchDashboardStats,
  fetchCategorySpend,
  fetchMonthlyTrends,
  fetchRecentTransactions,
} from '@/features/dashboard/queries';
import { currentMonthRange } from '@/lib/utils';

export const metadata: Metadata = { title: 'Dashboard — Kalash Finance' };

export default async function DashboardPage(): Promise<React.ReactElement> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  let householdId: string;
  try {
    householdId = await getHouseholdId(supabase, user.id);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[dashboard] getHouseholdId failed:', msg);
    throw new Error(`getHouseholdId: ${msg}`);
  }

  const { from, to } = currentMonthRange();

  let stats: Awaited<ReturnType<typeof fetchDashboardStats>>;
  let categorySpend: Awaited<ReturnType<typeof fetchCategorySpend>>;
  let trends: Awaited<ReturnType<typeof fetchMonthlyTrends>>;
  let recent: Awaited<ReturnType<typeof fetchRecentTransactions>>;
  try {
    [stats, categorySpend, trends, recent] = await Promise.all([
      fetchDashboardStats(supabase, householdId, from, to),
      fetchCategorySpend(supabase, householdId, from, to),
      fetchMonthlyTrends(supabase, householdId, 6),
      fetchRecentTransactions(supabase, householdId, 10),
    ]);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[dashboard] queries failed:', msg);
    throw new Error(`queries: ${msg}`);
  }

  const topCategory = categorySpend[0]?.name ?? null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          {new Date(from).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </p>
      </div>

      <StatsGrid stats={stats} topCategory={topCategory} />

      <div className="grid gap-4 lg:grid-cols-2">
        <SpendingByCategoryChart data={categorySpend} />
        <MonthlyTrendsChart data={trends} />
      </div>

      <RecentTransactions transactions={recent} />
    </div>
  );
}
