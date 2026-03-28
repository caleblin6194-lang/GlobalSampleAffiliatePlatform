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

-- ============================================================
-- ROUND 4: Affiliate Links, Coupons, Clicks, Orders, Commissions
-- ============================================================

-- Affiliate Links (one per creator per campaign)
INSERT INTO public.affiliate_links (id, creator_id, campaign_id, code, target_path, is_active)
VALUES
  ('l1000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000004', 'ca100000-0000-0000-0000-000000000002', 'ALICE-EARB-2024', '/campaigns/ca100000-0000-0000-0000-000000000002', true),
  ('l1000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000005', 'ca100000-0000-0000-0000-000000000003', 'CHARLIE-SKINC-2024', '/campaigns/ca100000-0000-0000-0000-000000000003', true),
  ('l1000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000004', 'ca100000-0000-0000-0000-000000000001', 'ALICE-IPHONE-2024', '/campaigns/ca100000-0000-0000-0000-000000000001', true);

-- Coupon Codes (some creator-specific, some general)
INSERT INTO public.coupon_codes (id, creator_id, campaign_id, code, discount_type, discount_value, is_active)
VALUES
  -- Creator-specific coupons
  ('cp100000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000004', 'ca100000-0000-0000-0000-000000000002', 'ALICE20', 'percent', 20.00, true),
  ('cp100000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000005', 'ca100000-0000-0000-0000-000000000003', 'CHARLIE15', 'percent', 15.00, true),
  -- General campaign coupons
  (NULL, NULL, 'ca100000-0000-0000-0000-000000000002', 'EARBUDS10', 'percent', 10.00, true),
  (NULL, NULL, 'ca100000-0000-0000-0000-000000000003', 'SKINCARE25', 'percent', 25.00, true),
  (NULL, NULL, 'ca100000-0000-0000-0000-000000000001', 'CASE5OFF', 'fixed', 5.00, true);

