import { NextResponse } from 'next/server';
import ensureEnvLoaded from '@/lib/loadEnv';

export async function GET() {
  try {
    // Load local .env if needed so health endpoint reflects current .env
    ensureEnvLoaded();
    const hasOpenAI = Boolean(process.env.OPENAI_API_KEY);
    const hasResendKey = Boolean(process.env.RESEND_API_KEY);
    const hasEmailUser = Boolean(process.env.EMAIL_USER);
    const hasEmailPass = Boolean(process.env.EMAIL_PASS);
    const emailHost = process.env.EMAIL_HOST || null;
    const emailPort = process.env.EMAIL_PORT || null;

    return NextResponse.json({
      ok: true,
      hasOpenAI,
      hasResendKey,
      hasEmailUser,
      hasEmailPass,
      emailHost,
      emailPort,
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || 'error' }, { status: 500 });
  }
}
