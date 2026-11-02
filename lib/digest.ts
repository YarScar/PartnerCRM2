import OpenAI from 'openai';
import { prisma } from './db';

export type DigestData = {
  newIntakes: { organizationName: string; contactName?: string; createdAt: Date }[];
  statusChanges: { organizationName: string; contactName?: string; status: string; updatedAt: Date }[];
  upcomingTimelines: { organizationName: string; contactName?: string; timeline: string; firmDates?: string }[];
  quietPartners: { organizationName: string; contactName?: string; lastNoteAt: Date | null }[];
  totalActive: number;
};

export type DigestAIData = {
  newIntakesCount: number;
  statusChangesCount: number;
  upcomingTimelineCount: number;
  quietPartnersCount: number;
  totalActive: number;
  statusChangeSummary: Array<{ status: string; count: number }>;
};

// This keeps the AI summary simple and safer.
// We do not send partner names or personal details.
export function sanitizeDigestForAI(data: DigestData): DigestAIData {
  // Count each status so the summary can talk about trends instead of names.
  const statusCounts = data.statusChanges.reduce<Record<string, number>>((acc, item) => {
    acc[item.status] = (acc[item.status] || 0) + 1;
    return acc;
  }, {});

  const statusChangeSummary = Object.entries(statusCounts)
    .map(([status, count]) => ({ status, count }))
    .sort((a, b) => b.count - a.count || a.status.localeCompare(b.status));

  // We only send counts and broad status groups to the AI.
  return {
    newIntakesCount: data.newIntakes.length,
    statusChangesCount: data.statusChanges.length,
    upcomingTimelineCount: data.upcomingTimelines.length,
    quietPartnersCount: data.quietPartners.length,
    totalActive: data.totalActive,
    statusChangeSummary,
  };
}

export async function getDigestData(): Promise<DigestData> {
  // Pull only the parts we need for the weekly digest.
  const now = new Date();
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

  // New intakes: created in last 7 days
  const newRows = await prisma.partner.findMany({
    where: { created_at: { gte: sevenDaysAgo } },
    orderBy: { created_at: 'desc' },
  });

  const newIntakes = newRows.map((p) => ({ organizationName: p.org_name, contactName: p.contact_name || undefined, createdAt: p.created_at }));

  // Status changes: updated in last 7 days but created before that
  const updatedRows = await prisma.partner.findMany({
    where: { updated_at: { gte: sevenDaysAgo }, created_at: { lt: sevenDaysAgo } },
    orderBy: { updated_at: 'desc' },
  });

  const statusChanges = updatedRows.map((p) => ({ organizationName: p.org_name, contactName: p.contact_name || undefined, status: p.status, updatedAt: p.updated_at }));

  // Upcoming timelines: parse desired_timeline or firm_dates for a date within 30 days
  const timelineCandidates = await prisma.partner.findMany({ where: { OR: [{ desired_timeline: { not: null } }, { firm_dates: { not: null } } ] } });
  const upcomingTimelines: { organizationName: string; contactName?: string; timeline: string; firmDates?: string }[] = [];
  for (const p of timelineCandidates) {
    const parseCandidates = [p.desired_timeline, p.firm_dates].filter(Boolean) as string[];
    for (const t of parseCandidates) {
      const parsed = Date.parse(t);
      if (!isNaN(parsed)) {
        const dt = new Date(parsed);
        if (dt >= now && dt <= thirtyDaysFromNow) {
          upcomingTimelines.push({ organizationName: p.org_name, contactName: p.contact_name || undefined, timeline: t, firmDates: p.firm_dates || undefined });
          break;
        }
      }
    }
  }

  // Quiet partners: Active Partner with last note older than 14 days or no notes
  const activePartners = await prisma.partner.findMany({ where: { status: 'Active Partner' }, include: { notes: { orderBy: { created_at: 'desc' }, take: 1 } } });
  const quietPartners = activePartners
    .map((p) => {
      // If there is no recent note, this partner should show up for follow-up.
      const lastNote = p.notes && p.notes.length > 0 ? p.notes[0].created_at : null;
      return { organizationName: p.org_name, contactName: p.contact_name || undefined, lastNoteAt: lastNote };
    })
    .filter((p) => (p.lastNoteAt ? p.lastNoteAt < fourteenDaysAgo : true));

  const totalActive = await prisma.partner.count({ where: { status: 'Active Partner' } });

  return { newIntakes, statusChanges, upcomingTimelines, quietPartners, totalActive };
}

// One place for the AI prompt, shared by the preview page and the email send.
export async function generateDigestMarkdown(data: DigestData): Promise<string> {
  // Turn the digest into a safer summary before sending it to the AI.
  const aiData = sanitizeDigestForAI(data);

  if (!process.env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY missing');
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const system = `You are a program coordinator assistant for CreateAccess, a nonprofit that brings basketball and technology programs to youth organizations. Write in a warm, encouraging, professional tone. Be concise — one sentence per bullet point.`;

  // Send only safe, summary-style info to the AI.
  const userPrompt = `Generate a weekly partnership digest using only aggregated, non-identifying data. Today is ${new Date().toDateString()}.

New inquiries this week: ${aiData.newIntakesCount}
Partners with updates this week: ${aiData.statusChangesCount}
Timelines coming up (next 30 days): ${aiData.upcomingTimelineCount}
Active partners needing follow-up: ${aiData.quietPartnersCount}
Total active partners: ${aiData.totalActive}
Status change breakdown: ${JSON.stringify(aiData.statusChangeSummary)}

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

  return resp.choices?.[0]?.message?.content || '';
}
