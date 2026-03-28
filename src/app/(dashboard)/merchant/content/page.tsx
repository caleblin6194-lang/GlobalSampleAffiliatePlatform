import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ExternalLink, Eye, FileText } from "lucide-react";

const statusColors: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  pending: "secondary",
  approved: "outline",
  rejected: "destructive",
};

const statusLabels: Record<string, string> = {
  pending: "Pending Review",
  approved: "Approved",
  rejected: "Rejected",
};

export default async function MerchantContentPage({
  searchParams,
}: {
  searchParams: { status?: string; campaign?: string };
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return <div>Please login</div>;
  }

  // Get campaigns for filter
  const { data: campaigns } = await supabase
    .from("campaigns")
    .select("id, title")
    .eq("merchant_id", user.id);

  // Get contents
  let query = supabase
    .from("creator_contents")
    .select(
      `
      id, platform, content_url, content_title, content_description,
      posted_at, disclosure_checked, status, rejection_reason, created_at,
      task:creator_tasks(id, title, status),
      campaign:campaigns(id, title),
      creator:profiles!creator_contents_creator_id_fkey(full_name, email)
    `
    )
    .order("created_at", { ascending: false });

  // Filter by merchant's campaigns
  if (campaigns && campaigns.length > 0) {
    query = query.in(
      "campaign_id",
      campaigns.map((c) => c.id)
    );
  } else {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Content Review
          </h1>
          <p className="text-muted-foreground">
            Review creator content submissions
          </p>
        </div>
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            No campaigns yet. Create a campaign first.
          </CardContent>
        </Card>
      </div>
    );
  }

  if (searchParams.status) {
    query = query.eq("status", searchParams.status);
  }

  if (searchParams.campaign) {
    query = query.eq("campaign_id", searchParams.campaign);
  }

  const { data: contents } = await query;

  const statuses = ["pending", "approved", "rejected"];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Content Review</h1>
        <p className="text-muted-foreground">
          Review and approve creator content submissions
        </p>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <Link href="/merchant/content">
          <Button variant={!searchParams.status ? "default" : "outline"} size="sm">
            All
          </Button>
        </Link>
        {statuses.map((status) => (
          <Link key={status} href={`/merchant/content?status=${status}`}>
            <Button
              variant={searchParams.status === status ? "default" : "outline"}
              size="sm"
            >
              {statusLabels[status]}
            </Button>
          </Link>
        ))}
      </div>

      <div className="flex gap-2 flex-wrap">
        <span className="text-xs text-muted-foreground py-2">Campaign:</span>
        <Link href="/merchant/content">
          <Button
            variant={!searchParams.campaign ? "secondary" : "ghost"}
            size="sm"
          >
            All
          </Button>
        </Link>
        {campaigns?.map((c) => (
          <Link key={c.id} href={`/merchant/content?campaign=${c.id}`}>
            <Button
              variant={searchParams.campaign === c.id ? "secondary" : "ghost"}
              size="sm"
            >
              {c.title}
            </Button>
          </Link>
        ))}
      </div>

      {/* Content List */}
      {!contents || contents.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">
              {searchParams.status || searchParams.campaign
                ? "No content matches your filters"
                : "No content submissions yet"}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Content will appear here when creators submit their work
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {contents.map((content) => {
            const task = content.task as unknown as {
              id: string;
              title: string;
              status: string;
            };
            const campaign = content.campaign as unknown as {
              id: string;
              title: string;
            };
            const creator = content.creator as unknown as {
              full_name: string;
              email: string;
            };
            return (
              <Card
                key={content.id}
                className="hover:bg-muted/50 transition-colors"
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium truncate">
                          {content.content_title || "Untitled Content"}
                        </h3>
                        <Badge variant={statusColors[content.status] || "secondary"}>
                          {statusLabels[content.status] || content.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {task?.title || campaign?.title || "Campaign"}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span>By {creator?.full_name || "Unknown"}</span>
                        <span className="flex items-center gap-1">
                          <Globe className="h-3 w-3" />
                          {content.platform}
                        </span>
                        <span>
                          {new Date(content.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      {content.rejection_reason && (
                        <p className="text-xs text-destructive mt-1 truncate">
                          Reason: {content.rejection_reason}
                        </p>
                      )}
                    </div>
                    <Link href={`/merchant/content/${content.id}`}>
                      <Button size="sm" variant="outline">
                        <Eye className="h-4 w-4 mr-1" />
                        Review
                      </Button>
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
