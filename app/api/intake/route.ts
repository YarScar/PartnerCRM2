import { NextRequest, NextResponse, after } from 'next/server';
import { createPartner } from '@/lib/partners';
import { notifyNewIntake } from '@/lib/notifications';
import { checkIntake } from '@/lib/intakeValidation';
import { checkRateLimit, getRateLimitKey } from '@/lib/rateLimit';
import { logAuditEvent } from '@/lib/audit';
import apiError from '@/lib/apiError';

export async function POST(req: NextRequest) {
  try {
    // Public, no login: cap how often one address can submit (each one emails every admin).
    const rateLimitKey = getRateLimitKey(req, 'intake');
    const rateLimit = checkRateLimit(rateLimitKey, 5, 60 * 60 * 1000);
    if (!rateLimit.allowed) {
      await logAuditEvent('intake.rate_limited', { key: rateLimitKey });
      return NextResponse.json(
        { error: 'Too many submissions. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil((rateLimit.retryAfterMs || 0) / 1000)) } }
      );
    }

    const check = checkIntake(await req.text());
    if (!check.ok) {
      if ('spam' in check) {
        await logAuditEvent('intake.spam_dropped', { key: rateLimitKey });
        return NextResponse.json({ success: true }, { status: 201 });
      }
      return NextResponse.json({ error: check.error }, { status: check.status });
    }

    const partner = await createPartner({
      ...check.data,
      source: 'intake_form',
      status: 'Pending Intake',
    });
    // Email admins after the response is sent. `after` keeps the serverless function
    // alive until this finishes; a bare un-awaited promise can be cut off on Vercel.
    after(async () => {
      try {
        await notifyNewIntake(partner);
      } catch (err) {
        console.error('intake notification failed', { partnerId: partner.id }, err);
      }
    });
    // The submitter only needs to know it worked; don't echo the stored record back.
    return NextResponse.json({ success: true, id: partner.id }, { status: 201 });
  } catch (err: any) {
    return apiError(err);
  }
}
