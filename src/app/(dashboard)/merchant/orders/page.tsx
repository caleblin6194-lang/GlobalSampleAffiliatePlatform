import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Eye, ShoppingBag } from "lucide-react";

const statusColors: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  pending: "secondary",
  paid: "default",
  cancelled: "destructive",
  refunded: "destructive",
};

const statusLabels: Record<string, string> = {
  pending: "Pending",
  paid: "Paid",
  cancelled: "Cancelled",
  refunded: "Refunded",
};

export default async function MerchantOrdersPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return <div>Please login</div>;
  }

  // Get campaigns for filter
  const { data: campaigns } = await supabase
    .from("campaigns")
    .select("id, title")
    .eq("merchant_id", user.id);

  // Get orders
  let query = supabase
    .from("orders")
    .select(
      `
      id, customer_name, customer_email, amount, status, attribution_source,
      created_at,
      campaign:campaigns(id, title),
      creator:profiles!orders_creator_id_fkey(full_name),
      affiliate_link:affiliate_links(code),
      coupon_code:coupon_codes(code)
    `
    )
    .order("created_at", { ascending: false });

  // Filter by merchant's campaigns
  if (campaigns && campaigns.length > 0) {
    query = query.in("campaign_id", campaigns.map((c) => c.id));
  } else {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
          <p className="text-muted-foreground">Manage customer orders</p>
        </div>
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            No campaigns yet. Create a campaign first.
          </CardContent>
        </Card>
      </div>
    );
  }

  if (searchParams.status) {
    query = query.eq("status", searchParams.status);
  }

  const { data: orders } = await query;

  const statuses = ["pending", "paid", "cancelled", "refunded"];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
          <p className="text-muted-foreground">Manage customer orders</p>
        </div>
        <Link href="/merchant/orders/new">
          <Button>
            <Plus className="h-4 w-4 mr-1" />
            New Order
          </Button>
        </Link>
      </div>

      {/* Status Filter */}
      <div className="flex gap-2 flex-wrap">
        <Link href="/merchant/orders">
          <Button variant={!searchParams.status ? "default" : "outline"} size="sm">
            All
          </Button>
        </Link>
        {statuses.map((status) => (
          <Link key={status} href={`/merchant/orders?status=${status}`}>
            <Button
              variant={searchParams.status === status ? "default" : "outline"}
              size="sm"
            >
              {statusLabels[status]}
            </Button>
          </Link>
        ))}
      </div>

      {/* Orders List */}
      {!orders || orders.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <ShoppingBag className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">
              {searchParams.status
                ? `No ${statusLabels[searchParams.status].toLowerCase()} orders`
                : "No orders yet"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const campaign = order.campaign as unknown as { id: string; title: string };
            const creator = order.creator as unknown as { full_name: string };
            const link = order.affiliate_link as unknown as { code: string };
            const coupon = order.coupon_code as unknown as { code: string };
            return (
              <Card key={order.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium truncate">
                          {order.customer_name}
                        </h3>
                        <Badge variant={statusColors[order.status] || "secondary"}>
                          {statusLabels[order.status] || order.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {campaign?.title || "Campaign"}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span>${order.amount?.toFixed(2)}</span>
                        <span>{order.attribution_source || "none"}</span>
                        {creator?.full_name && <span>By {creator.full_name}</span>}
                        {link?.code && <span>Link: {link.code}</span>}
                        {coupon?.code && <span>Coupon: {coupon.code}</span>}
                        <span>{new Date(order.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <Link href={`/merchant/orders/${order.id}`}>
                      <Button size="sm" variant="outline">
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
