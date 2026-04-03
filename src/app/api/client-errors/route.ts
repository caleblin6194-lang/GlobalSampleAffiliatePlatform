import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.error('ClientErrorReport:', body);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid error payload';
    return NextResponse.json({ ok: false, message }, { status: 400 });
  }
}
