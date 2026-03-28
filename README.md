# Global Sample Affiliate Platform (GSAP) v5

A complete affiliate marketing platform connecting **Brands**, **Content Creators**, and **Supplier Vendors** — with product sampling, content workflow, affiliate tracking, commission management, and vendor fulfillment.

---

## 🚀 Quick Start

### 1. Clone & Install

```bash
cd GlobalSampleAffiliatePlatform
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env.local
```

Edit `.env.local` with your Supabase credentials:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 3. Setup Supabase Database

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run:

```bash
# Run in order:
supabase/schema.sql      # Creates all tables, triggers, RLS policies
supabase/seed.sql        # Loads demo data (optional)
```

### 4. Create Demo Users

Before running seed.sql, create users in **Supabase Dashboard → Authentication → Users → Add User**:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@demo.com | Demo1234! |
| Merchant | merchant@demo.com | Demo1234! |
| Merchant | merchant2@demo.com | Demo1234! |
| Creator | creator@demo.com | Demo1234! |
| Creator | creator2@demo.com | Demo1234! |
| Vendor | vendor@demo.com | Demo1234! |

> **Important:** The `seed.sql` references these user IDs. Create users first, then run seed.sql.

### 5. Start Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 📱 Demo Walkthrough

### Demo Path 1: Admin (Platform Owner)

**Purpose:** Show platform-wide visibility and management

1. Login as `admin@demo.com`
2. View **Dashboard** — Total users, products, campaigns, clicks, orders, commissions
3. Navigate **Users** — See all platform users
4. Navigate **Platform Stats** — Overview of all activity

---

### Demo Path 2: Merchant (Brand/Seller) ⭐

**Purpose:** Core user for affiliate marketing platform

**Step 1: Setup Products & Campaigns**
1. Login as `merchant@demo.com`
2. Go to **Products** → Add Product (or see existing)
3. Go to **Campaigns** → Create Campaign
   - Set commission rate (e.g., 15%)
   - Set sample quantity

**Step 2: Review Applications**
1. See pending applications from creators
2. Click **Approve** or **Reject**

**Step 3: Review Content**
1. Go to **Content Review**
2. See submitted content from creators
3. **Approve** or **Reject** with reason

**Step 4: Create Orders & Track ROI**
1. Go to **Orders → New Order**
   - Select campaign, customer info
   - Optionally attribute to affiliate link/coupon
2. Mark order as **Paid** → Commission auto-generates
3. Go to **Analytics** → View:
   - Total clicks per campaign
   - Orders and conversion rate
   - Commission costs

**Step 5: Track Fulfillment**
1. Go to **Fulfillment**
2. See all orders (samples & sales) status
3. View shipped/delivered status with tracking

---

### Demo Path 3: Creator (Influencer/Reviewer) ⭐

**Purpose:** Earn by promoting products

**Step 1: Browse & Apply**
1. Login as `creator@demo.com`
2. Go to **Campaigns** → Browse active campaigns
3. Click **Apply** → Fill shipping info

**Step 2: Complete Content Task**
1. Go to **My Tasks** → See assigned tasks
2. Click task → Fill content submission form
3. Paste your content URL (Instagram/TikTok/YouTube)
4. Confirm disclosure checkbox

**Step 3: Earn Commissions**
1. Go to **Earnings**
2. Copy your **Affiliate Link** (e.g., `/track/ALICE-EARB-2024`)
3. Share link on social media
4. When someone orders, commission is earned
5. Track: clicks, orders, pending/approved commissions

---

### Demo Path 4: Vendor (Supplier/Pick & Ship) ⭐

**Purpose:** Fulfill orders from the warehouse

**Step 1: View Fulfillment Orders**
1. Login as `vendor@demo.com`
2. Go to **Orders** → See assigned orders
3. Each order shows:
   - Customer address
   - Product with **barcode code** (e.g., `HQB-A12-SJ-IP15PM-BK`)
   - Order type (sample/sales)

**Step 2: Process Order**
1. Click order → See details
2. Click **Start Picking** → Status: picking
3. Click **Mark as Packed** → Status: packed
4. Click **Ship Package**:
   - Select carrier (DHL, FedEx, UPS, etc.)
   - Enter tracking number
   - Submit → Shipment created

**Step 3: View Shipments**
1. Go to **Shipments**
2. See all shipped packages with tracking

---

## 🔗 Key Features

### Round 1: Foundation
- Multi-role authentication (Admin, Merchant, Creator, Vendor)
- Product catalog with barcode-labeled variants
- Campaign management
- Role-based dashboards

### Round 2: Applications
- Creators apply to campaigns with shipping info
- Merchants approve/reject applications

### Round 3: Content Workflow
- Auto task creation on approval
- Creator task center
- Content submission with disclosure
- Merchant content review

### Round 4: Affiliate & Commissions
- Unique affiliate links per creator/campaign
- Coupon codes
- Click tracking (`/track/[code]`)
- Order attribution
- Auto-commission on paid orders

### Round 5: Vendor Fulfillment
- Sample & sales fulfillment orders
- Pick → Pack → Ship workflow
- Shipment tracking with carrier & tracking number
- Barcode display for warehouse picking

---

## 🏗️ Tech Stack

- **Framework:** Next.js 14 (App Router) + TypeScript
- **Styling:** Tailwind CSS + shadcn/ui
- **Backend:** Supabase (Auth + PostgreSQL + RLS)

---

## 📁 Project Structure

```
GlobalSampleAffiliatePlatform/
├── src/
│   ├── app/
│   │   ├── (auth)/              # Login, Register
│   │   ├── (dashboard)/         # Role-based pages
│   │   │   ├── admin/
│   │   │   ├── creator/
│   │   │   ├── merchant/
│   │   │   └── vendor/
│   │   ├── api/                 # API routes
│   │   └── track/[code]/       # Affiliate tracking
│   ├── components/
│   │   ├── dashboard/
│   │   └── ui/
│   └── lib/
│       └── supabase/
├── supabase/
│   ├── schema.sql               # Database schema
│   └── seed.sql                 # Demo data
└── README.md
```

---

## ⚙️ Database Tables

| Table | Description |
|-------|-------------|
| `profiles` | User profiles with roles |
| `brands` | Merchant brand listings |
| `products` | Product catalog |
| `product_variants` | Variants with auto-generated barcodes |
| `campaigns` | Sampling campaigns |
| `campaign_applications` | Creator applications |
| `creator_tasks` | Auto-generated tasks |
| `creator_contents` | Submitted content |
| `affiliate_links` | Tracking links |
| `coupon_codes` | Discount codes |
| `clicks` | Click tracking |
| `orders` | Customer orders |
| `commissions` | Auto-generated commissions |
| `fulfillment_orders` | Vendor fulfillment |
| `shipments` | Shipment tracking |

---

## 🎯 What's NOT Included (v5)

- Stripe/PayPal payments (order simulation only)
- Payout system
- Email notifications
- Real barcode scanner hardware
- Multi-language

---

## 📄 License

This is a demonstration project for the Global Sample Affiliate Platform concept.
