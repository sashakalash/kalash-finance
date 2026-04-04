-- ============================================================
-- 005 — Household: shared data between family members
-- ============================================================

-- ─── New tables ───────────────────────────────────────────────────────────────

CREATE TABLE households (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name             TEXT NOT NULL DEFAULT 'My Household',
  invite_code      TEXT UNIQUE,
  invite_expires_at TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE household_members (
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role         TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'member')),
  email        TEXT NOT NULL DEFAULT '',
  joined_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (household_id, user_id)
);

CREATE INDEX idx_household_members_user ON household_members(user_id);

-- ─── RLS on new tables ────────────────────────────────────────────────────────

ALTER TABLE households ENABLE ROW LEVEL SECURITY;
ALTER TABLE household_members ENABLE ROW LEVEL SECURITY;

-- Members can view their own household
CREATE POLICY "view_own_household" ON households FOR SELECT
USING (
  id IN (SELECT household_id FROM household_members WHERE user_id = auth.uid())
  OR (invite_code IS NOT NULL AND invite_expires_at > now())  -- allow reading for invite acceptance
);

-- Owners can update (to set invite code etc.)
CREATE POLICY "owner_update_household" ON households FOR UPDATE
USING (
  id IN (SELECT household_id FROM household_members WHERE user_id = auth.uid() AND role = 'owner')
);

-- Members can see all members of their household
CREATE POLICY "view_household_members" ON household_members FOR SELECT
USING (
  household_id IN (SELECT household_id FROM household_members hm2 WHERE hm2.user_id = auth.uid())
);

-- Users can insert themselves into a household with a valid invite code
CREATE POLICY "join_via_invite" ON household_members FOR INSERT
WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM households
    WHERE id = household_id
      AND invite_code IS NOT NULL
      AND invite_expires_at > now()
  )
);

-- Users can remove themselves from a household (leave)
CREATE POLICY "leave_household" ON household_members FOR DELETE
USING (user_id = auth.uid());

-- ─── Create a household for every existing user ───────────────────────────────

DO $$
DECLARE
  u RECORD;
  new_hid UUID;
BEGIN
  FOR u IN SELECT id, email FROM auth.users LOOP
    INSERT INTO households (name) VALUES ('My Household') RETURNING id INTO new_hid;
    INSERT INTO household_members (household_id, user_id, role, email)
    VALUES (new_hid, u.id, 'owner', COALESCE(u.email, ''));
  END LOOP;
END;
$$;

-- ─── Add household_id to data tables ─────────────────────────────────────────

ALTER TABLE categories   ADD COLUMN household_id UUID REFERENCES households(id) ON DELETE CASCADE;
ALTER TABLE transactions  ADD COLUMN household_id UUID REFERENCES households(id) ON DELETE CASCADE;
ALTER TABLE csv_imports   ADD COLUMN household_id UUID REFERENCES households(id) ON DELETE CASCADE;
ALTER TABLE telegram_links ADD COLUMN household_id UUID REFERENCES households(id) ON DELETE CASCADE;

-- ─── Backfill household_id from user_id ──────────────────────────────────────

UPDATE categories c
SET household_id = (
  SELECT hm.household_id FROM household_members hm WHERE hm.user_id = c.user_id LIMIT 1
);
UPDATE transactions t
SET household_id = (
  SELECT hm.household_id FROM household_members hm WHERE hm.user_id = t.user_id LIMIT 1
);
UPDATE csv_imports ci
SET household_id = (
  SELECT hm.household_id FROM household_members hm WHERE hm.user_id = ci.user_id LIMIT 1
);
UPDATE telegram_links tl
SET household_id = (
  SELECT hm.household_id FROM household_members hm WHERE hm.user_id = tl.user_id LIMIT 1
);

-- ─── Make NOT NULL ────────────────────────────────────────────────────────────

ALTER TABLE categories    ALTER COLUMN household_id SET NOT NULL;
ALTER TABLE transactions  ALTER COLUMN household_id SET NOT NULL;
ALTER TABLE csv_imports   ALTER COLUMN household_id SET NOT NULL;
ALTER TABLE telegram_links ALTER COLUMN household_id SET NOT NULL;

-- ─── Drop old user-scoped RLS policies ───────────────────────────────────────

DROP POLICY "Users can view own categories"   ON categories;
DROP POLICY "Users can insert own categories" ON categories;
DROP POLICY "Users can update own categories" ON categories;
DROP POLICY "Users can delete own categories" ON categories;

DROP POLICY "Users can view own transactions"   ON transactions;
DROP POLICY "Users can insert own transactions" ON transactions;
DROP POLICY "Users can update own transactions" ON transactions;
DROP POLICY "Users can delete own transactions" ON transactions;

DROP POLICY "Users can view own imports"   ON csv_imports;
DROP POLICY "Users can insert own imports" ON csv_imports;
DROP POLICY "Users can update own imports" ON csv_imports;

