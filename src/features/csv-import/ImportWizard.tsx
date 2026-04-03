'use client';

import { useState } from 'react';
import { CheckCircle2, ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { CsvDropZone } from './CsvDropZone';
import { ImportPreviewTable } from './ImportPreviewTable';
import { fetchExistingHashes } from './actions';
import { importTransactions } from '@/features/transactions/actions';
import { parseXlsxFile } from '@/services/xlsx/parser';
import { detectAdapter } from '@/services/xlsx/adapters';
import { generateHash } from '@/services/xlsx/dedup';
import type { Category, PreviewTransaction } from '@/types';

type Step = 'upload' | 'preview' | 'done';

interface ImportResult {
  imported: number;
  duplicates: number;
}

interface ImportWizardProps {
  userId: string;
  categories: Category[];
}

export function ImportWizard({ userId, categories }: ImportWizardProps): React.ReactElement {
  const [step, setStep] = useState<Step>('upload');
  const [loading, setLoading] = useState(false);
  const [filename, setFilename] = useState('');
  const [rows, setRows] = useState<PreviewTransaction[]>([]);
  const [result, setResult] = useState<ImportResult | null>(null);

  // ─── Step 1: parse XLSX, build preview rows ───────────────────────────────
  async function handleFile(file: File): Promise<void> {
    setLoading(true);
    try {
      setFilename(file.name);
      const rawRows = await parseXlsxFile(file);

      if (rawRows.length === 0) {
        toast.error('File is empty or could not be parsed');
        return;
      }

      const headers = Object.keys(rawRows[0]);
      const adapter = detectAdapter(headers);

      if (!adapter) {
        toast.error('Bank format not recognized');
        return;
      }

      // Normalize rows via adapter
      const normalized = rawRows
        .map((row, i) => adapter.mapRow(row, i))
        .filter((r): r is NonNullable<typeof r> => r !== null);

      if (normalized.length === 0) {
        toast.error('No valid transactions found in file');
        return;
      }

      // Generate hashes and fetch existing to detect duplicates
      const [hashes, existingHashes] = await Promise.all([
        Promise.all(normalized.map((tx) => generateHash(userId, tx))),
        fetchExistingHashes(),
      ]);

      // Build category name → id map for lookup
      const catNameToId = new Map(categories.map((c) => [c.name, c.id]));

      const preview: PreviewTransaction[] = normalized.map((tx, i) => ({
        ...tx,
        hash: hashes[i],
        isDuplicate: existingHashes.has(hashes[i]),
        // Convert suggestedCategory name → category_id for later use
        // Store name in suggestedCategory so preview table can display it
        suggestedCategory: tx.suggestedCategory,
        // Attach resolved id for import
        _categoryId: tx.suggestedCategory ? (catNameToId.get(tx.suggestedCategory) ?? null) : null,
        selected: !existingHashes.has(hashes[i]),
      }));

      setRows(preview);
      setStep('preview');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to parse file');
    } finally {
      setLoading(false);
    }
  }

  // ─── Row interactions ─────────────────────────────────────────────────────
  function toggleRow(index: number): void {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, selected: !r.selected } : r)));
  }

  function setCategoryForRow(index: number, categoryName: string): void {
    const catNameToId = new Map(categories.map((c) => [c.name, c.id]));
    setRows((prev) =>
      prev.map((r, i) =>
        i === index
          ? {
              ...r,
              suggestedCategory: categoryName || null,
              _categoryId: categoryName ? (catNameToId.get(categoryName) ?? null) : null,
            }
          : r,
      ),
    );
  }

  // ─── Step 2: submit selected rows ────────────────────────────────────────
  async function handleImport(): Promise<void> {
    const selected = rows.filter((r) => r.selected);
    if (selected.length === 0) {
      toast.error('No rows selected');
      return;
    }

    setLoading(true);
    try {
      const res = await importTransactions({
        filename,
        bank_format: 'tbc',
        transactions: selected.map((r) => ({
          amount: r.amount,
          currency: r.currency,
          type: r.type,
          date: r.date,
          description: r.description,
          category_id:
            (r as PreviewTransaction & { _categoryId?: string | null })._categoryId ?? null,
          hash: r.hash,
        })),
      });
      setResult(res);
      setStep('done');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setLoading(false);
    }
  }

  // ─── Reset ────────────────────────────────────────────────────────────────
  function reset(): void {
    setStep('upload');
    setRows([]);
    setResult(null);
    setFilename('');
  }

  // ─── Render ───────────────────────────────────────────────────────────────
  if (step === 'done' && result) {
    return (
      <div className="flex flex-col items-center gap-4 py-12 text-center">
        <div className="rounded-full bg-green-100 p-4 dark:bg-green-900/30">
          <CheckCircle2 size={32} className="text-green-600" />
        </div>
        <h2 className="text-xl font-semibold">Import complete</h2>
        <p className="text-muted-foreground">
          <span className="font-medium text-foreground">{result.imported}</span> transactions
          imported
          {result.duplicates > 0 && (
            <>
              {' '}
              · <span className="font-medium text-amber-600">{result.duplicates}</span> duplicates
              skipped
            </>
          )}
        </p>
        <Button onClick={reset} variant="outline" className="mt-2">
          Import another file
        </Button>
      </div>
    );
  }

  if (step === 'preview') {
    const selectedCount = rows.filter((r) => r.selected).length;

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={reset} className="gap-1">
            <ArrowLeft size={14} />
            Back
          </Button>
          <span className="text-sm text-muted-foreground">{filename}</span>
        </div>

        <ImportPreviewTable
          rows={rows}
          categories={categories}
          onToggle={toggleRow}
          onCategoryChange={setCategoryForRow}
        />

        <div className="flex items-center justify-end gap-3">
          <span className="text-sm text-muted-foreground">
            {selectedCount} of {rows.length} rows selected
          </span>
          <Button onClick={handleImport} disabled={loading || selectedCount === 0}>
            {loading ? (
              <>
                <Loader2 size={14} className="mr-2 animate-spin" />
                Importing…
              </>
            ) : (
              `Import ${selectedCount} transactions`
            )}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <CsvDropZone onFile={handleFile} loading={loading} />
      {loading && (
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 size={14} className="animate-spin" />
          Parsing file…
        </div>
      )}
    </div>
  );
}
