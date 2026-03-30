-- Part 1: Profiles
INSERT INTO public.profiles (id, email, full_name, role)
VALUES ('00000000-0000-0000-0000-000000000001', 'admin@demo.com', 'System Admin', 'admin');

INSERT INTO public.profiles (id, email, full_name, role)
VALUES
  ('00000000-0000-0000-0000-000000000002', 'merchant@demo.com', 'Jane Merchant', 'merchant'),
  ('00000000-0000-0000-0000-000000000003', 'merchant2@demo.com', 'Bob Brands', 'merchant'),
  ('00000000-0000-0000-0000-000000000004', 'creator@demo.com', 'Alice Creator', 'creator'),
  ('00000000-0000-0000-0000-000000000005', 'creator2@demo.com', 'Charlie Tube', 'creator'),
  ('00000000-0000-0000-0000-000000000006', 'vendor@demo.com', 'David Vendor', 'vendor');
