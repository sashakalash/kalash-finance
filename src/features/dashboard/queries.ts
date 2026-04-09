import type { SupabaseClient } from '@supabase/supabase-js';
import type { CategorySpend, DashboardStats, MonthlyTrend, Transaction } from '@/types';

/** Aggregate stats for a date range — single query instead of two. */
export async function fetchDashboardStats(
  supabase: SupabaseClient,
  householdId: string,
  from: string,
  to: string,
): Promise<DashboardStats> {
  const { data, error } = await supabase
    .from('transactions')
    .select('amount, type')
    .eq('household_id', householdId)
    .in('type', ['expense', 'income'])
    .gte('date', from)
    .lte('date', to);

  if (error) throw new Error(error.message);

  const rows = (data ?? []) as Array<{ amount: number; type: string }>;
  let totalSpent = 0;
  let totalIncome = 0;
  let expenseCount = 0;

  for (const r of rows) {
    const amt = Number(r.amount);
    if (r.type === 'expense') {
      totalSpent += amt;
      expenseCount++;
    } else {
      totalIncome += amt;
    }
  }

  const days = Math.max(
    1,
    Math.ceil((new Date(to).getTime() - new Date(from).getTime()) / (1000 * 60 * 60 * 24)),
  );

  return {
    totalSpent,
    totalIncome,
    avgDailySpend: totalSpent / days,
    transactionCount: expenseCount,
    topCategory: null,
    currency: 'GEL',
  };
}

/** Spending grouped by category for the pie chart. */
export async function fetchCategorySpend(
  supabase: SupabaseClient,
  householdId: string,
  from: string,
  to: string,
): Promise<CategorySpend[]> {
  const { data, error } = await supabase
    .from('transactions')
    .select('amount, categories(name, color, icon)')
    .eq('household_id', householdId)
    .eq('type', 'expense')
    .gte('date', from)
    .lte('date', to)
    .not('category_id', 'is', null);

  if (error) throw new Error(error.message);

  const map = new Map<string, CategorySpend>();
  for (const row of data ?? []) {
    const rawCat = row.categories;
    const cat = (Array.isArray(rawCat) ? rawCat[0] : rawCat) as {
      name: string;
      color: string;
      icon: string;
    } | null;
    if (!cat) continue;
    const existing = map.get(cat.name);
    if (existing) {
      existing.amount += Number(row.amount);
    } else {
      map.set(cat.name, {
        name: cat.name,
        color: cat.color ?? '#6b7280',
        icon: cat.icon ?? '📦',
        amount: Number(row.amount),
      });
    }
  }

  return [...map.values()].sort((a, b) => b.amount - a.amount);
}

/** Monthly expense + income totals for the last N months. */
export async function fetchMonthlyTrends(
  supabase: SupabaseClient,
  householdId: string,
  months = 6,
): Promise<MonthlyTrend[]> {
  const to = new Date();
  const from = new Date();
  from.setMonth(from.getMonth() - months + 1);
  from.setDate(1);

  const { data, error } = await supabase
    .from('transactions')
    .select('amount, type, date')
    .eq('household_id', householdId)
    .gte('date', from.toISOString().split('T')[0])
    .lte('date', to.toISOString().split('T')[0]);

  if (error) throw new Error(error.message);

  const map = new Map<string, { expense: number; income: number }>();
  for (const row of data ?? []) {
    const key = row.date.slice(0, 7);
    const entry = map.get(key) ?? { expense: 0, income: 0 };
    if (row.type === 'expense') entry.expense += Number(row.amount);
    else entry.income += Number(row.amount);
    map.set(key, entry);
  }

  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, val]) => ({
      month: new Date(`${key}-01`).toLocaleDateString('en-US', {
        month: 'short',
        year: 'numeric',
      }),
      ...val,
    }));
}

/** Last N transactions for the recent list. */
export async function fetchRecentTransactions(
  supabase: SupabaseClient,
  householdId: string,
  limit = 10,
): Promise<Transaction[]> {
  const { data, error } = await supabase
    .from('transactions')
    .select('*, categories(id, name, color, icon)')
    .eq('household_id', householdId)
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return (data ?? []) as Transaction[];
}
