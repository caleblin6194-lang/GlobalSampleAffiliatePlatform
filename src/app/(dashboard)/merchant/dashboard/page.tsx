import { createClient } from "@/lib/supabase/server";
import { StatCard } from "@/components/dashboard/stat-card";
import { MerchantOnboarding } from "@/components/dashboard/onboarding-merchant";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Package, Megaphone, ShoppingBag, TrendingUp, Plus, MousePointer, ShoppingCart, DollarSign, Truck, CheckCircle } from "lucide-react";
import Link from "next/link";

export default async function MerchantDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user?.id)
    .single();

  // Get merchant's campaigns
  const { data: campaigns } = await supabase
    .from("campaigns")
    .select("id, title")
    .eq("merchant_id", user?.id);

  const campaignIds = campaigns?.map(c => c.id) || [];

  // Products & Campaigns stats
  const { count: totalProducts } = await supabase
    .from("products")
    .select("*", { count: "exact", head: true })
    .eq("merchant_id", user?.id);

  const { count: activeCampaigns } = await supabase
    .from("campaigns")
    .select("*", { count: "exact", head: true })
    .eq("merchant_id", user?.id)
    .eq("status", "active");

  // Round 4: Affiliate stats
  let totalClicks = 0;
  let totalOrders = 0;
  let paidOrders = 0;
  let totalCommissionCost = 0;

  if (campaignIds.length > 0) {
    // Clicks
    const { count: clicks } = await supabase
      .from("clicks")
      .select("*", { count: "exact", head: true })
      .in("campaign_id", campaignIds);
    totalClicks = clicks || 0;

    // Orders
    const { data: ordersData } = await supabase
      .from("orders")
      .select("id, status, amount")
      .in("campaign_id", campaignIds);
    
    totalOrders = ordersData?.length || 0;
    paidOrders = ordersData?.filter(o => o.status === 'paid').length || 0;

    // Commission cost (from paid orders)
    const paidOrderIds = ordersData?.filter(o => o.status === 'paid').map(o => o.id) || [];
    if (paidOrderIds.length > 0) {
      const { data: commissions } = await supabase
        .from("commissions")
        .select("amount")
        .in("order_id", paidOrderIds)
        .eq("status", "approved");
      totalCommissionCost = commissions?.reduce((sum, c) => sum + (c.amount || 0), 0) || 0;
    }
  }

  // Round 5: Fulfillment stats
  let pendingFulfillment = 0;
  let shippedFulfillment = 0;
  let deliveredFulfillment = 0;

  if (campaignIds.length > 0) {
    const { data: fulfillmentData } = await supabase
      .from("fulfillment_orders")
      .select("status")
      .in("campaign_id", campaignIds);

    pendingFulfillment = fulfillmentData?.filter(o => ['pending_pick', 'picking', 'packed'].includes(o.status)).length || 0;
    shippedFulfillment = fulfillmentData?.filter(o => o.status === 'shipped').length || 0;
    deliveredFulfillment = fulfillmentData?.filter(o => o.status === 'delivered').length || 0;
  }

  // Recent data
  const { data: recentCampaigns } = await supabase
    .from("campaigns")
    .select(`
      id, title, sample_qty, commission_rate, status, created_at,
      product:products(title)
    `)
    .eq("merchant_id", user?.id)
    .order("created_at", { ascending: false })
    .limit(5);

  const { data: recentOrders } = await supabase
    .from("orders")
    .select(`
      id, customer_name, amount, status, created_at,
      campaign:campaigns(title)
    `)
    .in("campaign_id", campaignIds)
    .order("created_at", { ascending: false })
    .limit(5);

  const { data: recentFulfillment } = await supabase
    .from("fulfillment_orders")
    .select(`
      id, order_type, status, customer_name, created_at,
      campaign:campaigns(title),
      vendor:vendors(vendor_name)
    `)
    .in("campaign_id", campaignIds)
    .order("created_at", { ascending: false })
    .limit(5);

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-700",
    paid: "bg-green-100 text-green-700",
    cancelled: "bg-red-100 text-red-700",
    refunded: "bg-red-100 text-red-700",
    pending_pick: "bg-yellow-100 text-yellow-700",
    picking: "bg-blue-100 text-blue-700",
    packed: "bg-purple-100 text-purple-700",
    shipped: "bg-indigo-100 text-indigo-700",
    delivered: "bg-green-100 text-green-700",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome back, {profile?.full_name || "Merchant"}
          </h1>
          <p className="text-muted-foreground">Your business overview at a glance</p>
        </div>
        <div className="flex gap-2">
          <Link href="/merchant/products/new">
            <Button><Plus className="mr-2 h-4 w-4" /> Add Product</Button>
          </Link>
          <Link href="/merchant/campaigns/new">
            <Button variant="outline"><Megaphone className="mr-2 h-4 w-4" /> New Campaign</Button>
          </Link>
        </div>
      </div>

      {/* Core Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Products" value={totalProducts || 0} icon={Package} />
        <StatCard title="Active Campaigns" value={activeCampaigns || 0} icon={Megaphone} />
        <StatCard title="Pending Fulfillment" value={pendingFulfillment} icon={Truck} className={pendingFulfillment > 0 ? "border-yellow-300" : ""} />
        <StatCard title="Total Clicks" value={totalClicks} icon={MousePointer} />
      </div>

      {/* Affiliate & Sales Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Orders" value={totalOrders} icon={ShoppingCart} />
        <StatCard title="Paid Orders" value={paidOrders} icon={CheckCircle} className={paidOrders > 0 ? "border-green-300" : ""} />
        <StatCard title="Shipped" value={shippedFulfillment} icon={Truck} />
        <StatCard title="Commission Cost" value={`$${totalCommissionCost.toFixed(2)}`} icon={DollarSign} />
      </div>

      {/* New Merchant Onboarding */}
      {totalProducts === 0 && (campaigns?.length ?? 0) === 0 && (
        <MerchantOnboarding />
      )}

      {/* Quick Links */}
      <div className="grid gap-4 md:grid-cols-4">
        <Link href="/merchant/applications">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{">"}</div>
              <p className="text-sm text-muted-foreground">Review Applications</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/merchant/content">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{">"}</div>
              <p className="text-sm text-muted-foreground">Review Content</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/merchant/analytics">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{">"}</div>
              <p className="text-sm text-muted-foreground">View Analytics</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/merchant/fulfillment">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{">"}</div>
              <p className="text-sm text-muted-foreground">Track Fulfillment</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Recent Orders */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Orders</CardTitle>
              <CardDescription>Latest customer orders</CardDescription>
            </div>
            <Link href="/merchant/orders">
              <Button variant="ghost" size="sm">View All</Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentOrders && recentOrders.length > 0 ? recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{order.customer_name}</p>
                    <p className="text-xs text-muted-foreground truncate max-w-[150px]">
                      {(order.campaign as unknown as { title: string })?.title}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">${order.amount?.toFixed(2)}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[order.status] || "bg-muted"}`}>
                      {order.status}
                    </span>
                  </div>
                </div>
              )) : (
                <div className="text-center py-8 text-muted-foreground">
                  <ShoppingCart className="mx-auto h-10 w-10 text-muted-foreground/30 mb-2" />
                  <p className="text-sm">No orders yet</p>
                  <p className="text-xs">Create orders from the Orders page</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Fulfillment */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Fulfillment Status</CardTitle>
              <CardDescription>Shipping progress</CardDescription>
            </div>
            <Link href="/merchant/fulfillment">
              <Button variant="ghost" size="sm">View All</Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentFulfillment && recentFulfillment.length > 0 ? recentFulfillment.map((fulfillment) => (
                <div key={fulfillment.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium capitalize">{fulfillment.order_type}</p>
                    <p className="text-xs text-muted-foreground">To: {fulfillment.customer_name}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[fulfillment.status] || "bg-muted"}`}>
                    {fulfillment.status.replace('_', ' ')}
                  </span>
                </div>
              )) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Truck className="mx-auto h-10 w-10 text-muted-foreground/30 mb-2" />
                  <p className="text-sm">No fulfillment orders</p>
                  <p className="text-xs">Approved samples will auto-create fulfillment</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Campaigns */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Your Campaigns</CardTitle>
            <CardDescription>Active sampling campaigns</CardDescription>
          </div>
          <Link href="/merchant/campaigns">
            <Button variant="ghost" size="sm">View All</Button>
          </Link>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentCampaigns && recentCampaigns.length > 0 ? recentCampaigns.map((campaign) => (
              <div key={campaign.id} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{campaign.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {(campaign.product as unknown as { title: string })?.title || "No product"}
                  </p>
                </div>
                <div className="text-right flex items-center gap-2">
                  <Badge variant={campaign.status === "active" ? "default" : "secondary"}>
                    {campaign.status}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {campaign.sample_qty} samples · {campaign.commission_rate}% commission
                  </span>
                </div>
              </div>
            )) : (
              <div className="text-center py-8 text-muted-foreground">
                <Megaphone className="mx-auto h-10 w-10 text-muted-foreground/30 mb-2" />
                <p className="text-sm">No campaigns yet</p>
                <Link href="/merchant/campaigns/new">
                  <Button size="sm" className="mt-2">Create Campaign</Button>
                </Link>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
