'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Image from "next/image";

export default function ApplyCampaignPage() {
  const router = useRouter();
  const params = useParams();
  const campaignId = params.id as string;
  const [loading, setLoading] = useState(false);
  const [campaign, setCampaign] = useState<any>(null);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from('campaigns')
        .select(`
          id, title, description, sample_qty, commission_rate,
          product:products(title, image_url),
          merchant:profiles(full_name)
        `)
        .eq('id', campaignId)
        .single();
      setCampaign(data);
    };
    void load();
  }, [campaignId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const form = e.target as HTMLFormElement;
    const fd = new FormData(form);
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/login'); return; }

    const { error } = await supabase
      .from('campaign_applications')
      .insert({
        campaign_id: campaignId,
        creator_id: user.id,
        shipping_name: fd.get('shipping_name') as string,
        phone: fd.get('phone') as string,
        country: fd.get('country') as string,
        state: fd.get('state') as string,
        city: fd.get('city') as string,
        address_line1: fd.get('address_line1') as string,
        address_line2: fd.get('address_line2') as string || null,
        postal_code: fd.get('postal_code') as string,
        notes: fd.get('notes') as string || null,
        selected_platform: fd.get('selected_platform') as string,
        status: 'pending',
      });

    if (error) {
      alert('Error: ' + error.message);
      setLoading(false);
    } else {
      router.push('/creator/campaigns');
    }
  };

  if (!campaign) {
    return <div className="p-6">Loading...</div>;
  }

  const product = campaign.product as unknown as { title: string; image_url: string } | null;
  const merchant = campaign.merchant as unknown as { full_name: string } | null;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Apply for Campaign</h1>
        <p className="text-muted-foreground">{campaign.title}</p>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            {product?.image_url && (
              <Image
                src={product.image_url}
                alt={product.title || "Product image"}
                width={64}
                height={64}
                className="w-16 h-16 object-cover rounded"
              />
            )}
            <div>
              <p className="font-medium">{product?.title || 'Product'}</p>
              <p className="text-sm text-muted-foreground">by {merchant?.full_name || 'Merchant'}</p>
              <div className="flex gap-2 mt-1">
                <span className="text-xs bg-primary/10 px-2 py-0.5 rounded">{campaign.sample_qty} samples</span>
                <span className="text-xs bg-primary/10 px-2 py-0.5 rounded">{campaign.commission_rate}% commission</span>
              </div>
            </div>
          </div>
          {campaign.description && (
            <p className="text-sm text-muted-foreground mt-3">{campaign.description}</p>
          )}
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader><CardTitle>Shipping Information</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div><Label>Full Name *</Label><Input name="shipping_name" required placeholder="Your full name" /></div>
            <div><Label>Phone Number *</Label><Input name="phone" required type="tel" placeholder="+1 234 567 8900" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Country *</Label><Input name="country" required placeholder="Country" /></div>
              <div><Label>State/Province *</Label><Input name="state" required placeholder="State" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>City *</Label><Input name="city" required placeholder="City" /></div>
              <div><Label>Postal Code *</Label><Input name="postal_code" required placeholder="Postal code" /></div>
            </div>
            <div><Label>Address Line 1 *</Label><Input name="address_line1" required placeholder="Street address" /></div>
            <div><Label>Address Line 2</Label><Input name="address_line2" placeholder="Apt, suite, etc. (optional)" /></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Platform & Notes</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Primary Platform *</Label>
              <select name="selected_platform" required className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm">
                <option value="">Select platform...</option>
                <option value="Instagram">Instagram</option>
                <option value="TikTok">TikTok</option>
                <option value="YouTube">YouTube</option>
                <option value="Twitter">Twitter</option>
                <option value="Facebook">Facebook</option>
                <option value="小红书">小红书</option>
                <option value="抖音">抖音</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div><Label>Additional Notes</Label><textarea name="notes" className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm" rows={3} placeholder="Tell us about your content style, audience, etc." /></div>
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button type="submit" disabled={loading}>{loading ? 'Submitting...' : 'Submit Application'}</Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}
