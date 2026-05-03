'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export interface PayrollRecord {
  id: string
  staff_id: string
  month: string
  payment_date: string
  basic_salary: number
  ta: number
  ta_paid: boolean
  notes: string | null
  salary_entry_id: string | null
  ta_entry_id: string | null
  created_at: string
}

// ── Fetch all payroll records for a given month ───────────────────────────────
export async function getPayrollForMonth(month: string): Promise<PayrollRecord[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('staff_payroll')
    .select('*')
    .eq('month', month)
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []) as PayrollRecord[]
}

// ── Fetch full payment history for a single staff member ──────────────────────
export async function getPayrollForStaff(staffId: string): Promise<PayrollRecord[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('staff_payroll')
    .select('*')
    .eq('staff_id', staffId)
    .order('month', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []) as PayrollRecord[]
}

// ── Build paid/partial/pending status map for StaffUI badges ──────────────────
// Pass in the full staff list so we can compare paid vs full salary
export async function getPayrollStatusForMonth(
  month: string,
  staffList: { id: string; basic_salary: number; ta: number }[]
): Promise<Record<string, { totalPaid: number; isFullyPaid: boolean; isPartiallyPaid: boolean }>> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('staff_payroll')
    .select('staff_id, basic_salary, ta, ta_paid')
    .eq('month', month)
  if (error) throw new Error(error.message)

  // Sum total paid per staff_id
  const paidMap: Record<string, number> = {}
  ;(data ?? []).forEach((p: any) => {
    const amount = Number(p.basic_salary) + (p.ta_paid ? Number(p.ta) : 0)
    paidMap[p.staff_id] = (paidMap[p.staff_id] ?? 0) + amount
  })

  const result: Record<string, { totalPaid: number; isFullyPaid: boolean; isPartiallyPaid: boolean }> = {}
  staffList.forEach(s => {
    const totalPaid  = paidMap[s.id] ?? 0
    const fullSalary = Number(s.basic_salary) + Number(s.ta)
    result[s.id] = {
      totalPaid,
      isFullyPaid:     totalPaid > 0 && totalPaid >= fullSalary,
      isPartiallyPaid: totalPaid > 0 && totalPaid < fullSalary,
    }
  })
  return result
}

// ── Record a salary payment (full or partial) ─────────────────────────────────
export async function markSalaryPaid(params: {
  staffId: string
  staffName: string
  basicSalary: number
  ta: number
  paymentDate: string
  month: string
  payTa: boolean
  notes?: string
  billVoucherNo?: string
  customAmount?: number | null
}): Promise<PayrollRecord> {
  const supabase = await createClient()

  const monthLabel = new Date(params.month + '-01').toLocaleString('en-IN', {
    month: 'long', year: 'numeric',
  })

  const isCustom = params.customAmount != null && params.customAmount > 0
  const billNo   = params.billVoucherNo?.trim() || null

  let salaryEntryId: string | null = null
  let taEntryId:     string | null = null

  if (isCustom) {
    // Single partial/custom amount entry
    const { data, error } = await supabase
      .from('account_entries')
      .insert([{
        type:                 'expenditure',
        expenditure_category: 'salary',
        staff_name:           params.staffName,
        amount:               params.customAmount,
        date:                 params.paymentDate,
        bill_voucher_no:      billNo,
        notes:                `Partial salary for ${monthLabel}${params.notes ? ' — ' + params.notes : ''}`,
        is_deleted:           false,
      }])
      .select('id')
      .single()
    if (error) throw new Error(`Salary entry failed: ${error.message}`)
    salaryEntryId = data.id
  } else {
    // Full basic salary
    if (params.basicSalary > 0) {
      const { data, error } = await supabase
        .from('account_entries')
        .insert([{
          type:                 'expenditure',
          expenditure_category: 'salary',
          staff_name:           params.staffName,
          amount:               params.basicSalary,
          date:                 params.paymentDate,
          bill_voucher_no:      billNo,
          notes:                `Salary for ${monthLabel}${params.notes ? ' — ' + params.notes : ''}`,
          is_deleted:           false,
        }])
        .select('id')
        .single()
      if (error) throw new Error(`Salary entry failed: ${error.message}`)
      salaryEntryId = data.id
    }

    // TA entry
    if (params.payTa && params.ta > 0) {
      const { data, error } = await supabase
        .from('account_entries')
        .insert([{
          type:                 'expenditure',
          expenditure_category: 'staff_ta',
          staff_name:           params.staffName,
          amount:               params.ta,
          date:                 params.paymentDate,
          bill_voucher_no:      billNo,
          notes:                `TA for ${monthLabel}${params.notes ? ' — ' + params.notes : ''}`,
          is_deleted:           false,
        }])
        .select('id')
        .single()
      if (error) throw new Error(`TA entry failed: ${error.message}`)
      taEntryId = data.id
    }
  }

  // Insert payroll record (no unique constraint — multiple allowed per month)
  const { data, error } = await supabase
    .from('staff_payroll')
    .insert({
      staff_id:        params.staffId,
      month:           params.month,
      payment_date:    params.paymentDate,
      basic_salary:    isCustom ? params.customAmount! : params.basicSalary,
      ta:              isCustom ? 0 : (params.payTa ? params.ta : 0),
      ta_paid:         !isCustom && params.payTa,
      notes:           params.notes || null,
      salary_entry_id: salaryEntryId,
      ta_entry_id:     taEntryId,
    })
    .select()
    .single()

  if (error) throw new Error(`Payroll record failed: ${error.message}`)

  revalidatePath('/admin/accounts')
  revalidatePath('/admin/staff')

  return data as PayrollRecord
}