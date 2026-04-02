import { handleUpdate } from './handler.ts';
import type { TelegramUpdate } from './types.ts';

Deno.serve(async (req: Request): Promise<Response> => {
  // Only accept POST
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  // Validate Telegram webhook secret
  const secret = req.headers.get('X-Telegram-Bot-Api-Secret-Token');
  const expectedSecret = Deno.env.get('TELEGRAM_WEBHOOK_SECRET');
  if (!expectedSecret || secret !== expectedSecret) {
    return new Response('Unauthorized', { status: 401 });
  }

  let update: TelegramUpdate;
  try {
    update = (await req.json()) as TelegramUpdate;
  } catch {
    return new Response('Bad Request', { status: 400 });
  }

  const env = {
    SUPABASE_URL: Deno.env.get('SUPABASE_URL') ?? '',
    SUPABASE_SERVICE_ROLE_KEY: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    TELEGRAM_BOT_TOKEN: Deno.env.get('TELEGRAM_BOT_TOKEN') ?? '',
    ANTHROPIC_API_KEY: Deno.env.get('ANTHROPIC_API_KEY') ?? '',
  };

  // Always return 200 to Telegram (prevents retries on our errors)
  try {
    await handleUpdate(update, env);
  } catch (err) {
    console.error('Unhandled error in handleUpdate:', err);
  }

  return new Response('OK', { status: 200 });
});
