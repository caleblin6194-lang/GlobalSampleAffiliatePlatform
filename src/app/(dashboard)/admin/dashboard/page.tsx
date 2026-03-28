import { createClient } from "@/lib/supabase/server";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Store, Video, Package, FileText, Clock, CheckCircle, XCircle } from "lucide-react";

export default async function AdminDashboard() {
  const supabase = await createClient();

  const { count: totalUsers } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true });

  const { count: totalMerchants } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("role", "merchant");

  const { count: totalCreators } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("role", "creator");

  const { count: totalVendors } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("role", "vendor");

  const { count: totalProducts } = await supabase
    .from("products")
    .select("*", { count: "exact", head: true });

  const { count: totalCampaigns } = await supabase
    .from("campaigns")
    .select("*", { count: "exact", head: true });

  // Round 3: Content stats
  const { count: totalTasks } = await supabase
    .from("creator_tasks")
    .select("*", { count: "exact", head: true });

  const { count: pendingTasks } = await supabase
    .from("creator_tasks")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending");

  const { count: totalContents } = await supabase
    .from("creator_contents")
    .select("*", { count: "exact", head: true });

  const { count: pendingContents } = await supabase
    .from("creator_contents")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending");

  const { count: approvedContents } = await supabase
    .from("creator_contents")
    .select("*", { count: "exact", head: true })
    .eq("status", "approved");

  const { count: rejectedContents } = await supabase
    .from("creator_contents")
    .select("*", { count: "exact", head: true })
    .eq("status", "rejected");

  const { data: recentUsers } = await supabase
    .from("profiles")
    .select("full_name, email, role, created_at")
    .order("created_at", { ascending: false })
    .limit(5);

  // Recent content submissions
  const { data: recentContents } = await supabase
    .from("creator_contents")
    .select(`
      id, platform, content_title, status, created_at,
      task:creator_tasks(title),
      creator:profiles!creator_contents_creator_id_fkey(full_name)
    `)
    .order("created_at", { ascending: false })
    .limit(5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">Platform overview and management</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Users" value={totalUsers || 0} icon={Users} />
        <StatCard title="Merchants" value={totalMerchants || 0} icon={Store} />
        <StatCard title="Creators" value={totalCreators || 0} icon={Video} />
        <StatCard title="Vendors" value={totalVendors || 0} icon={Package} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Products" value={totalProducts || 0} icon={Package} />
        <StatCard title="Active Campaigns" value={totalCampaigns || 0} icon={Package} />
        <StatCard title="Total Tasks" value={totalTasks || 0} icon={FileText} />
        <StatCard title="Pending Tasks" value={pendingTasks || 0} icon={Clock} />
      </div>

      {/* Round 3: Content Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Contents" value={totalContents || 0} icon={FileText} />
        <StatCard title="Pending Review" value={pendingContents || 0} icon={Clock} />
        <StatCard title="Approved" value={approvedContents || 0} icon={CheckCircle} />
        <StatCard title="Rejected" value={rejectedContents || 0} icon={XCircle} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Users</CardTitle>
            <CardDescription>Latest registered users</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentUsers?.map((user) => (
                <div key={user.email} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{user.full_name}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                  <span className="text-xs font-medium capitalize px-2 py-1 bg-muted rounded-full">
                    {user.role}
                  </span>
                </div>
              ))}
              {(!recentUsers || recentUsers.length === 0) && (
                <p className="text-sm text-muted-foreground">No users yet</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Round 3: Recent Content Submissions */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Content</CardTitle>
            <CardDescription>Latest content submissions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentContents?.map((content) => {
                const task = content.task as unknown as { title: string };
                const creator = content.creator as unknown as { full_name: string };
                return (
                  <div key={content.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium truncate max-w-[200px]">
                        {content.content_title || "Untitled"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {creator?.full_name} · {content.platform}
                      </p>
                    </div>
                    <Badge
                      variant={
                        content.status === "approved"
                          ? "default"
                          : content.status === "rejected"
                          ? "destructive"
                          : "secondary"
                      }
                    >
                      {content.status}
                    </Badge>
                  </div>
                );
              })}
              {(!recentContents || recentContents.length === 0) && (
                <p className="text-sm text-muted-foreground">No content submissions yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Platform Health</CardTitle>
          <CardDescription>System status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Database</span>
              <span className="text-xs font-medium text-green-600">Operational</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Authentication</span>
              <span className="text-xs font-medium text-green-600">Operational</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Storage</span>
              <span className="text-xs font-medium text-green-600">Operational</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">API</span>
              <span className="text-xs font-medium text-green-600">Operational</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
