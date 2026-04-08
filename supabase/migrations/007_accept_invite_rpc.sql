-- ============================================================
-- 007 — RPC to accept household invite (bypasses circular RLS)
-- ============================================================

CREATE OR REPLACE FUNCTION public.accept_household_invite(
  invite_code_input TEXT,
  calling_user_id   UUID,
  calling_user_email TEXT
)
RETURNS TEXT AS $$
DECLARE
  target_household_id UUID;
  old_household_id    UUID;
  expires             TIMESTAMPTZ;
BEGIN
  -- Validate invite code
  SELECT id, invite_expires_at INTO target_household_id, expires
  FROM public.households
  WHERE invite_code = invite_code_input;

  IF target_household_id IS NULL THEN
    RETURN 'Invalid invite code';
  END IF;

  IF expires IS NULL OR expires < now() THEN
    RETURN 'Invite link has expired';
  END IF;

  -- Get current household
  SELECT household_id INTO old_household_id
  FROM public.household_members
  WHERE user_id = calling_user_id;

  -- Already in this household
  IF old_household_id = target_household_id THEN
    RETURN NULL;
  END IF;

  -- Join new household
  INSERT INTO public.household_members (household_id, user_id, role, email)
  VALUES (target_household_id, calling_user_id, 'member', COALESCE(calling_user_email, ''));

  -- Leave old household
  IF old_household_id IS NOT NULL THEN
    DELETE FROM public.household_members
    WHERE household_id = old_household_id AND user_id = calling_user_id;

    -- Cleanup empty household
    IF NOT EXISTS (SELECT 1 FROM public.household_members WHERE household_id = old_household_id) THEN
      DELETE FROM public.households WHERE id = old_household_id;
    END IF;
  END IF;

  RETURN NULL; -- success
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
