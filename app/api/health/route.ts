import { NextResponse } from 'next/server';
import ensureEnvLoaded from '@/lib/loadEnv';

export async function GET() {
  try {
    // Load local .env if needed so health endpoint reflects current .env
    ensureEnvLoaded();
    const hasOpenAI = Boolean(process.env.OPENAI_API_KEY);
    const hasResendKey = Boolean(process.env.RESEND_API_KEY);
    const hasEmailFrom = Boolean(process.env.EMAIL_FROM);
    const hasCronSecret = Boolean(process.env.CRON_SECRET);

    return NextResponse.json({ ok: true, hasOpenAI, hasResendKey, hasEmailFrom, hasCronSecret });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || 'error' }, { status: 500 });
  }
}
