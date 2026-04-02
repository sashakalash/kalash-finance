import type { RawTransaction } from '@/types';

/**
 * Generate a deterministic SHA-256 hash for a transaction.
 * Used to detect duplicates across multiple imports.
 */
export async function generateHash(userId: string, tx: RawTransaction): Promise<string> {
  // Normalize before hashing to catch minor formatting differences
  const normalized = [
    userId,
    tx.date,
    tx.amount.toFixed(2),
    tx.currency.toUpperCase(),
    tx.type,
    tx.description.toLowerCase().trim(),
  ].join('|');

  const encoder = new TextEncoder();
  const data = encoder.encode(normalized);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}
