'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { createTransaction, updateTransaction } from './actions';
import type { Category, Transaction } from '@/types';

interface TransactionFormProps {
  categories: Category[];
  transaction?: Transaction;
  onSuccess?: () => void;
}

export function TransactionForm({
  categories,
  transaction,
  onSuccess,
}: TransactionFormProps): React.ReactElement {
  const isEdit = Boolean(transaction);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    amount: transaction ? String(transaction.amount) : '',
    type: transaction?.type ?? 'expense',
    date: transaction?.date ?? new Date().toISOString().split('T')[0],
    description: transaction?.description ?? '',
    category_id: transaction?.category_id ?? '',
    currency: transaction?.currency ?? 'GEL',
  });

  function set(field: string, value: string): void {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    const amount = parseFloat(form.amount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Invalid amount');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        amount,
        type: form.type as 'expense' | 'income',
        date: form.date,
        description: form.description || null,
        category_id: form.category_id || null,
        currency: form.currency,
      };
      if (isEdit && transaction) {
        await updateTransaction({ id: transaction.id, ...payload });
        toast.success('Transaction updated');
      } else {
        await createTransaction({ ...payload, source: 'manual' });
        toast.success('Transaction added');
        setForm((f) => ({ ...f, amount: '', description: '' }));
      }
      onSuccess?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label htmlFor="tx-amount" className="text-sm font-medium">
            Amount
          </label>
          <Input
            id="tx-amount"
            type="number"
            step="0.01"
            min="0.01"
            placeholder="0.00"
            value={form.amount}
            onChange={(e) => set('amount', e.target.value)}
            required
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="tx-type" className="text-sm font-medium">
            Type
          </label>
          <Select value={form.type} onValueChange={(v) => set('type', v ?? 'expense')}>
            <SelectTrigger id="tx-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="expense">Expense</SelectItem>
              <SelectItem value="income">Income</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="tx-date" className="text-sm font-medium">
          Date
        </label>
        <Input
          id="tx-date"
          type="date"
          value={form.date}
          onChange={(e) => set('date', e.target.value)}
          required
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="tx-description" className="text-sm font-medium">
          Description
        </label>
        <Input
          id="tx-description"
          placeholder="Coffee, groceries…"
          value={form.description}
          onChange={(e) => set('description', e.target.value)}
          maxLength={255}
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="tx-category" className="text-sm font-medium">
          Category
        </label>
        <Select value={form.category_id} onValueChange={(v) => set('category_id', v ?? '')}>
          <SelectTrigger id="tx-category">
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Uncategorized</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.icon} {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'Saving…' : isEdit ? 'Save changes' : 'Add transaction'}
      </Button>
    </form>
  );
}
