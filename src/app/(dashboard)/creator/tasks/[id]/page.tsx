"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, ExternalLink, Globe, AlertCircle } from "lucide-react";
import Link from "next/link";

const platformOptions = [
  "Instagram",
  "TikTok",
  "YouTube",
  "Twitter",
  "Facebook",
  "小红书",
  "抖音",
  "B站",
];

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

export default function TaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();

  const [task, setTask] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Content form state
  const [platform, setPlatform] = useState("");
  const [contentUrl, setContentUrl] = useState("");
  const [contentTitle, setContentTitle] = useState("");
  const [contentDescription, setContentDescription] = useState("");
  const [postedAt, setPostedAt] = useState("");
  const [disclosureChecked, setDisclosureChecked] = useState(false);
  const [screenshotUrl, setScreenshotUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    fetchTask();
  }, [params.id]);

  async function fetchTask() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }

    const response = await fetch(`/api/tasks/${params.id}`);
    const data = await response.json();

    if (response.ok) {
      setTask(data.task);
      // Pre-fill form if content exists
      if (data.task.content) {
        const c = data.task.content;
        setPlatform(c.platform || "");
        setContentUrl(c.content_url || "");
        setContentTitle(c.content_title || "");
        setContentDescription(c.content_description || "");
        setPostedAt(c.posted_at ? c.posted_at.split("T")[0] : "");
        setDisclosureChecked(c.disclosure_checked || false);
        setScreenshotUrl(c.screenshot_url || "");
      }
    } else {
      setError(data.error || "Failed to load task");
    }
    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);

    if (!disclosureChecked) {
      setSubmitError("You must confirm the disclosure checkbox");
      setSubmitting(false);
      return;
    }

    const response = await fetch("/api/content", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        task_id: task.id,
        platform,
        content_url: contentUrl,
        content_title: contentTitle,
        content_description: contentDescription,
        posted_at: postedAt ? new Date(postedAt).toISOString() : null,
        disclosure_checked: disclosureChecked,
        screenshot_url: screenshotUrl || null,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      router.refresh();
      fetchTask(); // Refresh to show updated status
    } else {
      setSubmitError(data.error || "Failed to submit content");
    }
    setSubmitting(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-muted-foreground">Loading task...</div>
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="space-y-4">
        <Link href="/creator/tasks">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Tasks
          </Button>
        </Link>
        <Card>
          <CardContent className="py-16 text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-destructive mb-4" />
            <p className="text-destructive">{error || "Task not found"}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const campaign = task.campaign;
  const product = campaign?.product;
  const application = task.application;
  const existingContent = task.content;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/creator/tasks">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{task.title}</h1>
          <p className="text-muted-foreground">{campaign?.title}</p>
        </div>
        <Badge
          variant={statusColors[task.status] || "secondary"}
          className="ml-auto"
        >
          {statusLabels[task.status] || task.status}
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Task Details */}
        <Card>
          <CardHeader>
            <CardTitle>Task Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-xs text-muted-foreground">Description</Label>
              <p className="text-sm">{task.description || "No description"}</p>
            </div>

            {task.due_at && (
              <div>
                <Label className="text-xs text-muted-foreground">Due Date</Label>
                <p className="text-sm">
                  {new Date(task.due_at).toLocaleDateString()}
                </p>
              </div>
            )}

            <div>
              <Label className="text-xs text-muted-foreground">
                Application Platform
              </Label>
              <p className="text-sm">{application?.selected_platform || "N/A"}</p>
            </div>

            <div>
              <Label className="text-xs text-muted-foreground">Merchant</Label>
              <p className="text-sm">
                {task.merchant?.full_name || "Unknown"}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Campaign & Product Info */}
        <Card>
          <CardHeader>
            <CardTitle>Campaign Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {product && (
              <>
                <div className="flex gap-4">
                  {product.image_url && (
                    <img
                      src={product.image_url}
                      alt={product.title}
                      className="w-20 h-20 object-cover rounded-md border"
                    />
                  )}
                  <div>
                    <Label className="text-xs text-muted-foreground">
                      Product
                    </Label>
                    <p className="text-sm font-medium">{product.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {product.category}
                    </p>
                  </div>
                </div>
                {product.description && (
                  <div>
                    <Label className="text-xs text-muted-foreground">
                      Product Description
                    </Label>
                    <p className="text-sm">{product.description}</p>
                  </div>
                )}
              </>
            )}
            {campaign?.description && (
              <div>
                <Label className="text-xs text-muted-foreground">
                  Campaign Requirements
                </Label>
                <p className="text-sm">{campaign.description}</p>
              </div>
            )}
            <div>
              <Label className="text-xs text-muted-foreground">
                Commission Rate
              </Label>
              <p className="text-sm">
                {campaign?.commission_rate
                  ? `${campaign.commission_rate}%`
                  : "N/A"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Content Submission */}
      <Card>
        <CardHeader>
          <CardTitle>
            {existingContent ? "Submitted Content" : "Submit Content"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {existingContent ? (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label className="text-xs text-muted-foreground">Platform</Label>
                  <p className="text-sm">{existingContent.platform}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Status</Label>
                  <Badge
                    variant={
                      existingContent.status === "approved"
                        ? "default"
                        : existingContent.status === "rejected"
                        ? "destructive"
                        : "secondary"
                    }
                  >
                    {existingContent.status}
                  </Badge>
                </div>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">Content URL</Label>
                <a
                  href={existingContent.content_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                >
                  {existingContent.content_url}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>

              {existingContent.content_title && (
                <div>
                  <Label className="text-xs text-muted-foreground">Title</Label>
                  <p className="text-sm">{existingContent.content_title}</p>
                </div>
              )}

              {existingContent.content_description && (
                <div>
                  <Label className="text-xs text-muted-foreground">
                    Description
                  </Label>
                  <p className="text-sm">{existingContent.content_description}</p>
                </div>
              )}

              {existingContent.posted_at && (
                <div>
                  <Label className="text-xs text-muted-foreground">
                    Posted At
                  </Label>
                  <p className="text-sm">
                    {new Date(existingContent.posted_at).toLocaleDateString()}
                  </p>
                </div>
              )}

              <div className="flex items-center gap-2">
                <Checkbox checked={existingContent.disclosure_checked} disabled />
                <Label className="text-sm">Disclosure confirmed (#ad/gifted)</Label>
              </div>

              {existingContent.rejection_reason && (
                <div className="p-3 bg-destructive/10 rounded-md">
                  <Label className="text-xs text-destructive">
                    Rejection Reason
                  </Label>
                  <p className="text-sm text-destructive mt-1">
                    {existingContent.rejection_reason}
                  </p>
                </div>
              )}
            </div>
          ) : task.status === "pending" ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              {submitError && (
                <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-md">
                  {submitError}
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="platform">
                    Platform <span className="text-destructive">*</span>
                  </Label>
                  <select
                    id="platform"
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value)}
                    required
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">Select platform</option>
                    {platformOptions.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contentUrl">
                    Content URL <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="contentUrl"
                    type="url"
                    placeholder="https://..."
                    value={contentUrl}
                    onChange={(e) => setContentUrl(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="contentTitle">Content Title</Label>
                <Input
                  id="contentTitle"
                  placeholder="Title of your post/video"
                  value={contentTitle}
                  onChange={(e) => setContentTitle(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contentDescription">Description / Caption</Label>
                <Textarea
                  id="contentDescription"
                  placeholder="Describe your content..."
                  value={contentDescription}
                  onChange={(e) => setContentDescription(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="postedAt">Date Posted</Label>
                  <Input
                    id="postedAt"
                    type="date"
                    value={postedAt}
                    onChange={(e) => setPostedAt(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="screenshotUrl">Screenshot URL</Label>
                  <Input
                    id="screenshotUrl"
                    type="url"
                    placeholder="https://..."
                    value={screenshotUrl}
                    onChange={(e) => setScreenshotUrl(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex items-start gap-2 p-3 bg-muted rounded-md">
                <Checkbox
                  id="disclosure"
                  checked={disclosureChecked}
                  onCheckedChange={(checked) =>
                    setDisclosureChecked(checked as boolean)
                  }
                />
                <div className="grid gap-1 leading-none">
                  <Label
                    htmlFor="disclosure"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    I confirm this content includes proper disclosure
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    By checking this, you confirm that your content clearly
                    identifies the partnership using #ad, #gifted, #sponsored,
                    or similar language as required by FTC guidelines.
                  </p>
                </div>
              </div>

              <Button type="submit" disabled={submitting}>
                {submitting ? "Submitting..." : "Submit Content"}
              </Button>
            </form>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              {task.status === "submitted"
                ? "You have already submitted content for this task. Awaiting merchant review."
                : "This task is not accepting submissions."}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
