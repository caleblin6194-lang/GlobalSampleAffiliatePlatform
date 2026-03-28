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
2. This creates all tables, triggers, and RLS policies for Rounds 1-5:
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
   - `fulfillment_orders` — vendor fulfillment tracking (Round 5)
   - `shipments` — shipment tracking with carrier & tracking no (Round 5)

### Step 3: Verify Triggers

After running schema.sql, verify these triggers exist:

1. Go to Supabase Dashboard → Database → Triggers
2. You should see:
   - **`on_auth_user_created`** on `auth.users`
   - **`on_application_approved_create_task`** on `campaign_applications` (Round 3)
   - **`on_order_paid_generate_commission`** on `orders` (Round 4)
   - **`on_application_approved_create_sample_fulfillment`** on `campaign_applications` (Round 5)
   - **`on_order_paid_create_sales_fulfillment`** on `orders` (Round 5)

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

### Round 4 (Affiliate & Commissions)
- **Affiliate links** — Unique tracking links per creator per campaign
- **Coupon codes** — Discount codes (creator-specific or general)
- **Click tracking** — `/track/[code]` records clicks then redirects
- **Order attribution** — Orders linked to creator via link or coupon
- **Auto-commission** — Paid orders generate commissions automatically
- **Merchant analytics** — Campaign-level clicks, orders, conversion rate
- **Creator earnings** — Dashboard showing links, clicks, commissions

### Round 5 (Vendor Fulfillment) ⭐ Current
- **Fulfillment orders** — Sample & sales fulfillment tracking
- **Auto-fulfillment creation** — Sample from approved apps, sales from paid orders
- **Vendor dashboard** — Order picking, packing, shipping workflow
- **Shipment tracking** — Carrier + tracking number management
- **Barcode display** — Barcode codes shown for each item (HQB-format)
- **Merchant fulfillment view** — Track all campaign fulfillment status

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
│   │   │   ├── fulfillment/    # Round 5: Fulfillment tracking
│   │   │   └── analytics/     # Round 4: Campaign analytics
│   │   └── vendor/
│   │       ├── orders/        # Round 5: Fulfillment orders
│   │       └── shipments/     # Round 5: Shipment tracking
│   ├── api/              # API routes
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
- **Email notifications** — Manual updates only
- **Real barcode scanning hardware** — Barcode display only, no scanner integration
- **Multi-language** — English only

---

## Complete Workflow Summary

### Sample Flow (Round 2 → 3 → 5)
1. Creator applies to campaign → `/creator/campaigns/[id]/apply`
2. Merchant approves → Task auto-created + Sample Fulfillment auto-created
3. Creator submits content → `/creator/tasks/[id]`
4. Vendor picks & ships → `/vendor/orders/[id]`
5. Merchant tracks → `/merchant/fulfillment`

### Sales Flow (Round 4 → 5)
1. Creator promotes with affiliate link → `/creator/earnings`
2. Customer clicks track link → `/track/[code]` → Records click
3. Merchant creates simulated order → `/merchant/orders/new`
4. Order marked paid → Commission auto-generated + Sales Fulfillment auto-created
5. Vendor picks & ships → `/vendor/orders/[id]`
6. Merchant tracks → `/merchant/fulfillment`

### Creator Earnings Flow (Round 4)
1. Creator views links & coupons → `/creator/earnings`
2. Creator tracks clicks, orders, commissions
3. Commission generated when order paid
