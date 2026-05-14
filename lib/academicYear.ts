export function getAcademicYear(): string {
  const now = new Date()
  const year = now.getFullYear()
  const startYear = now.getMonth() >= 4 ? year : year - 1
  return `${startYear}-${startYear + 1}`
}

export function academicMonths(startYear: number): Array<{ year: number; month: number }> {
  const months: Array<{ year: number; month: number }> = []
  for (let m = 4; m <= 11; m++) months.push({ year: startYear,     month: m })
  for (let m = 0; m <= 2;  m++) months.push({ year: startYear + 1, month: m })
  return months
}