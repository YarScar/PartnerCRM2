import { Partner, PartnerNote } from './types';

// In-memory store for prototype mode (no DB).
// In a real deployment with DATABASE_URL set, this is bypassed.

let nextPartnerId = 7;
let nextNoteId = 12;

export const mockPartners: Partner[] = [
  {
    id: 1,
    org_name: 'Roxbury Youth Collective',
    contact_name: 'Jasmine Carter',
    contact_email: 'jasmine@roxburyyouth.org',
    contact_phone: '(617) 555-0142',
    contact_role: 'Program Director',
    org_website: 'https://roxburyyouth.org',
    org_city: 'Boston',
    org_state: 'MA',
    status: 'Active Partner',
    program_structure: 'After-school programming Mon-Thu, 3-6pm. Drop-in style with project-based learning tracks.',
    who_they_work_with: 'Middle school and high school students, primarily Black and Latinx youth from Roxbury and Dorchester.',
    youth_ages: '11-18',
    how_kids_connect: 'Open enrollment, word of mouth, partnerships with 3 local schools.',
    recruitment_needed: false,
    program_times: 'Mon-Thu 3-6pm, Sat 10am-2pm',
    schedule_flexibility: 'Flexible — can adjust around CreateAccess schedule with 2 weeks notice.',
    desired_program_type: '3D Printing, CAD / 3D Modeling',
    specific_project_request: 'Want to run a 6-week 3D printing intensive culminating in a community showcase.',
    wants_recommendations: false,
    desired_timeline: 'Spring 2026 — March-April',
    firm_dates: 'Showcase target: April 25, 2026',
    works_with_3d_tech: 'yes',
    three_d_tech_specifics: 'Have 2 entry-level Ender 3 printers, students have done basic Tinkercad work.',
    hardware_inventory: [
      { type: '3D Printer', quantity: 2, notes: 'Ender 3 Pro' },
      { type: 'Laptop', quantity: 12, notes: 'Chromebooks' },
      { type: 'Tablet / iPad', quantity: 6 },
    ],
    hardware_notes: 'Chromebooks are limiting for CAD work. Would benefit from access to better hardware.',
    available_computers: '12 Chromebooks, 2 Windows desktops',
    internet_availability: 'Reliable WiFi throughout building',
    available_space: 'Dedicated makerspace room (~400 sqft) plus 2 classrooms',
    on_site_assistance: true,
    on_site_assistance_notes: '2 youth workers always present, 1 has CAD experience.',
    accessibility_limitations: 'Building is ADA accessible. No transportation provided to students.',
    general_tech_context: 'Strong digital literacy program already running. Looking to deepen 3D track.',
    source: 'manual',
    created_at: '2025-09-12T14:23:00Z',
    updated_at: '2026-04-22T11:15:00Z',
  },
  {
    id: 2,
    org_name: 'Camden STEAM Academy',
    contact_name: 'Marcus Williams',
    contact_email: 'mwilliams@camdensteam.edu',
    contact_phone: '(856) 555-0291',
    contact_role: 'Assistant Principal',
    org_website: 'https://camdensteam.edu',
    org_city: 'Camden',
    org_state: 'NJ',
    status: 'In Conversation',
    program_structure: 'In-school STEAM elective, 5 days/week for 8th graders.',
    who_they_work_with: '8th grade students, ~120 across 4 sections.',
    youth_ages: '13-14',
    how_kids_connect: 'Required elective rotation.',
    recruitment_needed: false,
    program_times: 'School day 8am-2:30pm',
    schedule_flexibility: 'Limited — must work within class periods (50 min).',
    desired_program_type: 'Open / Recommendations Welcome',
    wants_recommendations: true,
    desired_timeline: 'Fall 2026',
    works_with_3d_tech: 'interested',
    hardware_inventory: [
      { type: 'Laptop', quantity: 30, notes: 'Newer MacBooks' },
    ],
    available_computers: 'Full laptop cart',
    internet_availability: 'Reliable WiFi',
    available_space: 'STEM lab with movable furniture',
    on_site_assistance: true,
    accessibility_limitations: 'Period length is the main constraint.',
    source: 'intake_form',
    created_at: '2026-03-15T09:00:00Z',
    updated_at: '2026-04-20T16:30:00Z',
  },
  {
    id: 3,
    org_name: 'West Philly Boys & Girls Club',
    contact_name: 'Renee Thompson',
    contact_email: 'rthompson@wpbgc.org',
    contact_phone: '(215) 555-0188',
    contact_role: 'Teen Center Coordinator',
    org_city: 'Philadelphia',
    org_state: 'PA',
    status: 'Pending — CreateAccess 🏀',
    program_structure: 'Drop-in teen center, 3-8pm weekdays.',
    who_they_work_with: 'Teens 13-18, ~40 regulars per day.',
    youth_ages: '13-18',
    how_kids_connect: 'Drop-in, free membership.',
    recruitment_needed: false,
    program_times: 'Weekdays 3-8pm',
    schedule_flexibility: 'Very flexible',
    desired_program_type: 'Game Development, Digital Design',
    specific_project_request: 'Game design club — students want to make their own games.',
    desired_timeline: 'ASAP — flexible start',
    works_with_3d_tech: 'no',
    hardware_inventory: [
      { type: 'Desktop Computer', quantity: 8, notes: 'Older — 2018 era' },
    ],
    hardware_notes: 'Computers run slow. Would need software requirements before committing.',
    available_computers: '8 desktops in computer room',
    internet_availability: 'WiFi available but inconsistent in computer room',
    available_space: 'Dedicated computer room, gym, lounge',
    on_site_assistance: true,
    on_site_assistance_notes: 'Need staff training — no one has game dev background.',
    source: 'intake_form',
    created_at: '2026-04-02T13:45:00Z',
    updated_at: '2026-04-25T10:00:00Z',
  },
  {
    id: 4,
    org_name: 'Newark Girls Code',
    contact_name: 'Aisha Patel',
    contact_email: 'aisha@newarkgirlscode.org',
    contact_role: 'Founder',
    org_city: 'Newark',
    org_state: 'NJ',
    status: 'New',
    program_structure: 'Saturday workshops + summer camp',
    who_they_work_with: 'Girls and non-binary youth ages 10-16',
    youth_ages: '10-16',
    desired_program_type: 'CAD / 3D Modeling, Coding / Programming',
    desired_timeline: 'Summer 2026',
    works_with_3d_tech: 'interested',
    source: 'intake_form',
    created_at: '2026-05-01T08:30:00Z',
    updated_at: '2026-05-01T08:30:00Z',
  },
  {
    id: 5,
    org_name: 'South Bronx Community Center',
    contact_name: 'David Rodriguez',
    contact_email: 'drodriguez@sbcc.org',
    contact_phone: '(718) 555-0312',
    contact_role: 'Executive Director',
    org_city: 'Bronx',
    org_state: 'NY',
    status: 'Pending — Partner',
    program_structure: 'After-school + weekend programming',
    who_they_work_with: 'Youth ages 8-18 from surrounding neighborhoods',
    youth_ages: '8-18',
    desired_program_type: 'VR, 3D Printing',
    specific_project_request: 'Want a VR experience workshop tied to local history project.',
    desired_timeline: 'Fall 2026',
    works_with_3d_tech: 'yes',
    hardware_inventory: [
      { type: '3D Printer', quantity: 1 },
      { type: 'VR Headset', quantity: 4, notes: 'Meta Quest 2' },
    ],
    on_site_assistance: true,
    source: 'manual',
    created_at: '2026-02-20T15:00:00Z',
    updated_at: '2026-04-15T12:00:00Z',
  },
  {
    id: 6,
    org_name: 'Chester Arts Initiative',
    contact_name: 'Lisa Brown',
    contact_email: 'lisa@chesterarts.org',
    org_city: 'Chester',
    org_state: 'PA',
    status: 'Not a Fit / Closed',
    program_structure: 'Visual arts focus',
    desired_program_type: 'Animation',
    desired_timeline: 'No specific timeline',
    works_with_3d_tech: 'no',
    source: 'manual',
    created_at: '2025-11-08T10:00:00Z',
    updated_at: '2026-01-15T14:00:00Z',
  },
];

