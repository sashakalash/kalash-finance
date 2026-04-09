'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Badge } from '@/components/ui/badge';
import { TransactionCategoryCell } from './TransactionCategoryCell';
import { DeleteTransactionButton } from './DeleteTransactionButton';
import { fetchTransactionsPage } from './actions';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { Category, Transaction } from '@/types';

const PAGE_SIZE = 50;

const COL_CLASS =
  'grid grid-cols-[88px_1fr_32px] md:grid-cols-[96px_minmax(0,1fr)_164px_76px_184px_32px]';
const CELL = 'flex items-center px-3 py-0 text-sm overflow-hidden';

interface TransactionsVirtualTableProps {
  initialTransactions: Transaction[];
  initialHasMore: boolean;
  categories: Category[];
}

export function TransactionsVirtualTable({
  initialTransactions,
  initialHasMore,
  categories,
}: TransactionsVirtualTableProps): React.ReactElement {
  const parentRef = useRef<HTMLDivElement>(null);
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setTransactions(initialTransactions);
    setHasMore(initialHasMore);
  }, [initialTransactions, initialHasMore]);

  const virtualizer = useVirtualizer({
    count: hasMore ? transactions.length + 1 : transactions.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 48,
    overscan: 10,
  });

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    try {
      const page = await fetchTransactionsPage(transactions.length, PAGE_SIZE);
      setTransactions((prev) => [...prev, ...page]);
      setHasMore(page.length === PAGE_SIZE);
    } catch {
      // silent — user can scroll up and back to retry
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, transactions.length]);

  const virtualItems = virtualizer.getVirtualItems();
  const lastVirtualItem = virtualItems[virtualItems.length - 1];

  useEffect(() => {
    if (!lastVirtualItem) return;
    if (lastVirtualItem.index >= transactions.length - 1 && hasMore && !loading) {
      void loadMore();
    }
  }, [lastVirtualItem, transactions.length, hasMore, loading, loadMore]);

  function handleDelete(id: string): void {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  }

  function handleCategoryChange(id: string, categoryId: string | null): void {
    setTransactions((prev) =>
      prev.map((t) => (t.id === id ? { ...t, category_id: categoryId } : t)),
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border py-20 text-sm text-muted-foreground gap-2">
        <span className="text-3xl">🗒️</span>
        <span>No transactions yet</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col rounded-lg border overflow-hidden">
      {/* Sticky header */}
      <div
        className={`${COL_CLASS} sticky top-0 z-10 border-b bg-muted/50 text-xs font-medium text-muted-foreground`}
      >
        <div className={CELL}>Date</div>
        <div className={CELL}>Description</div>
        <div className="hidden md:flex items-center px-3 py-0 text-sm overflow-hidden">
          Category
        </div>
        <div className="hidden md:flex items-center px-3 py-0 text-sm overflow-hidden">Source</div>
        <div className="hidden md:flex items-center justify-end px-3 py-0 text-sm overflow-hidden">
          Amount
        </div>
        <div />
      </div>

      {/* Scrollable virtual body */}
      <div ref={parentRef} className="overflow-auto" style={{ height: 'calc(100vh - 220px)' }}>
        <div style={{ height: `${virtualizer.getTotalSize()}px`, position: 'relative' }}>
          {virtualizer.getVirtualItems().map((vRow) => {
            const isLoaderRow = vRow.index >= transactions.length;
            if (isLoaderRow) {
              return (
                <div
                  key="loader"
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: `${vRow.size}px`,
                    transform: `translateY(${vRow.start}px)`,
                  }}
                  className="flex items-center justify-center text-xs text-muted-foreground"
                >
                  Loading…
                </div>
              );
            }

            const tx = transactions[vRow.index];
            const isEven = vRow.index % 2 === 0;

            return (
              <div
                key={tx.id}
                data-index={vRow.index}
                ref={virtualizer.measureElement}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  transform: `translateY(${vRow.start}px)`,
                }}
                className={`${COL_CLASS} min-h-12 border-b last:border-0 ${isEven ? '' : 'bg-muted/20'}`}
              >
                {/* Date */}
                <div className={`${CELL} text-muted-foreground whitespace-nowrap`}>
                  {formatDate(tx.date)}
                </div>

                {/* Description — on mobile also shows amount */}
                <div className={`${CELL} flex-col items-start justify-center gap-0.5`}>
                  <span className="truncate w-full text-sm">{tx.description ?? '—'}</span>
                  <span
                    className={`text-xs font-medium md:hidden ${tx.type === 'expense' ? 'text-red-500' : 'text-green-500'}`}
                  >
                    {tx.type === 'expense' ? '-' : '+'}
                    {formatCurrency(tx.amount, tx.currency)}
                  </span>
                </div>

                {/* Category (desktop) */}
                <div className="hidden md:flex items-center px-3 overflow-hidden">
                  <TransactionCategoryCell
                    transactionId={tx.id}
                    categoryId={tx.category_id}
                    categories={categories}
                    onCategoryChange={(catId) => handleCategoryChange(tx.id, catId)}
                  />
                </div>

                {/* Source (desktop) */}
                <div className="hidden md:flex items-center px-3 overflow-hidden">
                  <Badge variant="outline" className="text-xs capitalize">
                    {tx.source}
                  </Badge>
                </div>

                {/* Amount (desktop) */}
                <div className="hidden md:flex items-center justify-end px-3 font-medium tabular-nums">
                  <span className={tx.type === 'expense' ? 'text-red-500' : 'text-green-500'}>
                    {tx.type === 'expense' ? '-' : '+'}
                    {formatCurrency(tx.amount, tx.currency)}
                  </span>
                </div>

                {/* Delete */}
                <div className="flex items-center justify-center px-1">
                  <DeleteTransactionButton
                    id={tx.id}
                    description={tx.description}
                    onDelete={() => handleDelete(tx.id)}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {!hasMore && transactions.length > 0 && (
        <div className="border-t py-3 text-center text-xs text-muted-foreground">
          {transactions.length} transactions total
        </div>
      )}
    </div>
  );
}
