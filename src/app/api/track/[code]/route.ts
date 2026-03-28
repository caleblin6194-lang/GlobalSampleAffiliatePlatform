import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';

// GET /api/track/[code] - Track click and redirect
export async function GET(
  request: Request,
  { params }: { params: { code: string } }
) {
  const supabase = await createClient();
  const headersList = headers();

  // Find affiliate link by code
  const { data: affiliateLink, error } = await supabase
    .from('affiliate_links')
    .select(`
      id, code, target_path, is_active,
      creator_id,
      campaign:campaigns(id, title, status)
    `)
    .eq('code', params.code)
    .eq('is_active', true)
    .single();

  if (error || !affiliateLink) {
    // Redirect to home if link not found
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Check campaign is active
  const campaign = affiliateLink.campaign as unknown as { id: string; status: string };
  if (!campaign || campaign.status !== 'active') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Record the click (async, don't wait)
  const referer = headersList.get('referer') || null;
  const userAgent = headersList.get('user-agent') || null;

  await supabase
    .from('clicks')
    .insert({
      affiliate_link_id: affiliateLink.id,
      creator_id: affiliateLink.creator_id,
      campaign_id: campaign.id,
      referrer: referer,
      user_agent: userAgent,
    });

  // Redirect to target path
  const targetPath = affiliateLink.target_path || `/campaigns/${campaign.id}`;
  return NextResponse.redirect(new URL(targetPath, request.url));
}
