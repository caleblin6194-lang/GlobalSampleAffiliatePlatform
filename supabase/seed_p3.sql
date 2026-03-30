-- Part 8: Campaign Applications
INSERT INTO public.campaign_applications (id, campaign_id, creator_id, shipping_name, phone, country, state, city, address_line1, postal_code, selected_platform, notes, status)
VALUES
  ('a1000000-0000-0000-0000-000000000001', 'ca100000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000004', 'Alice Creator', '+1234567890', 'United States', 'California', 'Los Angeles', '123 Main St', '90001', 'Instagram', 'I love tech products!', 'pending'),
  ('a1000000-0000-0000-0000-000000000002', 'ca100000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000005', 'Charlie Tube', '+1987654321', 'United Kingdom', 'England', 'London', '456 Oxford St', 'W1D 1BS', 'YouTube', 'My audience loves tech reviews', 'pending'),
  ('a1000000-0000-0000-0000-000000000003', 'ca100000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000004', 'Alice Creator', '+1234567890', 'United States', 'California', 'Los Angeles', '789 Sunset Blvd', '90028', 'TikTok', 'Perfect for my tech TikToks', 'approved'),
  ('a1000000-0000-0000-0000-000000000004', 'ca100000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000005', 'Charlie Tube', '+1987654321', 'United Kingdom', 'England', 'Manchester', '101 King St', 'M1 1AB', 'Instagram', 'Skincare is my niche', 'approved');

-- Part 9: Creator Tasks
INSERT INTO public.creator_tasks (id, application_id, campaign_id, creator_id, merchant_id, title, description, status, due_at)
VALUES
  ('t1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000003', 'ca100000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000002', 'Earbuds Unboxing Program', 'Creative unboxing content on TikTok. Create an engaging 30-60 second video showcasing the product features.', 'submitted', '2026-04-15'),
  ('t1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000004', 'ca100000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000003', 'Skincare Review Campaign', 'Beauty blogger skincare review program. Share your honest thoughts about the Vitamin C Serum.', 'pending', '2026-04-20');

INSERT INTO public.creator_tasks (id, application_id, campaign_id, creator_id, merchant_id, title, description, status)
VALUES
  ('t1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000003', 'ca100000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000002', 'Earbuds Review Content', 'Post your detailed review of the Wireless Earbuds Pro', 'approved'),
  ('t1000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000004', 'ca100000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000003', 'Skincare Demo Video', 'Create a skincare routine video featuring the products', 'rejected');

-- Part 10: Creator Contents
INSERT INTO public.creator_contents (id, task_id, creator_id, campaign_id, platform, content_url, content_title, content_description, posted_at, disclosure_checked, status, rejection_reason)
VALUES
  ('cc100000-0000-0000-0000-000000000001', 't1000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000004', 'ca100000-0000-0000-0000-000000000002', 'TikTok', 'https://tiktok.com/@alicecreator/video/1234567890', 'Wireless Earbuds Unboxing', 'First look at these amazing earbuds! The ANC is incredible #ad #gifted', '2026-03-25 14:30:00', true, 'pending', null),
  ('cc100000-0000-0000-0000-000000000002', 't1000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000004', 'ca100000-0000-0000-0000-000000000002', 'YouTube', 'https://youtube.com/watch?v=abcdef1234', 'Honest Earbuds Review - Worth It?', 'Detailed review of the Wireless Earbuds Pro after 2 weeks of use #ad #sponsored', '2026-03-20 10:00:00', true, 'approved', null),
  ('cc100000-0000-0000-0000-000000000003', 't1000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000005', 'ca100000-0000-0000-0000-000000000003', 'Instagram', 'https://instagram.com/p/rejectedcontent', 'Skincare Routine', 'My morning skincare routine featuring vitamin c serum', '2026-03-22 18:00:00', false, 'rejected', 'Content does not clearly disclose the #gifted relationship as required by FTC guidelines. Please revise and resubmit.');

INSERT INTO public.creator_contents (id, task_id, creator_id, campaign_id, platform, content_url, content_title, content_description, posted_at, disclosure_checked, status)
VALUES
  ('cc100000-0000-0000-0000-000000000004', 't1000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000005', 'ca100000-0000-0000-0000-000000000003', 'YouTube', 'https://youtube.com/watch?v=xyz789', 'Vitamin C Serum Review', 'My honest thoughts after 4 weeks #ad #gifted', '2026-03-26 09:00:00', true, 'pending');
