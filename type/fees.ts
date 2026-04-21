import type { AdmissionRecord } from '@/type/admission'

export type Student = AdmissionRecord

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
export interface FeeType {
  key: string
  label: string
  defaultAmount: number
}