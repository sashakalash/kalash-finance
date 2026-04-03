-- ============================================================
-- 004 — Fix seed_default_categories: search_path + schema + Transfers icon
-- ============================================================

CREATE OR REPLACE FUNCTION public.seed_default_categories()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.categories (user_id, name, icon, color, is_default) VALUES
    (NEW.id, 'Food & Dining',  '🍔', '#ef4444', true),
    (NEW.id, 'Transport',      '🚗', '#f59e0b', true),
    (NEW.id, 'Shopping',       '🛍', '#8b5cf6', true),
    (NEW.id, 'Entertainment',  '🎬', '#ec4899', true),
    (NEW.id, 'Utilities',      '💡', '#06b6d4', true),
    (NEW.id, 'Health',         '🏥', '#10b981', true),
    (NEW.id, 'Transfers',      '->', '#94a3b8', true),
    (NEW.id, 'Fees',           '🏦', '#64748b', true),
    (NEW.id, 'Income',         '💰', '#22c55e', true),
    (NEW.id, 'Other',          '📦', '#6b7280', true);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
