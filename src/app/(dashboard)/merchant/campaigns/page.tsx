import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function MerchantCampaignsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: campaigns } = await supabase
    .from("campaigns")
    .select(`
      id, title, sample_qty, commission_rate, status, created_at,
      product:products(title),
      application_count:campaign_applications(count)
    `)
    .eq("merchant_id", user?.id)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Campaigns</h1>
          <p className="text-muted-foreground">Manage your sampling campaigns</p>
        </div>
        <Link href="/merchant/campaigns/new">
          <Button>+ New Campaign</Button>
        </Link>
      </div>

      {(!campaigns || campaigns.length === 0) ? (
        <Card>
          <CardContent className="py-16 text-center">
            <p className="text-muted-foreground mb-4">No campaigns yet</p>
            <Link href="/merchant/campaigns/new">
              <Button variant="outline">Create your first campaign</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {campaigns.map((c) => {
            const appCount = (c.application_count as unknown as { count: number }[])?.[0]?.count || 0;
            return (
              <Card key={c.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <h3 className="font-medium">{c.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {(c.product as unknown as { title: string })?.title || 'No product'} • {c.sample_qty} samples • {c.commission_rate}% commission
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={c.status === 'active' ? 'default' : 'secondary'}>{c.status}</Badge>
                      <span className="text-xs text-muted-foreground">{appCount} applicants</span>
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Link href={`/merchant/applications?campaign=${c.id}`}>
                      <Button variant="outline" size="sm">Review Applications</Button>
                    </Link>
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
