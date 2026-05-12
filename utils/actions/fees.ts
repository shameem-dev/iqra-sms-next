import { createClient } from '@/utils/supabase/client'
import { FeeRow, Student } from '@/type/fees'
import {
  FIXED_FEE_TYPES,
  TUITION_FEE_TYPES,
  VEHICLE_FEE_TYPES,
  getDefaultAmount,
} from '@/utils/actions/feeConstants'
import { getAcademicYear } from '@/lib/academicYear'

const supabase = createClient()

export const FEE_TYPES = [
  { key: 'Admission Fee',       label: 'Admission Fee'       },
  { key: 'Welfare Fee',         label: 'Welfare Fee'         },
  { key: 'Book Fee',            label: 'Book Fee'            },
  { key: 'Exam Fee',            label: 'Exam Fee'            },
  { key: 'Others',              label: 'Others'              },
  { key: 'Tuition Fee 1',       label: 'Tuition Fee 1'       },
  { key: 'Tuition Fee 2',       label: 'Tuition Fee 2'       },
  { key: 'Tuition Fee 3',       label: 'Tuition Fee 3'       },
  { key: 'Tuition Fee 4',       label: 'Tuition Fee 4'       },
  { key: 'Vehicle Fee - June',      label: 'Vehicle Fee - June' },
  { key: 'Vehicle Fee - July',      label: 'Vehicle Fee - July' },
  { key: 'Vehicle Fee - August',    label: 'Vehicle Fee - August' },
  { key: 'Vehicle Fee - September', label: 'Vehicle Fee - September' },
  { key: 'Vehicle Fee - October',   label: 'Vehicle Fee - October' },
  { key: 'Vehicle Fee - November',  label: 'Vehicle Fee - November' },
  { key: 'Vehicle Fee - December',  label: 'Vehicle Fee - December' },
  { key: 'Vehicle Fee - January',   label: 'Vehicle Fee - January' },
  { key: 'Vehicle Fee - February',  label: 'Vehicle Fee - February' },
  { key: 'Vehicle Fee - March',     label: 'Vehicle Fee - March' },
]

const STUDENT_SELECT =
  'id, admission_no, name, standard, gender, parent_guardian, mobile_no, address, vehicle_point, date_of_birth, aadhar_no'

export async function getAllStudents(): Promise<Student[]> {
  const { data, error } = await supabase
    .from('students_list')
    .select(STUDENT_SELECT)
    .order('admission_no')
  if (error) throw error
  return (data ?? []) as Student[]
}

export async function searchStudents(query: string): Promise<Student[]> {
  const { data, error } = await supabase
    .from('students_list')
    .select(STUDENT_SELECT)
    .or(`admission_no.ilike.%${query}%,name.ilike.%${query}%`)
    .limit(10)
  if (error) throw error
  return (data ?? []) as Student[]
}

// ─── getOrCreateFeeRows ───────────────────────────────────────────────────────
// Only scaffolds FIXED fees (Admission, Welfare, Book, Exam, Others)
// with default amounts based on student's standard (FS or Grade).
// Tuition and Vehicle fees are NOT scaffolded — admin adds them manually.
// ─────────────────────────────────────────────────────────────────────────────
export async function getOrCreateFeeRows(
  studentId: number,
  standard?: string
): Promise<FeeRow[]> {
  const year = getAcademicYear()

  // Fetch student's standard if not passed in
  let studentStandard = standard
  if (!studentStandard) {
    const { data: student } = await supabase
      .from('students_list')
      .select('standard')
      .eq('id', studentId)
      .single()
    studentStandard = student?.standard ?? ''
  }

  // Fetch existing fee rows for this student + year
  const { data: existing } = await supabase
    .from('student_fees')
    .select('*')
    .eq('student_id', studentId)
    .eq('academic_year', year)

  const existingKeys = existing?.map((r: FeeRow) => r.fee_type) || []

  // Only scaffold missing FIXED fees — tuition and vehicle are added manually
  const missingFixed = FIXED_FEE_TYPES.filter(ft => !existingKeys.includes(ft))

  if (missingFixed.length > 0) {
    await supabase.from('student_fees').insert(
      missingFixed.map(ft => ({
        student_id:    studentId,
        fee_type:      ft,
        total_amount:  getDefaultAmount(ft, studentStandard!),
        paid_amount:   0,
        academic_year: year,
      }))
    )
  }

  // Return all existing rows (fixed + any tuition/vehicle already added manually)
  const { data: all, error } = await supabase
    .from('student_fees')
    .select('*')
    .eq('student_id', studentId)
    .eq('academic_year', year)

  if (error) throw error
  return all || []
}

