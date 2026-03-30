-- Part 2: Brands
INSERT INTO public.brands (id, owner_id, name, description, website)
VALUES
  ('b1000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'TechGear Pro', 'Premium tech accessories brand', 'https://techgear.example'),
  ('b1000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000003', 'BeautyBox Co', 'Cosmetic and beauty products', 'https://beautybox.example');

-- Part 3: Creator Channels
INSERT INTO public.creator_channels (id, creator_id, platform, handle, followers)
VALUES
  ('c1000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000004', 'Instagram', '@alicecreator', 45200),
  ('c1000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000004', 'TikTok', '@alicecreator', 128000),
  ('c1000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000005', 'YouTube', '@charlietube', 89000),
  ('c1000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000005', 'Instagram', '@charlietube', 31500);

-- Part 4: Vendors
INSERT INTO public.vendors (id, user_id, vendor_name, market_code, stall_no, contact_whatsapp)
VALUES
  ('v1000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000006', 'Shenzhen Electronics Stall', 'HQB', 'A12', '+8613800138000'),
  ('v1000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000006', 'Guangzhou Beauty Wholesale', 'GZBT', 'B05', '+862000000001');

-- Part 5: Products
INSERT INTO public.products (id, merchant_id, vendor_id, title, description, category, status)
VALUES
  ('p1000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'v1000000-0000-0000-0000-000000000001', 'iPhone 15 Pro Max Case', 'Premium shockproof case for iPhone 15 Pro Max', 'Electronics', 'active'),
  ('p1000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', 'v1000000-0000-0000-0000-000000000001', 'Wireless Earbuds Pro', 'ANC wireless earbuds with 30hr battery', 'Electronics', 'active'),
  ('p1000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000003', 'v1000000-0000-0000-0000-000000000002', 'Vitamin C Serum', '20% Vitamin C Brightening Serum 30ml', 'Beauty', 'active'),
  ('p1000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000003', 'v1000000-0000-0000-0000-000000000002', 'Matte Lipstick Set', '8-color matte lipstick collection', 'Beauty', 'active');

-- Part 6: Product Variants
INSERT INTO public.product_variants (product_id, model, color, series)
VALUES
  ('p1000000-0000-0000-0000-000000000001', 'IP15PM', 'Black', 'SG-PRO'),
  ('p1000000-0000-0000-0000-000000000001', 'IP15PM', 'Navy', 'SG-PRO'),
  ('p1000000-0000-0000-0000-000000000002', 'WEP-2024', 'White', 'AUD-X1'),
  ('p1000000-0000-0000-0000-000000000002', 'WEP-2024', 'Black', 'AUD-X1'),
  ('p1000000-0000-0000-0000-000000000003', 'VITC-20', 'Clear', 'SER-C'),
  ('p1000000-0000-0000-0000-000000000004', 'MLS-8C', 'Red', 'MAT-L');

-- Part 7: Campaigns
INSERT INTO public.campaigns (id, merchant_id, product_id, title, description, sample_qty, commission_rate, status)
VALUES
  ('ca100000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'p1000000-0000-0000-0000-000000000001', 'iPhone Case Review Campaign', 'Send us your honest review on Instagram', 50, 15.00, 'active'),
  ('ca100000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', 'p1000000-0000-0000-0000-000000000002', 'Earbuds Unboxing Program', 'Creative unboxing content on TikTok', 30, 20.00, 'active'),
  ('ca100000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000003', 'p1000000-0000-0000-0000-000000000003', 'Skincare Review Campaign', 'Beauty blogger skincare review program', 100, 12.50, 'active');
