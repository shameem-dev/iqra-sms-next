
export function getAcademicYear(): string {
  const now = new Date()
  const month = now.getMonth() // 0-indexed, June = 5
  const year = now.getFullYear()

  // Academic year starts in June
  // June 2025 → December 2025 → May 2026  =  "2025-2026"
  if (month >= 5) {
    return `${year}-${year + 1}`
  } else {
    return `${year - 1}-${year}`
  }
}