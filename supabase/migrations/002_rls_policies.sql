-- ============================================================
-- 002 — Row Level Security policies
-- ============================================================

-- categories
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own categories"   ON categories FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own categories" ON categories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own categories" ON categories FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own categories" ON categories FOR DELETE USING (auth.uid() = user_id);

-- transactions
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own transactions"   ON transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own transactions" ON transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own transactions" ON transactions FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own transactions" ON transactions FOR DELETE USING (auth.uid() = user_id);

-- csv_imports
ALTER TABLE csv_imports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own imports"   ON csv_imports FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own imports" ON csv_imports FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own imports" ON csv_imports FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- telegram_links
ALTER TABLE telegram_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own telegram link"   ON telegram_links FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own telegram link" ON telegram_links FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own telegram link" ON telegram_links FOR DELETE USING (auth.uid() = user_id);
-- Service role (Edge Function) bypasses RLS automatically via service_role key
