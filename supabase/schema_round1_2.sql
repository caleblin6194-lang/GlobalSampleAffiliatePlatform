-- ============================================================
-- Round 1-2: Core Schema (Missing Base Tables)
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- Helper function for updated_at (must come first!)
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- PROFILES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  role TEXT DEFAULT 'creator' CHECK (role IN ('admin', 'merchant', 'creator', 'vendor')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

DROP TRIGGER IF EXISTS on_profile_updated ON public.profiles;
CREATE TRIGGER on_profile_updated
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at();

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- ============================================================
-- BRANDS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.brands (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  website TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

DROP TRIGGER IF EXISTS on_brand_updated ON public.brands;
CREATE TRIGGER on_brand_updated
  BEFORE UPDATE ON public.brands
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at();

ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view brands" ON public.brands
  FOR SELECT USING (true);

CREATE POLICY "Merchants can manage own brands" ON public.brands
  FOR ALL USING (auth.uid() = owner_id);

-- ============================================================
-- CREATOR CHANNELS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.creator_channels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  handle TEXT NOT NULL,
  followers INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

DROP TRIGGER IF EXISTS on_channel_updated ON public.creator_channels;
CREATE TRIGGER on_channel_updated
  BEFORE UPDATE ON public.creator_channels
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at();

ALTER TABLE public.creator_channels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view channels" ON public.creator_channels
  FOR SELECT USING (true);

CREATE POLICY "Creators can manage own channels" ON public.creator_channels
  FOR ALL USING (auth.uid() = creator_id);

-- ============================================================
-- VENDORS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.vendors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  vendor_name TEXT NOT NULL,
  market_code TEXT,
  stall_no TEXT,
  contact_whatsapp TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

DROP TRIGGER IF EXISTS on_vendor_updated ON public.vendors;
CREATE TRIGGER on_vendor_updated
  BEFORE UPDATE ON public.vendors
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at();

ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view vendors" ON public.vendors
  FOR SELECT USING (true);

CREATE POLICY "Vendors can manage own vendor record" ON public.vendors
  FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- PRODUCTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  merchant_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  vendor_id UUID REFERENCES public.vendors(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

DROP TRIGGER IF EXISTS ON_product_updated ON public.products;
CREATE TRIGGER on_product_updated
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at();

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view products" ON public.products
  FOR SELECT USING (true);

CREATE POLICY "Merchants can manage own products" ON public.products
  FOR ALL USING (auth.uid() = merchant_id);

-- ============================================================
-- PRODUCT VARIANTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.product_variants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  model TEXT,
  color TEXT,
  series TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view variants" ON public.product_variants
  FOR SELECT USING (true);

CREATE POLICY "Merchants can manage variants" ON public.product_variants
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.products p
      WHERE p.id = product_id AND p.merchant_id = auth.uid()
    )
  );

-- ============================================================
-- CAMPAIGNS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  merchant_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  sample_qty INTEGER DEFAULT 0,
  commission_rate DECIMAL(5,2) DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'closed')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

DROP TRIGGER IF EXISTS on_campaign_updated ON public.campaigns;
CREATE TRIGGER on_campaign_updated
  BEFORE UPDATE ON public.campaigns
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at();

ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view campaigns" ON public.campaigns
  FOR SELECT USING (true);

CREATE POLICY "Merchants can manage own campaigns" ON public.campaigns
  FOR ALL USING (auth.uid() = merchant_id);

-- ============================================================
-- CAMPAIGN APPLICATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.campaign_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE,
  creator_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  shipping_name TEXT,
  phone TEXT,
  country TEXT,
  state TEXT,
  city TEXT,
  address_line1 TEXT,
  address_line2 TEXT,
  postal_code TEXT,
  selected_platform TEXT,
  notes TEXT,
  task_id UUID,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

DROP TRIGGER IF EXISTS on_application_updated ON public.campaign_applications;
CREATE TRIGGER on_application_updated
  BEFORE UPDATE ON public.campaign_applications
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at();

ALTER TABLE public.campaign_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Creators can view own applications" ON public.campaign_applications
  FOR SELECT USING (auth.uid() = creator_id);

CREATE POLICY "Creators can create applications" ON public.campaign_applications
  FOR INSERT WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can update own applications" ON public.campaign_applications
  FOR UPDATE USING (auth.uid() = creator_id);

CREATE POLICY "Merchants can view applications for own campaigns" ON public.campaign_applications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.campaigns c
      WHERE c.id = campaign_id AND c.merchant_id = auth.uid()
    )
  );

CREATE POLICY "Merchants can update applications for own campaigns" ON public.campaign_applications
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.campaigns c
      WHERE c.id = campaign_id AND c.merchant_id = auth.uid()
    )
  );
