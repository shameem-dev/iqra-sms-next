'use server'

import { createClient } from '@/utils/supabase/server'
import { AdmissionRecord } from '@/type/admission'



export interface StudentMarks {
  id?: number
  student_id: number
  arabic: number
  malayalam: number
  it: number
  gk: number
  science: number
  social: number
  maths: number
  english: number
  hindi: number
  quran: number
  thajveed: number
  fiqh: number
  uloom: number
  school_days: number
  days_attended: number
  rank: number | null
  moral_rank: number | null
  conduct: string
  qualified: boolean
  fees_paid: boolean
  fee_concession: boolean
  last_attendance: string
  next_school: string | null
  vaccinated: boolean
  nationality: string
  religion: string
  caste: string
  category: string
  admission_date: string
}

export interface StudentWithMarks extends AdmissionRecord {
  marks: StudentMarks
}

function defaultMarks(studentId: number): StudentMarks {
  return {
    student_id: studentId,
    arabic: 0, malayalam: 0, it: 0, gk: 0,
    science: 0, social: 0, maths: 0, english: 0, hindi: 0,
    quran: 0, thajveed: 0, fiqh: 0, uloom: 0,
    school_days: 0, days_attended: 0,
    rank: null, moral_rank: null,
    conduct: 'Good',
    qualified: true, fees_paid: true, fee_concession: false,
    last_attendance: '', next_school: null, vaccinated: true,
    nationality: 'Indian', religion: '', caste: '', category: 'General',
    admission_date: '',
  }
}

// ── Fetch all students (only real columns) ────────────────────────────────
export async function getStudentsForDocuments(): Promise<AdmissionRecord[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('students_list')
    .select('id, admission_no, name, standard, date_of_birth, parent_guardian, gender, mobile_no, address, vehicle_point, aadhar_no')
    .order('admission_no', { ascending: true })

  if (error) throw new Error(error.message)
  return (data ?? []) as AdmissionRecord[]
}

// ── Fetch all marks (graceful if table missing) ───────────────────────────
export async function getAllStudentMarks(): Promise<Record<number, StudentMarks>> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('student_marks')
    .select('*')

  if (error) {
    // Table may not exist yet — return empty map so UI still loads
    console.warn('[document-actions] student_marks:', error.message)
    return {}
  }

  const map: Record<number, StudentMarks> = {}
  for (const row of data ?? []) {
    map[row.student_id] = row as StudentMarks
  }
  return map
}

// ── Combined fetch ────────────────────────────────────────────────────────
export async function getStudentsWithMarks(): Promise<StudentWithMarks[]> {
  const [students, marksMap] = await Promise.all([
    getStudentsForDocuments(),
    getAllStudentMarks(),
  ])

  return students.map(s => ({
    ...s,
    marks: marksMap[s.id!] ?? defaultMarks(s.id!),
  }))
}

// ── Save / update marks for one student ──────────────────────────────────
export async function upsertStudentMarks(
  marks: Omit<StudentMarks, 'id'>
): Promise<StudentMarks> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('student_marks')
    .upsert(marks, { onConflict: 'student_id' })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as StudentMarks
}