import { NextRequest, NextResponse } from 'next/server';
import { createPartner } from '@/lib/partners';
import { notifyNewIntake } from '@/lib/notifications';

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const partner = await createPartner({
      ...data,
      source: 'intake_form',
      status: 'Pending Intake',
    });
    await notifyNewIntake(partner);
    return NextResponse.json({ partner, success: true }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
