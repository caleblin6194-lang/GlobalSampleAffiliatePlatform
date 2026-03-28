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
2. This creates all tables, triggers, and RLS policies for Rounds 1-4:
   - `profiles` — user profiles with roles
   - `brands` — merchant brand listings
   - `creator_channels` — creator social media channels
   - `vendors` — supplier vendor profiles
   - `products` — product catalog
   - `product_variants` — product variants with auto-generated barcodes
   - `campaigns` — sampling campaigns
   - `campaign_applications` — creator applications (Round 2)
   - `creator_tasks` — tasks auto-generated when application approved (Round 3)
   - `creator_contents` — content submitted by creators (Round 3)
   - `affiliate_links` — unique tracking links per creator per campaign (Round 4)
   - `coupon_codes` — discount codes (Round 4)
   - `clicks` — click tracking records (Round 4)
   - `orders` — customer orders with attribution (Round 4)
   - `order_items` — items within orders (Round 4)
   - `commissions` — auto-generated commissions on paid orders (Round 4)

### Step 3: Verify Triggers

After running schema.sql, verify these triggers exist:

1. Go to Supabase Dashboard → Database → Triggers
2. You should see:
   - **`on_auth_user_created`** on `auth.users`
   - **`on_application_updated`** on `campaign_applications`
   - **`on_application_approved_create_task`** on `campaign_applications` (Round 3)
   - **`on_order_paid_generate_commission`** on `orders` (Round 4)

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

## Feature Rounds

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

### Round 4 (Affiliate & Commissions) ⭐ Current
- **Affiliate links** — Unique tracking links per creator per campaign
- **Coupon codes** — Discount codes (creator-specific or general)
- **Click tracking** — `/track/[code]` records clicks then redirects
- **Order attribution** — Orders linked to creator via link or coupon
- **Auto-commission** — Paid orders generate commissions automatically
- **Merchant analytics** — Campaign-level clicks, orders, conversion rate
- **Creator earnings** — Dashboard showing links, clicks, commissions

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
│   │   │   └── earnings/      # Round 4: Earnings dashboard
│   │   ├── merchant/
│   │   │   ├── content/       # Round 3: Content review
│   │   │   ├── orders/        # Round 4: Order management
│   │   │   └── analytics/     # Round 4: Campaign analytics
│   │   └── vendor/
│   ├── api/              # API routes
│   │   ├── tasks/       # Round 3: Task APIs
│   │   ├── content/      # Round 3: Content APIs
│   │   ├── earnings/     # Round 4: Creator earnings API
│   │   ├── orders/       # Round 4: Order CRUD
│   │   ├── analytics/    # Round 4: Merchant analytics
│   │   └── track/        # Round 4: Click tracking
│   └── track/[code]/    # Round 4: Public tracking landing
└── components/
    ├── dashboard/        # Shared dashboard components
    └── ui/               # shadcn/ui components
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

## What's NOT in This Version

The following are intentionally not implemented to keep the scope focused:

- **Stripe / PayPal payments** — Order simulation only
- **Payouts** — No actual fund transfers
- **Vendor fulfillment** — No shipment tracking
- **File uploads** — URL-based content only
- **Email notifications** — Manual updates only
- **Multi-language** — English only

---

## Workflow Summary

### Complete Creator Flow
1. Creator applies to campaign → `/creator/campaigns/[id]/apply`
2. Merchant approves → Task auto-created → `/creator/tasks`
3. Creator submits content → `/creator/tasks/[id]`
4. Merchant reviews content → `/merchant/content/[id]`
5. **NEW:** Creator promotes with affiliate link → `/creator/earnings`
6. **NEW:** Clicks tracked → `/track/[code]`
7. **NEW:** Orders attributed → Commission auto-generated

### Complete Merchant Flow
1. Create campaign → `/merchant/campaigns/new`
2. Review applications → `/merchant/applications`
3. Review content → `/merchant/content/[id]`
4. **NEW:** Create simulated order → `/merchant/orders/new`
5. **NEW:** Mark order paid → Commission auto-generated
6. **NEW:** View analytics → `/merchant/analytics`
