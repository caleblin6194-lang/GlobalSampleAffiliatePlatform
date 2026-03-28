import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Truck } from "lucide-react";

const statusColors: Record<string, "secondary" | "default" | "outline" | "destructive"> = {
  in_transit: "default",
  delivered: "default",
  exception: "destructive",
};

export default async function VendorShipmentsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return <div>Please login</div>;
  }

  // Get vendor
  const { data: vendor } = await supabase
    .from('vendors')
    .select('id')
    .eq('user_id', user.id)
    .single();

  // Get shipments for vendor's orders
  const { data: shipments } = await supabase
    .from('shipments')
    .select(`
      id, carrier, tracking_no, shipped_at, delivered_at, status, created_at,
      fulfillment_order:fulfillment_orders(
        id, order_type, customer_name,
        campaign:campaigns(title)
      )
    `)
    .order('shipped_at', { ascending: false });

  // Filter by vendor
  const filteredShipments = shipments?.filter((s: any) => {
    const fo = s.fulfillment_order;
    return fo?.vendor_id === vendor?.id;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Shipments</h1>
        <p className="text-muted-foreground">View all shipped packages</p>
      </div>

      {!filteredShipments || filteredShipments.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Truck className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">No shipments yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Shipments will appear here once you mark orders as shipped
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredShipments.map((shipment: any) => {
            const fo = shipment.fulfillment_order;
            return (
              <Card key={shipment.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={statusColors[shipment.status] || "secondary"}>
                          {shipment.status === 'in_transit' ? 'In Transit' : shipment.status}
                        </Badge>
                        <Badge variant="outline">{fo?.order_type}</Badge>
                      </div>
                      <p className="font-medium">{fo?.campaign?.title}</p>
                      <p className="text-sm text-muted-foreground">To: {fo?.customer_name}</p>
                      <div className="flex items-center gap-4 mt-2 text-sm">
                        <span className="font-mono font-bold">{shipment.tracking_no}</span>
                        <span className="text-muted-foreground">{shipment.carrier}</span>
                      </div>
                    </div>
                    <div className="text-right text-xs text-muted-foreground">
                      <p>Shipped: {new Date(shipment.shipped_at).toLocaleDateString()}</p>
                      {shipment.delivered_at && (
                        <p>Delivered: {new Date(shipment.delivered_at).toLocaleDateString()}</p>
                      )}
                    </div>
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
