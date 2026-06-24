import { NextResponse } from 'next/server';
import ensureEnvLoaded from '@/lib/loadEnv';

export async function GET() {
  try {
    // Load local .env if needed so health endpoint reflects current .env
    ensureEnvLoaded();
    const hasOpenAI = Boolean(process.env.OPENAI_API_KEY);
    const hasResendKey = Boolean(process.env.RESEND_API_KEY);

    return NextResponse.json({ ok: true, hasOpenAI, hasResendKey });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || 'error' }, { status: 500 });
  }
}
