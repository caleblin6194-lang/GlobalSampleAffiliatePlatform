import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const formData = await request.formData();
  const id = formData.get('id') as string;
  const status = formData.get('status') as string;
  const rejection_reason = formData.get('rejection_reason') as string || null;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Verify ownership
  const { data: app } = await supabase
    .from('campaign_applications')
    .select('campaign_id, status')
    .eq('id', id)
    .single();

  if (!app) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (app.status !== 'pending') return NextResponse.json({ error: 'Already reviewed' }, { status: 400 });

  const { error } = await supabase
    .from('campaign_applications')
    .update({ status, rejection_reason })
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.redirect(request.headers.get('referer') || '/merchant/applications');
}
