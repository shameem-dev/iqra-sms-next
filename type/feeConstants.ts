import type { AdmissionRecord } from '@/type/admission'

export type Student = AdmissionRecord

// ============================================
// STUDENT FEES
// ============================================
export interface FeeRow {
  id: number
  student_id: number
  fee_type: string
  total_amount: number
  paid_amount: number
  academic_year: string
}

export interface FeeRowUI extends FeeRow {
  label: string
  balance: number
  payNow: number
}

// ============================================
// PAYMENTS
// ============================================
export interface PaymentDetail {
  fee_type: string
  label: string
  amount: number
}

export interface FeePayment {
  id: number
  student_id: number
  receipt_no: string
  total_paid: number
  payment_date: string
  payment_details: PaymentDetail[]
  academic_year: string
}

// ============================================
// FEE TYPES / CONSTANTS
// ============================================
export interface FeeType {
  key: string
  label: string
  defaultAmount: number
}

export type FeeCategory = 'FS' | 'GRADE'

export interface FeeDefault {
  fee_type: string
  label: string
  amount: number
}

// ============================================
// ACCOUNT ENTRIES (Income table)
// ============================================
export interface AccountEntry {
  id: string
  type: 'income' | 'expenditure'
  date: string
  amount: number
  bill_voucher_no: string | null
  notes: string | null
  income_category: string | null
  book_no: string | null
  receipt_no: string | null
  expenditure_category: string | null
  staff_name: string | null
  vehicle_no: string | null
  is_deleted: boolean
  created_at: string
  updated_at: string
}

// ============================================
// FEE TRACKER (display)
// ============================================
export interface StudentFeeStatus {
  student_id: number
  name: string
  admission_no: string
  standard: string
  fees: FeeRow[]
  totalAmount: number
  totalPaid: number
  totalBalance: number
  status: 'paid' | 'partial' | 'pending'
  s
}