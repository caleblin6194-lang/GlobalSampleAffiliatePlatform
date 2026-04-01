-- ============================================================
-- Migration: Add buyer role, payouts table, fix commission attribution
-- ============================================================

-- 1. Add 'buyer' to profiles role CHECK
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('admin', 'merchant', 'creator', 'vendor', 'buyer'));

-- 2. Allow profiles to be updated to switch role (for buyer→creator upgrade)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Payouts table for creator/buyer withdrawable balance
CREATE TABLE IF NOT EXISTS public.payouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'rejected')),
  payment_method TEXT,
  payment_reference TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

DROP TRIGGER IF EXISTS on_payout_updated ON public.payouts;
CREATE TRIGGER on_payout_updated
  BEFORE UPDATE ON public.payouts
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at();

ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;

-- Users can view their own payouts
CREATE POLICY "Users can view own payouts" ON public.payouts
  FOR SELECT USING (auth.uid() = user_id);

-- Users can create payout requests (will need admin approval)
CREATE POLICY "Users can create own payouts" ON public.payouts
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Admin can manage all payouts
CREATE POLICY "Admin can manage all payouts" ON public.payouts
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 4. Fix commission trigger: use affiliate_link.creator_id when order.creator_id is null
-- This ensures consumers who buy via affiliate link still credit the creator
DROP TRIGGER IF EXISTS on_order_paid_generate_commission ON public.orders;
DROP FUNCTION IF EXISTS public.generate_commission_on_order_paid;

CREATE OR REPLACE FUNCTION public.generate_commission_on_order_paid()
RETURNS trigger AS $$
DECLARE
  v_commission_amount DECIMAL(10,2);
  v_commission_rate DECIMAL(5,2);
  v_creator_id UUID;
  v_campaign_id UUID;
  v_order_amount DECIMAL(10,2);
BEGIN
  -- Only proceed if status changed TO paid
  IF new.status = 'paid' AND (old.status IS DISTINCT FROM 'paid') THEN

    -- Get the actual creator_id: prefer order.creator_id, fallback to affiliate_link.creator_id
    SELECT
      COALESCE(new.creator_id, al.creator_id),
      new.campaign_id,
      new.amount,
      c.commission_rate
    INTO v_creator_id, v_campaign_id, v_order_amount, v_commission_rate
    FROM public.orders o
    LEFT JOIN public.affiliate_links al ON o.affiliate_link_id = al.id
    LEFT JOIN public.campaigns c ON o.campaign_id = c.id
    WHERE o.id = new.id;

    IF v_campaign_id IS NOT NULL AND v_creator_id IS NOT NULL THEN
      -- Calculate commission
      v_commission_amount := v_order_amount * (v_commission_rate / 100);

      -- Prevent duplicate commission for same order
      IF NOT EXISTS (
        SELECT 1 FROM public.commissions
        WHERE order_id = new.id AND creator_id = v_creator_id
      ) THEN
        INSERT INTO public.commissions (
          order_id, creator_id, campaign_id,
          amount, rate, status
        ) VALUES (
          new.id, v_creator_id, v_campaign_id,
          v_commission_amount, v_commission_rate, 'pending'
        );
      END IF;
    END IF;
  END IF;

  -- If order cancelled or refunded, void pending commissions
  IF new.status IN ('cancelled', 'refunded') AND old.status = 'paid' THEN
    UPDATE public.commissions
    SET status = 'void', updated_at = now()
    WHERE order_id = new.id AND status = 'pending';
  END IF;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_order_paid_generate_commission
  AFTER UPDATE OF status ON public.orders
  FOR EACH ROW EXECUTE PROCEDURE public.generate_commission_on_order_paid();
