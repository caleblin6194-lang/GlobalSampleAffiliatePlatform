import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Truck, Package, CheckCircle } from "lucide-react";

export default async function MerchantFulfillmentPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return <div>Please login</div>;
  }

  // Get merchant's campaigns
  const { data: campaigns } = await supabase
    .from('campaigns')
    .select('id, title')
    .eq('merchant_id', user.id);

  const campaignIds = campaigns?.map(c => c.id) || [];

  // Get fulfillment data
  let summary = { total: 0, pending_pick: 0, picking: 0, packed: 0, shipped: 0, delivered: 0 };
  let byCampaign: any[] = [];
  let recentOrders: any[] = [];

  if (campaignIds.length > 0) {
    // Get fulfillment orders
    const { data: orders } = await supabase
      .from('fulfillment_orders')
      .select(`
        id, order_type, customer_name, status, created_at,
        campaign:campaigns(id, title),
        vendor:vendors(vendor_name),
        shipments(id, carrier, tracking_no)
      `)
      .in('campaign_id', campaignIds)
      .order('created_at', { ascending: false });

    // Summary
    summary = {
      total: orders?.length || 0,
      pending_pick: orders?.filter(o => o.status === 'pending_pick').length || 0,
      picking: orders?.filter(o => o.status === 'picking').length || 0,
      packed: orders?.filter(o => o.status === 'packed').length || 0,
      shipped: orders?.filter(o => o.status === 'shipped').length || 0,
      delivered: orders?.filter(o => o.status === 'delivered').length || 0,
    };

    // By campaign
    byCampaign = campaigns?.map(c => {
      const campaignOrders = orders?.filter((o: any) => o.campaign?.id === c.id) || [];
      return {
        campaign: c.title,
        campaignId: c.id,
        total: campaignOrders.length,
        pending: campaignOrders.filter((o: any) => ['pending_pick', 'picking', 'packed'].includes(o.status)).length,
        shipped: campaignOrders.filter((o: any) => o.status === 'shipped').length,
        delivered: campaignOrders.filter((o: any) => o.status === 'delivered').length,
      };
    }) || [];

    recentOrders = orders?.slice(0, 15) || [];
  }

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Fulfillment</h1>
        <p className="text-muted-foreground">Track order fulfillment status</p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4 lg:grid-cols-6">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{summary.total}</div>
            <p className="text-xs text-muted-foreground">Total Orders</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-yellow-600">{summary.pending_pick + summary.picking + summary.packed}</div>
            <p className="text-xs text-muted-foreground">Processing</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-blue-600">{summary.shipped}</div>
            <p className="text-xs text-muted-foreground">Shipped</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-green-600">{summary.delivered}</div>
            <p className="text-xs text-muted-foreground">Delivered</p>
          </CardContent>
        </Card>
      </div>

      {/* By Campaign */}
      {byCampaign.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <h3 className="font-medium mb-4">By Campaign</h3>
            <div className="space-y-2">
              {byCampaign.map((item: any) => (
                <div key={item.campaignId} className="flex items-center justify-between p-2 border rounded">
                  <span className="text-sm truncate">{item.campaign}</span>
                  <div className="flex items-center gap-4 text-xs">
                    <span>{item.pending} processing</span>
                    <span className="text-blue-600">{item.shipped} shipped</span>
                    <span className="text-green-600">{item.delivered} delivered</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Orders */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="font-medium mb-4">Recent Orders</h3>
          {recentOrders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
              <p>No fulfillment orders yet</p>
              <p className="text-sm">Orders will appear when samples are approved or sales are made</p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="grid grid-cols-5 gap-4 text-xs text-muted-foreground font-medium px-2">
                <span>Order</span>
                <span>Campaign</span>
                <span>Vendor</span>
                <span>Status</span>
                <span>Tracking</span>
              </div>
              {recentOrders.map((order: any) => (
                <div key={order.id} className="grid grid-cols-5 gap-4 items-center p-2 border-b last:border-0">
                  <div>
                    <span className="text-sm font-medium capitalize">{order.order_type}</span>
                    <p className="text-xs text-muted-foreground truncate">To: {order.customer_name}</p>
                  </div>
                  <span className="text-sm truncate">{order.campaign?.title}</span>
                  <span className="text-sm truncate">{order.vendor?.vendor_name || 'N/A'}</span>
                  <Badge variant={statusColors[order.status] || "secondary"}>
                    {statusLabels[order.status] || order.status}
                  </Badge>
                  <div className="text-xs">
                    {order.shipments && order.shipments.length > 0 ? (
                      <span className="text-green-600 font-mono">
                        {(order.shipments[0] as any).tracking_no}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
