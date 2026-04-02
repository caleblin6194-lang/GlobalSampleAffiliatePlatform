"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Check, X } from "lucide-react";
import Link from "next/link";

const statusColors: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  pending: "secondary",
  paid: "default",
  cancelled: "destructive",
  refunded: "destructive",
};

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [error, setError] = useState<string | null>(null);

  const fetchOrder = useCallback(async () => {
    const response = await fetch(`/api/orders/${orderId}`);
    const data = await response.json();

    if (response.ok) {
      setOrder(data.order);
      setNewStatus(data.order.status);
    }
    setLoading(false);
  }, [orderId]);

  useEffect(() => {
    void fetchOrder();
  }, [fetchOrder]);

  async function handleUpdateStatus() {
    if (!newStatus || newStatus === order.status) return;

    setUpdating(true);
    setError(null);

    const response = await fetch(`/api/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });

    if (response.ok) {
      router.refresh();
      await fetchOrder();
    } else {
      const data = await response.json();
      setError(data.error || "Failed to update order");
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
        <Link href="/merchant/orders">
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
  const creator = order.creator;
  const link = order.affiliate_link;
  const coupon = order.coupon_code;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/merchant/orders">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Order Details</h1>
          <p className="text-muted-foreground">{order.customer_name}</p>
        </div>
        <Badge variant={statusColors[order.status] || "secondary"} className="ml-auto">
          {order.status}
        </Badge>
      </div>

      {error && (
        <div className="p-4 bg-destructive/10 text-destructive rounded-md">{error}</div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Customer Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <Label className="text-xs text-muted-foreground">Name</Label>
              <p className="text-sm">{order.customer_name}</p>
            </div>
            {order.customer_email && (
              <div>
                <Label className="text-xs text-muted-foreground">Email</Label>
                <p className="text-sm">{order.customer_email}</p>
              </div>
            )}
            {order.customer_phone && (
              <div>
                <Label className="text-xs text-muted-foreground">Phone</Label>
                <p className="text-sm">{order.customer_phone}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Order Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <Label className="text-xs text-muted-foreground">Campaign</Label>
              <p className="text-sm">{(campaign as any)?.title || "Unknown"}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Amount</Label>
              <p className="text-sm font-bold">${order.amount?.toFixed(2)}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Attribution</Label>
              <p className="text-sm capitalize">{order.attribution_source || "none"}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Created</Label>
              <p className="text-sm">{new Date(order.created_at).toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>

        {(creator || link || coupon) && (
          <Card>
            <CardHeader>
              <CardTitle>Attribution</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {creator && (
                <div>
                  <Label className="text-xs text-muted-foreground">Creator</Label>
                  <p className="text-sm">{(creator as any)?.full_name || "Unknown"}</p>
                </div>
              )}
              {link && (
                <div>
                  <Label className="text-xs text-muted-foreground">Affiliate Link</Label>
                  <p className="text-sm">{(link as any)?.code}</p>
                </div>
              )}
              {coupon && (
                <div>
                  <Label className="text-xs text-muted-foreground">Coupon</Label>
                  <p className="text-sm">{(coupon as any)?.code}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Update Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="status">New Status</Label>
              <select
                id="status"
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="cancelled">Cancelled</option>
                <option value="refunded">Refunded</option>
              </select>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleUpdateStatus} disabled={updating || newStatus === order.status}>
                {updating ? "Updating..." : "Update Status"}
              </Button>
            </div>

            {order.status === "pending" && newStatus === "paid" && (
              <p className="text-xs text-muted-foreground">
                ⚠️ Setting to "paid" will automatically generate commission for the creator.
              </p>
            )}

            {(order.status === "paid") && (newStatus === "cancelled" || newStatus === "refunded") && (
              <p className="text-xs text-muted-foreground">
                ⚠️ This will void any pending commissions for this order.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
