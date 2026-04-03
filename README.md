# Kalash Finance

Personal finance tracker with multi-channel transaction input: CSV bank statements and Telegram receipt scanning.

## Features

- **CSV Import** — upload Bank of Georgia `.xlsx` statements, preview normalized transactions, detect duplicates by SHA-256 hash, batch import
- **Telegram Bot** — send a receipt photo or type `25 coffee` to [@kalash_finance_bot](https://t.me/kalash_finance_bot); receipts are parsed by Claude Vision (Haiku) and added automatically
- **Dashboard** — monthly spending by category (pie chart), 6-month trends (bar chart), key stats
- **Transaction CRUD** — add, edit, delete transactions manually; filter by date, category, source
- **Categories** — default set seeded on signup, fully customizable
- **Auth** — email/password + magic link via Supabase Auth; transactional emails via Resend
- **Row Level Security** — every SQL query is scoped to the authenticated user at the database level

## Stack

| Layer          | Technology                                   |
| -------------- | -------------------------------------------- |
| Framework      | Next.js 15 (App Router, Server Actions)      |
| Database       | Supabase (Postgres + RLS)                    |
| Auth           | Supabase Auth + Resend (transactional email) |
| Edge Functions | Supabase Edge Functions (Deno)               |
| AI / OCR       | Anthropic Claude Haiku (Vision)              |
| UI             | Tailwind CSS + shadcn/ui (base-ui)           |
| Charts         | Recharts                                     |
| File parsing   | SheetJS (xlsx)                               |
| Validation     | Zod                                          |
| Deployment     | Vercel (Next.js) + Supabase (DB + Functions) |

## Architecture

```
Browser
  ├── CSV upload → SheetJS (client-side parse) → Server Action → Supabase
  └── Manual entry → Server Action → Supabase

Telegram
  └── Message/photo → Supabase Edge Function
        ├── Text "25 coffee" → insert transaction
        └── Photo → Claude Vision → extract amount/merchant/date → insert transaction

Next.js Server Components
  └── Direct Supabase queries (no API layer) → Dashboard, Transactions, Settings
```

## Local Development

1. Clone and install:

```bash
git clone https://github.com/sashakalash/kalash-finance
cd kalash-finance
npm install
```

2. Copy env file and fill in values:

```bash
cp .env.example .env.local
```

3. Run dev server:

```bash
npm run dev
```

## Environment Variables

| Variable                        | Description              |
| ------------------------------- | ------------------------ |
| `NEXT_PUBLIC_SUPABASE_URL`      | Supabase project URL     |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |

Edge Function secrets (set via `supabase secrets set`):

| Secret                    | Description                                     |
| ------------------------- | ----------------------------------------------- |
| `TELEGRAM_BOT_TOKEN`      | From @BotFather                                 |
| `TELEGRAM_WEBHOOK_SECRET` | Random string used to validate webhook requests |
| `ANTHROPIC_API_KEY`       | For Claude Vision receipt OCR                   |

## Database Migrations

```bash
supabase link --project-ref <ref>
supabase db push
```

Migrations:

- `001_create_tables.sql` — categories, transactions, csv_imports, telegram_links
- `002_rls_policies.sql` — Row Level Security for all tables
- `003_seed_categories_trigger.sql` — auto-seed default categories on user signup
- `004_fix_seed_trigger.sql` — search_path fix for SECURITY DEFINER function

## Deploy Edge Function

```bash
supabase functions deploy telegram-webhook --no-verify-jwt
```

Register Telegram webhook:

```bash
TELEGRAM_BOT_TOKEN=xxx \
WEBHOOK_SECRET=yyy \
SUPABASE_PROJECT_REF=zzz \
./supabase/functions/telegram-webhook/register-webhook.sh
```

## Telegram Bot Usage

1. Go to **Settings** in the app → **Generate link code**
2. Send the 6-character code to telegram_bot
3. Once linked:
   - Send `25 coffee` → adds a 25 GEL expense
   - Send a receipt photo → Claude extracts amount, merchant, date and adds the transaction
