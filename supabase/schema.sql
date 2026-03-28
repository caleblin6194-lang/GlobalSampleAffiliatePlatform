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
