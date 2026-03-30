import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// GET /api/tasks/[id] - Get single task detail
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
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

  const { data: task, error } = await supabase
    .from('creator_tasks')
    .select(`
      id, status, title, description, due_at, created_at, updated_at, creator_id, merchant_id, campaign_id,
      campaign:campaigns(
        id, title, description, commission_rate, sample_qty,
        product:products(id, title, description, image_url, category)
      ),
      merchant:profiles!creator_tasks_merchant_id_fkey(id, full_name, email),
      creator:profiles!creator_tasks_creator_id_fkey(id, full_name, email),
      application:campaign_applications(id, selected_platform, shipping_name, phone, address_line1, city, state, postal_code, country),
      content:creator_contents(id, platform, content_url, content_title, content_description, posted_at, disclosure_checked, screenshot_url, status, rejection_reason, created_at)
    `)
    .eq('id', params.id)
    .single();

  if (error || !task) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  }

  // Permission check
  const canView = 
    profile?.role === 'admin' ||
    task.creator_id === user.id ||
    task.merchant_id === user.id;

  if (!canView) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return NextResponse.json({ task });
}

// PATCH /api/tasks/[id] - Update task status
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
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

  const body = await request.json();
  const { status } = body;

  // Get task to verify ownership
  const { data: task } = await supabase
    .from('creator_tasks')
    .select('creator_id, merchant_id, status')
    .eq('id', params.id)
    .single();

  if (!task) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  }

  // Permission check - merchants can update if they're the merchant_id
  const canUpdate = 
    profile?.role === 'admin' ||
    (profile?.role === 'merchant' && task.merchant_id === user.id);

  if (!canUpdate) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { error } = await supabase
    .from('creator_tasks')
    .update({ status })
    .eq('id', params.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
