'use server'

import { createClient } from '@/utils/supabase/server'
import { AdmissionRecord } from '@/type/admission'
import { Subject, Mark } from '@/type/mark'
import { getAcademicYear, academicMonths } from '@/lib/academicYear'

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
  last_attendance: string
  next_school: string | null
  vaccinated: boolean
  nationality: string
  religion: string
  caste: string
  category: string
  admission_date: string
}

export interface AttendanceSummary {
  /** Total working days (non-weekend days marked present or absent) */
  schoolDays: number
  /** Days the student was marked present */
  daysAttended: number
}

export interface StudentWithMarks extends AdmissionRecord {
  marks: StudentMarks
  /** Real exam marks keyed by subject name (lowercased) — academic subjects only */
  examMarks: Record<string, Mark>
  /** Academic subjects that belong to this student's standard */
  subjects: Subject[]
  /** Moral studies subjects that belong to this student's standard */
  moralSubjects: Subject[]
  /** Moral exam marks keyed by subject name (lowercased) */
  moralExamMarks: Record<string, Mark>
  /** Auto-computed academic rank within the same standard (half-yearly total) */
  computedRank: number | null
  /** Auto-computed moral rank within the same standard (half-yearly total) */
  computedMoralRank: number | null
  /** Live attendance counts from the attendance table for the full academic year */
  attendance: AttendanceSummary
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
    qualified: true, fees_paid: true,
    last_attendance: '', next_school: null, vaccinated: true,
    nationality: 'Indian', religion: '', caste: '', category: 'General',
    admission_date: '',
  }
}

function isWeekend(dateStr: string): boolean {
  const d = new Date(dateStr).getDay()
  return d === 0 || d === 6
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
// Fetch all subjects (both academic + moral_studies)
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
// Fetch all marks rows (marks table)
// Returns: map of student_id → subject_id → Mark
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
  const map: Record<number, Record<number, Mark>> = {}
  for (const row of data ?? []) {
    const m = row as Mark
    if (!map[m.student_id]) map[m.student_id] = {}
    map[m.student_id][m.subject_id] = m
  }
  return map
}

// ─────────────────────────────────────────────────────────────────────────────
// Fetch attendance for the full academic year
// Table: attendance(student_id, date, status)
// status values: 'present' | 'absent' | 'none'
// 'none' = not a school day (holiday/closure); skipped from count
// Returns: map of student_id → AttendanceSummary
// ─────────────────────────────────────────────────────────────────────────────

export async function getAllAttendance(
  academicYear: string
): Promise<Record<number, AttendanceSummary>> {
  const supabase = await createClient()

  // Build date range: e.g. "2026-2027" → Apr 2026 – Mar 2027
  const startYear = parseInt(academicYear.split('-')[0])
  const months    = academicMonths(startYear)
  const first     = months[0]
  const last      = months[months.length - 1]
  const fromDate  = `${first.year}-${String(first.month + 1).padStart(2, '0')}-01`
  const lastDay   = new Date(last.year, last.month + 1, 0)
  const toDate    = `${lastDay.getFullYear()}-${String(lastDay.getMonth() + 1).padStart(2, '0')}-${String(lastDay.getDate()).padStart(2, '0')}`

  const { data, error } = await supabase
    .from('attendance')
    .select('student_id, date, status')
    .gte('date', fromDate)
    .lte('date', toDate)

  if (error) {
    console.warn('[certicate] attendance:', error.message)
    return {}
  }

  const map: Record<number, AttendanceSummary> = {}

  for (const row of data ?? []) {
    const { student_id, date, status } = row as { student_id: number; date: string; status: string }
    if (isWeekend(date)) continue    // never count weekends
    if (status === 'none') continue  // not a school day

    if (!map[student_id]) map[student_id] = { schoolDays: 0, daysAttended: 0 }
    map[student_id].schoolDays++
    if (status === 'present') map[student_id].daysAttended++
  }

  return map
}

// ─────────────────────────────────────────────────────────────────────────────
// Combined fetch — everything the document generator needs
// ─────────────────────────────────────────────────────────────────────────────