export const mockNotes: PartnerNote[] = [
  {
    id: 1,
    partner_id: 1,
    body: 'Initial intro call. Jasmine very enthusiastic — already has buy-in from staff.',
    author: 'Devon',
    created_at: '2025-09-15T14:00:00Z',
  },
  {
    id: 2,
    partner_id: 1,
    body: 'Site visit completed. Makerspace is a great fit. Confirmed April showcase date.',
    author: 'Devon',
    created_at: '2025-10-03T16:30:00Z',
  },
  {
    id: 3,
    partner_id: 1,
    body: 'Spring intensive launched. First session of 12 students went really well.',
    author: 'Marcus',
    created_at: '2026-03-08T18:00:00Z',
  },
  {
    id: 4,
    partner_id: 2,
    body: 'Discovery call — they want recommendations on what would fit a 50-min class period.',
    author: 'Devon',
    created_at: '2026-03-20T11:00:00Z',
  },
  {
    id: 5,
    partner_id: 2,
    body: 'Sent over 3 program option memos. Waiting on their selection.',
    author: 'Devon',
    created_at: '2026-04-20T16:30:00Z',
  },
  {
    id: 6,
    partner_id: 3,
    body: 'They submitted intake form. Need to do tech audit on those 2018 desktops before committing to game dev.',
    author: 'Marcus',
    created_at: '2026-04-25T10:00:00Z',
  },
];

export function getMockPartners(): Partner[] {
  return mockPartners.map((p) => ({
    ...p,
    notes: mockNotes.filter((n) => n.partner_id === p.id),
  }));
}

export function getMockPartner(id: number): Partner | null {
  const p = mockPartners.find((p) => p.id === id);
  if (!p) return null;
  return { ...p, notes: mockNotes.filter((n) => n.partner_id === id) };
}

export function addMockPartner(data: Partial<Partner>): Partner {
  const now = new Date().toISOString();
  const partner: Partner = {
    id: nextPartnerId++,
    org_name: data.org_name || 'Untitled Org',
    status: data.status || 'New',
    source: data.source || 'manual',
    created_at: now,
    updated_at: now,
    ...data,
  } as Partner;
  mockPartners.unshift(partner);
  return partner;
}

export function updateMockPartner(id: number, data: Partial<Partner>): Partner | null {
  const idx = mockPartners.findIndex((p) => p.id === id);
  if (idx === -1) return null;
  mockPartners[idx] = {
    ...mockPartners[idx],
    ...data,
    id, // never overwrite
    updated_at: new Date().toISOString(),
  };
  return mockPartners[idx];
}

export function deleteMockPartner(id: number): boolean {
  const idx = mockPartners.findIndex((p) => p.id === id);
  if (idx === -1) return false;
  mockPartners.splice(idx, 1);
  for (let i = mockNotes.length - 1; i >= 0; i -= 1) {
    if (mockNotes[i].partner_id === id) {
      mockNotes.splice(i, 1);
    }
  }
  return true;
}

export function addMockNote(partner_id: number, body: string, author?: string): PartnerNote {
  const note: PartnerNote = {
    id: nextNoteId++,
    partner_id,
    body,
    author,
    created_at: new Date().toISOString(),
  };
  mockNotes.push(note);
  return note;
}
