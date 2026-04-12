import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { getHouseholdId } from '@/lib/supabase/household';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { StatsGrid } from '@/features/dashboard/StatsGrid';
import { RecentTransactions } from '@/features/dashboard/RecentTransactions';
import { DateRangePicker } from '@/features/dashboard/DateRangePicker';

const SpendingByCategoryChart = dynamic(() =>
  import('@/features/dashboard/SpendingByCategoryChart').then((m) => m.SpendingByCategoryChart),
);

const MonthlyTrendsChart = dynamic(() =>
  import('@/features/dashboard/MonthlyTrendsChart').then((m) => m.MonthlyTrendsChart),
);
import {
  fetchDashboardStats,
  fetchCategorySpend,
  fetchMonthlyTrends,
  fetchRecentTransactions,
} from '@/features/dashboard/queries';
import { lastNMonthsRange } from '@/lib/utils';

export const metadata: Metadata = { title: 'Dashboard — Kalash Finance' };

interface SearchParams {
  from?: string;
  to?: string;
}

function isValidDate(s: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(Date.parse(s));
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}): Promise<React.ReactElement> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const householdId = await getHouseholdId(supabase, user.id);
  const params = await searchParams;
  const defaults = lastNMonthsRange(1);
  const from = isValidDate(params.from ?? '') ? (params.from as string) : defaults.from;
  const to = isValidDate(params.to ?? '') ? (params.to as string) : defaults.to;

  const [stats, categorySpend, trends, recent] = await Promise.all([
    fetchDashboardStats(supabase, householdId, from, to),
    fetchCategorySpend(supabase, householdId, from, to),
    fetchMonthlyTrends(supabase, householdId, 6),
    fetchRecentTransactions(supabase, householdId, 10),
  ]);

  const topCategory = categorySpend[0]?.name ?? null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <Suspense>
          <DateRangePicker from={from} to={to} />
        </Suspense>
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
