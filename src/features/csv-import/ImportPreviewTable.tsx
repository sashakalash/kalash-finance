'use client';

import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { Category, PreviewTransaction } from '@/types';

interface ImportPreviewTableProps {
  rows: PreviewTransaction[];
  categories: Category[];
  onToggle: (index: number) => void;
  onCategoryChange: (index: number, categoryId: string) => void;
}

export function ImportPreviewTable({
  rows,
  categories,
  onToggle,
  onCategoryChange,
}: ImportPreviewTableProps): React.ReactElement {
  const selected = rows.filter((r) => r.selected).length;
  const duplicates = rows.filter((r) => r.isDuplicate).length;

  return (
    <div className="space-y-3">
      {/* Summary bar */}
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <span className="font-medium">{rows.length} rows parsed</span>
        <Badge variant="secondary" className="gap-1 text-green-600">
          <CheckCircle2 size={12} />
          {selected} selected
        </Badge>
        {duplicates > 0 && (
          <Badge variant="secondary" className="gap-1 text-amber-600">
            <AlertCircle size={12} />
            {duplicates} duplicates
          </Badge>
        )}
      </div>

      {/* Table */}
      <div className="max-h-[420px] overflow-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="sticky top-0 border-b bg-muted/80 backdrop-blur">
            <tr>
              <th className="w-8 px-3 py-2 text-left">
                <input
                  type="checkbox"
                  aria-label="Select all non-duplicate rows"
                  checked={rows.filter((r) => !r.isDuplicate).every((r) => r.selected)}
                  onChange={(e) => {
                    rows.forEach((r, i) => {
                      if (!r.isDuplicate && r.selected !== e.target.checked) onToggle(i);
                    });
                  }}
                  className="rounded"
                />
              </th>
              <th className="px-3 py-2 text-left font-medium">Date</th>
              <th className="px-3 py-2 text-left font-medium">Description</th>
              <th className="px-3 py-2 text-left font-medium">Category</th>
              <th className="px-3 py-2 text-right font-medium">Amount</th>
              <th className="w-6 px-2 py-2" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr
                key={i}
                className={
                  row.isDuplicate
                    ? 'bg-amber-50/60 opacity-70 dark:bg-amber-950/20'
                    : row.selected
                      ? 'bg-background'
                      : 'bg-muted/30'
                }
              >
                <td className="px-3 py-2">
                  <input
                    type="checkbox"
                    aria-label={`Select row ${i + 1}`}
                    checked={row.selected}
                    onChange={() => onToggle(i)}
                    className="rounded"
                  />
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-muted-foreground">
                  {formatDate(row.date)}
                </td>
                <td className="max-w-[200px] truncate px-3 py-2" title={row.description}>
                  {row.description}
                </td>
                <td className="px-3 py-2">
                  <Select
                    value={row.suggestedCategory ?? ''}
                    onValueChange={(v) => onCategoryChange(i, v ?? '')}
                  >
                    <SelectTrigger className="h-7 w-36 text-xs">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Uncategorized</SelectItem>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.name}>
                          {cat.icon} {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </td>
                <td
                  className={`px-3 py-2 text-right font-medium tabular-nums ${
                    row.type === 'expense' ? 'text-red-500' : 'text-green-500'
                  }`}
                >
                  {row.type === 'expense' ? '-' : '+'}
                  {formatCurrency(row.amount, row.currency)}
                </td>
                <td className="px-2 py-2 text-center">
                  {row.isDuplicate && (
                    <span title="Already imported">
                      <AlertCircle size={14} className="text-amber-500" />
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
