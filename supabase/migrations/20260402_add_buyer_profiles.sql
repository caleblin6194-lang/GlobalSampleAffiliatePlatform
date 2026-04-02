-- ============================================================
-- Migration: Add buyer_profiles table
-- ============================================================

-- Buyer-specific profiles (for users who resell via links/coupons)
CREATE TABLE IF NOT EXISTS public.buyer_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  sales_channel TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Auto-update updated_at
DROP TRIGGER IF EXISTS on_buyer_profile_updated ON public.buyer_profiles;
CREATE TRIGGER on_buyer_profile_updated
  BEFORE UPDATE ON public.buyer_profiles
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at();

-- RLS for buyer_profiles
ALTER TABLE public.buyer_profiles ENABLE ROW LEVEL SECURITY;

-- Buyers can view their own profile
CREATE POLICY "Buyers can view own profile" ON public.buyer_profiles
  FOR SELECT USING (auth.uid() = user_id);

-- Buyers can update their own profile
CREATE POLICY "Buyers can update own profile" ON public.buyer_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Buyers can insert their own profile
CREATE POLICY "Buyers can insert own profile" ON public.buyer_profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_buyer_profiles_user_id ON public.buyer_profiles(user_id);