export async function getStudentsWithMarks(
  academicYear = getAcademicYear()
): Promise<StudentWithMarks[]> {
  const [students, marksMap, subjects, examMarksMap, attendanceMap] = await Promise.all([
    getStudentsForDocuments(),
    getAllStudentMarks(),
    getSubjectsForYear(),
    getAllExamMarks(academicYear),
    getAllAttendance(academicYear),
  ])

  // Index subjects by standard, split by type
  const academicByStandard: Record<string, Subject[]> = {}
  const moralByStandard: Record<string, Subject[]>    = {}

  for (const sub of subjects) {
    if (sub.subject_type === 'moral_studies') {
      if (!moralByStandard[sub.standard]) moralByStandard[sub.standard] = []
      moralByStandard[sub.standard].push(sub)
    } else {
      if (!academicByStandard[sub.standard]) academicByStandard[sub.standard] = []
      academicByStandard[sub.standard].push(sub)
    }
  }

  // ── Step 1: build all student data (without ranks yet) ──────────────────────
  const partials = students.map(s => {
    const academicSubjects = academicByStandard[s.standard] ?? []
    const moralSubjects    = moralByStandard[s.standard]    ?? []
    const studentExamRows  = examMarksMap[s.id!] ?? {}
    const savedMarks       = marksMap[s.id!] ?? defaultMarks(s.id!)

    const examMarks: Record<string, Mark> = {}
    for (const sub of academicSubjects) {
      const markRow = studentExamRows[sub.id]
      if (markRow) examMarks[sub.name.toLowerCase()] = markRow
    }

    const moralExamMarks: Record<string, Mark> = {}
    for (const sub of moralSubjects) {
      const markRow = studentExamRows[sub.id]
      if (markRow) moralExamMarks[sub.name.toLowerCase()] = markRow
    }

    const academicTotal = academicSubjects.reduce(
      (sum, sub) => sum + (examMarks[sub.name.toLowerCase()]?.half_yearly ?? 0), 0
    )
    const moralTotal = moralSubjects.reduce(
      (sum, sub) => sum + (moralExamMarks[sub.name.toLowerCase()]?.half_yearly ?? 0), 0
    )

    // Prefer live attendance from DB; fall back to manual values in student_marks
    const dbAtt = attendanceMap[s.id!]
    const attendance: AttendanceSummary = dbAtt ?? {
      schoolDays:   savedMarks.school_days,
      daysAttended: savedMarks.days_attended,
    }

    return {
      ...s,
      marks: savedMarks,
      examMarks,
      subjects:       academicSubjects,
      moralSubjects,
      moralExamMarks,
      attendance,
      _academicTotal: academicTotal,
      _moralTotal:    moralTotal,
      computedRank:      null as number | null,
      computedMoralRank: null as number | null,
    }
  })

  // ── Step 2: compute dense ranks per standard ─────────────────────────────────
  const byStandard: Record<string, typeof partials> = {}
  for (const s of partials) {
    if (!byStandard[s.standard]) byStandard[s.standard] = []
    byStandard[s.standard].push(s)
  }

  for (const group of Object.values(byStandard)) {
    const sortedAcademic = [...group].sort((a, b) => b._academicTotal - a._academicTotal)
    let aRank = 1
    for (let i = 0; i < sortedAcademic.length; i++) {
      if (i > 0 && sortedAcademic[i]._academicTotal < sortedAcademic[i - 1]._academicTotal) aRank = i + 1
      const s = partials.find(p => p.id === sortedAcademic[i].id)!
      s.computedRank = sortedAcademic[i]._academicTotal > 0 ? aRank : null
    }

    const sortedMoral = [...group].sort((a, b) => b._moralTotal - a._moralTotal)
    let mRank = 1
    for (let i = 0; i < sortedMoral.length; i++) {
      if (i > 0 && sortedMoral[i]._moralTotal < sortedMoral[i - 1]._moralTotal) mRank = i + 1
      const s = partials.find(p => p.id === sortedMoral[i].id)!
      s.computedMoralRank = sortedMoral[i]._moralTotal > 0 ? mRank : null
    }
  }

  return partials.map(({ _academicTotal, _moralTotal, ...rest }) => rest)
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