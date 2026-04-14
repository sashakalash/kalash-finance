import { StatsGrid } from './StatsGrid';
import { fetchDashboardStats } from '../../queries';
import { getDashboardContext } from '@/features/dashboard/lib/dashboard-context';
import { DateRangeProps } from '../DateRangePicker';

export async function StatsGridWrapper({ from, to }: DateRangeProps) {
  const { supabase, householdId } = await getDashboardContext();
  const stats = await fetchDashboardStats(supabase, householdId, from, to);

  return <StatsGrid stats={stats} />;
}
