"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScanBarcode, Package, Truck, CheckCircle } from "lucide-react";
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

export default function VendorDashboard() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, pending: 0, shipped: 0, delivered: 0 });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);

  useEffect(() => {
    fetchDashboard();
  }, []);

  async function fetchDashboard() {
    const response = await fetch("/api/fulfillment");
    const data = await response.json();
    
    if (response.ok && data.orders) {
      const orders = data.orders;
      setStats({
        total: orders.length,
        pending: orders.filter((o: any) => ['pending_pick', 'picking', 'packed'].includes(o.status)).length,
        shipped: orders.filter((o: any) => o.status === 'shipped').length,
        delivered: orders.filter((o: any) => o.status === 'delivered').length,
      });
      setRecentOrders(orders.slice(0, 5));
    }
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="h-4 w-20 bg-muted animate-pulse rounded mb-2" />
                <div className="h-8 w-16 bg-muted animate-pulse rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Vendor Dashboard</h1>
        <p className="text-muted-foreground">Manage your fulfillment operations</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard title="Total Orders" value={stats.total} icon={Package} />
        <StatCard title="Pending" value={stats.pending} icon={Package} className={stats.pending > 0 ? "border-yellow-300" : ""} />
        <StatCard title="Shipped" value={stats.shipped} icon={Truck} />
        <StatCard title="Delivered" value={stats.delivered} icon={CheckCircle} className="border-green-300" />
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <Link href="/vendor/orders?status=pending_pick">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer border-yellow-300">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold text-yellow-600">{stats.pending}</div>
                  <p className="text-sm text-muted-foreground">Orders need picking</p>
                </div>
                <ScanBarcode className="h-10 w-10 text-yellow-400" />
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/vendor/shipments">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold">{stats.shipped}</div>
                  <p className="text-sm text-muted-foreground">Packages in transit</p>
                </div>
                <Truck className="h-10 w-10 text-blue-400" />
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Recent Orders */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium">Recent Fulfillment Orders</h3>
            <Link href="/vendor/orders" className="text-sm text-primary hover:underline">
              View All
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <div className="text-center py-12">
              <Package className="mx-auto h-12 w-12 text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">No fulfillment orders yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Orders will appear when samples are approved or sales are made
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentOrders.map((order: any) => {
                const campaign = order.campaign;
                const items = order.items || [];
                const firstItem = items[0];
                const variant = firstItem?.variant;
                const product = firstItem?.product;
                
                return (
                  <Link key={order.id} href={`/vendor/orders/${order.id}`}>
                    <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Badge variant={statusColors[order.status] || "secondary"}>
                            {statusLabels[order.status] || order.status}
                          </Badge>
                          <span className="text-xs px-2 py-0.5 bg-muted rounded capitalize">
                            {order.order_type}
                          </span>
                        </div>
                        <p className="text-sm font-medium mt-1 truncate">
                          {product?.title || "Product"} {variant && `· ${variant.model}`}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          To: {order.customer_name} · {order.phone}
                        </p>
                        {variant?.barcode_code && (
                          <div className="flex items-center gap-1 mt-1">
                            <ScanBarcode className="h-3 w-3 text-muted-foreground" />
                            <span className="font-mono text-xs text-muted-foreground">
                              {variant.barcode_code}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(order.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
