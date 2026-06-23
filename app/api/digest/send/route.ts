import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getSessionFromToken, isAdmin, SESSION_COOKIE_NAME } from '@/lib/auth';
import { getDigestData } from '@/lib/digest';
import { marked } from 'marked';
import { prisma } from '@/lib/db';
import { sendHtmlEmail } from '@/lib/email';

export async function POST(req: NextRequest) {
  try {
    const cookie = req.cookies.get(SESSION_COOKIE_NAME)?.value;
    const user = await getSessionFromToken(cookie);
    if (!user || !isAdmin(user)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const data = await getDigestData();

    if (!process.env.OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY missing in environment');
      return NextResponse.json({ error: 'OPENAI_API_KEY missing' }, { status: 500 });
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const system = `You are a program coordinator assistant for CreateAccess, a nonprofit that brings basketball and technology programs to youth organizations. Write in a warm, encouraging, professional tone. Be concise — one sentence per bullet point.`;

    const userPrompt = `Generate a weekly partnership digest. Today is ${new Date().toDateString()}.

New inquiries this week: ${JSON.stringify(data.newIntakes)}
Partners with updates: ${JSON.stringify(data.statusChanges)}
Timelines coming up (next 30 days): ${JSON.stringify(data.upcomingTimelines)}
Active partners gone quiet (14+ days no activity): ${JSON.stringify(data.quietPartners)}
Total active partners: ${data.totalActive}

Write the digest using exactly these markdown sections:
## 🆕 New Inquiries This Week
## 🔄 Recent Updates
## 📅 Timelines to Watch
## 🔇 Follow Up Needed
## 📊 Quick Stats

If a section has no data write "Nothing to report this week."
End with one short sentence of encouragement for the team.`;

    const resp = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 1000,
      temperature: 0.4,
    });

    const markdown = resp.choices?.[0]?.message?.content || '';
    const html: string = await Promise.resolve(marked.parse(markdown));

    // collect admin emails (only keep valid email addresses)
    const admins = await prisma.user.findMany({ where: { role: 'admin' } as any, select: { username: true, email: true } as any });
    const emailRegex = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
    const adminEmailsRaw = admins.map((a: any) => a.email || a.username).filter(Boolean);
    const adminEmails = adminEmailsRaw.filter((e: string) => emailRegex.test(e));
    const invalid = adminEmailsRaw.filter((e: string) => !emailRegex.test(e));
    if (invalid.length > 0) console.warn('digest send: invalid admin email addresses, skipping:', invalid);

    if (adminEmails.length === 0) {
      console.warn('digest send: no valid admin email addresses found in users, checking ADMIN_EMAILS env');
      const envList = (process.env.ADMIN_EMAILS || '').split(',').map((s) => s.trim()).filter(Boolean);
      const envValid = envList.filter((e: string) => emailRegex.test(e));
      if (envValid.length > 0) {
        adminEmails.push(...envValid);
      }
    }

    if (adminEmails.length === 0) {
      console.error('digest send: no valid admin email addresses found; aborting send');
      return NextResponse.json({ error: 'No admin email addresses configured' }, { status: 400 });
    } else {
      const dateStr = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
      const subject: string = `CreateAccess Weekly Digest — ${dateStr}`;
      await sendHtmlEmail(adminEmails, subject, html);
    }

    return NextResponse.json({ ok: true, sentTo: adminEmails });
  } catch (err: any) {
    console.error('digest send error', err);
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}
