export const PARTNER_STATUSES = [
  'Pending Intake',
  'New',
  'In Conversation',
  'Pending — CreateAccess 🏀',
  'Pending — Partner',
  'Active Partner',
  'Not a Fit / Closed',
] as const;

export type PartnerStatus = (typeof PARTNER_STATUSES)[number];

export const STATUS_COLORS: Record<PartnerStatus, string> = {
  'Pending Intake': 'bg-rose-100 text-rose-900 border-rose-300',
  'New': 'bg-blue-100 text-blue-900 border-blue-300',
  'In Conversation': 'bg-purple-100 text-purple-900 border-purple-300',
  'Pending — CreateAccess 🏀': 'bg-court/20 text-court-deep border-court/40',
  'Pending — Partner': 'bg-amber-100 text-amber-900 border-amber-300',
  'Active Partner': 'bg-emerald-100 text-emerald-900 border-emerald-300',
  'Not a Fit / Closed': 'bg-gray-100 text-gray-700 border-gray-300',
};

export interface HardwareItem {
  type: string;
  quantity: number;
  notes?: string;
}

export interface PartnerNote {
  id: number;
  partner_id: number;
  body: string;
  author?: string;
  created_at: string;
}

export interface Partner {
  id: number;
  // Org info
  org_name: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  contact_role?: string;
  org_website?: string;
  org_address?: string;
  org_city?: string;
  org_state?: string;

  // Status
  status: PartnerStatus;

  // Program info
  program_structure?: string;
  who_they_work_with?: string;
  youth_ages?: string;
  how_kids_connect?: string;
  intake_message?: string;
  recruitment_needed?: boolean | null;
  recruitment_notes?: string;
  program_times?: string;
  schedule_flexibility?: string;
  desired_program_type?: string;
  specific_project_request?: string;
  wants_recommendations?: boolean;
  desired_timeline?: string;
  firm_dates?: string;

  // Tech + space
  works_with_3d_tech?: 'yes' | 'no' | 'interested' | '';
  three_d_tech_specifics?: string;
  hardware_inventory?: HardwareItem[];
  hardware_notes?: string;
  available_computers?: string;
  internet_availability?: string;
  available_space?: string;
  on_site_assistance?: boolean | null;
  on_site_assistance_notes?: string;
  accessibility_limitations?: string;
  general_tech_context?: string;

  // Meta
  source?: 'intake_form' | 'manual';
  created_at: string;
  updated_at: string;

  // Relations (joined)
  notes?: PartnerNote[];
}

// Common hardware checklist used across forms
export const HARDWARE_CHECKLIST = [
  '3D Printer',
  '3D Scanner',
  'Laser Cutter',
  'CNC Machine',
  'VR Headset',
  'AR Device',
  'Desktop Computer',
  'Laptop',
  'Tablet / iPad',
  'Drone',
  'Robotics Kit',
  'Microcontrollers (Arduino/Raspberry Pi)',
] as const;

export const PROGRAM_TYPES = [
  'CAD / 3D Modeling',
  'Game Development',
  '3D Printing',
  'Virtual Reality',
  'Digital Design',
  'Robotics',
  'Coding / Programming',
  'Animation',
  'Music Production',
  'Podcasting / Audio',
  'Open / Recommendations Welcome',
] as const;
