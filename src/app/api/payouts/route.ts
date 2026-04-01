import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// GET /api/payouts - Get user's payout history
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: payouts, error } = await supabase
    .from('payouts')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ payouts });
}

// POST /api/payouts - Request a payout
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Role check
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'creator' && profile?.role !== 'buyer') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const { amount, payment_method, payment_reference } = body;

  if (!amount || amount <= 0) {
    return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
  }

  // Check withdrawable balance
  const { data: commissions } = await supabase
    .from('commissions')
    .select('amount')
    .eq('creator_id', user.id)
    .eq('status', 'approved');

  const approvedCommission = commissions?.reduce((sum: number, c: any) => sum + (c.amount || 0), 0) || 0;

  const { data: pendingPayouts } = await supabase
    .from('payouts')
    .select('amount')
    .eq('user_id', user.id)
    .eq('status', 'pending');

  const pendingPayoutAmount = pendingPayouts?.reduce((sum: number, p: any) => sum + (p.amount || 0), 0) || 0;
  const withdrawableBalance = Math.max(0, approvedCommission - pendingPayoutAmount);

  if (amount > withdrawableBalance) {
    return NextResponse.json(
      { error: `Insufficient balance. Withdrawable: $${withdrawableBalance.toFixed(2)}` },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from('payouts')
    .insert({
      user_id: user.id,
      amount,
      payment_method,
      payment_reference,
      status: 'pending',
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ payout: data }, { status: 201 });
}
