import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/** Format a number as currency. Default: GEL */
export function formatCurrency(amount: number, currency = 'GEL'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/** Format ISO date string to "Jan 31, 2026" */
export function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = String(d.getFullYear()).slice(-2);
  return `${day}.${month}.${year}`;
}

/** Format ISO date string to "Jan 2026" for chart axes */
export function formatMonth(dateStr: string): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
  }).format(new Date(dateStr));
}

/** Format a local Date as YYYY-MM-DD without UTC conversion. */
export function toLocalDateString(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Get first and last day of current month as YYYY-MM-DD */
export function currentMonthRange(): { from: string; to: string } {
  const now = new Date();
  const from = toLocalDateString(new Date(now.getFullYear(), now.getMonth(), 1));
  const to = toLocalDateString(new Date(now.getFullYear(), now.getMonth() + 1, 0));
  return { from, to };
}

/** Get first day N months ago through today as YYYY-MM-DD */
export function lastNMonthsRange(n: number): { from: string; to: string } {
  const now = new Date();
  const from = toLocalDateString(new Date(now.getFullYear(), now.getMonth() - (n - 1), 1));
  const to = toLocalDateString(now);
  return { from, to };
}
