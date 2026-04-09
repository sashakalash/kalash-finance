import { createClient } from 'npm:@supabase/supabase-js@2';
import {
  sendMessage,
  sendKeyboard,
  answerCallback,
  getFile,
  downloadFile,
  toBase64,
} from './telegram-api.ts';
import { parseReceipt } from './vision.ts';
import type { TelegramUpdate, BotState, InlineKeyboardButton } from './types.ts';

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
  const token = env.TELEGRAM_BOT_TOKEN;
  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

  // ─── Callback query (inline button press) ─────────────────────────────────
  if (update.callback_query) {
    const cb = update.callback_query;
    const chatId = cb.message?.chat.id;
    if (!chatId) return;

    await answerCallback(token, cb.id);

    const { data: link } = await supabase
      .from('telegram_links')
      .select('user_id, household_id, bot_state')
      .eq('telegram_chat_id', chatId)
      .maybeSingle();
    if (!link) return;

    const data = cb.data ?? '';

    // ── Type selection: expense / income ──
    if (data === 'type:expense' || data === 'type:income') {
      const type = data === 'type:expense' ? 'expense' : 'income';

      if (type === 'expense') {
        // Fetch categories and show as buttons
        const { data: categories } = await supabase
          .from('categories')
          .select('id, name, icon')
          .eq('household_id', link.household_id)
          .order('name');

        if (!categories || categories.length === 0) {
          await sendMessage(
            token,
            chatId,
            '❌ No categories found. Add categories in the app first.',
          );
          return;
        }

        // Build 2-column grid of category buttons
        const buttons: InlineKeyboardButton[][] = [];
        for (let i = 0; i < categories.length; i += 2) {
          const row: InlineKeyboardButton[] = [
            {
              text: `${categories[i].icon ?? ''} ${categories[i].name}`,
              callback_data: `cat:${categories[i].id}:${categories[i].name}`,
            },
          ];
          if (categories[i + 1]) {
            row.push({
              text: `${categories[i + 1].icon ?? ''} ${categories[i + 1].name}`,
              callback_data: `cat:${categories[i + 1].id}:${categories[i + 1].name}`,
            });
          }
          buttons.push(row);
        }
        buttons.push([{ text: '❌ Cancel', callback_data: 'cancel' }]);

        await supabase
          .from('telegram_links')
          .update({ bot_state: { type: 'expense' } })
          .eq('telegram_chat_id', chatId);

        await sendKeyboard(token, chatId, '📂 Choose a category:', buttons);
        return;
      }

      // Income — resolve "Income" category, then ask for amount
      const { data: incomeCat } = await supabase
        .from('categories')
        .select('id')
        .eq('household_id', link.household_id)
        .eq('name', 'Income')
        .maybeSingle();

      await supabase
        .from('telegram_links')
        .update({
          bot_state: {
            type: 'income',
            category_id: incomeCat?.id ?? null,
            category_name: 'Income',
            step: 'awaiting_amount',
          },
        })
        .eq('telegram_chat_id', chatId);

      await sendMessage(
        token,
        chatId,
        '💰 Enter amount and description:\n<code>1500 salary</code>',
      );
      return;
    }

    // ── Category selection ──
    if (data.startsWith('cat:')) {
      const parts = data.split(':');
      const categoryId = parts[1];
      const categoryName = parts.slice(2).join(':');

      const state: BotState = {
        type: 'expense',
        category_id: categoryId,
        category_name: categoryName,
        step: 'awaiting_amount',
      };

      await supabase
        .from('telegram_links')
        .update({ bot_state: state })
        .eq('telegram_chat_id', chatId);

      await sendMessage(
        token,
        chatId,
        `📝 <b>${categoryName}</b>\nEnter amount and description:\n<code>150 coffee</code>`,
      );
      return;
    }

    // ── Cancel ──
    if (data === 'cancel') {
      await supabase
        .from('telegram_links')
        .update({ bot_state: null })
        .eq('telegram_chat_id', chatId);

      await sendMessage(token, chatId, '👌 Cancelled.');
      return;
    }

    return;
  }

  // ─── Regular message ──────────────────────────────────────────────────────
  const msg = update.message;
  if (!msg) return;

  const chatId = msg.chat.id;

  // ─── Resolve user + household ─────────────────────────────────────────────
  const { data: link } = await supabase
    .from('telegram_links')
    .select('user_id, household_id, bot_state')
    .eq('telegram_chat_id', chatId)
    .maybeSingle();

  // ─── /start or /help ─────────────────────────────────────────────────────
  if (msg.text === '/start' || msg.text === '/help') {
    if (!link) {
      await sendMessage(
        token,
        chatId,
        `<b>Kalash Finance Bot</b>\n\nTo link your account, go to <b>Settings</b> in the app and send the code shown there.`,
      );
      return;
    }

    await sendKeyboard(token, chatId, '<b>Kalash Finance Bot</b>\n\nChoose transaction type:', [
      [
        { text: '💸 Expense', callback_data: 'type:expense' },
        { text: '💰 Income', callback_data: 'type:income' },
      ],
    ]);
    return;
  }

  // ─── /new — start new entry (shortcut) ────────────────────────────────────
  if (msg.text === '/new') {
    if (!link) {
      await sendMessage(
        token,
        chatId,
        'Link your account first. Open the app → Settings → Link Telegram.',
      );
      return;
    }

    await supabase
      .from('telegram_links')
      .update({ bot_state: null })
      .eq('telegram_chat_id', chatId);

    await sendKeyboard(token, chatId, 'Choose transaction type:', [
      [
        { text: '💸 Expense', callback_data: 'type:expense' },
        { text: '💰 Income', callback_data: 'type:income' },
      ],
    ]);
    return;
  }

  // ─── Link code handling (not yet linked) ──────────────────────────────────
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

      await sendKeyboard(token, chatId, '✅ Account linked! Choose transaction type:', [
        [
          { text: '💸 Expense', callback_data: 'type:expense' },
          { text: '💰 Income', callback_data: 'type:income' },
        ],
      ]);
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
  const householdId = link.household_id;
  const botState = link.bot_state as BotState | null;

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

      let categoryId: string | null = null;
      if (receipt.category) {
        const { data: cat } = await supabase
          .from('categories')
          .select('id')
          .eq('household_id', householdId)
          .eq('name', receipt.category)
          .maybeSingle();
        categoryId = cat?.id ?? null;
      }

      const hash = await hashTransaction(
        householdId,
        date,
        receipt.amount,
        receipt.currency,
        description,
      );

      const { error } = await supabase.from('transactions').insert({
        household_id: householdId,
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
        `✅ Added: <b>${receipt.amount} ${receipt.currency}</b> — ${description}${catLabel}\n<i>${date}</i>`,
      );
    } catch (err) {
      const msg2 = err instanceof Error ? err.message : 'Unknown error';
      await sendMessage(token, chatId, `❌ Could not read receipt: ${msg2}`);
    }

    // Clear state after receipt
    await supabase
      .from('telegram_links')
      .update({ bot_state: null })
      .eq('telegram_chat_id', chatId);
    return;
  }

  // ─── Text: awaiting amount entry ──────────────────────────────────────────
  if (msg.text && botState?.step === 'awaiting_amount') {
    const match = /^(\d+[.,]?\d*)\s*(.*)$/.exec(msg.text.trim());
    if (!match) {
      await sendMessage(
        token,
        chatId,
        '❌ Invalid format. Enter: <code>amount description</code>\nExample: <code>150 coffee</code>',
      );
      return;
    }

    const amount = parseFloat(match[1].replace(',', '.'));
    const description = match[2].trim() || (botState.type === 'income' ? 'Income' : 'Expense');
    const type = botState.type ?? 'expense';
    const categoryId = botState.category_id ?? null;
    const categoryName = botState.category_name ?? null;
    const date = new Date().toISOString().split('T')[0];

    const hash = await hashTransaction(householdId, date, amount, 'GEL', description);

    const { error } = await supabase.from('transactions').insert({
      household_id: householdId,
      user_id: userId,
      amount,
      currency: 'GEL',
      type,
      date,
      description,
      category_id: categoryId,
      source: 'telegram',
      hash,
    });

    // Clear state
    await supabase
      .from('telegram_links')
      .update({ bot_state: null })
      .eq('telegram_chat_id', chatId);

    if (error?.code === '23505') {
      await sendMessage(token, chatId, '⚠️ Already added today.');
      return;
    }
    if (error) {
      await sendMessage(token, chatId, `❌ Error: ${error.message}`);
      return;
    }

    const icon = type === 'income' ? '📥' : '✅';
    const catLabel = categoryName ? ` · ${categoryName}` : '';
    await sendMessage(
      token,
      chatId,
      `${icon} <b>${amount} GEL</b> — ${description}${catLabel}\n\nUse /new for another entry.`,
    );
    return;
  }

  // ─── Text: no active state — show main menu ──────────────────────────────
  if (msg.text) {
    await sendKeyboard(token, chatId, 'Choose transaction type:', [
      [
        { text: '💸 Expense', callback_data: 'type:expense' },
        { text: '💰 Income', callback_data: 'type:income' },
      ],
    ]);
  }
}
