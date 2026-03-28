"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Copy, ExternalLink, MousePointer, ShoppingCart, DollarSign, TrendingUp } from "lucide-react";
import Link from "next/link";

const statusColors: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  pending: "secondary",
  approved: "outline",
  paid: "default",
  void: "destructive",
};

export default function CreatorEarningsPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetchEarnings();
  }, []);

  async function fetchEarnings() {
    const response = await fetch("/api/earnings");
    const result = await response.json();
    if (response.ok) {
      setData(result);
    }
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-muted-foreground">Loading earnings...</div>
      </div>
    );
  }

  const { affiliateLinks, coupons, stats, commissions } = data || {
    affiliateLinks: [],
    coupons: [],
    stats: {},
    commissions: [],
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Earnings</h1>
        <p className="text-muted-foreground">Track your affiliate performance and commissions</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
            <MousePointer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalClicks || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Paid Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalOrders || 0}</div>
            <p className="text-xs text-muted-foreground">
              ${(stats?.totalOrderAmount || 0).toFixed(2)} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Commission</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              ${(stats?.pendingCommission || 0).toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Earned</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${(stats?.paidCommission || 0).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              +${(stats?.approvedCommission || 0).toFixed(2)} approved
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Affiliate Links */}
        <Card>
          <CardHeader>
            <CardTitle>My Affiliate Links</CardTitle>
          </CardHeader>
          <CardContent>
            {affiliateLinks.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No affiliate links yet. Links are created when your applications are approved.
              </p>
            ) : (
              <div className="space-y-4">
                {affiliateLinks.map((link: any) => (
                  <div key={link.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{link.code}</p>
                      <p className="text-xs text-muted-foreground">
                        {(link.campaign as any)?.title || "Campaign"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{link.clicks} clicks</Badge>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          navigator.clipboard.writeText(
                            `${window.location.origin}/track/${link.code}`
                          );
                        }}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Link href={`/track/${link.code}`} target="_blank">
                        <Button size="sm" variant="ghost">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Coupon Codes */}
        <Card>
          <CardHeader>
            <CardTitle>My Coupon Codes</CardTitle>
          </CardHeader>
          <CardContent>
            {coupons.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No coupon codes assigned to you yet.
              </p>
            ) : (
              <div className="space-y-4">
                {coupons.map((coupon: any) => (
                  <div key={coupon.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{coupon.code}</p>
                      <p className="text-xs text-muted-foreground">
                        {(coupon.campaign as any)?.title || "Campaign"} •{" "}
                        {coupon.discount_type === "percent"
                          ? `${coupon.discount_value}% off`
                          : `$${coupon.discount_value} off`}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        navigator.clipboard.writeText(coupon.code);
                      }}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Commission History */}
      <Card>
        <CardHeader>
          <CardTitle>Commission History</CardTitle>
        </CardHeader>
        <CardContent>
          {commissions.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No commissions yet. Commissions are generated when orders are paid.
            </p>
          ) : (
            <div className="space-y-2">
              <div className="grid grid-cols-5 gap-4 text-xs text-muted-foreground font-medium px-2">
                <span>Campaign</span>
                <span>Order Amount</span>
                <span>Commission</span>
                <span>Rate</span>
                <span>Status</span>
              </div>
              {commissions.map((commission: any) => (
                <div
                  key={commission.id}
                  className="grid grid-cols-5 gap-4 items-center p-2 border-b last:border-0"
                >
                  <span className="text-sm truncate">
                    {(commission.campaign as any)?.title || "Campaign"}
                  </span>
                  <span className="text-sm">
                    ${((commission.order as any)?.amount || 0).toFixed(2)}
                  </span>
                  <span className="text-sm font-medium text-green-600">
                    ${commission.amount?.toFixed(2)}
                  </span>
                  <span className="text-sm">{commission.rate}%</span>
                  <Badge variant={statusColors[commission.status] || "secondary"}>
                    {commission.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
