import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// GET /api/fulfillment/[id]
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: fulfillmentOrder, error } = await supabase
    .from('fulfillment_orders')
    .select(`
      id, order_type, customer_name, phone, country, state, city, address_line1, address_line2, postal_code,
      status, notes, created_at, updated_at,
      vendor_id, merchant_id, creator_id, campaign_id, order_id, application_id, task_id,
      campaign:campaigns(id, title, description),
      application:campaign_applications(id, shipping_name, phone, country, state, city, address_line1, address_line2, postal_code),
      order:orders(id, customer_name, customer_email, customer_phone, amount, status),
      creator:profiles!fulfillment_orders_creator_id_fkey(id, full_name),
      vendor:vendors(id, vendor_name),
      items:order_items(
        id, qty, unit_price,
        variant:product_variants(id, model, color, series, barcode_code),
        product:products(id, title, image_url)
      ),
      shipments(id, carrier, tracking_no, shipped_at, delivered_at, status)
    `)
    .eq('id', params.id)
    .single();

  if (error || !fulfillmentOrder) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  // Permission check
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const { data: vendor } = await supabase
    .from('vendors')
    .select('id')
    .eq('user_id', user.id)
    .single();

  const canView =
    profile?.role === 'admin' ||
    fulfillmentOrder.vendor_id === vendor?.id ||
    fulfillmentOrder.merchant_id === user.id ||
    fulfillmentOrder.creator_id === user.id;

  if (!canView) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return NextResponse.json({ order: fulfillmentOrder });
}

// PATCH /api/fulfillment/[id] - Update fulfillment status
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Role check - only vendors or admins
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'vendor' && profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Verify vendor role
  const { data: vendor } = await supabase
    .from('vendors')
    .select('id')
    .eq('user_id', user.id)
    .single();

  // Get order to verify ownership
  const { data: order } = await supabase
    .from('fulfillment_orders')
    .select('id, vendor_id, status')
    .eq('id', params.id)
    .single();

  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  if (order.vendor_id !== vendor?.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Validate status transition
  const validTransitions: Record<string, string[]> = {
    pending_pick: ['picking', 'cancelled'],
    picking: ['packed', 'cancelled'],
    packed: ['shipped'],
    shipped: ['delivered'],
  };

  const body = await request.json();
  const { status, notes, carrier, tracking_no } = body;

  if (!validTransitions[order.status]?.includes(status)) {
    return NextResponse.json({
      error: `Invalid status transition from ${order.status} to ${status}`
    }, { status: 400 });
  }

  // If shipping, require tracking info
  if (status === 'shipped' && (!carrier || !tracking_no)) {
    return NextResponse.json({
      error: 'Carrier and tracking number are required for shipped status'
    }, { status: 400 });
  }

  // Check if shipment already exists
  if (status === 'shipped') {
    const { data: existingShipment } = await supabase
      .from('shipments')
      .select('id')
      .eq('fulfillment_order_id', params.id)
      .single();

    if (existingShipment) {
      return NextResponse.json({ error: 'Shipment already exists for this order' }, { status: 400 });
    }
  }

  // Update fulfillment order status
  const { error: updateError } = await supabase
    .from('fulfillment_orders')
    .update({ status, notes })
    .eq('id', params.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // Create shipment if shipped
  if (status === 'shipped') {
    const { error: shipmentError } = await supabase
      .from('shipments')
      .insert({
        fulfillment_order_id: params.id,
        carrier,
        tracking_no,
        status: 'in_transit',
      });

    if (shipmentError) {
      return NextResponse.json({ error: shipmentError.message }, { status: 500 });
    }
  }

  return NextResponse.json({ success: true });
}
