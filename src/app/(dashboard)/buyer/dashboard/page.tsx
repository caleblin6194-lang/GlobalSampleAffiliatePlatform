import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Package, Video, ArrowRight, ExternalLink } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  paid: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
  refunded: "bg-red-100 text-red-700",
};

export default async function BuyerDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  // For now, show a simple welcome + upgrade CTA
  // Buyer orders would come through campaigns they participated in
  const { data: recentOrders } = await supabase
    .from("orders")
    .select(`
      id, customer_name, customer_email, amount, status, created_at,
      campaign:campaigns(title),
      product:campaigns(product:products(title))
    `)
    .eq("customer_email", user.email)
    .order("created_at", { ascending: false })
    .limit(5);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome back, {profile?.full_name || "Shopper"}
          </h1>
          <p className="text-muted-foreground">Your purchases and earning opportunities</p>
        </div>
      </div>

      {/* Become a Creator CTA */}
      <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-indigo-50">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-purple-100 p-3">
                <Video className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Want to earn while you shop?</h3>
                <p className="text-sm text-muted-foreground">
                  Refer products to friends and earn commission on every sale they make.
                </p>
              </div>
            </div>
            <Link href="/become-creator">
              <Button size="lg" className="gap-2">
                Become a Creator <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Quick Links */}
      <div className="grid gap-4 md:grid-cols-3">
        <Link href="/buyer/orders">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
            <CardContent className="pt-6">
              <ShoppingCart className="h-8 w-8 text-primary mb-3" />
              <p className="font-semibold">My Orders</p>
              <p className="text-sm text-muted-foreground">Track your purchases</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/creator/campaigns">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
            <CardContent className="pt-6">
              <Package className="h-8 w-8 text-primary mb-3" />
              <p className="font-semibold">Browse Products</p>
              <p className="text-sm text-muted-foreground">Explore campaigns</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/become-creator">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer border-purple-200">
            <CardContent className="pt-6">
              <Video className="h-8 w-8 text-purple-500 mb-3" />
              <p className="font-semibold">Upgrade to Creator</p>
              <p className="text-sm text-muted-foreground">Start earning commissions</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Orders</CardTitle>
              <CardDescription>Your purchase history</CardDescription>
            </div>
            <Link href="/buyer/orders">
              <Button variant="ghost" size="sm">View All</Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {recentOrders && recentOrders.length > 0 ? (
            <div className="space-y-4">
              {recentOrders.map((order) => {
                const campaign = order.campaign as unknown as { title: string } | null;
                const product = order.product as unknown as { title: string } | null;
                return (
                  <div key={order.id} className="flex items-center justify-between py-3 border-b last:border-0">
                    <div>
                      <p className="font-medium text-sm">{campaign?.title || product?.title || "Order"}</p>
                      <p className="text-xs text-muted-foreground">{order.customer_email}</p>
                    </div>
                    <div className="text-right flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[order.status] || "bg-muted"}`}>
                        {order.status}
                      </span>
                      <span className="text-sm font-medium">${order.amount?.toFixed(2)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <ShoppingCart className="mx-auto h-10 w-10 text-muted-foreground/30 mb-2" />
              <p className="text-sm">No orders yet</p>
              <p className="text-xs">Browse campaigns to find products you love</p>
              <Link href="/creator/campaigns">
                <Button size="sm" className="mt-3">Browse Campaigns</Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
