import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function CreatorCampaignsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: campaigns } = await supabase
    .from("campaigns")
    .select(`
      id, title, description, sample_qty, commission_rate, status, created_at,
      product:products(title, image_url, category),
      merchant:profiles(full_name)
    `)
    .eq("status", "active")
    .order("created_at", { ascending: false });

  // Check which campaigns user already applied to
  const { data: myApps } = await supabase
    .from('campaign_applications')
    .select('campaign_id')
    .eq('creator_id', user?.id);

  const appliedIds = new Set((myApps || []).map((a: any) => a.campaign_id));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Available Campaigns</h1>
        <p className="text-muted-foreground">Browse and apply for product sampling campaigns</p>
      </div>

      {!campaigns || campaigns.length === 0 ? (
        <Card><CardContent className="py-16 text-center text-muted-foreground">No active campaigns yet</CardContent></Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {campaigns.map((c) => {
            const product = c.product as unknown as { title: string; image_url: string; category: string } | null;
            const merchant = c.merchant as unknown as { full_name: string } | null;
            const hasApplied = appliedIds.has(c.id);

            return (
              <Card key={c.id}>
                <CardContent className="p-4 space-y-3">
                  <div className="space-y-1">
                    <h3 className="font-medium">{c.title}</h3>
                    <p className="text-xs text-muted-foreground">
                      by {merchant?.full_name || 'Merchant'} • {(product as { title: string })?.title || 'Product'}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{c.description}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                      <Badge variant="outline" className="text-xs">{c.sample_qty} samples</Badge>
                      <Badge variant="outline" className="text-xs">{c.commission_rate}% commission</Badge>
                    </div>
                  </div>
                  {hasApplied ? (
                    <Button size="sm" className="w-full" disabled>Already Applied</Button>
                  ) : (
                    <Link href={`/creator/campaigns/${c.id}/apply`} className="block">
                      <Button size="sm" className="w-full">Apply Now</Button>
                    </Link>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
