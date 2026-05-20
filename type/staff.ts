export interface Staff {
  id: string;
  name: string;
  address: string | null;
  mobile: string | null;
  designation: string | null;
  department: string | null;
  date_of_birth: string | null;
  date_joined: string | null;
  date_left: string | null;
  basic_salary: number;
  ta: number;
  total_salary: number;
  medical_allowance: number;   // ← NEW: total budget
  medical_used: number;
  medical_remaining: number;   // auto = medical_allowance - medical_used
  edu_qualification: string | null;
  certificate_option: string | null;
  remarks: string | null;
  created_at: string;
  updated_at: string;
  // Relations
  trainings?: StaffTraining[];
  projects?: StaffProject[];
  leaves?: StaffLeave[];
  auth_user_id?: string | null;
  email?: string | null;
}

export interface StaffTraining {
  id: string;
  staff_id: string;
  training_name: string;
  source: 'outside' | 'iqrah';
  training_date: string | null;
  description: string | null;
  created_at: string;
}

export interface StaffProject {
  id: string;
  staff_id: string;
  project_name: string;
  project_date: string | null;
  description: string | null;
  created_at: string;
}

export type LeaveType = 'annual' | 'casual' | 'commuted' | 'sick' | 'other';

export interface StaffLeave {
  id: string;
  staff_id: string;
  leave_type: LeaveType;
  days_used: number;
  days_remaining: number;
  year: number;
  created_at: string;
  updated_at: string;
}

export interface StaffFormData {
  name: string;
  address: string;
  mobile: string;
  designation: string;
  department: string;
  date_of_birth: string;
  date_joined: string;
  date_left: string;
  basic_salary: number;
  ta: number;
  medical_allowance: number;   // ← NEW
  medical_used: number;
  medical_remaining: number;   // read-only; auto = medical_allowance - medical_used
  edu_qualification: string;
  certificate_option: string;
  remarks: string;
  trainings_outside: string[];
  trainings_iqrah: string[];
  projects: string[];
  leaves: {
    annual_used: number;
    annual_remaining: number;
    casual_used: number;
    casual_remaining: number;
    commuted_used: number;
    commuted_remaining: number;
    sick_used: number;
    sick_remaining: number;
    other_used: number;
    other_remaining: number;
  };
}

export const DEPARTMENTS = [
  'Education',
  'Administration',
  'IT',
  'Finance',
  'HR',
  'Operations',
  'Management',
  'Other',
] as const;

export const DESIGNATIONS = [
  'Teacher',
  'Non Teacher Staff',
  'Other',
] as const;

export const CERTIFICATE_OPTIONS = [
  'Teaching Certificate',
  'Management Diploma',
  'IT Certification',
  'Professional Diploma',
  'Other',
] as const;

export const LEAVE_LABELS: Record<LeaveType, string> = {
  annual: 'Annual Leave',
  casual: 'Casual Leave',
  commuted: 'Commuted Leave',
  sick: 'Sick Leave',
  other: 'Other Leave',
};