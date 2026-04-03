import type { BankAdapter } from './types';
import { gelAdapter } from './gel';

/** Registered adapters — order matters for auto-detection priority */
export const BANK_ADAPTERS: BankAdapter[] = [gelAdapter];

/** Try to auto-detect the adapter by inspecting column headers */
export function detectAdapter(headers: string[]): BankAdapter | null {
  return BANK_ADAPTERS.find((a) => a.detect(headers)) ?? null;
}
