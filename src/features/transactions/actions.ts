'use server';

import { revalidatePath } from 'next/cache';
import { requireUser } from '@/lib/supabase/auth';
import { generateHash } from '@/services/xlsx/dedup';
import {
  CreateTransactionSchema,
  UpdateTransactionSchema,
  ImportTransactionsSchema,
} from '@/types/zod';
import type {
  CreateTransactionInput,
  ImportTransactionsInput,
  UpdateTransactionInput,
} from '@/types/zod';

/** Create a single transaction manually. */
export async function createTransaction(input: CreateTransactionInput): Promise<void> {
  const { supabase, user } = await requireUser();
  const data = CreateTransactionSchema.parse(input);

  const hash = await generateHash(user.id, {
    amount: data.amount,
    currency: data.currency ?? 'GEL',
    type: data.type,
    date: data.date,
    description: data.description ?? '',
    suggestedCategory: null,
    rawDetails: '',
  });

  const { error } = await supabase.from('transactions').insert({
    ...data,
    user_id: user.id,
    hash,
  });

  if (error) throw new Error(error.message);
  revalidatePath('/(protected)/dashboard');
  revalidatePath('/(protected)/transactions');
}

/** Update an existing transaction. */
export async function updateTransaction(input: UpdateTransactionInput): Promise<void> {
  const { supabase, user } = await requireUser();
  const { id, ...data } = UpdateTransactionSchema.parse(input);

  const { error } = await supabase
    .from('transactions')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', user.id); // RLS double-check

  if (error) throw new Error(error.message);
  revalidatePath('/(protected)/dashboard');
  revalidatePath('/(protected)/transactions');
}

/** Delete a transaction. */
export async function deleteTransaction(id: string): Promise<void> {
  const { supabase, user } = await requireUser();

  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) throw new Error(error.message);
  revalidatePath('/(protected)/dashboard');
  revalidatePath('/(protected)/transactions');
}

/** Batch import from CSV. Returns { imported, duplicates } counts. */
export async function importTransactions(
  input: ImportTransactionsInput,
): Promise<{ imported: number; duplicates: number }> {
  const { supabase, user } = await requireUser();
  const { transactions, bank_format: bankFormat, filename } = ImportTransactionsSchema.parse(input);

  // Create import record
  const { data: importRecord, error: importErr } = await supabase
    .from('csv_imports')
    .insert({
      user_id: user.id,
      filename,
      bank_format: bankFormat,
      row_count: transactions.length,
      status: 'processing',
    })
    .select('id')
    .single();

  if (importErr) throw new Error(importErr.message);

  // Fetch existing hashes to detect duplicates client-side
  const { data: existing } = await supabase
    .from('transactions')
    .select('hash')
    .eq('user_id', user.id)
    .in(
      'hash',
      transactions.map((t) => t.hash),
    );

  const existingHashes = new Set((existing ?? []).map((r) => r.hash));
  const toInsert = transactions.filter((t) => !existingHashes.has(t.hash));
  const duplicates = transactions.length - toInsert.length;

  if (toInsert.length > 0) {
    // Insert in batches of 100
    for (let i = 0; i < toInsert.length; i += 100) {
      const batch = toInsert.slice(i, i + 100).map((t) => ({
        user_id: user.id,
        amount: t.amount,
        currency: t.currency,
        type: t.type,
        date: t.date,
        description: t.description,
        category_id: t.category_id ?? null,
        source: 'csv' as const,
        hash: t.hash,
        csv_import_id: importRecord.id,
      }));

      const { error } = await supabase.from('transactions').insert(batch);
      if (error) throw new Error(error.message);
    }
  }

  await supabase
    .from('csv_imports')
    .update({
      imported_count: toInsert.length,
      duplicate_count: duplicates,
      status: 'completed',
    })
    .eq('id', importRecord.id);

  revalidatePath('/(protected)/dashboard');
  revalidatePath('/(protected)/transactions');

  return { imported: toInsert.length, duplicates };
}
