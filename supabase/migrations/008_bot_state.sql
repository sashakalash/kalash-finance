-- 008 — Add bot conversation state to telegram_links
ALTER TABLE telegram_links ADD COLUMN bot_state JSONB;
