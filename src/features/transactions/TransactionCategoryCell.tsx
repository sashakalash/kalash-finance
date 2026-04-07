'use client';

import { useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { updateTransaction } from './actions';
import type { Category } from '@/types';

interface TransactionCategoryCellProps {
  transactionId: string;
  categoryId: string | null;
  categories: Category[];
}

export function TransactionCategoryCell({
  transactionId,
  categoryId,
  categories,
}: TransactionCategoryCellProps): React.ReactElement {
  const [selected, setSelected] = useState(categoryId ?? '');
  const [saving, setSaving] = useState(false);

  const isDirty = selected !== (categoryId ?? '');
  const selectedCat = categories.find((c) => c.id === selected) ?? null;

  async function save(): Promise<void> {
    setSaving(true);
    try {
      await updateTransaction({ id: transactionId, category_id: selected || null });
      toast.success('Category updated');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex items-center gap-1">
      <Select value={selected} onValueChange={(v) => setSelected(v ?? '')}>
        <SelectTrigger
          className="h-7 w-36 text-xs"
          style={{
            color: selectedCat?.color ?? undefined,
            borderColor: selectedCat?.color ?? undefined,
          }}
        >
          <SelectValue placeholder="—">
            {selectedCat ? `${selectedCat.icon ?? ''} ${selectedCat.name}`.trim() : '—'}
          </SelectValue>
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
      {isDirty && (
        <Button
          size="icon"
          variant="ghost"
          className="h-6 w-6 shrink-0 text-green-500 hover:text-green-600"
          disabled={saving}
          onClick={save}
          aria-label="Save category"
        >
          {saving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
        </Button>
      )}
    </div>
  );
}
