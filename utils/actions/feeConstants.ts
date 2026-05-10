export const FIXED_FEE_TYPES = [
  'Admission Fee',
  'Welfare Fee',
  'Book Fee',
  'Exam Fee',
  'Others',
] as const

export const TUITION_FEE_TYPES = [
  'Tuition Fee 1',
  'Tuition Fee 2',
  'Tuition Fee 3',
  'Tuition Fee 4',
] as const

export const VEHICLE_FEE_TYPES = [
  'Vehicle Fee Term 1',
  'Vehicle Fee Term 2',
  'Vehicle Fee Term 3',
  'Vehicle Fee Term 4',
  'Vehicle Fee Term 5',
  'Vehicle Fee Term 6',
  'Vehicle Fee Term 7',
  'Vehicle Fee Term 8',
  'Vehicle Fee Term 9',
  'Vehicle Fee Term 10',
] as const

export const ALL_FEE_TYPES = [
  ...FIXED_FEE_TYPES,
  ...TUITION_FEE_TYPES,
  ...VEHICLE_FEE_TYPES,
]

export const ACADEMIC_YEAR = '2026-27'

export const FS_STANDARDS = ['FS1 A', 'FS1 B', 'FS2 A', 'FS2 B']

export const GRADE_STANDARDS = [
  'GRADE 1 A',
  'GRADE 2 A',
  'GRADE 2 B',
  'GRADE 3 A',
  'GRADE 4 A',
]

export const ALL_STANDARDS = [...FS_STANDARDS, ...GRADE_STANDARDS]

export const FS_FEES: Record<string, number> = {
  'Admission Fee':  500,
  'Welfare Fee':    200,
  'Book Fee':       300,
  'Exam Fee':       100,
  'Tuition Fee 1': 1000,
  'Tuition Fee 2': 1000,
  'Tuition Fee 3': 1000,
  'Tuition Fee 4': 1000,
  'Others':           0,
}

export const GRADE_FEES: Record<string, number> = {
  'Admission Fee':  750,
  'Welfare Fee':    200,
  'Book Fee':       400,
  'Exam Fee':       150,
  'Tuition Fee 1': 1200,
  'Tuition Fee 2': 1200,
  'Tuition Fee 3': 1200,
  'Tuition Fee 4': 1200,
  'Others':           0,
}

export function getDefaultAmount(feeType: string, standard: string): number {
  const isFS = FS_STANDARDS.includes(standard)
  const feeMap = isFS ? FS_FEES : GRADE_FEES
  return feeMap[feeType] ?? 0
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
  if (total === 0) return 'paid'
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