-- Clicks
INSERT INTO public.clicks (affiliate_link_id, creator_id, campaign_id, referrer, user_agent, created_at)
VALUES
  ('l1000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000004', 'ca100000-0000-0000-0000-000000000002', 'https://instagram.com/', 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)', '2026-03-20 10:00:00'),
  ('l1000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000004', 'ca100000-0000-0000-0000-000000000002', 'https://tiktok.com/', 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)', '2026-03-21 14:30:00'),
  ('l1000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000004', 'ca100000-0000-0000-0000-000000000002', NULL, 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', '2026-03-22 09:15:00'),
  ('l1000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000005', 'ca100000-0000-0000-0000-000000000003', 'https://instagram.com/', 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)', '2026-03-20 11:00:00'),
  ('l1000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000005', 'ca100000-0000-0000-0000-000000000003', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', '2026-03-21 16:45:00'),
  ('l1000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000004', 'ca100000-0000-0000-0000-000000000001', 'https://twitter.com/', 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)', '2026-03-23 08:30:00');

-- Orders
INSERT INTO public.orders (id, campaign_id, creator_id, affiliate_link_id, coupon_code_id, customer_name, customer_email, customer_phone, amount, status, attribution_source, created_at)
VALUES
  -- Paid orders with affiliate attribution
  ('o1000000-0000-0000-0000-000000000001', 'ca100000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000004', 'l1000000-0000-0000-0000-000000000001', 'cp100000-0000-0000-0000-000000000001', 'John Smith', 'john@email.com', '+1234567890', 129.99, 'paid', 'link', '2026-03-24 10:00:00'),
  ('o1000000-0000-0000-0000-000000000002', 'ca100000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000005', 'l1000000-0000-0000-0000-000000000002', 'cp100000-0000-0000-0000-000000000002', 'Emma Wilson', 'emma@email.com', '+1987654321', 89.50, 'paid', 'link', '2026-03-25 14:30:00'),
  -- Paid order with coupon attribution
  ('o1000000-0000-0000-0000-000000000003', 'ca100000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000004', NULL, 'cp100000-0000-0000-0000-000000000001', 'Lisa Chen', 'lisa@email.com', '+1122334455', 149.00, 'paid', 'coupon', '2026-03-26 09:15:00'),
  -- Pending order
  ('o1000000-0000-0000-0000-000000000004', 'ca100000-0000-0000-0000-000000000001', NULL, NULL, NULL, 'Mike Brown', 'mike@email.com', '+1555666777', 79.99, 'pending', 'none', '2026-03-27 11:00:00'),
  -- Cancelled order
  ('o1000000-0000-0000-0000-000000000005', 'ca100000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000004', 'l1000000-0000-0000-0000-000000000001', NULL, 'Tom Davis', 'tom@email.com', '+1888999000', 99.99, 'cancelled', 'link', '2026-03-26 16:00:00'),
  -- Refunded order
  ('o1000000-0000-0000-0000-000000000006', 'ca100000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000005', 'l1000000-0000-0000-0000-000000000002', NULL, 'Sarah Johnson', 'sarah@email.com', '+1666777888', 199.00, 'refunded', 'link', '2026-03-25 10:00:00');

-- Order Items
INSERT INTO public.order_items (order_id, product_id, variant_id, qty, unit_price)
VALUES
  ('o1000000-0000-0000-0000-000000000001', 'p1000000-0000-0000-0000-000000000002', NULL, 1, 129.99),
  ('o1000000-0000-0000-0000-000000000002', 'p1000000-0000-0000-0000-000000000003', NULL, 2, 44.75),
  ('o1000000-0000-0000-0000-000000000003', 'p1000000-0000-0000-0000-000000000002', NULL, 1, 149.00),
  ('o1000000-0000-0000-0000-000000000004', 'p1000000-0000-0000-0000-000000000001', NULL, 1, 79.99),
  ('o1000000-0000-0000-0000-000000000005', 'p1000000-0000-0000-0000-000000000002', NULL, 1, 99.99),
  ('o1000000-0000-0000-0000-000000000006', 'p1000000-0000-0000-0000-000000000003', NULL, 1, 199.00);

-- Commissions (auto-generated when orders paid, but also insert manually for demo)
INSERT INTO public.commissions (id, order_id, creator_id, campaign_id, amount, rate, status, created_at)
VALUES
  ('cm100000-0000-0000-0000-000000000001', 'o1000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000004', 'ca100000-0000-0000-0000-000000000002', 25.99, 20.00, 'pending', '2026-03-24 10:00:00'),
  ('cm100000-0000-0000-0000-000000000002', 'o1000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000005', 'ca100000-0000-0000-0000-000000000003', 11.19, 12.50, 'pending', '2026-03-25 14:30:00'),
  ('cm100000-0000-0000-0000-000000000003', 'o1000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000004', 'ca100000-0000-0000-0000-000000000002', 29.80, 20.00, 'approved', '2026-03-26 09:15:00'),
  ('cm100000-0000-0000-0000-000000000004', 'o1000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000005', 'ca100000-0000-0000-0000-000000000003', 24.88, 12.50, 'void', '2026-03-25 10:00:00');

-- ============================================================
-- ROUND 5: Fulfillment Orders & Shipments
-- ============================================================

-- Fulfillment Orders (sample type - from approved applications)
INSERT INTO public.fulfillment_orders (id, application_id, campaign_id, merchant_id, vendor_id, creator_id, order_type, customer_name, phone, country, state, city, address_line1, postal_code, status, created_at)
VALUES
  ('f1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000003', 'ca100000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', 'v1000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000004', 'sample', 'Alice Creator', '+1234567890', 'United States', 'California', 'Los Angeles', '789 Sunset Blvd', '90028', 'pending_pick', '2026-03-25 10:00:00'),
  ('f1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000004', 'ca100000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000003', 'v1000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000005', 'sample', 'Charlie Tube', '+1987654321', 'United Kingdom', 'England', 'Manchester', '101 King St', 'M1 1AB', 'picking', '2026-03-25 11:00:00'),
  ('f1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000003', 'ca100000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', 'v1000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000004', 'sample', 'Alice Creator', '+1234567890', 'United States', 'California', 'Los Angeles', '789 Sunset Blvd', '90028', 'packed', '2026-03-26 09:00:00'),
  ('f1000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000004', 'ca100000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000003', 'v1000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000005', 'sample', 'Charlie Tube', '+1987654321', 'United Kingdom', 'England', 'London', '456 Oxford St', 'W1D 1BS', 'shipped', '2026-03-27 10:00:00');

-- Fulfillment Orders (sales type - from paid orders)
INSERT INTO public.fulfillment_orders (id, order_id, campaign_id, merchant_id, vendor_id, creator_id, order_type, customer_name, phone, country, state, city, address_line1, postal_code, status, created_at)
VALUES
  ('f1000000-0000-0000-0000-000000000005', 'o1000000-0000-0000-0000-000000000001', 'ca100000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', 'v1000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000004', 'sales', 'John Smith', '+1234567890', 'United States', 'California', 'Los Angeles', '123 Main St', '90001', 'pending_pick', '2026-03-24 10:00:00'),
  ('f1000000-0000-0000-0000-000000000006', 'o1000000-0000-0000-0000-000000000002', 'ca100000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000003', 'v1000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000005', 'sales', 'Emma Wilson', '+1987654321', 'United Kingdom', 'England', 'London', '789 Queen St', 'SW1A 1AA', 'delivered', '2026-03-25 14:30:00'),
  ('f1000000-0000-0000-0000-000000000007', 'o1000000-0000-0000-0000-000000000003', 'ca100000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', 'v1000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000004', 'sales', 'Lisa Chen', '+1122334455', 'United States', 'New York', 'New York', '456 Broadway', '10001', 'picking', '2026-03-26 09:15:00');

-- Shipments
INSERT INTO public.shipments (id, fulfillment_order_id, carrier, tracking_no, shipped_at, status)
VALUES
  ('s1000000-0000-0000-0000-000000000001', 'f1000000-0000-0000-0000-000000000004', 'DHL', 'DHL123456789', '2026-03-27 10:00:00', 'in_transit'),
  ('s1000000-0000-0000-0000-000000000002', 'f1000000-0000-0000-0000-000000000006', 'FedEx', 'FX789012345', '2026-03-25 15:00:00', 'delivered');
