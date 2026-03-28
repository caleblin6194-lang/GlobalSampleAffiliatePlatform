-- ============================================================
-- SEED DATA - Round 3 Demo (Tasks & Contents)
-- Run AFTER schema.sql
-- NOTE: Password for all demo accounts is: Demo1234!
-- ============================================================

-- Create these users via Supabase Dashboard > Authentication > Users first:
-- admin@demo.com, merchant@demo.com, merchant2@demo.com,
-- creator@demo.com, creator2@demo.com, vendor@demo.com

-- ============================================================
-- EXISTING ROUND 1-2 SEED DATA (Comments removed, ready to run)
-- ============================================================

-- Admin profile
INSERT INTO public.profiles (id, email, full_name, role)
VALUES ('00000000-0000-0000-0000-000000000001', 'admin@demo.com', 'System Admin', 'admin');

-- Merchant profiles
INSERT INTO public.profiles (id, email, full_name, role)
VALUES
  ('00000000-0000-0000-0000-000000000002', 'merchant@demo.com', 'Jane Merchant', 'merchant'),
  ('00000000-0000-0000-0000-000000000003', 'merchant2@demo.com', 'Bob Brands', 'merchant');

-- Creator profiles
INSERT INTO public.profiles (id, email, full_name, role)
VALUES
  ('00000000-0000-0000-0000-000000000004', 'creator@demo.com', 'Alice Creator', 'creator'),
  ('00000000-0000-0000-0000-000000000005', 'creator2@demo.com', 'Charlie Tube', 'creator');

-- Vendor profile
INSERT INTO public.profiles (id, email, full_name, role)
VALUES ('00000000-0000-0000-0000-000000000006', 'vendor@demo.com', 'David Vendor', 'vendor');

