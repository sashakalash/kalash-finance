'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { updateTransaction } from '../actions';
import type { Category } from '@/types';

interface TransactionCategoryCellProps {
  transactionId: string;
  categoryId: string | null;
  categories: Category[];
  onCategoryChange?: (categoryId: string | null) => void;
}

export function TransactionCategoryCell({
  transactionId,
  categoryId,
  categories,
  onCategoryChange,
}: TransactionCategoryCellProps): React.ReactElement {
  const router = useRouter();
  const [selected, setSelected] = useState(categoryId ?? '');
  const [saving, setSaving] = useState(false);

  // Base UI Select uses null for "no value" — map empty string ↔ null at the boundary
  const selectValue = selected || null;
  const selectedCat = categories.find((c) => c.id === selected) ?? null;

  async function handleChange(value: string | null): Promise<void> {
    const next = value ?? null;
    setSelected(next ?? '');
    setSaving(true);
    try {
      await updateTransaction({ id: transactionId, category_id: next });
      onCategoryChange?.(next);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update category');
      setSelected(categoryId ?? '');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex items-center gap-1">
      <Select value={selectValue} onValueChange={handleChange} disabled={saving}>
        <SelectTrigger
          className="!h-5 w-full py-0 px-1 text-[10px] md:!h-6 md:w-32 md:py-0 md:px-1 md:text-[11px] lg:!h-7 lg:w-36 lg:py-1 lg:px-2 lg:text-xs"
          style={{
            color: selectedCat?.color ?? undefined,
            borderColor: selectedCat?.color ?? undefined,
          }}
        >
          {saving ? (
            <Loader2 size={10} className="animate-spin" />
          ) : (
            <SelectValue placeholder="—">
              {selectedCat ? `${selectedCat.icon ?? ''} ${selectedCat.name}`.trim() : '—'}
            </SelectValue>
          )}
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">— None</SelectItem>
          {categories.map((cat) => (
            <SelectItem key={cat.id} value={cat.id}>
              {cat.icon} {cat.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
