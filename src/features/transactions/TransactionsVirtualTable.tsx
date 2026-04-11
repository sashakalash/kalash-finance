'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Badge } from '@/components/ui/badge';
import { TransactionCategoryCell } from './TransactionCategoryCell';
import { DeleteTransactionButton } from './DeleteTransactionButton';
import { fetchTransactionsPage } from './actions';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { Category, Transaction } from '@/types';

const PAGE_SIZE = 20;

const COL_CLASS =
  'grid grid-cols-[72px_minmax(0,1fr)_120px_28px] md:grid-cols-[96px_minmax(0,1fr)_172px_140px_32px] lg:grid-cols-[96px_minmax(0,1fr)_208px_76px_184px_32px]';
const CELL = 'flex items-center px-1 md:px-3 py-0 text-[11px] md:text-[0.675rem] overflow-hidden';

const ROW_HEIGHT_MOBILE = 32;
const ROW_HEIGHT_DESKTOP = 40;

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
  const scrollRef = useRef<HTMLDivElement>(null);

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const rowHeight = isMobile ? ROW_HEIGHT_MOBILE : ROW_HEIGHT_DESKTOP;
  const overscan = 3;

  function calcScreenRows(rh: number): number {
    if (typeof window === 'undefined') return 15;
    return Math.floor(window.innerHeight / rh) + 3;
  }

  const [transactions, setTransactions] = useState<Transaction[]>(() =>
    initialTransactions.slice(0, calcScreenRows(rowHeight)),
  );
  const [hasMore, setHasMore] = useState(
    initialHasMore || initialTransactions.length > calcScreenRows(rowHeight),
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const isMob = typeof window !== 'undefined' && window.innerWidth < 768;
    const rh = isMob ? ROW_HEIGHT_MOBILE : ROW_HEIGHT_DESKTOP;
    const rows = calcScreenRows(rh);
    setTransactions(initialTransactions.slice(0, rows));
    setHasMore(initialHasMore || initialTransactions.length > rows);
  }, [initialTransactions, initialHasMore]);

  const virtualizer = useVirtualizer({
    count: hasMore ? transactions.length + 1 : transactions.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => rowHeight,
    overscan,
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
    <div className="flex min-h-0 flex-1 flex-col rounded-lg border overflow-hidden">
      {/* Sticky header */}
      <div
        className={`${COL_CLASS} border-b bg-muted/50 text-[10px] md:text-xs font-medium text-muted-foreground`}
      >
        <div className={CELL}>Date</div>
        <div className={CELL}>Description</div>
        <div className={CELL}>Category</div>
        <div className="hidden lg:flex items-center justify-center px-3 py-0 text-sm overflow-hidden">
          Source
        </div>
        <div className="hidden md:flex items-center justify-end px-3 py-0 text-sm overflow-hidden">
          Amount
        </div>
        <div />
      </div>

      <div className="relative min-h-0 flex-1">
        <div ref={scrollRef} className="overflow-auto h-full">
          <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
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
                      height: vRow.size,
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
                  className={`${COL_CLASS} min-h-8 md:min-h-10 border-b last:border-0 ${isEven ? '' : 'bg-muted/20'}`}
                >
                  {/* Date */}
                  <div className={`${CELL} text-muted-foreground whitespace-nowrap`}>
                    {formatDate(tx.date)}
                  </div>

                  {/* Description — on mobile also shows amount */}
                  <div className={`${CELL} flex-col items-start justify-center gap-0`}>
                    <span className="w-full text-[12px] landscape:max-md:text-[0.674rem] md:text-[0.675rem] break-words md:truncate leading-tight">
                      {tx.description ?? '—'}
                    </span>
                    <span
                      className={`text-[10px] leading-tight font-medium md:hidden ${tx.type === 'expense' ? 'text-red-500' : 'text-green-500'}`}
                    >
                      {tx.type === 'expense' ? '-' : '+'}
                      {formatCurrency(tx.amount, tx.currency)}
                    </span>
                  </div>

                  {/* Category */}
                  <div className="flex items-center px-0.5 md:px-3 overflow-hidden">
                    <TransactionCategoryCell
                      transactionId={tx.id}
                      categoryId={tx.category_id}
                      categories={categories}
                      onCategoryChange={(catId) => handleCategoryChange(tx.id, catId)}
                    />
                  </div>

                  {/* Source (large desktop) */}
                  <div className="hidden lg:flex items-center justify-center px-3 overflow-hidden">
                    <Badge variant="outline" className="text-xs capitalize">
                      {tx.source}
                    </Badge>
                  </div>

                  {/* Amount (desktop) */}
                  <div className="hidden md:flex items-center justify-end px-3 font-medium tabular-nums text-xs lg:text-sm">
                    <span className={tx.type === 'expense' ? 'text-red-500' : 'text-green-500'}>
                      {tx.type === 'expense' ? '-' : '+'}
                      {formatCurrency(tx.amount, tx.currency)}
                    </span>
                  </div>

                  {/* Delete */}
                  <div className="flex items-center justify-center px-0.5 md:px-1">
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
      </div>

      {!hasMore && transactions.length > 0 && (
        <div className="border-t py-2 text-center text-[10px] md:text-xs text-muted-foreground">
          {transactions.length} transactions total
        </div>
      )}
    </div>
  );
}
