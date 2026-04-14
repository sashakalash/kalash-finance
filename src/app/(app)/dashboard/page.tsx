import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { DateRangePicker } from '@/features/dashboard/components/DateRangePicker';

import { lastNMonthsRange } from '@/lib/utils';
import { StatsGridWrapper } from '@/features/dashboard/components/stats-grid/StatsGridWrapper';
import { SpendingByCategoryChartWrapper } from '@/features/dashboard/components/category-chart/SpendingByCategoryChartWrapper';
import { MonthlyTrendsChartWrapper } from '@/features/dashboard/components/trends-chart/MonthlyTrendsChartWrapper';
import { RecentTransactionsWrapper } from '@/features/dashboard/components/transactions-list/RecentTransactionsWrapper';
import { ErrorFallback } from '@/components/error-boundary/error-boundary';
import { Skeleton } from '@/components/ui/skeleton';
import { Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

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

  const params = await searchParams;
  const defaults = lastNMonthsRange(1);
  const from = isValidDate(params.from ?? '') ? (params.from as string) : defaults.from;
  const to = isValidDate(params.to ?? '') ? (params.to as string) : defaults.to;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <DateRangePicker from={from} to={to} />
      </div>
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <Suspense fallback={<Skeleton />}>
          <StatsGridWrapper from={from} to={to} />
        </Suspense>
      </ErrorBoundary>
      <div className="grid gap-4 lg:grid-cols-2">
        <ErrorBoundary FallbackComponent={ErrorFallback}>
          <Suspense fallback={<Skeleton />}>
            <SpendingByCategoryChartWrapper from={from} to={to} />
          </Suspense>
        </ErrorBoundary>
        <ErrorBoundary FallbackComponent={ErrorFallback}>
          <Suspense fallback={<Skeleton />}>
            <MonthlyTrendsChartWrapper />
          </Suspense>
        </ErrorBoundary>
      </div>
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <Suspense fallback={<Skeleton />}>
          <RecentTransactionsWrapper />
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}