DROP POLICY "Users can view own telegram link"   ON telegram_links;
DROP POLICY "Users can insert own telegram link" ON telegram_links;
DROP POLICY "Users can delete own telegram link" ON telegram_links;

-- ─── New household-scoped RLS policies ───────────────────────────────────────

CREATE POLICY "household_select_categories" ON categories FOR SELECT
USING (EXISTS (
  SELECT 1 FROM household_members WHERE household_id = categories.household_id AND user_id = auth.uid()
));
CREATE POLICY "household_insert_categories" ON categories FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM household_members WHERE household_id = categories.household_id AND user_id = auth.uid()
));
CREATE POLICY "household_update_categories" ON categories FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM household_members WHERE household_id = categories.household_id AND user_id = auth.uid()
));
CREATE POLICY "household_delete_categories" ON categories FOR DELETE
USING (EXISTS (
  SELECT 1 FROM household_members WHERE household_id = categories.household_id AND user_id = auth.uid()
));

CREATE POLICY "household_select_transactions" ON transactions FOR SELECT
USING (EXISTS (
  SELECT 1 FROM household_members WHERE household_id = transactions.household_id AND user_id = auth.uid()
));
CREATE POLICY "household_insert_transactions" ON transactions FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM household_members WHERE household_id = transactions.household_id AND user_id = auth.uid()
));
CREATE POLICY "household_update_transactions" ON transactions FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM household_members WHERE household_id = transactions.household_id AND user_id = auth.uid()
));
CREATE POLICY "household_delete_transactions" ON transactions FOR DELETE
USING (EXISTS (
  SELECT 1 FROM household_members WHERE household_id = transactions.household_id AND user_id = auth.uid()
));

CREATE POLICY "household_select_imports" ON csv_imports FOR SELECT
USING (EXISTS (
  SELECT 1 FROM household_members WHERE household_id = csv_imports.household_id AND user_id = auth.uid()
));
CREATE POLICY "household_insert_imports" ON csv_imports FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM household_members WHERE household_id = csv_imports.household_id AND user_id = auth.uid()
));
CREATE POLICY "household_update_imports" ON csv_imports FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM household_members WHERE household_id = csv_imports.household_id AND user_id = auth.uid()
));

-- telegram_links stay user-scoped (a Telegram account belongs to one person)
CREATE POLICY "own_telegram_select" ON telegram_links FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own_telegram_insert" ON telegram_links FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own_telegram_delete" ON telegram_links FOR DELETE USING (auth.uid() = user_id);

-- ─── Update indexes ───────────────────────────────────────────────────────────

DROP INDEX IF EXISTS uq_transaction_hash;
DROP INDEX IF EXISTS idx_transactions_user_date;
DROP INDEX IF EXISTS idx_transactions_user_category;
DROP INDEX IF EXISTS uq_category_user_name;

CREATE UNIQUE INDEX uq_transaction_hash        ON transactions(household_id, hash) WHERE hash IS NOT NULL;
CREATE INDEX idx_transactions_household_date   ON transactions(household_id, date DESC);
CREATE INDEX idx_transactions_household_cat    ON transactions(household_id, category_id);
CREATE UNIQUE INDEX uq_category_household_name ON categories(household_id, name);

-- ─── Cleanup helper: delete household if empty (called via RPC) ──────────────

CREATE OR REPLACE FUNCTION public.cleanup_empty_household(hid UUID)
RETURNS void AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.household_members WHERE household_id = hid) THEN
    DELETE FROM public.households WHERE id = hid;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ─── Replace user-seed trigger with household-seed trigger ────────────────────

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.seed_default_categories();

CREATE OR REPLACE FUNCTION public.setup_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_household_id UUID;
BEGIN
  INSERT INTO public.households (name) VALUES ('My Household') RETURNING id INTO new_household_id;

  INSERT INTO public.household_members (household_id, user_id, role, email)
  VALUES (new_household_id, NEW.id, 'owner', COALESCE(NEW.email, ''));

  INSERT INTO public.categories (household_id, name, icon, color, is_default) VALUES
    (new_household_id, 'Food & Dining',  '🍔', '#ef4444', true),
    (new_household_id, 'Transport',      '🚗', '#f59e0b', true),
    (new_household_id, 'Shopping',       '🛍', '#8b5cf6', true),
    (new_household_id, 'Entertainment',  '🎬', '#ec4899', true),
    (new_household_id, 'Utilities',      '💡', '#06b6d4', true),
    (new_household_id, 'Health',         '🏥', '#10b981', true),
    (new_household_id, 'Transfers',      '->', '#94a3b8', true),
    (new_household_id, 'Fees',           '🏦', '#64748b', true),
    (new_household_id, 'Income',         '💰', '#22c55e', true),
    (new_household_id, 'Other',          '📦', '#6b7280', true);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.setup_new_user();
