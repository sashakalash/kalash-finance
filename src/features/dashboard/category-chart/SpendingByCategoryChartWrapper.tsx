import { SpendingByCategoryChart } from './SpendingByCategoryChart';
import { getDashboardContext } from '@/lib/dashboard-context';
import { fetchCategorySpend } from '../queries';
import { DateRangeProps } from '../DateRangePicker';

export async function SpendingByCategoryChartWrapper({ from, to }: DateRangeProps) {
  const { supabase, householdId } = await getDashboardContext();
  const data = await fetchCategorySpend(supabase, householdId, from, to);
  return <SpendingByCategoryChart data={data} />;
}
