import { prisma } from './db';
import { escapeHtml } from './email';

export type DigestData = {
  newIntakes: { organizationName: string; contactName?: string; createdAt: Date }[];
  statusChanges: { organizationName: string; contactName?: string; status: string; updatedAt: Date }[];
  upcomingTimelines: { organizationName: string; contactName?: string; timeline: string; firmDates?: string }[];
  quietPartners: { organizationName: string; contactName?: string; lastNoteAt: Date | null }[];
  totalActive: number;
};

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

const EMPTY = 'Nothing to report this week.';

function shortDate(d: Date | string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Builds the digest straight from the data: same sections every week, no AI.
// Partner names come from the public intake form, so every value is escaped.
export function renderDigest(data: DigestData): { html: string; text: string } {
  const sections: { title: string; items: string[] }[] = [
    {
      title: `New inquiries this week (${data.newIntakes.length})`,
      items: data.newIntakes.map(
        (p) => `${p.organizationName}${p.contactName ? ` — ${p.contactName}` : ''} (${shortDate(p.createdAt)})`
      ),
    },
    {
      title: `Recently updated partners (${data.statusChanges.length})`,
      items: data.statusChanges.map((p) => `${p.organizationName} — ${p.status} (${shortDate(p.updatedAt)})`),
    },
    {
      title: `Timelines in the next 30 days (${data.upcomingTimelines.length})`,
      items: data.upcomingTimelines.map((p) => `${p.organizationName} — ${p.timeline}`),
    },
    {
      title: `Active partners to follow up with (${data.quietPartners.length})`,
      items: data.quietPartners.map(
        (p) => `${p.organizationName} — ${p.lastNoteAt ? `last note ${shortDate(p.lastNoteAt)}` : 'no notes yet'}`
      ),
    },
  ];

  const html =
    sections
      .map(
        (s) =>
          `<h2>${escapeHtml(s.title)}</h2>` +
          (s.items.length ? `<ul>${s.items.map((i) => `<li>${escapeHtml(i)}</li>`).join('')}</ul>` : `<p>${EMPTY}</p>`)
      )
      .join('') + `<p class="stat">Total active partners: ${data.totalActive}</p>`;

  const text =
    sections
      .map((s) => `${s.title}\n${s.items.length ? s.items.map((i) => `- ${i}`).join('\n') : EMPTY}`)
      .join('\n\n') + `\n\nTotal active partners: ${data.totalActive}`;

  return { html, text };
}
