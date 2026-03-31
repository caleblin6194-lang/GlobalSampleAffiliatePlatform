import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// GET /api/content - List content for merchant review
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
  const status = searchParams.get('status');
  const campaignId = searchParams.get('campaign_id');

  let query = supabase
    .from('creator_contents')
    .select(`
      id, platform, content_url, content_title, content_description, 
      posted_at, disclosure_checked, screenshot_url, status, 
      rejection_reason, created_at, updated_at,
      task:creator_tasks(id, title, status),
      campaign:campaigns(id, title, merchant_id),
      creator:profiles!creator_contents_creator_id_fkey(full_name, email)
    `)
    .order('created_at', { ascending: false });

  // Role-based filtering
  if (profile?.role === 'merchant') {
    // Get merchant's campaign IDs first
    const { data: merchantCampaigns } = await supabase
      .from('campaigns')
      .select('id')
      .eq('merchant_id', user.id);
    
    const campaignIds = merchantCampaigns?.map(c => c.id) || [];
    query = query.in('campaign_id', campaignIds);
  } else if (profile?.role === 'creator') {
    query = query.eq('creator_id', user.id);
  }
  // admin sees all

  if (status) {
    query = query.eq('status', status);
  }

  if (campaignId) {
    query = query.eq('campaign_id', campaignId);
  }

  const { data: contents, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ contents });
}

// POST /api/content - Submit content
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Role check - only creators can submit content
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'creator' && profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const { 
    task_id, 
    platform, 
    content_url, 
    content_title, 
    content_description, 
    posted_at, 
    disclosure_checked, 
    screenshot_url 
  } = body;

  // Verify task belongs to this creator
  const { data: task } = await supabase
    .from('creator_tasks')
    .select('id, creator_id, status, campaign_id')
    .eq('id', task_id)
    .single();

  if (!task) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  }

  if (task.creator_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (task.status !== 'pending') {
    return NextResponse.json({ error: 'Task is not pending content submission' }, { status: 400 });
  }

  // Check if content already exists for this task
  const { data: existingContent } = await supabase
    .from('creator_contents')
    .select('id')
    .eq('task_id', task_id)
    .single();

  if (existingContent) {
    return NextResponse.json({ error: 'Content already submitted for this task' }, { status: 400 });
  }

  // Insert content
  const { data: content, error } = await supabase
    .from('creator_contents')
    .insert({
      task_id,
      creator_id: user.id,
      campaign_id: task.campaign_id,
      platform,
      content_url,
      content_title,
      content_description,
      posted_at: posted_at || new Date().toISOString(),
      disclosure_checked,
      screenshot_url,
      status: 'pending'
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Update task status to submitted
  await supabase
    .from('creator_tasks')
    .update({ status: 'submitted' })
    .eq('id', task_id);

  return NextResponse.json({ content }, { status: 201 });
}
