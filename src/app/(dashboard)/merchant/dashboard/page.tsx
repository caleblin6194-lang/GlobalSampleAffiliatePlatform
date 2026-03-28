import { createClient } from "@/lib/supabase/server";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package, Megaphone, ShoppingBag, TrendingUp, Plus } from "lucide-react";
import Link from "next/link";

export default async function MerchantDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user?.id)
    .single();

  const { count: totalProducts } = await supabase
    .from("products")
    .select("*", { count: "exact", head: true })
    .eq("merchant_id", user?.id);

  const { count: activeCampaigns } = await supabase
    .from("campaigns")
    .select("*", { count: "exact", head: true })
    .eq("merchant_id", user?.id)
    .eq("status", "active");

  const { count: totalSamples } = await supabase
    .from("campaigns")
    .select("sample_qty", { count: "exact", head: true })
    .eq("merchant_id", user?.id);

  const { data: recentCampaigns } = await supabase
    .from("campaigns")
    .select(`
      id, title, sample_qty, commission_rate, status, created_at,
      product:products(title)
    `)
    .eq("merchant_id", user?.id)
    .order("created_at", { ascending: false })
    .limit(5);

  const { data: recentProducts } = await supabase
    .from("products")
    .select("id, title, category, status, created_at")
    .eq("merchant_id", user?.id)
    .order("created_at", { ascending: false })
    .limit(5);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome back, {profile?.full_name || "Merchant"}
          </h1>
          <p className="text-muted-foreground">Manage your brands, products, and campaigns</p>
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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Products"
          value={totalProducts || 0}
          icon={Package}
        />
        <StatCard
          title="Active Campaigns"
          value={activeCampaigns || 0}
          icon={Megaphone}
        />
        <StatCard
          title="Total Samples"
          value={totalSamples || 0}
          icon={ShoppingBag}
        />
        <StatCard
          title="Avg. Commission"
          value="15%"
          icon={TrendingUp}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Campaigns</CardTitle>
            <CardDescription>Your latest campaign activity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentCampaigns?.map((campaign) => (
                <div key={campaign.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{campaign.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {(campaign.product as unknown as { title: string })?.title || "No product"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-medium">{campaign.sample_qty} samples</p>
                    <p className="text-xs text-muted-foreground">{campaign.commission_rate}% commission</p>
                  </div>
                </div>
              ))}
              {(!recentCampaigns || recentCampaigns.length === 0) && (
                <p className="text-sm text-muted-foreground">No campaigns yet</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Products</CardTitle>
            <CardDescription>Your product catalog</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentProducts?.map((product) => (
                <div key={product.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{product.title}</p>
                    <p className="text-xs text-muted-foreground">{product.category}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    product.status === "active" ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"
                  }`}>
                    {product.status}
                  </span>
                </div>
              ))}
              {(!recentProducts || recentProducts.length === 0) && (
                <p className="text-sm text-muted-foreground">No products yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
