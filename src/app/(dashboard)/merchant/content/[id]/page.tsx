"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  CheckCircle,
  XCircle,
  ArrowLeft,
  ExternalLink,
  Globe,
  AlertCircle,
  Check,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

const statusColors: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  pending: "secondary",
  approved: "outline",
  rejected: "destructive",
};

export default function ContentReviewPage() {
  const params = useParams();
  const router = useRouter();
  const contentId = params.id as string;

  const [content, setContent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Review form state
  const [rejectionReason, setRejectionReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const fetchContent = useCallback(async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }

    const response = await fetch(`/api/content/review?id=${contentId}`);
    const data = await response.json();

    if (response.ok) {
      setContent(data.content);
    } else {
      setError(data.error || "Failed to load content");
    }
    setLoading(false);
  }, [contentId, router]);

  useEffect(() => {
    void fetchContent();
  }, [fetchContent]);

  async function handleReview(status: "approved" | "rejected") {
    if (status === "rejected" && !rejectionReason.trim()) {
      setSubmitError("Please provide a rejection reason");
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    const response = await fetch("/api/content/review", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content_id: content.id,
        status,
        rejection_reason: rejectionReason,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      setSuccess(true);
      setTimeout(() => {
        router.push("/merchant/content");
        router.refresh();
      }, 1500);
    } else {
      setSubmitError(data.error || "Failed to submit review");
    }
    setSubmitting(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-muted-foreground">Loading content...</div>
      </div>
    );
  }

  if (error || !content) {
    return (
      <div className="space-y-4">
        <Link href="/merchant/content">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Content
          </Button>
        </Link>
        <Card>
          <CardContent className="py-16 text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-destructive mb-4" />
            <p className="text-destructive">{error || "Content not found"}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const task = content.task;
  const campaign = content.campaign;
  const product = campaign?.product;
  const creator = content.creator;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/merchant/content">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Content Review
          </h1>
          <p className="text-muted-foreground">
            {task?.title || campaign?.title}
          </p>
        </div>
        <Badge
          variant={statusColors[content.status] || "secondary"}
          className="ml-auto"
        >
          {content.status}
        </Badge>
      </div>

      {success && (
        <div className="p-4 bg-green-100 text-green-800 rounded-md flex items-center gap-2">
          <CheckCircle className="h-5 w-5" />
          Review submitted successfully! Redirecting...
        </div>
      )}

      {submitError && (
        <div className="p-4 bg-destructive/10 text-destructive rounded-md flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          {submitError}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Content Details */}
        <Card>
          <CardHeader>
            <CardTitle>Submitted Content</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground">Platform</Label>
                <p className="text-sm flex items-center gap-1">
                  <Globe className="h-3 w-3" />
                  {content.platform}
                </p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Creator</Label>
                <p className="text-sm">{creator?.full_name || "Unknown"}</p>
                <p className="text-xs text-muted-foreground">
                  {creator?.email}
                </p>
              </div>
            </div>

            <div>
              <Label className="text-xs text-muted-foreground">Content URL</Label>
              <a
                href={content.content_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:underline flex items-center gap-1"
              >
                {content.content_url}
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>

            {content.content_title && (
              <div>
                <Label className="text-xs text-muted-foreground">Title</Label>
                <p className="text-sm font-medium">{content.content_title}</p>
              </div>
            )}

            {content.content_description && (
              <div>
                <Label className="text-xs text-muted-foreground">
                  Description / Caption
                </Label>
                <p className="text-sm whitespace-pre-wrap">
                  {content.content_description}
                </p>
              </div>
            )}

            {content.posted_at && (
              <div>
                <Label className="text-xs text-muted-foreground">
                  Posted At
                </Label>
                <p className="text-sm">
                  {new Date(content.posted_at).toLocaleDateString()}
                </p>
              </div>
            )}

            <div className="flex items-center gap-2">
              <div
                className={`w-5 h-5 rounded border flex items-center justify-center ${
                  content.disclosure_checked
                    ? "bg-green-100 border-green-300"
                    : "bg-red-100 border-red-300"
                }`}
              >
                {content.disclosure_checked && (
                  <Check className="h-3 w-3 text-green-600" />
                )}
              </div>
              <Label className="text-sm">
                Disclosure {content.disclosure_checked ? "confirmed" : "MISSING"}
              </Label>
            </div>

            {content.screenshot_url && (
              <div>
                <Label className="text-xs text-muted-foreground">
                  Screenshot
                </Label>
                <a
                  href={content.screenshot_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline"
                >
                  View screenshot
                </a>
              </div>
            )}

            {content.rejection_reason && (
              <div className="p-3 bg-destructive/10 rounded-md">
                <Label className="text-xs text-destructive">
                  Previous Rejection Reason
                </Label>
                <p className="text-sm text-destructive mt-1">
                  {content.rejection_reason}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Campaign Info */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Campaign & Task Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-xs text-muted-foreground">Campaign</Label>
                <p className="text-sm font-medium">{campaign?.title}</p>
              </div>

              {product && (
                <div className="flex gap-4">
                  {product.image_url && (
                    <Image
                      src={product.image_url}
                      alt={product.title}
                      width={64}
                      height={64}
                      className="w-16 h-16 object-cover rounded-md border"
                    />
                  )}
                  <div>
                    <Label className="text-xs text-muted-foreground">
                      Product
                    </Label>
                    <p className="text-sm">{product.title}</p>
                  </div>
                </div>
              )}

              {task?.description && (
                <div>
                  <Label className="text-xs text-muted-foreground">
                    Task Description
                  </Label>
                  <p className="text-sm">{task.description}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">
                    Task Status
                  </Label>
                  <p className="text-sm capitalize">{task?.status}</p>
                </div>
                {campaign?.commission_rate && (
                  <div>
                    <Label className="text-xs text-muted-foreground">
                      Commission Rate
                    </Label>
                    <p className="text-sm">
                      {campaign.commission_rate}%
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Review Actions */}
          {content.status === "pending" && (
            <Card>
              <CardHeader>
                <CardTitle>Review Decision</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="rejectionReason">
                    Rejection Reason (required if rejecting)
                  </Label>
                  <Textarea
                    id="rejectionReason"
                    placeholder="Explain why content is being rejected..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 bg-green-600 hover:bg-green-700 hover:text-white text-white"
                    onClick={() => handleReview("approved")}
                    disabled={submitting}
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Approve
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={() => handleReview("rejected")}
                    disabled={submitting}
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Reject
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {content.status !== "pending" && (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                This content has already been {content.status}.
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
