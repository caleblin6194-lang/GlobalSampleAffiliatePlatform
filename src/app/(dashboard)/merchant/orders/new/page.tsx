"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NewOrderPage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(false);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [affiliateLinks, setAffiliateLinks] = useState<any[]>([]);
  const [coupons, setCoupons] = useState<any[]>([]);

  const [campaignId, setCampaignId] = useState("");
  const [creatorId, setCreatorId] = useState("");
  const [affiliateLinkId, setAffiliateLinkId] = useState("");
  const [couponCodeId, setCouponCodeId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [attributionSource, setAttributionSource] = useState("manual");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    // Get campaigns
    const { data: campaignsData } = await supabase
      .from("campaigns")
      .select("id, title, merchant_id")
      .eq("status", "active");

    if (campaignsData) {
      setCampaigns(campaignsData);
    }
  }

  useEffect(() => {
    if (campaignId) {
      fetchAffiliateData();
    }
  }, [campaignId]);

  async function fetchAffiliateData() {
    // Get affiliate links for this campaign
    const { data: links } = await supabase
      .from("affiliate_links")
      .select("id, code, creator_id, creator:profiles!affiliate_links_creator_id_fkey(full_name)")
      .eq("campaign_id", campaignId)
      .eq("is_active", true);

    if (links) {
      setAffiliateLinks(links);
    }

    // Get coupons for this campaign
    const { data: couponData } = await supabase
      .from("coupon_codes")
      .select("id, code, creator_id, creator:profiles!coupon_codes_creator_id_fkey(full_name)")
      .eq("campaign_id", campaignId)
      .eq("is_active", true);

    if (couponData) {
      setCoupons(couponData);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!campaignId || !customerName) {
      setError("Campaign and customer name are required");
      setLoading(false);
      return;
    }

    // Determine attribution
    let finalAttributionSource = attributionSource;
    let finalCreatorId = creatorId || null;

    if (affiliateLinkId) {
      finalAttributionSource = "link";
      const link = affiliateLinks.find((l) => l.id === affiliateLinkId);
      if (link && !finalCreatorId) {
        finalCreatorId = link.creator_id;
      }
    } else if (couponCodeId) {
      finalAttributionSource = "coupon";
      const coupon = coupons.find((c) => c.id === couponCodeId);
      if (coupon && !finalCreatorId) {
        finalCreatorId = coupon.creator_id;
      }
    }

    const response = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        campaign_id: campaignId,
        creator_id: finalCreatorId,
        affiliate_link_id: affiliateLinkId || null,
        coupon_code_id: couponCodeId || null,
        customer_name: customerName,
        customer_email: customerEmail || null,
        customer_phone: customerPhone || null,
        amount: parseFloat(amount) || 0,
        attribution_source: finalAttributionSource,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      setSuccess(true);
      setTimeout(() => {
        router.push("/merchant/orders");
        router.refresh();
      }, 1500);
    } else {
      setError(data.error || "Failed to create order");
    }

    setLoading(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/merchant/orders">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">New Order</h1>
          <p className="text-muted-foreground">Create a simulated order</p>
        </div>
      </div>

      {success && (
        <div className="p-4 bg-green-100 text-green-800 rounded-md">
          Order created successfully! Redirecting...
        </div>
      )}

      {error && (
        <div className="p-4 bg-destructive/10 text-destructive rounded-md">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Customer Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="customerName">
                Customer Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="customerName"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="customerEmail">Email</Label>
                <Input
                  id="customerEmail"
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="customerPhone">Phone</Label>
                <Input
                  id="customerPhone"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Order Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="campaignId">
                Campaign <span className="text-destructive">*</span>
              </Label>
              <select
                id="campaignId"
                value={campaignId}
                onChange={(e) => setCampaignId(e.target.value)}
                required
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">Select campaign</option>
                {campaigns.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="affiliateLinkId">Affiliate Link</Label>
                <select
                  id="affiliateLinkId"
                  value={affiliateLinkId}
                  onChange={(e) => {
                    setAffiliateLinkId(e.target.value);
                    if (e.target.value) setCouponCodeId("");
                  }}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="">None (direct)</option>
                  {affiliateLinks.map((l: any) => (
                    <option key={l.id} value={l.id}>
                      {l.code} ({(l.creator as any)?.full_name})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="couponCodeId">Coupon Code</Label>
                <select
                  id="couponCodeId"
                  value={couponCodeId}
                  onChange={(e) => {
                    setCouponCodeId(e.target.value);
                    if (e.target.value) setAffiliateLinkId("");
                  }}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="">None</option>
                  {coupons.map((c: any) => (
                    <option key={c.id} value={c.id}>
                      {c.code} ({(c.creator as any)?.full_name || "General"})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Order Amount ($)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="attributionSource">Attribution Source</Label>
              <select
                id="attributionSource"
                value={attributionSource}
                onChange={(e) => setAttributionSource(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="manual">Manual</option>
                <option value="link">Affiliate Link</option>
                <option value="coupon">Coupon Code</option>
                <option value="none">None</option>
              </select>
              <p className="text-xs text-muted-foreground">
                Attribution is auto-detected if you select an affiliate link or coupon above.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-2">
          <Button type="submit" disabled={loading}>
            {loading ? "Creating..." : "Create Order (Pending)"}
          </Button>
          <Link href="/merchant/orders">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
        </div>

        <p className="text-xs text-muted-foreground">
          Note: Orders start as "pending". You can mark them as "paid" from the orders list to trigger commission generation.
        </p>
      </form>
    </div>
  );
}
