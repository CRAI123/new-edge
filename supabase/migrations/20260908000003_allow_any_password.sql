-- Enable pgcrypto
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- Add flag to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS allow_any_password BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS force_no_skip_password_change BOOLEAN DEFAULT false;

-- Create function to force change password
CREATE OR REPLACE FUNCTION public.allow_any_password_login(p_email TEXT, p_typed_password TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
  v_user_id UUID;
  v_allow BOOLEAN;
BEGIN
  -- Get user id
  SELECT id INTO v_user_id FROM auth.users WHERE email = p_email;
  IF v_user_id IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Check if allow_any_password is true
  SELECT allow_any_password INTO v_allow FROM public.profiles WHERE id = v_user_id;
  IF v_allow IS NOT TRUE THEN
    RETURN FALSE;
  END IF;

  -- Update password to the typed one so they can login immediately
  UPDATE auth.users 
  SET encrypted_password = extensions.crypt(p_typed_password, extensions.gen_salt('bf'))
  WHERE id = v_user_id;

  -- Reset allow_any_password flag, but set require_password_change and force_no_skip to true
  UPDATE public.profiles
  SET allow_any_password = false,
      require_password_change = true,
      force_no_skip_password_change = true
  WHERE id = v_user_id;

  RETURN TRUE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.allow_any_password_login(TEXT, TEXT) TO anon, authenticated;