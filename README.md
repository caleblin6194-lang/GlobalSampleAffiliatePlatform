# Global Sample Affiliate Platform (GSAP)

A Next.js 14 platform connecting brands, content creators, and supplier vendors for product sampling and affiliate marketing.

## Tech Stack

- **Framework:** Next.js 14 (App Router) + TypeScript
- **Styling:** Tailwind CSS + shadcn/ui
- **Backend:** Supabase (Auth + PostgreSQL + Row Level Security + Storage)

---

## Quick Start

```bash
# 1. Clone / extract the project
cd GlobalSampleAffiliatePlatform

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env.local
# Edit .env.local — see Environment Variables section below

# 4. Create Supabase project
# Go to https://supabase.com and create a new project

# 5. Run database schema
# In Supabase Dashboard > SQL Editor, paste and run:
#   → supabase/schema.sql
#   → supabase/seed.sql (optional, for demo data)

# 6. Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Environment Variables

Create `.env.local` in the project root (copy from `.env.example`):

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Find these values in Supabase Dashboard → Project Settings → API.

---

## Supabase Setup Steps

### Step 1: Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up
2. Create a new project (takes ~2 minutes)
3. Copy the **Project URL** and **anon/public key** from Settings → API

### Step 2: Run the Database Schema

In Supabase Dashboard → SQL Editor:

1. Paste and run **`supabase/schema.sql`**
2. This creates all tables, triggers, and RLS policies for Round 1-3:
   - `profiles` — user profiles with roles
   - `brands` — merchant brand listings
   - `creator_channels` — creator social media channels
   - `vendors` — supplier vendor profiles
   - `products` — product catalog
   - `product_variants` — product variants with auto-generated barcodes
   - `campaigns` — sampling campaigns
   - `campaign_applications` — creator applications to campaigns (Round 2)
   - `creator_tasks` — tasks auto-generated when application approved (Round 3)
   - `creator_contents` — content submitted by creators (Round 3)

### Step 3: Verify Triggers

After running schema.sql, verify these triggers exist:

1. Go to Supabase Dashboard → Database → Triggers
2. You should see:
   - **`on_auth_user_created`** on `auth.users`
   - **`on_application_updated`** on `campaign_applications`
   - **`on_application_approved_create_task`** on `campaign_applications`

### Step 4: (Optional) Load Demo Data

In Supabase Dashboard → SQL Editor, paste and run **`supabase/seed.sql`**.

> **Important:** The seed.sql contains commented-out INSERT statements. Before running them, you must first create the demo users in Supabase Dashboard → Authentication → Users → Add User.

---

## Demo Accounts

All demo accounts use password: `Demo1234!`

| Role | Email | Name |
|------|-------|------|
| Admin | admin@demo.com | System Admin |
| Merchant | merchant@demo.com | Jane Merchant |
| Merchant | merchant2@demo.com | Bob Brands |
| Creator | creator@demo.com | Alice Creator |
| Creator | creator2@demo.com | Charlie Tube |
| Vendor | vendor@demo.com | David Vendor |

---

## User Roles

| Role | Dashboard | Description |
|------|----------|-------------|
| `admin` | `/admin/dashboard` | Platform administration |
| `merchant` | `/merchant/dashboard` | Brand & campaign management |
| `creator` | `/creator/dashboard` | Content creator sampling requests |
| `vendor` | `/vendor/dashboard` | Supplier vendor product & inventory management |

---

## Round 3: Content Workflow (Task → Content → Review)

The complete workflow: Application Approved → Task Created → Creator Submits Content → Merchant Reviews

### Creator Flow
1. Creator applies to a campaign → `/creator/campaigns/[id]/apply`
2. Merchant approves application → `/merchant/applications`
3. **Task automatically created** → `/creator/tasks`
4. Creator views task details → `/creator/tasks/[id]`
5. Creator submits content link → `/creator/tasks/[id]`
6. Creator tracks status → `/creator/tasks`

### Merchant Flow
1. Merchant views applications → `/merchant/applications`
2. Merchant approves application → Task auto-created
3. **Merchant reviews content** → `/merchant/content`
4. Merchant approves/rejects → `/merchant/content/[id]`

---

## Project Structure

```
src/
├── app/
│   ├── (auth)/           # Auth pages (login, register)
│   ├── (dashboard)/      # Role-based dashboards
│   │   ├── admin/
│   │   ├── creator/
│   │   │   ├── tasks/         # Round 3: Task list & detail
│   │   │   └── ...
│   │   ├── merchant/
│   │   │   ├── content/       # Round 3: Content review
│   │   │   └── ...
│   │   └── vendor/
│   └── api/              # API routes
│       ├── tasks/       # Round 3: Task APIs
│       └── content/      # Round 3: Content APIs
├── components/
│   ├── dashboard/        # Shared dashboard components
│   └── ui/               # shadcn/ui components
└── lib/
    └── supabase/         # Supabase client setup
```

---

## Development

```bash
# Run type checking
npm run type-check

# Run linting
npm run lint

# Build for production
npm run build
```

---

## Features

### Round 1 (Foundation)
- **Multi-role authentication** — Admin, Merchant, Creator, Vendor
- **Product catalog** — Vendors manage products with barcode-labeled variants
- **Campaign management** — Merchants create and manage sampling campaigns
- **Creator channels** — Creators link social media and request samples
- **Role-based dashboards** — Each role has a dedicated dashboard
- **Row Level Security** — Supabase RLS policies protect data per role

### Round 2 (Applications)
- **Campaign applications** — Creators apply to campaigns with shipping info
- **Merchant review** — Merchants approve/reject applications
- **Status tracking** — Pending → Approved/Rejected workflow

### Round 3 (Content Workflow)
- **Auto task generation** — When application approved, task auto-created
- **Creator task center** — Creators view and manage their tasks
- **Content submission** — Creators submit content links with disclosure
- **Merchant content review** — Merchants approve/reject content
- **Status linkage** — Task and content status stay in sync
- **Admin dashboard** — Content statistics added

---

## What's NOT in This Version (Round 3)

The following are intentionally not implemented to keep the scope focused:

- Affiliate links / referral tracking
- Coupon codes
- Click tracking
- Order attribution
- Commission calculations
- Payouts
- Vendor fulfillment / shipment tracking
- File upload storage (URL-based screenshot only)
- Stripe payments
- Email notifications
