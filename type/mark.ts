// ============================================
// SUBJECTS
// ============================================
export interface Subject {
  id: number
  name: string
  standard: string
  max_ut1: number
  max_ut2: number
  max_ut3: number
  max_ut4: number
  max_mid_term: number
  max_half_yearly: number
  max_final: number
  is_active: boolean
  created_at: string
  user_id: string
}

export interface SubjectFormData {
  name: string
  standard: string
  max_ut1: number
  max_ut2: number
  max_ut3: number
  max_ut4: number
  max_mid_term: number
  max_half_yearly: number
  max_final: number
}

// ============================================
// MARKS
// ============================================
export interface Mark {
  id: number
  student_id: number
  subject_id: number
  academic_year: string
  ut1: number | null
  ut2: number | null
  ut3: number | null
  ut4: number | null
  mid_term: number | null
  half_yearly: number | null
  final: number | null
  entered_by: string
  updated_at: string
}

// id is optional — present only for existing rows, omitted for new inserts
export interface MarkFormData {
  id?: number          // ← FIXED: optional, never set on new rows
  ut1: number | null
  ut2: number | null
  ut3: number | null
  ut4: number | null
  mid_term: number | null
  half_yearly: number | null
  final: number | null
}

// ============================================
// MARKS WITH STUDENT INFO (for display)
// ============================================
export interface MarkWithStudent {
  student_id: number
  name: string
  admission_no: string
  standard: string
  marks: MarkFormData   // id? is already part of MarkFormData now
}

// ============================================
// TOP SCORER
// ============================================
export interface TopScorer {
  student_id: number
  name: string
  admission_no: string
  score: number
  max_score: number
  percentage: number
  exam_type: string
}

// ============================================
// STUDENT
// ============================================
export interface Student {
  id: number
  admission_no: string
  name: string
  standard: string
  date_of_birth: string
  aadhar_no: string
  parent_guardian: string
  address: string
  mobile_no: string
  vehicle_point: string
  created_at: string
  user_id: string
}