import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// GET /api/shipments - List shipments
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

  const { data: vendor } = await supabase
    .from('vendors')
    .select('id')
    .eq('user_id', user.id)
    .single();

  let query = supabase
    .from('shipments')
    .select(`
      id, carrier, tracking_no, shipped_at, delivered_at, status, created_at,
      fulfillment_order:fulfillment_orders(
        id, order_type, customer_name, status,
        campaign:campaigns(title),
        order:orders(customer_email)
      )
    `)
    .order('shipped_at', { ascending: false });

  // Filter by vendor if vendor role
  if (profile?.role === 'vendor' && vendor) {
    query = query.contains('fulfillment_order', { vendor_id: vendor.id });
  }

  const { data: shipments, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ shipments });
}
