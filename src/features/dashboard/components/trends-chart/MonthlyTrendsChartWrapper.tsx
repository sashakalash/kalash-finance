import { DASHBOARD_DEFAULT_VALUES } from '@/lib/constants';
import { fetchMonthlyTrends } from '../../queries';
import { MonthlyTrendsChart } from './MonthlyTrendsChart';
import { getDashboardContext } from '@/features/dashboard/lib/dashboard-context';

export async function MonthlyTrendsChartWrapper() {
  const { supabase, householdId } = await getDashboardContext();
  const trends = await fetchMonthlyTrends(
    supabase,
    householdId,
    DASHBOARD_DEFAULT_VALUES.MONTHLY_TRENDS_MONTHS,
  );

  return <MonthlyTrendsChart data={trends} />;
}
