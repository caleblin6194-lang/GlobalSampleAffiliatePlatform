import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Package, ScanBarcode } from "lucide-react";

const statusColors: Record<string, "secondary" | "default" | "outline" | "destructive"> = {
  pending_pick: "secondary",
  picking: "default",
  packed: "outline",
  shipped: "outline",
  delivered: "default",
  cancelled: "destructive",
};

const statusLabels: Record<string, string> = {
  pending_pick: "Pending Pick",
  picking: "Picking",
  packed: "Packed",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export default async function VendorOrdersPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return <div>Please login</div>;
  }

  // Get vendor's fulfillment orders
  let url = '/api/fulfillment';
  if (searchParams.status) {
    url += `?status=${searchParams.status}`;
  }

  const response = await fetch(new URL(url, process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'), {
    headers: { cookie: '' }, // Server-side fetch needs proper cookie handling
  });

  // For server components, fetch directly
  const { data: vendor } = await supabase
    .from('vendors')
    .select('id')
    .eq('user_id', user.id)
    .single();

  let query = supabase
    .from('fulfillment_orders')
    .select(`
      id, order_type, customer_name, phone, status, created_at,
      campaign:campaigns(title),
      items:order_items(
        id, qty,
        variant:product_variants(barcode_code, model, color),
        product:products(title)
      ),
      shipments(id)
    `)
    .eq('vendor_id', vendor?.id)
    .order('created_at', { ascending: false });

  if (searchParams.status) {
    query = query.eq('status', searchParams.status);
  }

  const { data: orders } = await query;

  const statuses = ['pending_pick', 'picking', 'packed', 'shipped', 'delivered'];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Fulfillment Orders</h1>
        <p className="text-muted-foreground">Manage your order fulfillment</p>
      </div>

      {/* Status Filter */}
      <div className="flex gap-2 flex-wrap">
        <Link href="/vendor/orders">
          <Button variant={!searchParams.status ? "default" : "outline"} size="sm">
            All
          </Button>
        </Link>
        {statuses.map((status) => (
          <Link key={status} href={`/vendor/orders?status=${status}`}>
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
            <Package className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">
              {searchParams.status
                ? `No ${statusLabels[searchParams.status]} orders`
                : "No fulfillment orders yet"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const campaign = order.campaign as unknown as { title: string };
            const items = order.items || [];
            const firstItem = items[0] as any;
            const variant = firstItem?.variant;
            const product = firstItem?.product;
            const hasShipment = order.shipments && (order.shipments as any[]).length > 0;

            return (
              <Card key={order.id} className="hover:bg-muted/50 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={statusColors[order.status] || "secondary"}>
                          {statusLabels[order.status] || order.status}
                        </Badge>
                        <Badge variant="outline">{order.order_type}</Badge>
                      </div>
                      <h3 className="font-medium truncate">{campaign?.title || "Campaign"}</h3>
                      <p className="text-sm text-muted-foreground truncate">
                        {product?.title || "Product"}
                        {variant && ` - ${variant.model} (${variant.color})`}
                      </p>

                      {/* Barcode Display */}
                      {variant?.barcode_code && (
                        <div className="flex items-center gap-2 mt-2 p-2 bg-muted rounded">
                          <ScanBarcode className="h-4 w-4 text-muted-foreground" />
                          <span className="font-mono text-sm">{variant.barcode_code}</span>
                        </div>
                      )}

                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span>To: {order.customer_name}</span>
                        <span>{order.phone}</span>
                        <span>{new Date(order.created_at).toLocaleDateString()}</span>
                        {hasShipment && <span className="text-green-600">Has Shipment</span>}
                      </div>
                    </div>
                    <Link href={`/vendor/orders/${order.id}`}>
                      <Button size="sm" variant="outline">
                        Process
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
