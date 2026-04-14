import type { RawTransaction } from '@/types';

export interface BankAdapter {
  id: string;
  name: string;
  fileExtension: 'xlsx' | 'csv';
  /** Return true if the parsed headers match this bank's format */
  detect: (headers: string[]) => boolean;
  /** Map a raw row (Record<header, value>) to a RawTransaction or null to skip */
  mapRow: (row: Record<string, string>, rowIndex: number) => RawTransaction | null;
}
