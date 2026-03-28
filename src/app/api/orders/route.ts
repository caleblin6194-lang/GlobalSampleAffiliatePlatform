import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// GET /api/orders - List orders
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
    .from('orders')
    .select(`
      id, customer_name, customer_email, customer_phone, amount, status,
      attribution_source, notes, created_at, updated_at,
      campaign:campaigns(id, title, merchant_id),
      creator:profiles!orders_creator_id_fkey(id, full_name),
      affiliate_link:affiliate_links(code),
      coupon_code:coupon_codes(code),
      items:order_items(
        id, qty, unit_price,
        product:products(id, title)
      )
    `)
    .order('created_at', { ascending: false });

  // Role-based filtering
  if (profile?.role === 'merchant') {
    // Get merchant's campaign IDs
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

  const { data: orders, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ orders });
}

// POST /api/orders - Create order
export async function POST(request: Request) {
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
  const {
    campaign_id,
    creator_id,
    affiliate_link_id,
    coupon_code_id,
    customer_name,
    customer_email,
    customer_phone,
    amount,
    attribution_source,
    notes,
    items,
  } = body;

  // Verify campaign belongs to merchant
  if (profile?.role === 'merchant') {
    const { data: campaign } = await supabase
      .from('campaigns')
      .select('id, merchant_id')
      .eq('id', campaign_id)
      .single();

    if (!campaign || campaign.merchant_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }

  // Create order
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      campaign_id,
      creator_id: creator_id || null,
      affiliate_link_id: affiliate_link_id || null,
      coupon_code_id: coupon_code_id || null,
      customer_name,
      customer_email: customer_email || null,
      customer_phone: customer_phone || null,
      amount: amount || 0,
      status: 'pending',
      attribution_source: attribution_source || 'manual',
      notes: notes || null,
    })
    .select()
    .single();

  if (orderError) {
    return NextResponse.json({ error: orderError.message }, { status: 500 });
  }

  // Create order items
  if (items && items.length > 0) {
    const orderItems = items.map((item: any) => ({
      order_id: order.id,
      product_id: item.product_id,
      variant_id: item.variant_id || null,
      qty: item.qty || 1,
      unit_price: item.unit_price || 0,
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      return NextResponse.json({ error: itemsError.message }, { status: 500 });
    }

    // Recalculate total from items
    const total = orderItems.reduce((sum: number, item: any) => sum + (item.qty * item.unit_price), 0);
    await supabase
      .from('orders')
      .update({ amount: total })
      .eq('id', order.id);
  }

  return NextResponse.json({ order }, { status: 201 });
}
