import type { RawTransaction } from '@/types';
import type { BankAdapter } from './types';

const MCC_CATEGORIES: Record<string, string> = {
  '5411': 'Food & Dining',
  '5412': 'Food & Dining',
  '5812': 'Food & Dining',
  '5814': 'Food & Dining',
  '5912': 'Health',
  '5655': 'Shopping',
  '5311': 'Shopping',
  '5734': 'Shopping',
  '7941': 'Entertainment',
  '7011': 'Entertainment',
  '5999': 'Shopping',
};

function parseAmount(raw: string | number | undefined): number | null {
  if (raw === undefined || raw === null || raw === '') return null;
  // "1 000,0" → "1000.0"  |  "-39,0" → "-39.0"
  const normalized = String(raw).replace(/\s/g, '').replace(',', '.');
  const value = parseFloat(normalized);
  return isNaN(value) ? null : value;
}

function parseGelDate(str: string): string {
  // "31/12/2025" or "31/12/2025 14:32" → "2025-12-31"
  const datePart = str.trim().split(' ')[0];
  const [day, month, year] = datePart.split('/');
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

function parseDetails(details: string): {
  description: string;
  date: string | null;
  suggestedCategory: string | null;
} {
  // Card payment: "Payment - Amount: GEL21.34; Merchant: UNIVERSAMI, Batumi, ...; MCC:5411; Date: 31/12/2025 14:32"
  const cardPayment = details.match(
    /^Payment - Amount[^;]+;\s*Merchant:\s*([^;]+);.*?MCC:(\d+).*?Date:\s*([\d/]+ [\d:]+)/,
  );
  if (cardPayment) {
    const merchant = cardPayment[1].split(',')[0].trim();
    const mcc = cardPayment[2];
    const date = parseGelDate(cardPayment[3]);
    return {
      description: merchant,
      date,
      suggestedCategory: MCC_CATEGORIES[mcc] ?? 'Shopping',
    };
  }

  // Utility payment: "Payment - Amount GEL28.30; Payment, 05/01/2026, payment service, SILKNET-By account..."
  const utilityPayment = details.match(/payment service,\s*([^,\-;]+)/i);
  if (utilityPayment) {
    return {
      description: utilityPayment[1].trim(),
      date: null,
      suggestedCategory: 'Utilities',
    };
  }

  // Outgoing transfer: "Outgoing Transfer - Amount: GEL39.00; Beneficiary: shps emotsia; ..."
  const outgoing = details.match(/Outgoing Transfer.*?Beneficiary:\s*([^;]+)/i);
  if (outgoing) {
    return {
      description: outgoing[1].trim(),
      date: null,
      suggestedCategory: 'Transfers',
    };
  }

  // Incoming transfer: "Incoming Transfer - Amount: GEL1,000.00; Sender: maltseva aleksandra; ..."
  const incoming = details.match(/Incoming Transfer.*?Sender:\s*([^;]+)/i);
  if (incoming) {
    return {
      description: `From: ${incoming[1].trim()}`,
      date: null,
      suggestedCategory: 'Income',
    };
  }

  // Refund/Income (Georgian text): "Income - Amount GEL3.94; tankhis dabruneba ...; obiekti:Temu; ..."
  const refund = details.match(/obiekti:([^;]+)/i);
  if (refund) {
    return {
      description: `Refund: ${refund[1].trim()}`,
      date: null,
      suggestedCategory: 'Income',
    };
  }

  // Transfer fee: "Fee - Amount: ; Transaction: Outgoing Transfer; ..."
  if (/^Fee/i.test(details)) {
    return { description: 'Transfer Fee', date: null, suggestedCategory: 'Fees' };
  }

  return {
    description: details.slice(0, 80).trim(),
    date: null,
    suggestedCategory: null,
  };
}

export const gelAdapter: BankAdapter = {
  id: 'bog',
  name: 'BoG',
  fileExtension: 'xlsx',

  detect: (headers) =>
    headers.includes('Date') && headers.includes('Details') && headers.includes('GEL'),

  mapRow: (row): RawTransaction | null => {
    const details = String(row.Details ?? '').trim();
    const rawGel = row.GEL;

    // Skip balance summary rows and rows without transaction details
    if (!details || details.startsWith('Balance') || rawGel === undefined || rawGel === '') {
      return null;
    }

    const amount = parseAmount(rawGel);
    if (amount === null) return null;

    const rowDate = parseGelDate(String(row.Date));
    const { description, date, suggestedCategory } = parseDetails(details);

    // Determine currency: use non-empty foreign currency column if GEL is ~0
    let currency = 'GEL';
    if (row.USD && parseAmount(row.USD) !== null && parseAmount(row.USD) !== 0) {
      currency = 'USD';
    } else if (row.EUR && parseAmount(row.EUR) !== null && parseAmount(row.EUR) !== 0) {
      currency = 'EUR';
    }

    return {
      amount: Math.abs(amount),
      currency,
      type: amount < 0 ? 'expense' : 'income',
      date: date ?? rowDate,
      description,
      suggestedCategory,
      rawDetails: details,
    };
  },
};
