import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// GET /api/orders/[id]
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: order, error } = await supabase
    .from('orders')
    .select(`
      id, customer_name, customer_email, customer_phone, amount, status,
      attribution_source, notes, created_at, updated_at, creator_id,
      campaign:campaigns(id, title, merchant_id),
      creator:profiles!orders_creator_id_fkey(id, full_name),
      affiliate_link:affiliate_links(code),
      coupon_code:coupon_codes(code),
      items:order_items(
        id, qty, unit_price,
        product:products(id, title)
      )
    `)
    .eq('id', params.id)
    .single();

  if (error || !order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  // Permission check
  const campaign = order.campaign as unknown as { merchant_id: string };
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const canView =
    profile?.role === 'admin' ||
    campaign.merchant_id === user.id ||
    order.creator_id === user.id;

  if (!canView) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return NextResponse.json({ order });
}

// PATCH /api/orders/[id] - Update order status
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { status } = body;

  // Get order to verify ownership
  const { data: order } = await supabase
    .from('orders')
    .select(`
      id, status, campaign_id,
      campaign:campaigns(merchant_id)
    `)
    .eq('id', params.id)
    .single();

  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  const campaign = order.campaign as unknown as { merchant_id: string };
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const canUpdate =
    profile?.role === 'admin' ||
    campaign.merchant_id === user.id;

  if (!canUpdate) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Validate status
  const validStatuses = ['pending', 'paid', 'cancelled', 'refunded'];
  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  }

  const { error: updateError } = await supabase
    .from('orders')
    .update({ status })
    .eq('id', params.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
