import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// PATCH /api/content/review - Review content (approve/reject)
export async function PATCH(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'merchant' && profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const { content_id, status, rejection_reason } = body;

  if (!content_id || !status) {
    return NextResponse.json({ error: 'content_id and status are required' }, { status: 400 });
  }

  if (!['approved', 'rejected'].includes(status)) {
    return NextResponse.json({ error: 'Status must be approved or rejected' }, { status: 400 });
  }

  // Get content with campaign info to verify ownership
  const { data: content } = await supabase
    .from('creator_contents')
    .select(`
      id, task_id, status, campaign_id,
      campaign:campaigns(merchant_id)
    `)
    .eq('id', content_id)
    .single();

  if (!content) {
    return NextResponse.json({ error: 'Content not found' }, { status: 404 });
  }

  if (content.status !== 'pending') {
    return NextResponse.json({ error: 'Content already reviewed' }, { status: 400 });
  }

  // Verify merchant owns this campaign
  const campaign = content.campaign as unknown as { merchant_id: string };
  if (profile?.role === 'merchant' && campaign.merchant_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Update content status
  const { error: contentError } = await supabase
    .from('creator_contents')
    .update({ 
      status,
      rejection_reason: status === 'rejected' ? rejection_reason : null
    })
    .eq('id', content_id);

  if (contentError) {
    return NextResponse.json({ error: contentError.message }, { status: 500 });
  }

  // Update task status to match
  const { error: taskError } = await supabase
    .from('creator_tasks')
    .update({ status })
    .eq('id', content.task_id);

  if (taskError) {
    return NextResponse.json({ error: taskError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

// GET /api/content/review - Get single content for review
export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const { searchParams } = new URL(request.url);
  const contentId = searchParams.get('id');

  if (!contentId) {
    return NextResponse.json({ error: 'Content ID required' }, { status: 400 });
  }

  const { data: content, error } = await supabase
    .from('creator_contents')
    .select(`
      id, creator_id, platform, content_url, content_title, content_description,
      posted_at, disclosure_checked, screenshot_url, status,
      rejection_reason, created_at, updated_at,
      task:creator_tasks(id, title, status, description),
      campaign:campaigns(id, title, description, merchant_id, commission_rate,
        product:products(id, title, description, image_url)
      ),
      creator:profiles!creator_contents_creator_id_fkey(id, full_name, email)
    `)
    .eq('id', contentId)
    .single();

  if (error || !content) {
    return NextResponse.json({ error: 'Content not found' }, { status: 404 });
  }

  // Verify permission
  const campaign = content.campaign as unknown as { merchant_id: string };
  const canView = 
    profile?.role === 'admin' ||
    (profile?.role === 'merchant' && campaign.merchant_id === user.id) ||
    content.creator_id === user.id;

  if (!canView) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return NextResponse.json({ content });
}
