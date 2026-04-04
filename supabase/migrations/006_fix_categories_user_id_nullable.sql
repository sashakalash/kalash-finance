-- ============================================================
-- 006 — Make categories.user_id nullable
-- The data model shifted to household-scoped in 005; the trigger
-- setup_new_user() inserts categories by household_id only.
-- user_id NOT NULL on categories causes "Database error saving
-- new user" because the trigger omits user_id on INSERT.
-- ============================================================

ALTER TABLE categories ALTER COLUMN user_id DROP NOT NULL;
