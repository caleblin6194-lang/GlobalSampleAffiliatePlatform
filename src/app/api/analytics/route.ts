import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// GET /api/analytics - Merchant analytics
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

  if (profile?.role !== 'merchant' && profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Get merchant's campaigns
  const { data: campaigns } = await supabase
    .from('campaigns')
    .select('id, title, commission_rate')
    .eq('merchant_id', user.id);

  const campaignIds = campaigns?.map(c => c.id) || [];

  if (campaignIds.length === 0) {
    return NextResponse.json({
      campaigns: [],
      totals: {
        totalClicks: 0,
        totalOrders: 0,
        totalOrderAmount: 0,
        totalCommissions: 0,
        conversionRate: 0,
      },
      byCampaign: [],
    });
  }

  // Get clicks per campaign
  const { data: clicks } = await supabase
    .from('clicks')
    .select('campaign_id')
    .in('campaign_id', campaignIds);

  const clicksByCampaign: Record<string, number> = {};
  clicks?.forEach(click => {
    const cid = click.campaign_id;
    if (cid) {
      clicksByCampaign[cid] = (clicksByCampaign[cid] || 0) + 1;
    }
  });

  // Get orders per campaign
  const { data: orders } = await supabase
    .from('orders')
    .select(`
      id, campaign_id, amount, status, creator_id,
      creator:profiles!orders_creator_id_fkey(full_name)
    `)
    .in('campaign_id', campaignIds);

  // Get commissions per campaign
  const { data: commissions } = await supabase
    .from('commissions')
    .select('campaign_id, amount, status')
    .in('campaign_id', campaignIds);

  // Calculate per-campaign stats
  const byCampaign = campaigns?.map(campaign => {
    const campaignOrders = orders?.filter(o => o.campaign_id === campaign.id) || [];
    const paidOrders = campaignOrders.filter(o => o.status === 'paid');
    const campaignCommissions = commissions?.filter(co => co.campaign_id === campaign.id) || [];

    const totalClicks = clicksByCampaign[campaign.id] || 0;
    const totalOrders = paidOrders.length;
    const totalOrderAmount = paidOrders.reduce((sum, o) => sum + (o.amount || 0), 0);
    const totalCommissions = campaignCommissions
      .filter(c => c.status !== 'void')
      .reduce((sum, c) => sum + (c.amount || 0), 0);
    const conversionRate = totalClicks > 0 ? (totalOrders / totalClicks) * 100 : 0;

    return {
      campaign: campaign.title,
      campaignId: campaign.id,
      commissionRate: campaign.commission_rate,
      clicks: totalClicks,
      orders: totalOrders,
      orderAmount: totalOrderAmount,
      commissions: totalCommissions,
      conversionRate: conversionRate.toFixed(2),
    };
  }) || [];

  // Calculate totals
  const totalClicks = Object.values(clicksByCampaign).reduce((a, b) => a + b, 0);
  const totalOrders = orders?.filter(o => o.status === 'paid').length || 0;
  const totalOrderAmount = orders
    ?.filter(o => o.status === 'paid')
    .reduce((sum, o) => sum + (o.amount || 0), 0) || 0;
  const totalCommissions = commissions
    ?.filter(c => c.status !== 'void')
    .reduce((sum, c) => sum + (c.amount || 0), 0) || 0;
  const conversionRate = totalClicks > 0 ? (totalOrders / totalClicks) * 100 : 0;

  // Recent orders
  const recentOrders = orders
    ?.slice(0, 10)
    .map(o => ({
      id: o.id,
      amount: o.amount,
      status: o.status,
      creator: (o.creator as unknown as { full_name: string })?.full_name || 'Unknown',
      createdAt: o.id, // Use id as proxy for time
    })) || [];

  return NextResponse.json({
    campaigns,
    totals: {
      totalClicks,
      totalOrders,
      totalOrderAmount,
      totalCommissions,
      conversionRate: conversionRate.toFixed(2),
    },
    byCampaign,
    recentOrders,
  });
}
