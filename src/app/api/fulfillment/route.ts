import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// GET /api/fulfillment - Vendor fulfillment orders list
export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify vendor role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'vendor' && profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');

  // Get vendor's vendor record
  const { data: vendor } = await supabase
    .from('vendors')
    .select('id')
    .eq('user_id', user.id)
    .single();

  let query = supabase
    .from('fulfillment_orders')
    .select(`
      id, order_type, customer_name, phone, country, state, city, address_line1, postal_code,
      status, notes, created_at, updated_at,
      campaign:campaigns(id, title),
      application:campaign_applications(id, shipping_name),
      order:orders(id, customer_name, customer_email, amount, status),
      items:order_items(
        id, qty, unit_price,
        variant:product_variants(id, model, color, series, barcode_code),
        product:products(id, title)
      ),
      shipments(id, carrier, tracking_no, shipped_at, status)
    `)
    .order('created_at', { ascending: false });

  // Filter by vendor if vendor role
  if (profile?.role === 'vendor' && vendor) {
    query = query.eq('vendor_id', vendor.id);
  }

  if (status) {
    query = query.eq('status', status);
  }

  const { data: orders, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ orders });
}
