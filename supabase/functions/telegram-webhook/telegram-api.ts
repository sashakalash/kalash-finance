import type { TelegramFile, InlineKeyboardButton } from './types.ts';

const BASE = (token: string) => `https://api.telegram.org/bot${token}`;

/** Send a text reply to a Telegram chat. */
export async function sendMessage(token: string, chatId: number, text: string): Promise<void> {
  await fetch(`${BASE(token)}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
  });
}

/** Send a message with an inline keyboard. */
export async function sendKeyboard(
  token: string,
  chatId: number,
  text: string,
  buttons: InlineKeyboardButton[][],
): Promise<void> {
  await fetch(`${BASE(token)}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      reply_markup: { inline_keyboard: buttons },
    }),
  });
}

/** Acknowledge a callback query (removes the loading spinner). */
export async function answerCallback(token: string, callbackId: string): Promise<void> {
  await fetch(`${BASE(token)}/answerCallbackQuery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ callback_query_id: callbackId }),
  });
}

/** Get file metadata (file_path) for a given file_id. */
export async function getFile(token: string, fileId: string): Promise<TelegramFile> {
  const res = await fetch(`${BASE(token)}/getFile?file_id=${fileId}`);
  const json = (await res.json()) as { ok: boolean; result: TelegramFile };
  if (!json.ok) throw new Error('getFile failed');
  return json.result;
}

/** Download file bytes from Telegram CDN. */
export async function downloadFile(token: string, filePath: string): Promise<Uint8Array> {
  const res = await fetch(`https://api.telegram.org/file/bot${token}/${filePath}`);
  if (!res.ok) throw new Error('Failed to download file from Telegram');
  const buffer = await res.arrayBuffer();
  return new Uint8Array(buffer);
}

/** Convert Uint8Array to base64 string. */
export function toBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}
