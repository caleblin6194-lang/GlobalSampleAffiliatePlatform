"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Copy, ExternalLink, MousePointer, ShoppingCart, DollarSign, TrendingUp, CopyCheck, Wallet } from "lucide-react";
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
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

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

  function copyToClipboard(text: string, type: string) {
    navigator.clipboard.writeText(text);
    setCopiedLink(type);
    setTimeout(() => setCopiedLink(null), 2000);
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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

  const { affiliateLinks, coupons, stats, commissions } = data || {
    affiliateLinks: [],
    coupons: [],
    stats: {},
    commissions: [],
  };

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Earnings</h1>
        <p className="text-muted-foreground">Track your affiliate performance and commissions</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <StatCard title="Total Clicks" value={stats?.totalClicks || 0} icon={MousePointer} />
        <StatCard title="Paid Orders" value={stats?.totalOrders || 0} icon={ShoppingCart} />
        <StatCard title="Pending Commission" value={`$${(stats?.pendingCommission || 0).toFixed(2)}`} icon={DollarSign} className={stats?.pendingCommission > 0 ? "border-yellow-300" : ""} />
        <StatCard title="Approved" value={`$${(stats?.approvedCommission || 0).toFixed(2)}`} icon={TrendingUp} className="border-blue-300" />
        <Card className="border-green-300">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-1">
              <Wallet className="h-4 w-4 text-green-600" />
              <span className="text-xs text-muted-foreground">Withdrawable</span>
            </div>
            <div className="text-2xl font-bold text-green-600">
              ${(stats?.withdrawableBalance || 0).toFixed(2)}
            </div>
            {(stats?.withdrawableBalance || 0) > 0 && (
              <Button size="sm" variant="outline" className="mt-2 w-full text-green-600 border-green-300 hover:bg-green-50" onClick={() => {
                const amount = (stats?.withdrawableBalance || 0).toFixed(2);
                if (confirm(`Request payout of $${amount}?`)) {
                  fetch('/api/payouts', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ amount: parseFloat(amount), payment_method: 'bank_transfer' }),
                  }).then(r => r.json()).then(() => fetchEarnings());
                }
              }}>
                Request Withdrawal
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{affiliateLinks.length}</div>
            <p className="text-sm text-muted-foreground">Active Affiliate Links</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{coupons.length}</div>
            <p className="text-sm text-muted-foreground">Coupon Codes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats?.totalCommission || 0}</div>
            <p className="text-sm text-muted-foreground">Total Commissions</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Affiliate Links */}
        <Card>
          <CardHeader>
            <CardTitle>My Affiliate Links</CardTitle>
            <CardDescription>Share these links to earn commissions</CardDescription>
          </CardHeader>
          <CardContent>
            {affiliateLinks.length === 0 ? (
              <div className="text-center py-8">
                <Link href="/creator/campaigns">
                  <Button>Browse Campaigns</Button>
                </Link>
                <p className="text-sm text-muted-foreground mt-2">
                  Apply to campaigns to get your affiliate links
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {affiliateLinks.map((link: any) => {
                  const fullUrl = `${baseUrl}/track/${link.code}`;
                  return (
                    <div key={link.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-medium bg-muted px-2 py-0.5 rounded">
                            {link.code}
                          </span>
                          <Badge variant="secondary">{link.clicks} clicks</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground truncate mt-1">
                          {(link.campaign as any)?.title || "Campaign"}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyToClipboard(fullUrl, link.code)}
                        >
                          {copiedLink === link.code ? (
                            <CopyCheck className="h-4 w-4 text-green-600" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                        <Link href={`/track/${link.code}`} target="_blank">
                          <Button size="sm" variant="ghost">
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Coupon Codes */}
        <Card>
          <CardHeader>
            <CardTitle>My Coupon Codes</CardTitle>
            <CardDescription>Share these codes for discounts</CardDescription>
          </CardHeader>
          <CardContent>
            {coupons.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground text-sm">
                  No coupon codes assigned yet
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {coupons.map((coupon: any) => (
                  <div key={coupon.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-bold bg-primary/10 text-primary px-2 py-0.5 rounded">
                          {coupon.code}
                        </span>
                        <Badge variant="outline">
                          {coupon.discount_type === "percent"
                            ? `${coupon.discount_value}% off`
                            : `$${coupon.discount_value} off`}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate mt-1">
                        {(coupon.campaign as any)?.title || "Campaign"}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(coupon.code, coupon.code)}
                    >
                      {copiedLink === coupon.code ? (
                        <CopyCheck className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
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
          <CardDescription>Your earnings from completed orders</CardDescription>
        </CardHeader>
        <CardContent>
          {commissions.length === 0 ? (
            <div className="text-center py-12">
              <DollarSign className="mx-auto h-12 w-12 text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">No commissions yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Commissions are earned when orders are marked as paid
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="grid grid-cols-6 gap-4 text-xs text-muted-foreground font-medium px-2 mb-2">
                <span>Campaign</span>
                <span>Order Amount</span>
                <span>Commission</span>
                <span>Rate</span>
                <span>Status</span>
                <span>Date</span>
              </div>
              {commissions.map((commission: any) => (
                <div
                  key={commission.id}
                  className="grid grid-cols-6 gap-4 items-center p-3 border rounded-lg hover:bg-muted/50"
                >
                  <span className="text-sm truncate">
                    {(commission.campaign as any)?.title || "Campaign"}
                  </span>
                  <span className="text-sm">
                    ${((commission.order as any)?.amount || 0).toFixed(2)}
                  </span>
                  <span className={`text-sm font-bold ${
                    commission.status === 'paid' ? 'text-green-600' : 
                    commission.status === 'approved' ? 'text-blue-600' :
                    commission.status === 'void' ? 'text-red-600' : 'text-yellow-600'
                  }`}>
                    ${commission.amount?.toFixed(2)}
                  </span>
                  <span className="text-sm">{commission.rate}%</span>
                  <Badge variant={statusColors[commission.status] || "secondary"}>
                    {commission.status}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {new Date(commission.created_at).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
