-- ============================================================
-- Migration: Auto-create role-specific profiles on user signup
-- ============================================================

-- Function to automatically create role-specific profiles
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert into role-specific profile table based on the role field
  CASE NEW.role
    WHEN 'creator' THEN
      INSERT INTO public.creator_profiles (user_id)
      VALUES (NEW.id)
      ON CONFLICT (user_id) DO NOTHING;
      
    WHEN 'merchant' THEN
      INSERT INTO public.merchant_profiles (user_id)
      VALUES (NEW.id)
      ON CONFLICT (user_id) DO NOTHING;
      
    WHEN 'buyer' THEN
      INSERT INTO public.buyer_profiles (user_id)
      VALUES (NEW.id)
      ON CONFLICT (user_id) DO NOTHING;
      
    WHEN 'vendor' THEN
      INSERT INTO public.vendor_profiles (user_id)
      VALUES (NEW.id)
      ON CONFLICT (user_id) DO NOTHING;
  END CASE;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to fire after insert on profiles
DROP TRIGGER IF EXISTS on_profile_created ON public.profiles;
CREATE TRIGGER on_profile_created
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user_profile();
