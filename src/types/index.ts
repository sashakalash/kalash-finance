export type TransactionType = 'expense' | 'income';
export type TransactionSource = 'csv' | 'telegram' | 'manual';
export type CsvImportStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type BankFormat = 'bog' | 'custom';

export interface Category {
  id: string;
  user_id: string;
  name: string;
  icon: string | null;
  color: string | null;
  is_default: boolean;
  created_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  type: TransactionType;
  date: string;
  description: string | null;
  category_id: string | null;
  source: TransactionSource;
  hash: string | null;
  receipt_url: string | null;
  csv_import_id: string | null;
  created_at: string;
  updated_at: string;
  category?: Category | null;
}

export interface CsvImport {
  id: string;
  user_id: string;
  filename: string;
  bank_format: BankFormat;
  row_count: number;
  imported_count: number;
  duplicate_count: number;
  status: CsvImportStatus;
  error_message: string | null;
  created_at: string;
}

export interface TelegramLink {
  id: string;
  user_id: string;
  telegram_chat_id: number;
  telegram_username: string | null;
  linked_at: string;
}

/** Normalized row produced by any bank adapter before DB insert */
export interface RawTransaction {
  amount: number;
  currency: string;
  type: TransactionType;
  date: string; // YYYY-MM-DD
  description: string;
  suggestedCategory: string | null;
  rawDetails: string;
}

/** RawTransaction enriched with dedup result for preview table */
export interface PreviewTransaction extends RawTransaction {
  isDuplicate: boolean;
  hash: string;
  selected: boolean;
}

export interface DashboardStats {
  totalSpent: number;
  totalIncome: number;
  avgDailySpend: number;
  transactionCount: number;
  topCategory: string | null;
  currency: string;
}

export interface CategorySpend {
  name: string;
  color: string;
  icon: string;
  amount: number;
}

export interface MonthlyTrend {
  month: string; // "Jan 2026"
  expense: number;
  income: number;
}
