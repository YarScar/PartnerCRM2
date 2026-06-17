export const DEFAULT_FORM_CONFIG = [
  {
    id: 'org',
    label: 'Organization & Contact',
    fields: [
      { id: 'org_name', label: 'Organization Name', type: 'text', visible: true, required: true },
      { id: 'contact_name', label: 'Contact Name', type: 'text', visible: true, required: false },
      { id: 'contact_email', label: 'Contact Email', type: 'text', visible: true, required: false },
      { id: 'contact_phone', label: 'Contact Phone', type: 'text', visible: true, required: false },
      { id: 'org_website', label: 'Website', type: 'text', visible: true, required: false },
    ],
  },
  {
    id: 'program',
    label: 'Program & Approach',
    fields: [
      { id: 'program_structure', label: 'Program Structure', type: 'textarea', visible: true, required: false },
      { id: 'youth_ages', label: 'Youth Ages', type: 'text', visible: true, required: false },
      { id: 'how_kids_connect', label: 'How Kids Connect', type: 'text', visible: true, required: false },
      { id: 'recruitment_needed', label: 'Recruitment Needed', type: 'boolean', visible: true, required: false },
    ],
  },
  {
    id: 'request',
    label: "What They're Looking For",
    fields: [
      { id: 'desired_program_type', label: 'Desired Program Type', type: 'select', visible: true, required: false },
      { id: 'specific_project_request', label: 'Specific Project', type: 'textarea', visible: true, required: false },
      { id: 'wants_recommendations', label: 'Open to Recommendations', type: 'boolean', visible: true, required: false },
      { id: 'desired_timeline', label: 'Desired Timeline', type: 'text', visible: true, required: false },
      { id: 'firm_dates', label: 'Firm Dates', type: 'text', visible: true, required: false },
    ],
  },
  {
    id: 'tech',
    label: 'Tech & Space',
    fields: [
      { id: 'works_with_3d_tech', label: 'Works with 3D Tech', type: 'select', visible: true, required: false },
      { id: 'hardware_inventory', label: 'Hardware Inventory', type: 'checklist', visible: true, required: false },
      { id: 'available_computers', label: 'Available Computers', type: 'text', visible: true, required: false },
      { id: 'internet_availability', label: 'Internet / WiFi', type: 'select', visible: true, required: false },
      { id: 'available_space', label: 'Available Space', type: 'textarea', visible: true, required: false },
      { id: 'on_site_assistance', label: 'On-Site Assistance', type: 'boolean', visible: true, required: false },
    ],
  },
];

export default DEFAULT_FORM_CONFIG;
