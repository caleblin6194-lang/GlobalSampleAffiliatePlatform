import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

export default async function CreatorApplicationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: applications } = await supabase
    .from('campaign_applications')
    .select(`
      id, status, rejection_reason, selected_platform, notes, created_at,
      campaign:campaigns(id, title, sample_qty, commission_rate,
        product:products(title, image_url),
        merchant:profiles(full_name)
      )
    `)
    .eq('creator_id', user?.id)
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">My Applications</h1>
        <p className="text-muted-foreground">Track your campaign applications</p>
      </div>

      {!applications || applications.length === 0 ? (
        <Card><CardContent className="py-16 text-center text-muted-foreground">No applications yet. Browse campaigns to apply!</CardContent></Card>
      ) : (
        <div className="space-y-4">
          {applications.map((app) => {
            const campaign = app.campaign as unknown as {
              id: string;
              title: string;
              sample_qty: number;
              commission_rate: number;
              product: { title: string; image_url: string };
              merchant: { full_name: string };
            };
            return (
              <Card key={app.id}>
                <CardContent className="p-4 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex gap-4">
                      {campaign?.product?.image_url && (
                        <img src={campaign.product.image_url} alt="" className="w-16 h-16 object-cover rounded" />
                      )}
                      <div>
                        <h3 className="font-medium">{campaign?.title || 'Campaign'}</h3>
                        <p className="text-sm text-muted-foreground">
                          {campaign?.product?.title || 'Product'} • by {campaign?.merchant?.full_name || 'Merchant'}
                        </p>
                        <div className="flex gap-2 mt-1">
                          <span className="text-xs bg-primary/10 px-2 py-0.5 rounded">{campaign?.sample_qty} samples</span>
                          <span className="text-xs bg-primary/10 px-2 py-0.5 rounded">{campaign?.commission_rate}% commission</span>
                        </div>
                      </div>
                    </div>
                    <Badge variant={app.status === 'pending' ? 'secondary' : app.status === 'approved' ? 'default' : 'destructive'}>
                      {app.status}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <Label className="text-xs text-muted-foreground">Platform</Label>
                      <p>{app.selected_platform}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Applied</Label>
                      <p>{new Date(app.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>

                  {app.notes && (
                    <div>
                      <Label className="text-xs text-muted-foreground">Notes</Label>
                      <p className="text-sm">{app.notes}</p>
                    </div>
                  )}

                  {app.rejection_reason && (
                    <div className="p-3 bg-destructive/10 rounded-md">
                      <Label className="text-xs text-destructive">Rejection Reason</Label>
                      <p className="text-sm text-destructive">{app.rejection_reason}</p>
                    </div>
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
