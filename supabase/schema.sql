-- ============================================================
-- Round 3: Tasks & Content Workflow
-- Application Approved → Task Created → Content Submitted → Content Reviewed
-- ============================================================

-- ============================================================
-- CREATOR TASKS
-- ============================================================
create table if not exists public.creator_tasks (
  id uuid default uuid_generate_v4() primary key,
  application_id uuid references public.campaign_applications(id) on delete cascade unique,
  campaign_id uuid references public.campaigns(id) on delete cascade,
  creator_id uuid references public.profiles(id) on delete cascade,
  merchant_id uuid references public.profiles(id) on delete cascade,
  title text not null,
  description text,
  status text default 'pending' check (status in ('pending', 'submitted', 'approved', 'rejected')),
  due_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Auto-update updated_at
drop trigger if exists on_task_updated on public.creator_tasks;
create trigger on_task_updated
  before update on public.creator_tasks
  for each row execute procedure public.update_updated_at();

-- Indexes for performance
create index if not exists idx_tasks_creator_id on public.creator_tasks(creator_id);
create index if not exists idx_tasks_campaign_id on public.creator_tasks(campaign_id);
create index if not exists idx_tasks_status on public.creator_tasks(status);
create index if not exists idx_tasks_merchant_id on public.creator_tasks(merchant_id);

-- ============================================================
-- CREATOR CONTENTS
-- ============================================================
create table if not exists public.creator_contents (
  id uuid default uuid_generate_v4() primary key,
  task_id uuid references public.creator_tasks(id) on delete cascade unique,
  creator_id uuid references public.profiles(id) on delete cascade,
  campaign_id uuid references public.campaigns(id) on delete cascade,
  platform text not null,
  content_url text not null,
  content_title text,
  content_description text,
  posted_at timestamptz,
  disclosure_checked boolean default false,
  screenshot_url text,
  status text default 'pending' check (status in ('pending', 'approved', 'rejected')),
  rejection_reason text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Auto-update updated_at
drop trigger if exists on_content_updated on public.creator_contents;
create trigger on_content_updated
  before update on public.creator_contents
  for each row execute procedure public.update_updated_at();

-- Indexes for performance
create index if not exists idx_contents_task_id on public.creator_contents(task_id);
create index if not exists idx_contents_creator_id on public.creator_contents(creator_id);
create index if not exists idx_contents_campaign_id on public.creator_contents(campaign_id);
create index if not exists idx_contents_status on public.creator_contents(status);

-- ============================================================
-- RLS POLICIES
-- ============================================================
alter table public.creator_tasks enable row level security;
alter table public.creator_contents enable row level security;

-- CREATOR TASKS RLS
-- Creators can read their own tasks
create policy "Creators can read own tasks" on public.creator_tasks
  for select to authenticated
  using (auth.uid() = creator_id);

-- Creators can update their own tasks (for status changes)
create policy "Creators can update own tasks" on public.creator_tasks
  for update to authenticated
  using (auth.uid() = creator_id);

-- Merchants can read tasks for their campaigns
create policy "Merchants can read tasks for their campaigns" on public.creator_tasks
  for select to authenticated
  using (
    exists (
      select 1 from public.campaigns c
      where c.id = campaign_id and c.merchant_id = auth.uid()
    )
  );

-- Merchants can update tasks for their campaigns (for status changes by content review)
create policy "Merchants can update tasks for their campaigns" on public.creator_tasks
  for update to authenticated
  using (
    exists (
      select 1 from public.campaigns c
      where c.id = campaign_id and c.merchant_id = auth.uid()
    )
  );

-- Admin can read all tasks
create policy "Admin can read all tasks" on public.creator_tasks
  for select to authenticated
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Auto-creation via service role (system)
create policy "Service role can insert tasks" on public.creator_tasks
  for insert to authenticated
  with check (true);

-- CREATOR CONTENTS RLS
-- Creators can read their own contents
create policy "Creators can read own contents" on public.creator_contents
  for select to authenticated
  using (auth.uid() = creator_id);

-- Creators can insert their own contents
create policy "Creators can create own contents" on public.creator_contents
  for insert to authenticated
  with check (auth.uid() = creator_id);

-- Creators can update their own contents (before review)
create policy "Creators can update own contents" on public.creator_contents
  for update to authenticated
  using (auth.uid() = creator_id and status = 'pending');

-- Merchants can read contents for their campaigns
create policy "Merchants can read contents for their campaigns" on public.creator_contents
  for select to authenticated
  using (
    exists (
      select 1 from public.campaigns c
      where c.id = campaign_id and c.merchant_id = auth.uid()
    )
  );

-- Merchants can update contents (for review)
create policy "Merchants can update contents for their campaigns" on public.creator_contents
  for update to authenticated
  using (
    exists (
      select 1 from public.campaigns c
      where c.id = campaign_id and c.merchant_id = auth.uid()
    )
  );

-- Admin can read all contents
create policy "Admin can read all contents" on public.creator_contents
  for select to authenticated
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- ============================================================
-- AUTO-TASK GENERATION TRIGGER
-- When application is approved, automatically create a task
-- ============================================================
create or replace function public.create_task_on_application_approved()
returns trigger as $$
declare
  v_campaign record;
  v_task_exists boolean;
begin
  -- Only proceed if status changed TO approved
  if new.status = 'approved' and old.status = 'pending' then
    -- Check if task already exists for this application
    select exists(
      select 1 from public.creator_tasks where application_id = new.id
    ) into v_task_exists;

    -- Only create if no existing task
    if not v_task_exists then
      -- Get campaign details
      select c.id, c.title, c.description, c.merchant_id, p.full_name
      into v_campaign
      from public.campaigns c
      join public.profiles p on c.merchant_id = p.id
      where c.id = new.campaign_id;

      -- Insert the task
      insert into public.creator_tasks (
        application_id,
        campaign_id,
        creator_id,
        merchant_id,
        title,
        description
      ) values (
        new.id,
        new.campaign_id,
        new.creator_id,
        v_campaign.merchant_id,
        v_campaign.title,
        coalesce(v_campaign.description, 'Complete the content task as discussed.')
      );
    end if;
  end if;

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_application_approved_create_task on public.campaign_applications;
create trigger on_application_approved_create_task
  after update of status on public.campaign_applications
  for each row execute procedure public.create_task_on_application_approved();

-- ============================================================
-- ROUND 4: Affiliate Links, Coupons, Clicks, Orders, Commissions
-- ============================================================

-- ============================================================
-- AFFILIATE LINKS
-- ============================================================
create table if not exists public.affiliate_links (
  id uuid default uuid_generate_v4() primary key,
  creator_id uuid references public.profiles(id) on delete cascade,
  campaign_id uuid references public.campaigns(id) on delete cascade,
  code text not null unique,
  target_path text,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- Each creator+campaign combo has unique code
create unique index if not exists idx_affiliate_links_creator_campaign 
  on public.affiliate_links(creator_id, campaign_id);

alter table public.affiliate_links enable row level security;

-- Creators manage their own links
create policy "Creators manage own affiliate links" on public.affiliate_links
  for all to authenticated using (auth.uid() = creator_id);

-- Merchants can view links for their campaigns
create policy "Merchants can view affiliate links for their campaigns" on public.affiliate_links
  for select to authenticated
  using (
    exists (
      select 1 from public.campaigns c
      where c.id = campaign_id and c.merchant_id = auth.uid()
    )
  );

-- Admin can read all
create policy "Admin can read all affiliate links" on public.affiliate_links
  for select to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- Public can access links by code (for /track/[code])
create policy "Public can view active affiliate links by code" on public.affiliate_links
  for select to authenticated using (is_active = true);

-- ============================================================
-- COUPON CODES
-- ============================================================
create table if not exists public.coupon_codes (
  id uuid default uuid_generate_v4() primary key,
  creator_id uuid references public.profiles(id) on delete set null,
  campaign_id uuid references public.campaigns(id) on delete cascade,
  code text not null,
  discount_type text default 'percent' check (discount_type in ('percent', 'fixed')),
  discount_value decimal(10,2) default 0,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- Creator+campaign+code combo is unique
create unique index if not exists idx_coupon_codes_creator_campaign_code 
  on public.coupon_codes(creator_id, campaign_id, code);

alter table public.coupon_codes enable row security;

-- Creators can view their own coupons
create policy "Creators can view own coupon codes" on public.coupon_codes
  for select to authenticated using (auth.uid() = creator_id or creator_id is null);

-- Creators can manage their own coupons
create policy "Creators can manage own coupon codes" on public.coupon_codes
  for all to authenticated using (auth.uid() = creator_id);

-- Merchants can manage coupons for their campaigns
create policy "Merchants can manage coupons for their campaigns" on public.coupon_codes
  for all to authenticated
  using (
    exists (
      select 1 from public.campaigns c
      where c.id = campaign_id and c.merchant_id = auth.uid()
    )
  );

-- Admin can read all
create policy "Admin can read all coupon codes" on public.coupon_codes
  for select to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- ============================================================
-- CLICKS (Tracking)
-- ============================================================
create table if not exists public.clicks (
  id uuid default uuid_generate_v4() primary key,
  affiliate_link_id uuid references public.affiliate_links(id) on delete set null,
  creator_id uuid references public.profiles(id) on delete set null,
  campaign_id uuid references public.campaigns(id) on delete set null,
  visitor_id text,
  referrer text,
  user_agent text,
  ip_address text,
  created_at timestamptz default now()
);

create index if not exists idx_clicks_affiliate_link_id on public.clicks(affiliate_link_id);
create index if not exists idx_clicks_creator_id on public.clicks(creator_id);
create index if not exists idx_clicks_campaign_id on public.clicks(campaign_id);
create index if not exists idx_clicks_created_at on public.clicks(created_at);

alter table public.clicks enable row level security;

-- Anyone can record clicks (public access)
create policy "Anyone can insert clicks" on public.clicks
  for insert to authenticated with check (true);

-- Public can insert clicks without auth (for tracking)
-- Note: This allows anonymous tracking - adjust as needed

-- Creators can view their own clicks
create policy "Creators can view own clicks" on public.clicks
  for select to authenticated using (auth.uid() = creator_id);

-- Merchants can view clicks for their campaigns
create policy "Merchants can view clicks for their campaigns" on public.clicks
  for select to authenticated
  using (
    exists (
      select 1 from public.campaigns c
      where c.id = campaign_id and c.merchant_id = auth.uid()
    )
  );

-- Admin can read all
create policy "Admin can read all clicks" on public.clicks
  for select to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- ============================================================
-- ORDERS
-- ============================================================
create table if not exists public.orders (
  id uuid default uuid_generate_v4() primary key,
  campaign_id uuid references public.campaigns(id) on delete set null,
  creator_id uuid references public.profiles(id) on delete set null,
  affiliate_link_id uuid references public.affiliate_links(id) on delete set null,
  coupon_code_id uuid references public.coupon_codes(id) on delete set null,
  customer_name text not null,
  customer_email text,
  customer_phone text,
  amount decimal(10,2) default 0,
  status text default 'pending' check (status in ('pending', 'paid', 'cancelled', 'refunded')),
  attribution_source text default 'none' check (attribution_source in ('link', 'coupon', 'manual', 'none')),
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_orders_campaign_id on public.orders(campaign_id);
create index if not exists idx_orders_creator_id on public.orders(creator_id);
create index if not exists idx_orders_status on public.orders(status);
create index if not exists idx_orders_created_at on public.orders(created_at);

-- Auto-update updated_at
drop trigger if exists on_order_updated on public.orders;
create trigger on_order_updated
  before update on public.orders
  for each row execute procedure public.update_updated_at();

alter table public.orders enable row level security;

-- Creators can view orders attributed to them
create policy "Creators can view own attributed orders" on public.orders
  for select to authenticated using (auth.uid() = creator_id);

-- Merchants can view orders for their campaigns
create policy "Merchants can view orders for their campaigns" on public.orders
  for select to authenticated
  using (
    exists (
      select 1 from public.campaigns c
      where c.id = campaign_id and c.merchant_id = auth.uid()
    )
  );

-- Admin can read all
create policy "Admin can read all orders" on public.orders
  for select to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- Merchants can insert orders (for manual entry)
create policy "Merchants can create orders" on public.orders
  for insert to authenticated
  with check (
    exists (
      select 1 from public.campaigns c
      where c.id = campaign_id and c.merchant_id = auth.uid()
    )
  );

-- Merchants can update orders
create policy "Merchants can update orders" on public.orders
  for update to authenticated
  using (
    exists (
      select 1 from public.campaigns c
      where c.id = campaign_id and c.merchant_id = auth.uid()
    )
  );

-- ============================================================
-- ORDER ITEMS
-- ============================================================
create table if not exists public.order_items (
  id uuid default uuid_generate_v4() primary key,
  order_id uuid references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  variant_id uuid references public.product_variants(id) on delete set null,
  qty integer default 1,
  unit_price decimal(10,2) default 0,
  created_at timestamptz default now()
);

create index if not exists idx_order_items_order_id on public.order_items(order_id);

alter table public.order_items enable row level security;

-- Merchants can manage order items for their orders
create policy "Merchants can manage order items" on public.order_items
  for all to authenticated
  using (
    exists (
      select 1 from public.orders o
      join public.campaigns c on o.campaign_id = c.id
      where o.id = order_id and c.merchant_id = auth.uid()
    )
  );

-- Admin can read all
create policy "Admin can read all order items" on public.order_items
  for select to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- ============================================================
-- COMMISSIONS
-- ============================================================
create table if not exists public.commissions (
  id uuid default uuid_generate_v4() primary key,
  order_id uuid references public.orders(id) on delete cascade,
  creator_id uuid references public.profiles(id) on delete cascade,
  campaign_id uuid references public.campaigns(id) on delete cascade,
  amount decimal(10,2) default 0,
  rate decimal(5,2) default 0,
  status text default 'pending' check (status in ('pending', 'approved', 'paid', 'void')),
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_commissions_creator_id on public.commissions(creator_id);
create index if not exists idx_commissions_campaign_id on public.commissions(campaign_id);
create index if not exists idx_commissions_status on public.commissions(status);
create index if not exists idx_commissions_order_id on public.commissions(order_id);

-- Auto-update updated_at
drop trigger if exists on_commission_updated on public.commissions;
create trigger on_commission_updated
  before update on public.commissions
  for each row execute procedure public.update_updated_at();

alter table public.commissions enable row level security;

-- Creators can view their own commissions
create policy "Creators can view own commissions" on public.commissions
  for select to authenticated using (auth.uid() = creator_id);

-- Merchants can view commissions for their campaigns
create policy "Merchants can view commissions for their campaigns" on public.commissions
  for select to authenticated
  using (
    exists (
      select 1 from public.campaigns c
      where c.id = campaign_id and c.merchant_id = auth.uid()
    )
  );

-- Admin can manage all commissions
create policy "Admin can manage all commissions" on public.commissions
  for all to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- ============================================================
-- AUTO-COMMISSION GENERATION TRIGGER
-- When order status changes to 'paid', generate commission
-- ============================================================
create or replace function public.generate_commission_on_order_paid()
returns trigger as $$
declare
  v_campaign record;
  v_commission_amount decimal(10,2);
  v_order record;
begin
  -- Only proceed if status changed TO paid
  if new.status = 'paid' and old.status != 'paid' and new.creator_id is not null then
    -- Get order and campaign details
    select o.id, o.campaign_id, o.amount, o.affiliate_link_id, o.coupon_code_id,
           c.commission_rate
    into v_order
    from public.orders o
    join public.campaigns c on o.campaign_id = c.id
    where o.id = new.id;

    if v_order.campaign_id is not null and v_order.creator_id is not null then
      -- Calculate commission
      v_commission_amount := v_order.amount * (v_order.commission_rate / 100);

      -- Insert commission
      insert into public.commissions (
        order_id,
        creator_id,
        campaign_id,
        amount,
        rate,
        status
      ) values (
        v_order.id,
        v_order.creator_id,
        v_order.campaign_id,
        v_commission_amount,
        v_order.commission_rate,
        'pending'
      );
    end if;
  end if;

  -- If order cancelled or refunded, void pending commissions
  if new.status in ('cancelled', 'refunded') and old.status = 'paid' then
    update public.commissions
    set status = 'void', updated_at = now()
    where order_id = new.id and status = 'pending';
  end if;

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_order_paid_generate_commission on public.orders;
create trigger on_order_paid_generate_commission
  after update of status on public.orders
  for each row execute procedure public.generate_commission_on_order_paid();

-- ============================================================
-- ROUND 5: Vendor Fulfillment & Shipments
-- ============================================================

-- ============================================================
-- FULFILLMENT ORDERS
-- ============================================================
create table if not exists public.fulfillment_orders (
  id uuid default uuid_generate_v4() primary key,
  order_id uuid references public.orders(id) on delete set null,
  application_id uuid references public.campaign_applications(id) on delete set null,
  task_id uuid references public.creator_tasks(id) on delete set null,
  campaign_id uuid references public.campaigns(id) on delete set null,
  merchant_id uuid references public.profiles(id) on delete set null,
  vendor_id uuid references public.vendors(id) on delete set null,
  creator_id uuid references public.profiles(id) on delete set null,
  order_type text not null check (order_type in ('sample', 'sales')),
  customer_name text,
  phone text,
  country text,
  state text,
  city text,
  address_line1 text,
  address_line2 text,
  postal_code text,
  status text default 'pending_pick' check (status in ('pending_pick', 'picking', 'packed', 'shipped', 'delivered', 'cancelled')),
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_fulfillment_orders_vendor_id on public.fulfillment_orders(vendor_id);
create index if not exists idx_fulfillment_orders_order_id on public.fulfillment_orders(order_id);
create index if not exists idx_fulfillment_orders_application_id on public.fulfillment_orders(application_id);
create index if not exists idx_fulfillment_orders_status on public.fulfillment_orders(status);
create index if not exists idx_fulfillment_orders_merchant_id on public.fulfillment_orders(merchant_id);

-- Auto-update updated_at
drop trigger if exists on_fulfillment_updated on public.fulfillment_orders;
create trigger on_fulfillment_updated
  before update on public.fulfillment_orders
  for each row execute procedure public.update_updated_at();

alter table public.fulfillment_orders enable row level security;

-- Vendors can view and manage their assigned orders
create policy "Vendors can view own fulfillment orders" on public.fulfillment_orders
  for select to authenticated using (auth.uid() = vendor_id);

create policy "Vendors can update own fulfillment orders" on public.fulfillment_orders
  for update to authenticated using (auth.uid() = vendor_id);

-- Merchants can view their campaign fulfillment orders
create policy "Merchants can view fulfillment orders for their campaigns" on public.fulfillment_orders
  for select to authenticated
  using (
    exists (
      select 1 from public.campaigns c
      where c.id = campaign_id and c.merchant_id = auth.uid()
    )
  );

-- Creators can view fulfillment orders for their applications
create policy "Creators can view fulfillment orders for own applications" on public.fulfillment_orders
  for select to authenticated using (auth.uid() = creator_id);

-- Admin can manage all
create policy "Admin can manage all fulfillment orders" on public.fulfillment_orders
  for all to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- ============================================================
-- SHIPMENTS
-- ============================================================
create table if not exists public.shipments (
  id uuid default uuid_generate_v4() primary key,
  fulfillment_order_id uuid references public.fulfillment_orders(id) on delete cascade,
  carrier text not null,
  tracking_no text not null,
  shipped_at timestamptz default now(),
  delivered_at timestamptz,
  status text default 'in_transit' check (status in ('in_transit', 'delivered', 'exception')),
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_shipments_fulfillment_order_id on public.shipments(fulfillment_order_id);
create index if not exists idx_shipments_tracking_no on public.shipments(tracking_no);

-- Auto-update updated_at
drop trigger if exists on_shipment_updated on public.shipments;
create trigger on_shipment_updated
  before update on public.shipments
  for each row execute procedure public.update_updated_at();

alter table public.shipments enable row level security;

-- Vendors can manage their shipments
create policy "Vendors can manage own shipments" on public.shipments
  for all to authenticated
  using (
    exists (
      select 1 from public.fulfillment_orders fo
      where fo.id = fulfillment_order_id and fo.vendor_id = auth.uid()
    )
  );

-- Merchants can view shipments for their orders
create policy "Merchants can view shipments for their campaigns" on public.shipments
  for select to authenticated
  using (
    exists (
      select 1 from public.fulfillment_orders fo
      join public.campaigns c on fo.campaign_id = c.id
      where fo.id = fulfillment_order_id and c.merchant_id = auth.uid()
    )
  );

-- Admin can manage all
create policy "Admin can manage all shipments" on public.shipments
  for all to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- ============================================================
-- AUTO FULFILLMENT GENERATION TRIGGERS
-- ============================================================

-- Trigger: Create sample fulfillment when application is approved
create or replace function public.create_sample_fulfillment_on_approved()
returns trigger as $$
declare
  v_product record;
  v_vendor_id uuid;
  v_fulfillment_exists boolean;
begin
  -- Only proceed if status changed TO approved
  if new.status = 'approved' and old.status = 'pending' then
    -- Check if fulfillment already exists
    select exists(
      select 1 from public.fulfillment_orders where application_id = new.id
    ) into v_fulfillment_exists;

    if not v_fulfillment_exists then
      -- Get product and vendor
      select p.vendor_id, p.id, p.title into v_product
      from public.products p
      join public.campaigns c on c.product_id = p.id
      where c.id = new.campaign_id;

      v_vendor_id := v_product.vendor_id;

      -- Create sample fulfillment order
      insert into public.fulfillment_orders (
        application_id,
        task_id,
        campaign_id,
        merchant_id,
        vendor_id,
        creator_id,
        order_type,
        customer_name,
        phone,
        country,
        state,
        city,
        address_line1,
        address_line2,
        postal_code,
        status
      ) values (
        new.id,
        new.task_id,
        new.campaign_id,
        new.merchant_id,
        v_vendor_id,
        new.creator_id,
        'sample',
        new.shipping_name,
        new.phone,
        new.country,
        new.state,
        new.city,
        new.address_line1,
        new.address_line2,
        new.postal_code,
        'pending_pick'
      );
    end if;
  end if;

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_application_approved_create_sample_fulfillment on public.campaign_applications;
create trigger on_application_approved_create_sample_fulfillment
  after update of status on public.campaign_applications
  for each row execute procedure public.create_sample_fulfillment_on_approved();

-- Trigger: Create sales fulfillment when order is paid
create or replace function public.create_sales_fulfillment_on_paid()
returns trigger as $$
declare
  v_product record;
  v_vendor_id uuid;
  v_fulfillment_exists boolean;
begin
  -- Only proceed if status changed TO paid
  if new.status = 'paid' and old.status != 'paid' then
    -- Check if fulfillment already exists
    select exists(
      select 1 from public.fulfillment_orders where order_id = new.id
    ) into v_fulfillment_exists;

    if not v_fulfillment_exists then
      -- Get product from campaign and vendor from product
      select p.vendor_id into v_vendor_id
      from public.products p
      join public.campaigns c on c.product_id = p.id
      where c.id = new.campaign_id;

      -- Create sales fulfillment order
      insert into public.fulfillment_orders (
        order_id,
        campaign_id,
        merchant_id,
        vendor_id,
        creator_id,
        order_type,
        customer_name,
        phone,
        country,
        state,
        city,
        address_line1,
        postal_code,
        status
      ) values (
        new.id,
        new.campaign_id,
        (select merchant_id from public.campaigns where id = new.campaign_id),
        v_vendor_id,
        new.creator_id,
        'sales',
        new.customer_name,
        new.customer_phone,
        'N/A', -- Country not tracked in orders
        'N/A', -- State
        'N/A', -- City
        coalesce(new.customer_email, 'N/A'),
        'N/A'  -- Postal
      );
    end if;
  end if;

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_order_paid_create_sales_fulfillment on public.orders;
create trigger on_order_paid_create_sales_fulfillment
  after update of status on public.orders
  for each row execute procedure public.create_sales_fulfillment_on_paid();
