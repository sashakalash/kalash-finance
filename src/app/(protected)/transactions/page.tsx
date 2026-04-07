import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getHouseholdId } from '@/lib/supabase/household';
import { AddTransactionDialog } from '@/features/transactions/AddTransactionDialog';
import { TransactionsVirtualTable } from '@/features/transactions/TransactionsVirtualTable';
import type { Category, Transaction } from '@/types';

export const metadata: Metadata = { title: 'Transactions — Kalash Finance' };

const PAGE_SIZE = 50;

export default async function TransactionsPage(): Promise<React.ReactElement> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const householdId = await getHouseholdId(supabase, user.id);

  const [{ data: txData }, { data: catData }] = await Promise.all([
    supabase
      .from('transactions')
      .select('*, categories(id, name, color, icon)')
      .eq('household_id', householdId)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
      .range(0, PAGE_SIZE - 1),
    supabase.from('categories').select('*').eq('household_id', householdId).order('name'),
  ]);

  const transactions = (txData ?? []) as Transaction[];
  const categories = (catData ?? []) as Category[];

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Transactions</h1>
        <AddTransactionDialog categories={categories} />
      </div>

      <TransactionsVirtualTable
        initialTransactions={transactions}
        initialHasMore={transactions.length === PAGE_SIZE}
        categories={categories}
      />
    </div>
  );
}
