import { createClient } from '@/utils/supabase/client'
import { FeeRow, Student } from '@/type/fees'

const supabase = createClient()

export const FEE_TYPES = [
  { key: 'admission', label: 'Admission fee',        defaultAmount: 2000 },
  { key: 'welfare',   label: 'Welfare fee',          defaultAmount: 500  },
  { key: 'book',      label: 'Book fee',             defaultAmount: 1500 },
  { key: 'vehicle',   label: 'Vehicle fee',          defaultAmount: 1200 },
  { key: 'exam',      label: 'Exam fee',             defaultAmount: 800  },
  { key: 'tuition1',  label: 'Tuition fee 1st term', defaultAmount: 3000 },
  { key: 'tuition2',  label: 'Tuition fee 2nd term', defaultAmount: 3000 },
  { key: 'tuition3',  label: 'Tuition fee 3rd term', defaultAmount: 3000 },
  { key: 'tuition4',  label: 'Tuition fee 4th term', defaultAmount: 3000 },
  { key: 'others',    label: 'Other fees',           defaultAmount: 0    },
]

// FIX: shared select string so gender is never accidentally omitted again
const STUDENT_SELECT =
  'id, admission_no, name, standard, gender, parent_guardian, mobile_no, address, vehicle_point, date_of_birth, aadhar_no'

// getAllStudents
export async function getAllStudents(): Promise<Student[]> {
  const { data, error } = await supabase
    .from('students_list')
    .select(STUDENT_SELECT)   // FIX: added gender
    .order('admission_no')
  if (error) throw error
  return (data ?? []) as Student[]
}

// searchStudents
export async function searchStudents(query: string): Promise<Student[]> {
  const { data, error } = await supabase
    .from('students_list')
    .select(STUDENT_SELECT)   // FIX: added gender
    .or(`admission_no.ilike.%${query}%,name.ilike.%${query}%`)
    .limit(10)
  if (error) throw error
  return (data ?? []) as Student[]
}

// Get or create fee rows for a student
export async function getOrCreateFeeRows(
  studentId: number,
  year = '2024-25'
): Promise<FeeRow[]> {
  const { data: existing } = await supabase
    .from('student_fees')
    .select('*')
    .eq('student_id', studentId)
    .eq('academic_year', year)

  const existingKeys = existing?.map((r: FeeRow) => r.fee_type) || []
  const missing = FEE_TYPES.filter(f => !existingKeys.includes(f.key))

  if (missing.length > 0) {
    await supabase.from('student_fees').insert(
      missing.map(f => ({
        student_id:    studentId,
        fee_type:      f.key,
        total_amount:  f.defaultAmount,
        paid_amount:   0,
        academic_year: year,
      }))
    )
  }

  const { data: all, error } = await supabase
    .from('student_fees')
    .select('*')
    .eq('student_id', studentId)
    .eq('academic_year', year)

  if (error) throw error
  return all || []
}

// Update total amount
export async function updateTotal(id: number, total: number) {
  const { error } = await supabase
    .from('student_fees')
    .update({ total_amount: total, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}

// Save payment
export async function savePayment(
  studentId: number,
  payments: { id: number; fee_type: string; payNow: number }[],
  year = '2024-25'
) {
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
        paid_amount:  (current?.paid_amount || 0) + p.payNow,
        updated_at:   new Date().toISOString(),
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
  authUserId: string   // the UUID from auth.users
) {
  // 1. Delete fee rows
  await supabase.from('student_fees').delete().eq('student_id', studentId)

  // 2. Delete fee payment history
  await supabase.from('fee_payments').delete().eq('student_id', studentId)

  // 3. Delete student record
  await supabase.from('students_list').delete().eq('id', studentId)

  // 4. Delete auth user (via server route)
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