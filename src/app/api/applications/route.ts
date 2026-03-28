import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// GET: List applications (filtered by role)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const role = searchParams.get('role');
  const userId = searchParams.get('userId');
  const campaignId = searchParams.get('campaignId');

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let query = supabase
    .from('campaign_applications')
    .select(`
      id,
      status,
      rejection_reason,
      shipping_name,
      phone,
      country,
      state,
      city,
      address_line1,
      postal_code,
      selected_platform,
      notes,
      created_at,
      updated_at,
      campaign:campaigns(id, title, sample_qty, commission_rate, status,
        product:products(title, image_url),
        merchant:profiles(full_name, email)
      ),
      creator:profiles(id, full_name, email)
    `)
    .order('created_at', { ascending: false });

  if (role === 'creator') {
    query = query.eq('creator_id', userId);
  } else if (role === 'merchant' && campaignId) {
    query = query.eq('campaign_id', campaignId);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// POST: Create application
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const {
    campaign_id, shipping_name, phone, country, state, city,
    address_line1, address_line2, postal_code, notes, selected_platform
  } = body;

  // Check if already applied
  const { data: existing } = await supabase
    .from('campaign_applications')
    .select('id')
    .eq('campaign_id', campaign_id)
    .eq('creator_id', user.id)
    .single();

  if (existing) {
    return NextResponse.json({ error: 'Already applied to this campaign' }, { status: 409 });
  }

  const { data, error } = await supabase
    .from('campaign_applications')
    .insert({
      campaign_id,
      creator_id: user.id,
      shipping_name,
      phone,
      country,
      state,
      city,
      address_line1,
      address_line2: address_line2 || null,
      postal_code,
      notes: notes || null,
      selected_platform,
      status: 'pending',
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

// PATCH: Update application status (merchant reviews)
export async function PATCH(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { id, status, rejection_reason } = body;

  // Verify merchant owns this campaign
  const { data: app } = await supabase
    .from('campaign_applications')
    .select('campaign_id, status')
    .eq('id', id)
    .single();

  if (!app) return NextResponse.json({ error: 'Application not found' }, { status: 404 });
  if (app.status !== 'pending') return NextResponse.json({ error: 'Already reviewed' }, { status: 400 });

  const { data, error } = await supabase
    .from('campaign_applications')
    .update({ status, rejection_reason: rejection_reason || null })
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
