import { getDashboardContext } from '@/lib/dashboard-context';
import { fetchRecentTransactions } from '../queries';
import { RecentTransactions } from './RecentTransactions';
import { DASHBOARD_DEFAULT_VALUES } from '@/lib/constants';

export async function RecentTransactionsWrapper() {
  const { supabase, householdId } = await getDashboardContext();
  const transactions = await fetchRecentTransactions(
    supabase,
    householdId,
    DASHBOARD_DEFAULT_VALUES.RECENT_TRANSACTIONS_LIMIT,
  );

  return <RecentTransactions transactions={transactions} />;
}
