import Anthropic from 'npm:@anthropic-ai/sdk';

export interface ReceiptData {
  amount: number;
  currency: string;
  date: string | null;
  merchant: string | null;
  category: string | null;
}

const SYSTEM_PROMPT = `You are a receipt parser. Extract transaction data from the receipt image.
Return ONLY a JSON object with these fields:
- amount: number (required, always positive)
- currency: string (3-letter ISO code, e.g. "GEL", "USD". Default to "GEL" if unclear)
- date: string or null (YYYY-MM-DD format, null if not visible)
- merchant: string or null (store/restaurant name, null if not visible)
- category: string or null (one of: "Food & Dining", "Health", "Shopping", "Transport", "Entertainment", "Utilities", or null)

Return only valid JSON, no markdown, no explanation.`;

/** Extract transaction data from a receipt image using Claude Vision. */
export async function parseReceipt(
  apiKey: string,
  imageBase64: string,
  mediaType: 'image/jpeg' | 'image/png' | 'image/webp' = 'image/jpeg',
): Promise<ReceiptData> {
  const client = new Anthropic({ apiKey });

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 256,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: mediaType, data: imageBase64 },
          },
          { type: 'text', text: 'Parse this receipt.' },
        ],
      },
    ],
  });

  const text = message.content[0].type === 'text' ? message.content[0].text : '';

  try {
    const parsed = JSON.parse(text) as Partial<ReceiptData>;

    if (typeof parsed.amount !== 'number' || parsed.amount <= 0) {
      throw new Error('Invalid amount in OCR response');
    }

    return {
      amount: parsed.amount,
      currency: typeof parsed.currency === 'string' ? parsed.currency.toUpperCase() : 'GEL',
      date:
        typeof parsed.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(parsed.date)
          ? parsed.date
          : null,
      merchant: typeof parsed.merchant === 'string' ? parsed.merchant.slice(0, 100) : null,
      category: typeof parsed.category === 'string' ? parsed.category : null,
    };
  } catch {
    throw new Error(`Failed to parse OCR response: ${text.slice(0, 100)}`);
  }
}
