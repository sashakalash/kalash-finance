import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { Transaction } from '@/types';

export interface RecentTransactionsProps {
  transactions: Transaction[];
}

export function RecentTransactions({ transactions }: RecentTransactionsProps): React.ReactElement {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-medium">Recent transactions</CardTitle>
        <Link
          href="/transactions"
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          View all <ArrowRight size={12} />
        </Link>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">No transactions yet</p>
        ) : (
          <ul className="space-y-3">
            {transactions.map((tx) => {
              const cat = tx.category as { name: string; color: string } | null | undefined;
              return (
                <li key={tx.id} className="flex items-center justify-between gap-2">
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate text-sm font-medium">
                      {tx.description ?? 'Unnamed'}
                    </span>
                    <span className="text-xs text-muted-foreground">{formatDate(tx.date)}</span>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {cat && (
                      <Badge
                        variant="secondary"
                        style={{ borderColor: cat.color, color: cat.color }}
                        className="hidden text-xs sm:inline-flex"
                      >
                        {cat.name}
                      </Badge>
                    )}
                    <span
                      className={
                        tx.type === 'expense'
                          ? 'text-sm font-medium text-red-500'
                          : 'text-sm font-medium text-green-500'
                      }
                    >
                      {tx.type === 'expense' ? '-' : '+'}
                      {formatCurrency(tx.amount, tx.currency)}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
