import { getAcademicYear } from "@/lib/academicYear"

export const FIXED_FEE_TYPES = [
  'Admission Fee',
  'Welfare Fee',
  'Book Fee',
  'Uniform Fee',
  'Others',
] as const

export const INSTALLMENT_FEE_TYPES = [
  '1st Installment',
  '2nd Installment',
  '3rd Installment',
  '4th Installment',
] as const

export const VEHICLE_FEE_TYPES = [
  'Vehicle Fee - June',
  'Vehicle Fee - July',
  'Vehicle Fee - August',
  'Vehicle Fee - September',
  'Vehicle Fee - October',
  'Vehicle Fee - November',
  'Vehicle Fee - December',
  'Vehicle Fee - January',
  'Vehicle Fee - February',
  'Vehicle Fee - March',
] as const

export const ALL_FEE_TYPES = [
  ...FIXED_FEE_TYPES,
  ...INSTALLMENT_FEE_TYPES,
  ...VEHICLE_FEE_TYPES,
]

export const ACADEMIC_YEAR = getAcademicYear()

export const FS_STANDARDS = ['FS1 A', 'FS1 B', 'FS2 A', 'FS2 B']

export const GRADE_STANDARDS = [
  'GRADE 1 A',
  'GRADE 2 A',
  'GRADE 2 B',
  'GRADE 3 A',
  'GRADE 4 A',
]

export const ALL_STANDARDS = [...FS_STANDARDS, ...GRADE_STANDARDS]

// ── Fee maps ────────────────────────────────────────────────────────────────

export const FS1_FEES: Record<string, number> = {
  'Admission Fee':  5000,
  'Welfare Fee':    1500,
  'Book Fee':       1500,   // ← updated
  'Uniform Fee':    1200,
  '1st Installment': 2200,
  '2nd Installment': 2200,
  '3rd Installment': 2200,
  '4th Installment': 1900,
  'Others':           0,
}

export const FS2_FEES: Record<string, number> = {
  'Admission Fee':  5000,
  'Welfare Fee':    1500,
  'Book Fee':       1600,   // ← updated
  'Uniform Fee':    1200,
  '1st Installment': 2200,
  '2nd Installment': 2200,
  '3rd Installment': 2200,
  '4th Installment': 1900,
  'Others':           0,
}

export const GRADE1_FEES: Record<string, number> = {
  'Admission Fee':  5000,
  'Welfare Fee':    1500,
  'Book Fee':       2300,   // ← updated
  '1st Installment': 2200,
  '2nd Installment': 2200,
  '3rd Installment': 2200,
  '4th Installment': 2500,
  'Others':           0,
}

export const GRADE2_FEES: Record<string, number> = {
  'Admission Fee':  5000,
  'Welfare Fee':    1500,
  'Book Fee':       2400,   // ← updated
  '1st Installment': 2200,
  '2nd Installment': 2200,
  '3rd Installment': 2200,
  '4th Installment': 2500,
  'Others':           0,
}

export const GRADE3_FEES: Record<string, number> = {
  'Admission Fee':  5000,
  'Welfare Fee':    1500,
  'Book Fee':       2500,   // ← updated
  '1st Installment': 2200,
  '2nd Installment': 2200,
  '3rd Installment': 2200,
  '4th Installment': 2500,
  'Others':           0,
}

export const GRADE4_FEES: Record<string, number> = {
  'Admission Fee':  5000,
  'Welfare Fee':    1500,
  'Book Fee':       2600,   // ← updated
  '1st Installment': 2200,
  '2nd Installment': 2200,
  '3rd Installment': 2200,
  '4th Installment': 2500,
  'Others':           0,
}

// Keep a generic FS_FEES / GRADE_FEES if anything else in the codebase
// references them — they now just point to FS1 and GRADE1 as a fallback.
export const FS_FEES    = FS1_FEES
export const GRADE_FEES = GRADE1_FEES

// ── Helpers ─────────────────────────────────────────────────────────────────

export function getDefaultAmount(feeType: string, standard: string): number {
  const s = standard.toUpperCase()

  if (s.startsWith('FS1'))     return FS1_FEES[feeType]    ?? 0
  if (s.startsWith('FS2'))     return FS2_FEES[feeType]    ?? 0
  if (s.startsWith('GRADE 1')) return GRADE1_FEES[feeType] ?? 0
  if (s.startsWith('GRADE 2')) return GRADE2_FEES[feeType] ?? 0
  if (s.startsWith('GRADE 3')) return GRADE3_FEES[feeType] ?? 0
  if (s.startsWith('GRADE 4')) return GRADE4_FEES[feeType] ?? 0

  return 0
}

export function getFeeCategory(standard: string): 'FS' | 'GRADE' {
  return FS_STANDARDS.includes(standard) ? 'FS' : 'GRADE'
}

export function generateReceiptNo(): string {
  const year = new Date().getFullYear()
  const random = Math.floor(1000 + Math.random() * 9000)
  return `RCP-${year}-${random}`
}

export function getFeeStatus(
  paid: number,
  total: number
): 'paid' | 'partial' | 'pending' {
  if (total === 0) return 'pending'
  if (paid >= total) return 'paid'
  if (paid > 0) return 'partial'
  return 'pending'
}

export function getStatusConfig(status: 'paid' | 'partial' | 'pending') {
  switch (status) {
    case 'paid':
      return {
        label: 'PAID',
        icon: '',
        bg: 'bg-teal-50',
        text: 'text-teal-600',
        border: 'border-teal-200',
      }
    case 'partial':
      return {
        label: 'PARTIAL',
        icon: '',
        bg: 'bg-yellow-50',
        text: 'text-yellow-600',
        border: 'border-yellow-200',
      }
    case 'pending':
      return {
        label: 'PENDING',
        icon: '',
        bg: 'bg-red-50',
        text: 'text-red-500',
        border: 'border-red-200',
      }
  }
}