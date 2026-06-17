import { NextRequest, NextResponse } from 'next/server';
import { createPartner } from '@/lib/partners';
import { prisma } from '@/lib/db';
import { sendIntakeNotification } from '@/lib/email';

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const partner = await createPartner({
      ...data,
      source: 'intake_form',
      status: 'Pending Intake',
    });
    // Fire-and-forget: find admin emails and notify individually (do not block response)
    prisma.user
      .findMany({ where: { role: 'admin' } as any, select: { username: true } as any })
      .then((admins) => {
        const emails = admins.map((a: any) => a.username).filter(Boolean);
        if (emails.length > 0) {
          // created partner shape expected by sendIntakeNotification
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
          sendIntakeNotification(emails, createdPartner).catch(console.error);
        }
      })
      .catch(console.error);
    return NextResponse.json({ partner, success: true }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
