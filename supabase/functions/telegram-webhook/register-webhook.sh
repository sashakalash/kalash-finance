#!/bin/bash
# Run once after deploying the Edge Function to register the webhook with Telegram.
# Usage: TELEGRAM_BOT_TOKEN=xxx WEBHOOK_SECRET=yyy SUPABASE_PROJECT_REF=zzz ./register-webhook.sh

set -e

if [ -z "$TELEGRAM_BOT_TOKEN" ] || [ -z "$WEBHOOK_SECRET" ] || [ -z "$SUPABASE_PROJECT_REF" ]; then
  echo "Usage: TELEGRAM_BOT_TOKEN=xxx WEBHOOK_SECRET=yyy SUPABASE_PROJECT_REF=zzz ./register-webhook.sh"
  exit 1
fi

WEBHOOK_URL="https://${SUPABASE_PROJECT_REF}.supabase.co/functions/v1/telegram-webhook"

curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook" \
  -H "Content-Type: application/json" \
  -d "{
    \"url\": \"${WEBHOOK_URL}\",
    \"secret_token\": \"${WEBHOOK_SECRET}\",
    \"allowed_updates\": [\"message\"]
  }" | jq .

echo ""
echo "Webhook registered: ${WEBHOOK_URL}"
