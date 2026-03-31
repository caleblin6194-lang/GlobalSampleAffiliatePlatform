"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MousePointer, ShoppingCart, DollarSign, TrendingUp, BarChart3 } from "lucide-react";

interface CampaignStats {
  campaign: string;
  campaignId: string;
  clicks: number;
  orders: number;
  orderAmount: number;
  commissions: number;
  conversionRate: string;
}

interface AnalyticsData {
  totals: {
    totalClicks: number;
    totalOrders: number;
    totalOrderAmount: number;
    totalCommissions: number;
    conversionRate: string;
  };
  byCampaign: CampaignStats[];
}

export default function MerchantAnalyticsPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AnalyticsData | null>(null);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  async function fetchAnalytics() {
    const response = await fetch("/api/analytics");
    const result = await response.json();
    if (response.ok) {
      setData(result);
    }
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-muted-foreground">Loading analytics...</div>
      </div>
    );
  }

  const { totals, byCampaign } = data || {
    totals: {
      totalClicks: 0,
      totalOrders: 0,
      totalOrderAmount: 0,
      totalCommissions: 0,
      conversionRate: "0",
    },
    byCampaign: [],
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground">Track your campaign performance and ROI</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
            <MousePointer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals?.totalClicks || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Paid Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals?.totalOrders || 0}</div>
            <p className="text-xs text-muted-foreground">
              ${(totals?.totalOrderAmount || 0).toFixed(2)} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Commission Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              ${(totals?.totalCommissions || 0).toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals?.conversionRate || 0}%</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="campaigns" className="space-y-4">
        <TabsList>
          <TabsTrigger value="campaigns">By Campaign</TabsTrigger>
          <TabsTrigger value="overview">Overview</TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns">
          <Card>
            <CardHeader>
              <CardTitle>Campaign Performance</CardTitle>
            </CardHeader>
            <CardContent>
              {byCampaign.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  No campaign data yet. Create campaigns and wait for affiliate activity.
                </p>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-6 gap-4 text-xs text-muted-foreground font-medium px-2">
                    <span>Campaign</span>
                    <span>Clicks</span>
                    <span>Orders</span>
                    <span>Revenue</span>
                    <span>Commission</span>
                    <span>Conv. Rate</span>
                  </div>
                  {byCampaign.map((item: CampaignStats) => (
                    <div key={item.campaignId} className="grid grid-cols-6 gap-4 items-center p-3 border rounded-lg">
                      <span className="text-sm font-medium truncate">{item.campaign}</span>
                      <span className="text-sm">{item.clicks}</span>
                      <span className="text-sm">{item.orders}</span>
                      <span className="text-sm">${item.orderAmount?.toFixed(2)}</span>
                      <span className="text-sm text-red-600">-${item.commissions?.toFixed(2)}</span>
                      <Badge variant="outline">{item.conversionRate}%</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>Performance Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <p className="text-xs text-muted-foreground">Avg. Order Value</p>
                  <p className="text-2xl font-bold">
                    ${totals.totalOrders > 0 ? (totals.totalOrderAmount / totals.totalOrders).toFixed(2) : "0.00"}
                  </p>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="text-xs text-muted-foreground">Commission Rate</p>
                  <p className="text-2xl font-bold">
                    {totals.totalOrderAmount > 0 ? ((totals.totalCommissions / totals.totalOrderAmount) * 100).toFixed(1) : "0"}%
                  </p>
                </div>
              </div>

              <div className="p-4 border rounded-lg">
                <p className="text-xs text-muted-foreground mb-2">ROI Indicator</p>
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-green-600" />
                  <span className="text-sm">
                    {totals.totalOrders > 0
                      ? "Your campaigns are generating sales through the affiliate program."
                      : "Start promoting your campaigns to see ROI data."}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
