import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const hasResendKey = Boolean(process.env.RESEND_API_KEY);
    const hasEmailFrom = Boolean(process.env.EMAIL_FROM);

    return NextResponse.json({ ok: true, hasResendKey, hasEmailFrom });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || 'error' }, { status: 500 });
  }
}
