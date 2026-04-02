"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, ScanBarcode, Package, MapPin, Truck, Check } from "lucide-react";
import Link from "next/link";

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

const nextStatusLabels: Record<string, string> = {
  pending_pick: "Start Picking",
  picking: "Mark as Packed",
  packed: "Ship Package",
};

export default function VendorOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const fulfillmentId = params.id as string;

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [carrier, setCarrier] = useState("");
  const [trackingNo, setTrackingNo] = useState("");

  const fetchOrder = useCallback(async () => {
    const response = await fetch(`/api/fulfillment/${fulfillmentId}`);
    const data = await response.json();

    if (response.ok) {
      setOrder(data.order);
    }
    setLoading(false);
  }, [fulfillmentId]);

  useEffect(() => {
    void fetchOrder();
  }, [fetchOrder]);

  async function handleStatusUpdate(newStatus: string) {
    if (newStatus === 'shipped' && (!carrier || !trackingNo)) {
      setError("Carrier and tracking number are required");
      return;
    }

    setUpdating(true);
    setError(null);

    const response = await fetch(`/api/fulfillment/${fulfillmentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: newStatus,
        carrier: newStatus === 'shipped' ? carrier : undefined,
        tracking_no: newStatus === 'shipped' ? trackingNo : undefined,
      }),
    });

    if (response.ok) {
      router.refresh();
      await fetchOrder();
    } else {
      const data = await response.json();
      setError(data.error || "Failed to update");
    }

    setUpdating(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-muted-foreground">Loading order...</div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="space-y-4">
        <Link href="/vendor/orders">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Orders
          </Button>
        </Link>
        <Card>
          <CardContent className="py-16 text-center">Order not found</CardContent>
        </Card>
      </div>
    );
  }

  const campaign = order.campaign;
  const application = order.application;
  const salesOrder = order.order;
  const items = order.items || [];
  const shipments = order.shipments || [];
  const firstShipment = shipments[0];

  const currentStatus = order.status;
  const nextStatus = nextStatusLabels[currentStatus];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/vendor/orders">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {order.order_type === 'sample' ? 'Sample' : 'Sales'} Order
          </h1>
          <p className="text-muted-foreground">
            {campaign?.title || 'Campaign'}
          </p>
        </div>
        <Badge variant={statusColors[currentStatus] || "secondary"} className="ml-auto">
          {statusLabels[currentStatus] || currentStatus}
        </Badge>
      </div>

      {error && (
        <div className="p-4 bg-destructive/10 text-destructive rounded-md">{error}</div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Shipping Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              {order.order_type === 'sample' ? 'Sample Shipping' : 'Customer Address'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <Label className="text-xs text-muted-foreground">Recipient</Label>
              <p className="text-sm font-medium">{order.customer_name}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Phone</Label>
              <p className="text-sm">{order.phone}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Address</Label>
              <p className="text-sm">
                {order.address_line1}
                {order.address_line2 && `, ${order.address_line2}`}
                <br />
                {order.city}, {order.state} {order.postal_code}
                <br />
                {order.country}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Items / Products */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Items to Fulfill
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {items.map((item: any) => {
              const variant = item.variant;
              const product = item.product;
              return (
                <div key={item.id} className="border rounded-lg p-3">
                  <p className="font-medium">{product?.title || 'Product'}</p>
                  <p className="text-sm text-muted-foreground">
                    {variant?.model} / {variant?.color} / {variant?.series}
                  </p>
                  <p className="text-sm">Qty: {item.qty}</p>
                  {variant?.barcode_code && (
                    <div className="flex items-center gap-2 mt-2 p-2 bg-muted rounded">
                      <ScanBarcode className="h-4 w-4" />
                      <span className="font-mono text-sm font-bold">{variant.barcode_code}</span>
                    </div>
                  )}
                </div>
              );
            })}
            {items.length === 0 && (
              <p className="text-muted-foreground text-sm">No items found</p>
            )}
          </CardContent>
        </Card>

        {/* Shipment Info */}
        {firstShipment && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Shipment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <Label className="text-xs text-muted-foreground">Carrier</Label>
                <p className="text-sm font-medium">{firstShipment.carrier}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Tracking Number</Label>
                <p className="text-sm font-mono font-bold">{firstShipment.tracking_no}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Shipped At</Label>
                <p className="text-sm">{new Date(firstShipment.shipped_at).toLocaleString()}</p>
              </div>
              <Badge variant={firstShipment.status === 'delivered' ? 'default' : 'outline'}>
                {firstShipment.status}
              </Badge>
            </CardContent>
          </Card>
        )}

        {/* Action Card */}
        {nextStatus && currentStatus !== 'shipped' && currentStatus !== 'delivered' && (
          <Card>
            <CardHeader>
              <CardTitle>Update Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {currentStatus === 'packed' && (
                <div className="space-y-2">
                  <div className="space-y-2">
                    <Label htmlFor="carrier">Carrier</Label>
                    <select
                      id="carrier"
                      value={carrier}
                      onChange={(e) => setCarrier(e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="">Select carrier</option>
                      <option value="DHL">DHL</option>
                      <option value="FedEx">FedEx</option>
                      <option value="UPS">UPS</option>
                      <option value="USPS">USPS</option>
                      <option value="EMS">EMS</option>
                      <option value="SF Express">SF Express</option>
                      <option value="YTO Express">YTO Express</option>
                      <option value="ZTO Express">ZTO Express</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="trackingNo">Tracking Number</Label>
                    <Input
                      id="trackingNo"
                      value={trackingNo}
                      onChange={(e) => setTrackingNo(e.target.value)}
                      placeholder="Enter tracking number"
                    />
                  </div>
                </div>
              )}
              <Button
                onClick={() => handleStatusUpdate(nextStatus.toLowerCase().replace(' ', '_'))}
                disabled={updating || (currentStatus === 'packed' && (!carrier || !trackingNo))}
                className="w-full"
              >
                {updating ? 'Updating...' : nextStatus}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Already Shipped/Delivered */}
        {(currentStatus === 'shipped' || currentStatus === 'delivered') && (
          <Card>
            <CardHeader>
              <CardTitle>Order Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-green-600">
                <Check className="h-5 w-5" />
                <span className="font-medium">
                  {currentStatus === 'delivered' ? 'Delivered' : 'Shipped'}
                </span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
