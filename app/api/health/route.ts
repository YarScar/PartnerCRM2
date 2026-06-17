import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const hasOpenAI = Boolean(process.env.OPENAI_API_KEY);
    const hasEmailUser = Boolean(process.env.EMAIL_USER);
    const hasEmailPass = Boolean(process.env.EMAIL_PASS);
    const emailHost = process.env.EMAIL_HOST || null;
    const emailPort = process.env.EMAIL_PORT || null;

    return NextResponse.json({
      ok: true,
      hasOpenAI,
      hasEmailUser,
      hasEmailPass,
      emailHost,
      emailPort,
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || 'error' }, { status: 500 });
  }
}
