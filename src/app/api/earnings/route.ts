import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// GET /api/earnings - Get creator earnings summary
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Role check - only creators can view their earnings
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'creator' && profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Get creator's affiliate links
  const { data: affiliateLinks } = await supabase
    .from('affiliate_links')
    .select('id, code, campaign_id, campaign:campaigns(title)')
    .eq('creator_id', user.id)
    .eq('is_active', true);

  const linkIds = affiliateLinks?.map(l => l.id) || [];

  // Get creator's coupons
  const { data: coupons } = await supabase
    .from('coupon_codes')
    .select('id, code, campaign_id, discount_type, discount_value, campaign:campaigns(title)')
    .eq('creator_id', user.id)
    .eq('is_active', true);

  // Get total clicks
  const { count: totalClicks } = await supabase
    .from('clicks')
    .select('*', { count: 'exact', head: true })
    .eq('creator_id', user.id);

  // Get click count per link
  const { data: clicksPerLink } = linkIds.length > 0
    ? await supabase
        .from('clicks')
        .select('affiliate_link_id')
        .in('affiliate_link_id', linkIds)
    : { data: [] };

  const clicksByLink: Record<string, number> = {};
  clicksPerLink?.forEach(click => {
    const linkId = click.affiliate_link_id;
    clicksByLink[linkId] = (clicksByLink[linkId] || 0) + 1;
  });

  // Get attributed orders
  const { data: orders } = await supabase
    .from('orders')
    .select(`
      id, amount, status, attribution_source, created_at,
      campaign:campaigns(title),
      affiliate_link_id
    `)
    .eq('creator_id', user.id)
    .in('status', ['paid', 'pending']);

  // Get commissions
  const { data: commissions } = await supabase
    .from('commissions')
    .select(`
      id, amount, rate, status, created_at,
      campaign:campaigns(title),
      order:orders(id, amount)
    `)
    .eq('creator_id', user.id)
    .order('created_at', { ascending: false });

  // Calculate totals
  const pendingCommission = commissions
    ?.filter(c => c.status === 'pending')
    .reduce((sum, c) => sum + (c.amount || 0), 0) || 0;

  const approvedCommission = commissions
    ?.filter(c => c.status === 'approved')
    .reduce((sum, c) => sum + (c.amount || 0), 0) || 0;

  const paidCommission = commissions
    ?.filter(c => c.status === 'paid')
    .reduce((sum, c) => sum + (c.amount || 0), 0) || 0;

  const totalPaidOrders = orders?.filter(o => o.status === 'paid').length || 0;
  const totalOrderAmount = orders
    ?.filter(o => o.status === 'paid')
    .reduce((sum, o) => sum + (o.amount || 0), 0) || 0;

  return NextResponse.json({
    affiliateLinks: affiliateLinks?.map(l => ({
      ...l,
      clicks: clicksByLink[l.id] || 0,
    })) || [],
    coupons: coupons || [],
    stats: {
      totalClicks: totalClicks || 0,
      totalOrders: totalPaidOrders,
      totalOrderAmount,
      pendingCommission,
      approvedCommission,
      paidCommission,
      totalCommission: pendingCommission + approvedCommission + paidCommission,
    },
    commissions: commissions || [],
  });
}
