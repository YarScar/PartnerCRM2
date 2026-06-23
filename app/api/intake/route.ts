import { NextRequest, NextResponse } from 'next/server';
import { createPartner } from '@/lib/partners';
import { prisma } from '@/lib/db';
import { sendIntakeNotification } from '@/lib/email';
import apiError from '@/lib/apiError';

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const partner = await createPartner({
      ...data,
      source: 'intake_form',
      status: 'Pending Intake',
    });
    // Notify admins in a non-blocking background task, but don't swallow errors
    (async () => {
      try {
        const admins = await prisma.user.findMany({ where: { role: 'admin' } as any, select: { username: true } as any });
        const emails = admins.map((a: any) => a.username).filter(Boolean);
        if (emails.length > 0) {
          const createdPartner = {
            id: partner.id,
            organizationName: partner.org_name,
            contactName: partner.contact_name,
            contactEmail: partner.contact_email,
            contactPhone: partner.contact_phone,
            programType: partner.desired_program_type,
            timeline: partner.desired_timeline || partner.firm_dates || undefined,
            createdAt: new Date(partner.created_at),
          };
          try {
            await sendIntakeNotification(emails, createdPartner);
          } catch (err) {
            console.error('sendIntakeNotification failed for partner', { partnerId: partner.id, emails }, err);
          }
        }
      } catch (err) {
        console.error('intake notification background task failed', { partnerId: partner.id }, err);
      }
    })();
    return NextResponse.json({ partner, success: true }, { status: 201 });
  } catch (err: any) {
    return apiError(err);
  }
}