// ─── addTuitionFeeRow ─────────────────────────────────────────────────────────
// Called when admin clicks Add Tuition Fee in the UI.
// Only adds if that term doesn't already exist for this student + year.
// ─────────────────────────────────────────────────────────────────────────────
export async function addTuitionFeeRow(
  studentId: number,
  feeType: typeof TUITION_FEE_TYPES[number],
  standard: string
): Promise<FeeRow> {
  const year = getAcademicYear()

  const { data: existing } = await supabase
    .from('student_fees')
    .select('id')
    .eq('student_id', studentId)
    .eq('fee_type', feeType)
    .eq('academic_year', year)
    .single()

  if (existing) throw new Error(`${feeType} already exists for this student`)

  const { data, error } = await supabase
    .from('student_fees')
    .insert({
      student_id:    studentId,
      fee_type:      feeType,
      total_amount:  getDefaultAmount(feeType, standard),
      paid_amount:   0,
      academic_year: year,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

// ─── addVehicleFeeRow ─────────────────────────────────────────────────────────
// Called when admin clicks Add Vehicle Fee in the UI.
// Vehicle fees always default to 0 — admin sets amount manually.
// ─────────────────────────────────────────────────────────────────────────────
export async function addVehicleFeeRow(
  studentId: number,
  feeType: typeof VEHICLE_FEE_TYPES[number]
): Promise<FeeRow> {
  const year = getAcademicYear()

  const { data: existing } = await supabase
    .from('student_fees')
    .select('id')
    .eq('student_id', studentId)
    .eq('fee_type', feeType)
    .eq('academic_year', year)
    .single()

  if (existing) throw new Error(`${feeType} already exists for this student`)

  const { data, error } = await supabase
    .from('student_fees')
    .insert({
      student_id:    studentId,
      fee_type:      feeType,
      total_amount:  0,
      paid_amount:   0,
      academic_year: year,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateTotal(id: number, total: number) {
  const { error } = await supabase
    .from('student_fees')
    .update({ total_amount: total, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}

export async function savePayment(
  studentId: number,
  payments: { id: number; fee_type: string; payNow: number }[]
) {
  const year = getAcademicYear()
  const paymentRows = payments.filter(p => p.payNow > 0)
  if (paymentRows.length === 0) return null

  for (const p of paymentRows) {
    const { data: current } = await supabase
      .from('student_fees')
      .select('paid_amount')
      .eq('id', p.id)
      .single()

    await supabase
      .from('student_fees')
      .update({
        paid_amount: (current?.paid_amount || 0) + p.payNow,
        updated_at:  new Date().toISOString(),
      })
      .eq('id', p.id)
  }

  const receiptNo = `RCP-${Date.now()}`
  const totalPaid = paymentRows.reduce((s, p) => s + p.payNow, 0)

  const { data: receipt, error } = await supabase
    .from('fee_payments')
    .insert({
      student_id:      studentId,
      receipt_no:      receiptNo,
      total_paid:      totalPaid,
      academic_year:   year,
      payment_date:    new Date().toISOString().split('T')[0],
      payment_details: paymentRows.map(p => ({
        fee_type: p.fee_type,
        label:    FEE_TYPES.find(f => f.key === p.fee_type)?.label || p.fee_type,
        amount:   p.payNow,
      })),
    })
    .select()
    .single()

  if (error) throw error
  return receipt
}

export async function deleteFeeRow(id: number) {
  const { error } = await supabase
    .from('student_fees')
    .delete()
    .eq('id', id)
  if (error) throw error
}

export async function deleteStudentAndUser(
  studentId: number,
  authUserId: string
) {
  await supabase.from('student_fees').delete().eq('student_id', studentId)
  await supabase.from('fee_payments').delete().eq('student_id', studentId)
  await supabase.from('students_list').delete().eq('id', studentId)

  const res = await fetch('/api/delete-parent-user', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: authUserId }),
  })

  if (!res.ok) {
    const { error } = await res.json()
    throw new Error(`Auth user deletion failed: ${error}`)
  }
}