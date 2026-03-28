'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function NewCampaignPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('products')
        .select('id, title, category')
        .eq('merchant_id', user.id)
        .eq('status', 'active');
      setProducts(data || []);
    };
    load();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const form = e.target as HTMLFormElement;
    const fd = new FormData(form);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/login'); return; }

    const { error } = await supabase.from('campaigns').insert({
      merchant_id: user.id,
      product_id: fd.get('product_id') as string,
      title: fd.get('title') as string,
      description: fd.get('description') as string,
      sample_qty: parseInt(fd.get('sample_qty') as string) || 0,
      commission_rate: parseFloat(fd.get('commission_rate') as string) || 0,
      status: fd.get('status') as string || 'active',
    });

    if (error) {
      alert('Error: ' + error.message);
      setLoading(false);
    } else {
      router.push('/merchant/campaigns');
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">Create Campaign</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader><CardTitle>Campaign Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Select Product *</Label>
              <select name="product_id" required className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm">
                <option value="">Choose a product...</option>
                {products.map(p => <option key={p.id} value={p.id}>{p.title} ({p.category})</option>)}
              </select>
            </div>
            <div><Label>Campaign Title *</Label><Input name="title" required placeholder="e.g. iPhone Case Review Campaign" /></div>
            <div><Label>Description</Label><textarea name="description" className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm" rows={3} placeholder="What should creators do?" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Sample Quantity *</Label><Input name="sample_qty" type="number" required min={1} defaultValue={10} /></div>
              <div><Label>Commission Rate (%)</Label><Input name="commission_rate" type="number" step="0.01" min={0} max={100} defaultValue={10} /></div>
            </div>
            <div>
              <Label>Status</Label>
              <select name="status" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm">
                <option value="active">Active</option>
                <option value="draft">Draft</option>
                <option value="closed">Closed</option>
              </select>
            </div>
          </CardContent>
        </Card>
        <div className="flex gap-4">
          <Button type="submit" disabled={loading}>{loading ? 'Creating...' : 'Create Campaign'}</Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}
