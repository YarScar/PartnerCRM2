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
