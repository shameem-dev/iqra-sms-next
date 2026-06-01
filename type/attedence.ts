
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