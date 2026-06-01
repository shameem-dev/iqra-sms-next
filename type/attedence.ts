export type Status = 'present' | 'absent' | 'none'
export interface Student {
  id: number
  name: string
  admission_no: string
  gender: string
}
export const GENDER_ORDER: Record<string, number> = { Male: 0, Female: 1 }
export const STANDARDS = [
  'LKG A', 'LKG B', 'UKG A', 'UKG B',
  'GRADE 1 A', 'GRADE 2 A', 'GRADE 2 B', 'GRADE 3 A', 'GRADE 4 A'
]
export function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}
export function fmtDate(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}
export function getDayLabel(year: number, month: number, day: number) {
  return new Date(year, month, day).toLocaleDateString('en-IN', { weekday: 'short' })
}
export function isWeekend(year: number, month: number, day: number) {
  const d = new Date(year, month, day).getDay()
  return d === 0 || d === 6
}

// ─── Daily Attendance Stats ───────────────────────────────────────────────────
export interface DailyAttendanceStats {
  present: number
  absent: number
  unmarked: number
  total: number
  pct: number
}

/**
 * Compute attendance stats for a single day.
 *
 * @param attendance  Record<dateStr, Record<studentId, Status>>
 * @param students    Student[]
 * @param dateStr     'YYYY-MM-DD'
 */
export function getDailyAttendanceStats(
  attendance: Record<string, Record<number, Status>>,
  students: Student[],
  dateStr: string
): DailyAttendanceStats {
  const dayMap = attendance[dateStr] || {}
  let present = 0
  let absent = 0
  students.forEach((s) => {
    const st = dayMap[s.id]
    if (st === 'present') present++
    else if (st === 'absent') absent++
  })
  const marked = present + absent
  const pct = marked > 0 ? Math.round((present / marked) * 100) : 0
  return {
    present,
    absent,
    unmarked: students.length - marked,
    total: students.length,
    pct,
  }
}

// ─── Monthly Attendance Stats ─────────────────────────────────────────────────
export interface AttendanceStats {
  overallPct: number
  totalPresent: number
  totalAbsent: number
  totalMarked: number
  workingDays: number
  atRisk: Array<Student & { present: number; absent: number; pct: number }>
  perStudent: Array<Student & { present: number; absent: number; pct: number }>
}

/**
 * Compute attendance performance stats from the raw attendance map
 * produced by useAttendance hook.
 *
 * @param attendance  Record<dateStr, Record<studentId, Status>>
 * @param students    Student[]
 * @param year        full year e.g. 2025
 * @param month       0-indexed month
 */
export function getAttendanceStats(
  attendance: Record<string, Record<number, Status>>,
  students: Student[],
  year: number,
  month: number
): AttendanceStats {
  const totalDays = getDaysInMonth(year, month)
  const workingDays = Array.from({ length: totalDays }, (_, i) => i + 1).filter(
    (d) => !isWeekend(year, month, d)
  ).length
  let totalPresent = 0
  let totalAbsent = 0
  let totalMarked = 0
  const perStudent = students.map((s) => {
    let present = 0
    let absent = 0
    for (let d = 1; d <= totalDays; d++) {
      const status = attendance[fmtDate(year, month, d)]?.[s.id]
      if (status === 'present') present++
      else if (status === 'absent') absent++
    }
    totalPresent += present
    totalAbsent += absent
    totalMarked += present + absent
    const pct = workingDays > 0 ? Math.round((present / workingDays) * 100) : 0
    return { ...s, present, absent, pct }
  })
  const overallPct =
    totalMarked > 0 ? Math.round((totalPresent / totalMarked) * 100) : 0
  const atRisk = perStudent.filter(
    (s) => s.pct < 75 && s.present + s.absent > 0
  )
  return {
    overallPct,
    totalPresent,
    totalAbsent,
    totalMarked,
    workingDays,
    atRisk,
    perStudent,
  }
}