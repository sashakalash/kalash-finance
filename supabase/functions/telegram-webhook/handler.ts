import { createClient } from 'npm:@supabase/supabase-js@2';
import { sendMessage, getFile, downloadFile, toBase64 } from './telegram-api.ts';
import { parseReceipt } from './vision.ts';
import type { TelegramUpdate } from './types.ts';

// Quick-entry pattern: "150 coffee" or "25.5 taxi"
const QUICK_ENTRY_RE = /^(\d+[.,]?\d*)\s+(.+)$/;

// 6-char alphanumeric link code
const LINK_CODE_RE = /^[A-Z0-9]{6}$/i;

/** Generate a SHA-256 hash for deduplication. */
async function hashTransaction(
  userId: string,
  date: string,
  amount: number,
  currency: string,
  description: string,
): Promise<string> {
  const normalized = [
    userId,
    date,
    amount.toFixed(2),
    currency.toUpperCase(),
    description.toLowerCase().trim(),
  ].join('|');
  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(normalized));
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function handleUpdate(
  update: TelegramUpdate,
  env: {
    SUPABASE_URL: string;
    SUPABASE_SERVICE_ROLE_KEY: string;
    TELEGRAM_BOT_TOKEN: string;
    ANTHROPIC_API_KEY: string;
  },
): Promise<void> {
  const msg = update.message;
  if (!msg) return;

  const chatId = msg.chat.id;
  const token = env.TELEGRAM_BOT_TOKEN;

  // Service-role client bypasses RLS — used only in Edge Functions
  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

  // ─── Resolve user from chat id ────────────────────────────────────────────
  const { data: link } = await supabase
    .from('telegram_links')
    .select('user_id')
    .eq('telegram_chat_id', chatId)
    .maybeSingle();

  // ─── /start or /help ─────────────────────────────────────────────────────
  if (msg.text === '/start' || msg.text === '/help') {
    await sendMessage(
      token,
      chatId,
      `<b>Kalash Finance Bot</b>\n\n` +
        `To link your account, go to <b>Settings</b> in the app and send the code shown there.\n\n` +
        `Once linked, you can:\n` +
        `• Send a receipt photo to log it automatically\n` +
        `• Type <code>25 coffee</code> for quick entry`,
    );
    return;
  }

  // ─── Link code handling (not yet linked) ─────────────────────────────────
  if (!link) {
    if (msg.text && LINK_CODE_RE.test(msg.text.trim())) {
      const code = msg.text.trim().toUpperCase();
      const now = new Date().toISOString();

      const { data: pendingLink } = await supabase
        .from('telegram_links')
        .select('user_id, link_code_expires_at')
        .eq('link_code', code)
        .maybeSingle();

      if (!pendingLink) {
        await sendMessage(token, chatId, '❌ Code not found. Generate a new one in the app.');
        return;
      }

      if (pendingLink.link_code_expires_at < now) {
        await sendMessage(token, chatId, '❌ Code expired. Generate a new one in Settings.');
        return;
      }

      await supabase
        .from('telegram_links')
        .update({
          telegram_chat_id: chatId,
          telegram_username: msg.from?.username ?? null,
          link_code: null,
          link_code_expires_at: null,
          linked_at: now,
        })
        .eq('user_id', pendingLink.user_id);

      await sendMessage(
        token,
        chatId,
        '✅ Account linked! Send a receipt photo or type <code>25 coffee</code>.',
      );
      return;
    }

    await sendMessage(
      token,
      chatId,
      'Please link your account first. Open the app → Settings → Link Telegram.',
    );
    return;
  }

  const userId = link.user_id;

  // ─── Photo: receipt OCR ───────────────────────────────────────────────────
  if (msg.photo && msg.photo.length > 0) {
    const largest = msg.photo[msg.photo.length - 1];
    try {
      const fileInfo = await getFile(token, largest.file_id);
      if (!fileInfo.file_path) throw new Error('No file_path');

      const bytes = await downloadFile(token, fileInfo.file_path);
      const base64 = toBase64(bytes);

      const receipt = await parseReceipt(env.ANTHROPIC_API_KEY, base64);
      const today = new Date().toISOString().split('T')[0];
      const date = receipt.date ?? today;
      const description = receipt.merchant ?? 'Receipt';

      // Resolve category id from name
      let categoryId: string | null = null;
      if (receipt.category) {
        const { data: cat } = await supabase
          .from('categories')
          .select('id')
          .eq('user_id', userId)
          .eq('name', receipt.category)
          .maybeSingle();
        categoryId = cat?.id ?? null;
      }

      const hash = await hashTransaction(
        userId,
        date,
        receipt.amount,
        receipt.currency,
        description,
      );

      const { error } = await supabase.from('transactions').insert({
        user_id: userId,
        amount: receipt.amount,
        currency: receipt.currency,
        type: 'expense',
        date,
        description,
        category_id: categoryId,
        source: 'telegram',
        hash,
      });

      if (error?.code === '23505') {
        await sendMessage(token, chatId, '⚠️ This transaction looks like a duplicate — skipped.');
        return;
      }
      if (error) throw new Error(error.message);

      const catLabel = receipt.category ? ` · ${receipt.category}` : '';
      await sendMessage(
        token,
        chatId,
        `✅ Added: <b>${receipt.amount} ${receipt.currency}</b> — ${description}${catLabel}\n` +
          `<i>${date}</i>`,
      );
    } catch (err) {
      const msg2 = err instanceof Error ? err.message : 'Unknown error';
      await sendMessage(token, chatId, `❌ Could not read receipt: ${msg2}`);
    }
    return;
  }

  // ─── Text: quick entry "150 coffee" ──────────────────────────────────────
  if (msg.text) {
    const match = QUICK_ENTRY_RE.exec(msg.text.trim());
    if (match) {
      const amount = parseFloat(match[1].replace(',', '.'));
      const description = match[2].trim();
      const date = new Date().toISOString().split('T')[0];

      const hash = await hashTransaction(userId, date, amount, 'GEL', description);

      const { error } = await supabase.from('transactions').insert({
        user_id: userId,
        amount,
        currency: 'GEL',
        type: 'expense',
        date,
        description,
        source: 'telegram',
        hash,
      });

      if (error?.code === '23505') {
        await sendMessage(token, chatId, '⚠️ Already added today.');
        return;
      }
      if (error) {
        await sendMessage(token, chatId, `❌ Error: ${error.message}`);
        return;
      }

      await sendMessage(token, chatId, `✅ Added: <b>${amount} GEL</b> — ${description}`);
      return;
    }

    await sendMessage(
      token,
      chatId,
      'Send a receipt photo, or type: <code>amount description</code>\nExample: <code>25 coffee</code>',
    );
  }
}
