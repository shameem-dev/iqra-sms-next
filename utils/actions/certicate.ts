'use server'

import { createClient } from '@/utils/supabase/server'
import { AdmissionRecord } from '@/type/admission'
import { Subject, Mark } from '@/type/mark'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

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
  /** Real exam marks keyed by subject name (lowercased).
   *  e.g. { "social science": { half_yearly: 65, final: 75, ... } }
   */
  examMarks: Record<string, Mark>
  /** All subjects that belong to this student's standard */
  subjects: Subject[]
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────────────────────
// Fetch students (basic info only)
// ─────────────────────────────────────────────────────────────────────────────

export async function getStudentsForDocuments(): Promise<AdmissionRecord[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('students_list')
    .select('id, admission_no, name, standard, date_of_birth, parent_guardian, gender, mobile_no, address, vehicle_point, aadhar_no')
    .order('admission_no', { ascending: true })
  if (error) throw new Error(error.message)
  return (data ?? []) as AdmissionRecord[]
}

// ─────────────────────────────────────────────────────────────────────────────
// Fetch TC/CC/PR override marks from student_marks table
// ─────────────────────────────────────────────────────────────────────────────

export async function getAllStudentMarks(): Promise<Record<number, StudentMarks>> {
  const supabase = await createClient()
  const { data, error } = await supabase.from('student_marks').select('*')
  if (error) {
    console.warn('[certicate] student_marks:', error.message)
    return {}
  }
  const map: Record<number, StudentMarks> = {}
  for (const row of data ?? []) map[row.student_id] = row as StudentMarks
  return map
}

// ─────────────────────────────────────────────────────────────────────────────
// Fetch all subjects for a given academic year
// ─────────────────────────────────────────────────────────────────────────────

export async function getSubjectsForYear(): Promise<Subject[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('subjects')
    .select('*')
    .eq('is_active', true)
    .order('name', { ascending: true })
  if (error) {
    console.warn('[certicate] subjects:', error.message)
    return []
  }
  return (data ?? []) as Subject[]
}

// ─────────────────────────────────────────────────────────────────────────────
// Fetch all marks rows from the marks system (marks table)
// Returns: map of  student_id → subject_id → Mark
// ─────────────────────────────────────────────────────────────────────────────

export async function getAllExamMarks(
  academicYear: string
): Promise<Record<number, Record<number, Mark>>> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('marks')
    .select('*')
    .eq('academic_year', academicYear)
  if (error) {
    console.warn('[certicate] marks:', error.message)
    return {}
  }
  // Build nested map: student_id → subject_id → Mark
  const map: Record<number, Record<number, Mark>> = {}
  for (const row of data ?? []) {
    const m = row as Mark
    if (!map[m.student_id]) map[m.student_id] = {}
    map[m.student_id][m.subject_id] = m
  }
  return map
}

// ─────────────────────────────────────────────────────────────────────────────
// Combined fetch — everything the document generator needs
// ─────────────────────────────────────────────────────────────────────────────

export async function getStudentsWithMarks(
  academicYear = '2025-2026'
): Promise<StudentWithMarks[]> {
  const [students, marksMap, subjects, examMarksMap] = await Promise.all([
    getStudentsForDocuments(),
    getAllStudentMarks(),
    getSubjectsForYear(),
    getAllExamMarks(academicYear),
  ])

  // Index subjects by standard for quick lookup
  const subjectsByStandard: Record<string, Subject[]> = {}
  for (const sub of subjects) {
    if (!subjectsByStandard[sub.standard]) subjectsByStandard[sub.standard] = []
    subjectsByStandard[sub.standard].push(sub)
  }

  return students.map(s => {
    const studentSubjects = subjectsByStandard[s.standard] ?? []
    const studentExamRows = examMarksMap[s.id!] ?? {}

    // Build examMarks: subject name (lowercase) → Mark
    const examMarks: Record<string, Mark> = {}
    for (const sub of studentSubjects) {
      const markRow = studentExamRows[sub.id]
      if (markRow) examMarks[sub.name.toLowerCase()] = markRow
    }

    return {
      ...s,
      marks:     marksMap[s.id!] ?? defaultMarks(s.id!),
      examMarks,
      subjects:  studentSubjects,
    }
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// Save / update TC override marks for one student
// ─────────────────────────────────────────────────────────────────────────────

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