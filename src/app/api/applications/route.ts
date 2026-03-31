import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const ApplicationSchema = z.object({
  campaign_id: z.string().uuid(),
  shipping_name: z.string().min(1, 'Shipping name is required'),
  phone: z.string().min(1, 'Phone is required'),
  country: z.string().min(1, 'Country is required'),
  state: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  address_line1: z.string().min(1, 'Address is required'),
  address_line2: z.string().optional(),
  postal_code: z.string().min(1, 'Postal code is required'),
  notes: z.string().optional(),
  selected_platform: z.string().min(1, 'Platform is required'),
});

// GET: List applications (filtered by role)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const role = searchParams.get('role');
  const userId = searchParams.get('userId');
  const campaignId = searchParams.get('campaignId');

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Role check - only merchants, admins, or creators can view applications
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'merchant' && profile?.role !== 'admin' && profile?.role !== 'creator') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

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

  // Role check - only creators can apply
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'creator' && profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();

  // Validate request body
  const validationResult = ApplicationSchema.safeParse(body);
  if (!validationResult.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: validationResult.error.flatten() },
      { status: 400 }
    );
  }

  const {
    campaign_id, shipping_name, phone, country, state, city,
    address_line1, address_line2, postal_code, notes, selected_platform
  } = validationResult.data;

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

  // Role check - only merchants or admins can review
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'merchant' && profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

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
