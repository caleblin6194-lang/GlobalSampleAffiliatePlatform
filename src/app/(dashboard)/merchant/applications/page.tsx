import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

export default async function MerchantApplicationsPage({ searchParams }: { searchParams: { campaign?: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Get campaigns for filter dropdown
  const { data: campaigns } = await supabase
    .from('campaigns')
    .select('id, title')
    .eq('merchant_id', user?.id);

  // Get applications
  let query = supabase
    .from('campaign_applications')
    .select(`
      id, status, rejection_reason, shipping_name, phone, country, state, city,
      address_line1, postal_code, selected_platform, notes, created_at,
      campaign:campaigns(id, title),
      creator:profiles(full_name, email)
    `)
    .order('created_at', { ascending: false });

  if (searchParams.campaign) {
    query = query.eq('campaign_id', searchParams.campaign);
  }

  const { data: applications } = await query;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Application Reviews</h1>
        <p className="text-muted-foreground">Review and approve creator applications</p>
      </div>

      {/* Campaign Filter */}
      <div className="flex gap-2 flex-wrap">
        <a href="/merchant/applications">
          <Button variant={!searchParams.campaign ? 'default' : 'outline'}>All</Button>
        </a>
        {campaigns?.map(c => (
          <a key={c.id} href={`/merchant/applications?campaign=${c.id}`}>
            <Button variant={searchParams.campaign === c.id ? 'default' : 'outline'}>{c.title}</Button>
          </a>
        ))}
      </div>

      {!applications || applications.length === 0 ? (
        <Card><CardContent className="py-16 text-center text-muted-foreground">No applications found</CardContent></Card>
      ) : (
        <div className="space-y-4">
          {applications.map((app) => {
            const campaign = app.campaign as unknown as { id: string; title: string };
            const creator = app.creator as unknown as { full_name: string; email: string };
            return (
              <Card key={app.id}>
                <CardContent className="p-4 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium">{campaign?.title || 'Campaign'}</h3>
                      <p className="text-sm text-muted-foreground">Applicant: {creator?.full_name} ({creator?.email})</p>
                      <p className="text-xs text-muted-foreground">Applied: {new Date(app.created_at).toLocaleDateString()}</p>
                    </div>
                    <Badge variant={app.status === 'pending' ? 'secondary' : app.status === 'approved' ? 'default' : 'destructive'}>
                      {app.status}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <Label className="text-xs text-muted-foreground">Shipping</Label>
                      <p>{app.shipping_name}</p>
                      <p>{app.phone}</p>
                      <p>{app.address_line1}, {app.city}, {app.state} {app.postal_code}</p>
                      <p>{app.country}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Platform</Label>
                      <p>{app.selected_platform}</p>
                      {app.notes && <><Label className="text-xs text-muted-foreground">Notes</Label><p className="text-xs">{app.notes}</p></>}
                      {app.rejection_reason && <><Label className="text-xs text-muted-foreground">Rejection Reason</Label><p className="text-xs text-destructive">{app.rejection_reason}</p></>}
                    </div>
                  </div>

                  {app.status === 'pending' && (
                    <div className="flex gap-2 pt-2 border-t">
                      <form action={`/api/applications/review`} method="POST">
                        <input type="hidden" name="id" value={app.id} />
                        <input type="hidden" name="status" value="approved" />
                        <Button type="submit" size="sm" variant="default">✓ Approve</Button>
                      </form>
                      <form action={`/api/applications/review`} method="POST">
                        <input type="hidden" name="id" value={app.id} />
                        <input type="hidden" name="status" value="rejected" />
                        <Button type="submit" size="sm" variant="destructive">✕ Reject</Button>
                      </form>
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
