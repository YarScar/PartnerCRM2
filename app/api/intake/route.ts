import { NextRequest, NextResponse, after } from 'next/server';
import { createPartner } from '@/lib/partners';
import { notifyNewIntake } from '@/lib/notifications';
import apiError from '@/lib/apiError';

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const partner = await createPartner({
      ...data,
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
    return NextResponse.json({ partner, success: true }, { status: 201 });
  } catch (err: any) {
    return apiError(err);
  }
}
