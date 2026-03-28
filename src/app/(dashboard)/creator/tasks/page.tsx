import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ClipboardList, ExternalLink } from "lucide-react";

const statusColors: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  pending: "secondary",
  submitted: "default",
  approved: "outline",
  rejected: "destructive",
};

const statusLabels: Record<string, string> = {
  pending: "Pending Submission",
  submitted: "Awaiting Review",
  approved: "Approved",
  rejected: "Needs Revision",
};

export default async function CreatorTasksPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return <div>Please login</div>;
  }

  // Get tasks
  let query = supabase
    .from("creator_tasks")
    .select(
      `
      id, status, title, description, due_at, created_at,
      campaign:campaigns(id, title),
      application:campaign_applications(id, selected_platform)
    `
    )
    .eq("creator_id", user.id)
    .order("created_at", { ascending: false });

  if (searchParams.status) {
    query = query.eq("status", searchParams.status);
  }

  const { data: tasks } = await query;

  const statuses = ["pending", "submitted", "approved", "rejected"];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Tasks</h1>
        <p className="text-muted-foreground">
          View and manage your content tasks
        </p>
      </div>

      {/* Status Filter */}
      <div className="flex gap-2 flex-wrap">
        <Link href="/creator/tasks">
          <Button
            variant={!searchParams.status ? "default" : "outline"}
            size="sm"
          >
            All
          </Button>
        </Link>
        {statuses.map((status) => (
          <Link key={status} href={`/creator/tasks?status=${status}`}>
            <Button
              variant={searchParams.status === status ? "default" : "outline"}
              size="sm"
            >
              {statusLabels[status]}
            </Button>
          </Link>
        ))}
      </div>

      {/* Tasks List */}
      {!tasks || tasks.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <ClipboardList className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">
              {searchParams.status
                ? `No ${statusLabels[searchParams.status].toLowerCase()} tasks`
                : "No tasks yet"}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {searchParams.status
                ? "Try a different filter"
                : "Tasks will appear here when your applications are approved"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {tasks.map((task) => {
            const campaign = task.campaign as unknown as {
              id: string;
              title: string;
            };
            const application = task.application as unknown as {
              selected_platform: string;
            };
            return (
              <Card key={task.id} className="hover:bg-muted/50 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium truncate">{task.title}</h3>
                        <Badge variant={statusColors[task.status] || "secondary"}>
                          {statusLabels[task.status] || task.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {campaign?.title || "Campaign"}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          Platform: {application?.selected_platform || "N/A"}
                        </span>
                        {task.due_at && (
                          <span>
                            Due: {new Date(task.due_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <Link href={`/creator/tasks/${task.id}`}>
                      <Button size="sm" variant="outline">
                        <ExternalLink className="h-4 w-4 mr-1" />
                        View
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
