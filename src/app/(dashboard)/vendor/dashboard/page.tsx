import { createClient } from "@/lib/supabase/server";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, ShoppingCart, Truck, BarChart3, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function VendorDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // FIXED: separate queries
  const { data: vendor } = await supabase
    .from("vendors")
    .select("id, vendor_name, market_code, stall_no")
    .eq("user_id", user?.id)
    .single();

  const vendorId = vendor?.id || "";

  const { data: vendorProducts } = await supabase
    .from("products")
    .select("id, title, category, status, created_at")
    .eq("vendor_id", vendorId)
    .limit(10);

  const { count: totalProducts } = await supabase
    .from("products")
    .select("*", { count: "exact", head: true })
    .eq("vendor_id", vendorId);

  const { data: recentVariants } = await supabase
    .from("product_variants")
    .select("id, barcode_code, model, color, series, product:products(title)")
    .in("product_id", (vendorProducts || []).map(p => p.id))
    .limit(10);

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user?.id)
    .single();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome, {profile?.full_name || "Vendor"}
          </h1>
          <p className="text-muted-foreground">
            {vendor ? `${vendor.vendor_name} | ${vendor.market_code}-${vendor.stall_no}` : "Set up your vendor profile"}
          </p>
        </div>
        <Link href="/vendor/products/new">
          <Button><Plus className="mr-2 h-4 w-4" /> Add Product</Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Products" value={totalProducts || 0} icon={Package} />
        <StatCard title="Variants" value={recentVariants?.length || 0} icon={BarChart3} />
        <StatCard title="Pending Orders" value={0} icon={ShoppingCart} />
        <StatCard title="Fulfilled Today" value={0} icon={Truck} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Product Variants</CardTitle>
            <CardDescription>Barcode labels for your products</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(recentVariants || []).map((variant) => {
                const product = (variant.product as unknown as { title: string }) | null;
                return (
                  <div key={variant.id} className="flex items-center justify-between p-2 rounded-lg border">
                    <div>
                      <p className="text-sm font-medium">{product?.title || "—"}</p>
                      <p className="text-xs text-muted-foreground">
                        {variant.model} / {variant.color} / {variant.series}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-mono bg-muted px-2 py-1 rounded">
                        {variant.barcode_code || "—"}
                      </p>
                    </div>
                  </div>
                );
              })}
              {(!recentVariants || recentVariants.length === 0) && (
                <p className="text-sm text-muted-foreground">No variants registered</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/vendor/products" className="block">
              <Button variant="outline" className="w-full justify-start">
                <Package className="mr-2 h-4 w-4" /> Manage Products
              </Button>
            </Link>
            <Link href="/vendor/inventory" className="block">
              <Button variant="outline" className="w-full justify-start">
                <BarChart3 className="mr-2 h-4 w-4" /> View Inventory
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
