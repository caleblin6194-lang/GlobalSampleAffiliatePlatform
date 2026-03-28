import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// GET /api/tasks - List tasks for current user
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

  let query = supabase
    .from('creator_tasks')
    .select(`
      id, status, title, description, due_at, created_at, updated_at,
      campaign:campaigns(id, title, description, product_id),
      merchant:profiles!creator_tasks_merchant_id_fkey(full_name),
      application:campaign_applications(id, selected_platform)
    `)
    .order('created_at', { ascending: false });

  // Role-based filtering
  if (profile?.role === 'creator') {
    query = query.eq('creator_id', user.id);
  } else if (profile?.role === 'merchant') {
    query = query.eq('merchant_id', user.id);
  }
  // admin sees all

  if (status) {
    query = query.eq('status', status);
  }

  const { data: tasks, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ tasks });
}
