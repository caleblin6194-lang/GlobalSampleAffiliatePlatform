'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Video, Plus, Loader2 } from 'lucide-react';

type Channel = {
  platform: string;
  handle: string;
  followers: number | null;
};

const PLATFORM_OPTIONS = ['TikTok', 'Instagram', 'YouTube', 'Xiaohongshu', 'Other'];

export default function CreatorChannelsPage() {
  const router = useRouter();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [platform, setPlatform] = useState('TikTok');
  const [handle, setHandle] = useState('');
  const [followers, setFollowers] = useState('0');

  const loadChannels = useCallback(async () => {
    try {
      const supabase = createClient();
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        router.push('/login');
        return;
      }

      const { data, error: listError } = await supabase
        .from('creator_channels')
        .select('platform, handle, followers')
        .eq('creator_id', user.id)
        .order('followers', { ascending: false });

      if (listError) {
        setError(listError.message || 'Failed to load channels.');
        setLoading(false);
        return;
      }

      setChannels((data as Channel[]) || []);
      setLoading(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load channels.';
      setError(message);
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void loadChannels();
  }, [loadChannels]);

  const handleCreate = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setError('');
      setSubmitting(true);

      try {
        const supabase = createClient();
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          router.push('/login');
          return;
        }

        const normalizedFollowers = Number.parseInt(followers, 10);
        const payload = {
          creator_id: user.id,
          platform,
          handle: handle.trim(),
          followers: Number.isNaN(normalizedFollowers) ? 0 : Math.max(0, normalizedFollowers),
        };

        if (!payload.handle) {
          setError('Please enter your channel handle.');
          return;
        }

        const { error: insertError } = await supabase.from('creator_channels').insert(payload);
        if (insertError) {
          setError(insertError.message || 'Failed to add channel.');
          return;
        }

        setHandle('');
        setFollowers('0');
        await loadChannels();
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to add channel.';
        setError(message);
      } finally {
        setSubmitting(false);
      }
    },
    [followers, handle, loadChannels, platform, router]
  );

  const totalFollowers = channels.reduce((sum, ch) => sum + (ch.followers || 0), 0);

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Channels</h1>
          <p className="text-muted-foreground">Manage your social channels for campaign matching.</p>
        </div>
        <Badge variant="outline" className="text-sm">
          {channels.length} channel{channels.length === 1 ? '' : 's'}
        </Badge>
      </div>

      {error && <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

      <Card>
        <CardHeader>
          <CardTitle>Add Channel</CardTitle>
          <CardDescription>Connect your public account so brands can review your audience.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="platform">Platform</Label>
              <select
                id="platform"
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {PLATFORM_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="handle">Handle / Channel Name</Label>
              <Input
                id="handle"
                placeholder="@yourname"
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="followers">Followers</Label>
              <Input
                id="followers"
                type="number"
                min={0}
                value={followers}
                onChange={(e) => setFollowers(e.target.value)}
              />
            </div>
            <div className="md:col-span-4">
              <Button type="submit" disabled={submitting} className="gap-2">
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    Add Channel
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Connected Channels</CardTitle>
          <CardDescription>
            Total followers: <span className="font-medium">{totalFollowers.toLocaleString()}</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-sm text-muted-foreground">Loading channels...</div>
          ) : channels.length === 0 ? (
            <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
              No channels yet. Add your first channel above.
            </div>
          ) : (
            <div className="space-y-3">
              {channels.map((channel, idx) => (
                <div key={`${channel.platform}-${channel.handle}-${idx}`} className="flex items-center gap-3 rounded-lg border p-3">
                  <div className="rounded-full bg-primary/10 p-2">
                    <Video className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{channel.platform}</p>
                    <p className="text-xs text-muted-foreground truncate">{channel.handle}</p>
                  </div>
                  <p className="text-sm font-medium">
                    {(Number(channel.followers) || 0).toLocaleString()} followers
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
