import { createClient } from "@/lib/supabase/server";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Video, ShoppingBag, CheckCircle, TrendingUp, Compass } from "lucide-react";
import Link from "next/link";

export default async function CreatorDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user?.id)
    .single();

  const { count: totalChannels } = await supabase
    .from("creator_channels")
    .select("*", { count: "exact", head: true })
    .eq("creator_id", user?.id);

  const { data: channels } = await supabase
    .from("creator_channels")
    .select("platform, handle, followers")
    .eq("creator_id", user?.id)
    .order("followers", { ascending: false })
    .limit(3);

  const totalFollowers = channels?.reduce((sum, ch) => sum + (ch.followers || 0), 0) || 0;

  const { count: activeCampaigns } = await supabase
    .from("campaigns")
    .select("*", { count: "exact", head: true })
    .eq("status", "active");

  const { data: recentCampaigns } = await supabase
    .from("campaigns")
    .select(`
      id, title, description, sample_qty, commission_rate, status, created_at,
      product:products(title, image_url)
    `)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(6);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome, {profile?.full_name || "Creator"}
          </h1>
          <p className="text-muted-foreground">Discover campaigns and grow your audience</p>
        </div>
        <Link href="/creator/campaigns">
          <Button><Compass className="mr-2 h-4 w-4" /> Browse Campaigns</Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Your Channels"
          value={totalChannels || 0}
          icon={Video}
        />
        <StatCard
          title="Total Followers"
          value={totalFollowers.toLocaleString()}
          icon={TrendingUp}
        />
        <StatCard
          title="Active Campaigns"
          value={activeCampaigns || 0}
          icon={ShoppingBag}
        />
        <StatCard
          title="Applications"
          value={0}
          description="Pending review"
          icon={CheckCircle}
        />
      </div>

      {channels && channels.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Your Channels</CardTitle>
            <CardDescription>Connected social media platforms</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {channels.map((channel) => (
                <div key={channel.handle} className="flex items-center gap-3 p-3 rounded-lg border">
                  <div className="rounded-full bg-primary/10 p-2">
                    <Video className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{channel.platform}</p>
                    <p className="text-xs text-muted-foreground">{channel.handle}</p>
                    <p className="text-xs font-medium">{channel.followers.toLocaleString()} followers</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Available Campaigns</CardTitle>
          <CardDescription>Apply to campaigns that match your content</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recentCampaigns?.map((campaign) => {
              const product = campaign.product as unknown as { title: string; image_url: string } | null;
              return (
                <div key={campaign.id} className="rounded-lg border p-4 space-y-3">
                  <div>
                    <p className="font-medium text-sm">{campaign.title}</p>
                    <p className="text-xs text-muted-foreground">{product?.title || "Product"}</p>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{campaign.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                      {campaign.sample_qty} samples
                    </span>
                    <span className="text-xs font-medium">{campaign.commission_rate}% commission</span>
                  </div>
                  <Button size="sm" className="w-full">Apply Now</Button>
                </div>
              );
            })}
            {(!recentCampaigns || recentCampaigns.length === 0) && (
              <p className="text-sm text-muted-foreground col-span-full">No campaigns available</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
