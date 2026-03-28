import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// GET /api/merchant/fulfillment - Merchant fulfillment overview
export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify merchant role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'merchant' && profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Get merchant's campaigns
  const { data: campaigns } = await supabase
    .from('campaigns')
    .select('id, title')
    .eq('merchant_id', user.id);

  const campaignIds = campaigns?.map(c => c.id) || [];

  if (campaignIds.length === 0) {
    return NextResponse.json({
      summary: { total: 0, pending_pick: 0, picking: 0, packed: 0, shipped: 0, delivered: 0 },
      byCampaign: [],
      orders: [],
    });
  }

  // Get fulfillment orders for merchant's campaigns
  const { data: orders } = await supabase
    .from('fulfillment_orders')
    .select(`
      id, order_type, customer_name, status, created_at,
      campaign:campaigns(id, title),
      vendor:vendors(id, vendor_name),
      shipments(id, carrier, tracking_no, shipped_at, status)
    `)
    .in('campaign_id', campaignIds)
    .order('created_at', { ascending: false });

  // Calculate summary
  const summary = {
    total: orders?.length || 0,
    pending_pick: orders?.filter(o => o.status === 'pending_pick').length || 0,
    picking: orders?.filter(o => o.status === 'picking').length || 0,
    packed: orders?.filter(o => o.status === 'packed').length || 0,
    shipped: orders?.filter(o => o.status === 'shipped').length || 0,
    delivered: orders?.filter(o => o.status === 'delivered').length || 0,
  };

  // Group by campaign
  const byCampaign = campaigns?.map(campaign => {
    const campaignOrders = orders?.filter(o => o.campaign_id === campaign.id) || [];
    return {
      campaign: campaign.title,
      campaignId: campaign.id,
      total: campaignOrders.length,
      pending: campaignOrders.filter(o => ['pending_pick', 'picking', 'packed'].includes(o.status)).length,
      shipped: campaignOrders.filter(o => o.status === 'shipped').length,
      delivered: campaignOrders.filter(o => o.status === 'delivered').length,
    };
  }) || [];

  return NextResponse.json({
    summary,
    byCampaign,
    orders: orders?.slice(0, 20) || [], // Recent 20
  });
}