-- Brands
INSERT INTO public.brands (id, owner_id, name, description, website)
VALUES
  ('b1000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'TechGear Pro', 'Premium tech accessories brand', 'https://techgear.example'),
  ('b1000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000003', 'BeautyBox Co', 'Cosmetic and beauty products', 'https://beautybox.example');

-- Creator channels
INSERT INTO public.creator_channels (id, creator_id, platform, handle, followers)
VALUES
  ('c1000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000004', 'Instagram', '@alicecreator', 45200),
  ('c1000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000004', 'TikTok', '@alicecreator', 128000),
  ('c1000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000005', 'YouTube', '@charlietube', 89000),
  ('c1000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000005', 'Instagram', '@charlietube', 31500);

-- Vendors
INSERT INTO public.vendors (id, user_id, vendor_name, market_code, stall_no, contact_whatsapp)
VALUES
  ('v1000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000006', 'Shenzhen Electronics Stall', 'HQB', 'A12', '+8613800138000'),
  ('v1000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000006', 'Guangzhou Beauty Wholesale', 'GZBT', 'B05', '+862000000001');

-- Products
INSERT INTO public.products (id, merchant_id, vendor_id, title, description, category, status)
VALUES
  ('p1000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'v1000000-0000-0000-0000-000000000001', 'iPhone 15 Pro Max Case', 'Premium shockproof case for iPhone 15 Pro Max', 'Electronics', 'active'),
  ('p1000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', 'v1000000-0000-0000-0000-000000000001', 'Wireless Earbuds Pro', 'ANC wireless earbuds with 30hr battery', 'Electronics', 'active'),
  ('p1000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000003', 'v1000000-0000-0000-0000-000000000002', 'Vitamin C Serum', '20% Vitamin C Brightening Serum 30ml', 'Beauty', 'active'),
  ('p1000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000003', 'v1000000-0000-0000-0000-000000000002', 'Matte Lipstick Set', '8-color matte lipstick collection', 'Beauty', 'active');

-- Product Variants
INSERT INTO public.product_variants (product_id, model, color, series)
VALUES
  ('p1000000-0000-0000-0000-000000000001', 'IP15PM', 'Black', 'SG-PRO'),
  ('p1000000-0000-0000-0000-000000000001', 'IP15PM', 'Navy', 'SG-PRO'),
  ('p1000000-0000-0000-0000-000000000002', 'WEP-2024', 'White', 'AUD-X1'),
  ('p1000000-0000-0000-0000-000000000002', 'WEP-2024', 'Black', 'AUD-X1'),
  ('p1000000-0000-0000-0000-000000000003', 'VITC-20', 'Clear', 'SER-C'),
  ('p1000000-0000-0000-0000-000000000004', 'MLS-8C', 'Red', 'MAT-L');

-- Campaigns
INSERT INTO public.campaigns (id, merchant_id, product_id, title, description, sample_qty, commission_rate, status)
VALUES
  ('ca100000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'p1000000-0000-0000-0000-000000000001', 'iPhone Case Review Campaign', 'Send us your honest review on Instagram', 50, 15.00, 'active'),
  ('ca100000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', 'p1000000-0000-0000-0000-000000000002', 'Earbuds Unboxing Program', 'Creative unboxing content on TikTok', 30, 20.00, 'active'),
  ('ca100000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000003', 'p1000000-0000-0000-0000-000000000003', 'Skincare Review Campaign', 'Beauty blogger skincare review program', 100, 12.50, 'active');

-- ============================================================
-- ROUND 2: Campaign Applications
-- ============================================================
INSERT INTO public.campaign_applications (id, campaign_id, creator_id, shipping_name, phone, country, state, city, address_line1, postal_code, selected_platform, notes, status)
VALUES
  -- Applications for iPhone Case Campaign
  ('a1000000-0000-0000-0000-000000000001', 'ca100000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000004', 'Alice Creator', '+1234567890', 'United States', 'California', 'Los Angeles', '123 Main St', '90001', 'Instagram', 'I love tech products!', 'pending'),
  ('a1000000-0000-0000-0000-000000000002', 'ca100000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000005', 'Charlie Tube', '+1987654321', 'United Kingdom', 'England', 'London', '456 Oxford St', 'W1D 1BS', 'YouTube', 'My audience loves tech reviews', 'pending'),
  -- Applications for Earbuds Campaign
  ('a1000000-0000-0000-0000-000000000003', 'ca100000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000004', 'Alice Creator', '+1234567890', 'United States', 'California', 'Los Angeles', '789 Sunset Blvd', '90028', 'TikTok', 'Perfect for my tech TikToks', 'approved'),
  -- Applications for Skincare Campaign
  ('a1000000-0000-0000-0000-000000000004', 'ca100000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000005', 'Charlie Tube', '+1987654321', 'United Kingdom', 'England', 'Manchester', '101 King St', 'M1 1AB', 'Instagram', 'Skincare is my niche', 'approved');

-- ============================================================
-- ROUND 3: Tasks (auto-generated when applications approved)
-- Manual insert for demo purposes
-- ============================================================
INSERT INTO public.creator_tasks (id, application_id, campaign_id, creator_id, merchant_id, title, description, status, due_at)
VALUES
  ('t1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000003', 'ca100000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000002', 'Earbuds Unboxing Program', 'Creative unboxing content on TikTok. Create an engaging 30-60 second video showcasing the product features.', 'submitted', '2026-04-15'),
  ('t1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000004', 'ca100000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000003', 'Skincare Review Campaign', 'Beauty blogger skincare review program. Share your honest thoughts about the Vitamin C Serum.', 'pending', '2026-04-20');

-- Add more tasks with different statuses for demo
INSERT INTO public.creator_tasks (id, application_id, campaign_id, creator_id, merchant_id, title, description, status)
VALUES
  ('t1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000003', 'ca100000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000002', 'Earbuds Review Content', 'Post your detailed review of the Wireless Earbuds Pro', 'approved'),
  ('t1000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000004', 'ca100000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000003', 'Skincare Demo Video', 'Create a skincare routine video featuring the products', 'rejected');

-- ============================================================
-- ROUND 3: Contents
-- ============================================================
INSERT INTO public.creator_contents (id, task_id, creator_id, campaign_id, platform, content_url, content_title, content_description, posted_at, disclosure_checked, status, rejection_reason)
VALUES
  -- Submitted content (pending review)
  ('cc100000-0000-0000-0000-000000000001', 't1000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000004', 'ca100000-0000-0000-0000-000000000002', 'TikTok', 'https://tiktok.com/@alicecreator/video/1234567890', 'Wireless Earbuds Unboxing 🎧', 'First look at these amazing earbuds! The ANC is incredible #ad #gifted', '2026-03-25 14:30:00', true, 'pending', null),
  -- Approved content
  ('cc100000-0000-0000-0000-000000000002', 't1000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000004', 'ca100000-0000-0000-0000-000000000002', 'YouTube', 'https://youtube.com/watch?v=abcdef1234', 'Honest Earbuds Review - Worth It?', 'Detailed review of the Wireless Earbuds Pro after 2 weeks of use #ad #sponsored', '2026-03-20 10:00:00', true, 'approved', null),
  -- Rejected content
  ('cc100000-0000-0000-0000-000000000003', 't1000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000005', 'ca100000-0000-0000-0000-000000000003', 'Instagram', 'https://instagram.com/p/rejectedcontent', 'Skincare Routine 🌟', 'My morning skincare routine featuring vitamin c serum', '2026-03-22 18:00:00', false, 'rejected', 'Content does not clearly disclose the #gifted relationship as required by FTC guidelines. Please revise and resubmit.');

-- More pending content for demo variety
INSERT INTO public.creator_contents (id, task_id, creator_id, campaign_id, platform, content_url, content_title, content_description, posted_at, disclosure_checked, status)
VALUES
  ('cc100000-0000-0000-0000-000000000004', 't1000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000005', 'ca100000-0000-0000-0000-000000000003', 'YouTube', 'https://youtube.com/watch?v=xyz789', 'Vitamin C Serum Review ✨', 'My honest thoughts after 4 weeks #ad #gifted', '2026-03-26 09:00:00', true, 'pending');
