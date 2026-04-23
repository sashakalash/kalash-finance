'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { TransactionCategoryCell } from './TransactionCategoryCell';
import { DeleteTransactionButton } from './DeleteTransactionButton';
import { fetchTransactionsPage } from '../actions';
import { cn, formatCurrency, formatDate } from '@/lib/utils';
import type { Category, Transaction } from '@/types';

const PAGE_SIZE = 20;

const COL_CLASS =
  'grid grid-cols-[55px_1fr_170px_30px] md:grid-cols-[100px_1fr_170px_130px_30px] lg:grid-cols-[100px_1fr_170px_130px_30px]';
const CELL =
  'flex flex-start items-center px-1 md:px-3 py-0 text-[11px] md:text-[0.675rem] overflow-hidden';

const ROW_HEIGHT_MOBILE = 44;
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

  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

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

  function handleFilterChange(categoryId: string | null): void {
    setSelectedCategoryId(categoryId);
    setTransactions([]);
    setHasMore(true);
  }

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
      const page = await fetchTransactionsPage(transactions.length, PAGE_SIZE, selectedCategoryId);
      setTransactions((prev) => [...prev, ...page]);
      setHasMore(page.length === PAGE_SIZE);
    } catch {
      // silent — user can scroll up and back to retry
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, transactions.length, selectedCategoryId]);

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
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              category_id: categoryId,
              category: categoryId ? (categories.find((c) => c.id === categoryId) ?? null) : null,
            }
          : t,
      ),
    );
  }

  const isEmpty = transactions.length === 0 && !loading;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      {/* Category filter chips */}
      <div className="shrink-0 flex gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden flex-wrap">
        <button
          onClick={() => handleFilterChange(null)}
          className={cn(
            'shrink-0 rounded-full px-2.5 py-0.5 text-[11px] md:px-3 md:py-1 md:text-xs font-medium transition-colors',
            selectedCategoryId === null
              ? 'bg-foreground text-background'
              : 'bg-muted text-muted-foreground hover:text-foreground',
          )}
        >
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => handleFilterChange(cat.id)}
            className={cn(
              'shrink-0 flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] md:px-3 md:py-1 md:text-xs font-medium transition-colors',
              selectedCategoryId === cat.id
                ? 'bg-foreground text-background'
                : 'bg-muted text-muted-foreground hover:text-foreground',
            )}
          >
            {cat.color && (
              <span
                className="size-2 rounded-full shrink-0"
                style={{ backgroundColor: cat.color }}
              />
            )}
            {cat.icon && <span className="leading-none">{cat.icon}</span>}
            {cat.name}
          </button>
        ))}
        <button
          onClick={() => handleFilterChange('uncategorized')}
          className={cn(
            'shrink-0 rounded-full px-2.5 py-0.5 text-[11px] md:px-3 md:py-1 md:text-xs font-medium transition-colors',
            selectedCategoryId === 'uncategorized'
              ? 'bg-foreground text-background'
              : 'bg-muted text-muted-foreground hover:text-foreground',
          )}
        >
          Uncategorized
        </button>
      </div>

      {isEmpty ? (
        <div className="flex flex-col items-center justify-center rounded-lg border py-20 text-sm text-muted-foreground gap-2">
          <span className="text-3xl">🗒️</span>
          <span>
            {selectedCategoryId ? 'No transactions for this filter' : 'No transactions yet'}
          </span>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col rounded-lg border overflow-hidden">
          {/* Sticky header */}
          <div
            className={`${COL_CLASS} border-b bg-muted/50 text-[10px] md:text-xs font-medium text-muted-foreground`}
          >
            <div className={CELL}>Date</div>
            <div className={CELL}>Description</div>
            <div className={CELL}>Category</div>
            <div className={`${CELL} justify-end hidden md:flex`}>Amount</div>
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
                      className={`${COL_CLASS} min-h-10 border-b last:border-0 ${isEven ? '' : 'bg-muted/20'}`}
                    >
                      {/* Date */}
                      <div
                        className={`${CELL} text-muted-foreground whitespace-nowrap text-[0.675rem] md:text-[0.825rem]`}
                      >
                        {formatDate(tx.date)}
                      </div>

                      {/* Description — on mobile: 2 lines (desc + amount/category), on desktop: single truncated line */}
                      <div className="flex flex-col md:flex-row md:items-center justify-center min-w-0 px-1 md:px-3 py-1 md:py-0 gap-0.5 overflow-hidden">
                        <span className="min-w-0 w-full text-[0.675rem] md:text-[0.825rem] break-words md:truncate leading-tight">
                          {tx.description ?? '—'}
                        </span>
                        <div className="flex items-center gap-2 md:hidden">
                          <span
                            className={`text-[12px] md:text-[15px] leading-tight font-medium ${tx.type === 'expense' ? 'text-red-500' : 'text-green-500'}`}
                          >
                            {tx.type === 'expense' ? '-' : '+'}
                            {formatCurrency(tx.amount, tx.currency)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center px-3 overflow-hidden">
                        <TransactionCategoryCell
                          transactionId={tx.id}
                          categoryId={tx.category_id}
                          categories={categories}
                          onCategoryChange={(catId) => handleCategoryChange(tx.id, catId)}
                        />
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
      )}
    </div>
  );
}
