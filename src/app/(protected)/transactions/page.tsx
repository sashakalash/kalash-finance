import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Plus } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { TransactionForm } from '@/features/transactions/TransactionForm';
import { DeleteTransactionButton } from '@/features/transactions/DeleteTransactionButton';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { Category, Transaction } from '@/types';

export const metadata: Metadata = { title: 'Transactions — Kalash Finance' };

export default async function TransactionsPage(): Promise<React.ReactElement> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const [{ data: txData }, { data: catData }] = await Promise.all([
    supabase
      .from('transactions')
      .select('*, categories(id, name, color, icon)')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(100),
    supabase.from('categories').select('*').eq('user_id', user.id).order('name'),
  ]);

  const transactions = (txData ?? []) as Transaction[];
  const categories = (catData ?? []) as Category[];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Transactions</h1>
        <Dialog>
          <DialogTrigger render={<Button size="sm" />}>
            <Plus size={14} className="mr-1" />
            Add
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New transaction</DialogTitle>
            </DialogHeader>
            <TransactionForm categories={categories} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Source</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="w-8" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                  No transactions yet. Add one or import a CSV.
                </TableCell>
              </TableRow>
            ) : (
              transactions.map((tx) => {
                const cat = tx.category as
                  | { name: string; color: string; icon: string }
                  | null
                  | undefined;
                return (
                  <TableRow key={tx.id}>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      {formatDate(tx.date)}
                    </TableCell>
                    <TableCell className="max-w-[220px] truncate text-sm">
                      {tx.description ?? '—'}
                    </TableCell>
                    <TableCell>
                      {cat ? (
                        <Badge
                          variant="secondary"
                          className="text-xs"
                          style={{ borderColor: cat.color, color: cat.color }}
                        >
                          {cat.icon} {cat.name}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs capitalize">
                        {tx.source}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      <span className={tx.type === 'expense' ? 'text-red-500' : 'text-green-500'}>
                        {tx.type === 'expense' ? '-' : '+'}
                        {formatCurrency(tx.amount, tx.currency)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <DeleteTransactionButton id={tx.id} description={tx.description} />
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
