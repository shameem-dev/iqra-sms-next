'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { AccountEntry, NewEntry, EntryType, MonthlySummary, CategorySummary } from '@/type/accounts'

// ── Re-export types so UI can import everything from one place ────────────────
export type {
  AccountEntry,
  NewEntry,
  EntryType,
  MonthlySummary,
  CategorySummary,
} from '@/type/accounts'

export type {
  IncomeCategory,
  ExpenditureCategory,
} from '@/type/accounts'

// ── Fetch entries ─────────────────────────────────────────
export async function fetchEntries(
  opts: { type?: EntryType; month?: string; limit?: number; offset?: number } = {}
): Promise<AccountEntry[]> {
  const supabase = await createClient()

  let q = supabase
    .from('account_entries')
    .select('*')
    .eq('is_deleted', false)
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })

  if (opts.type)   q = q.eq('type', opts.type)
  if (opts.month)  q = q.gte('date', `${opts.month}-01`).lte('date', `${opts.month}-31`)
  if (opts.limit)  q = q.limit(opts.limit)
  if (opts.offset) q = q.range(opts.offset, opts.offset + (opts.limit ?? 50) - 1)

  const { data, error } = await q
  if (error) throw new Error(`fetchEntries: ${error.message}`)
  return (data ?? []) as AccountEntry[]
}

// ── Create entry ──────────────────────────────────────────
export async function createEntry(entry: NewEntry): Promise<AccountEntry> {
  const supabase = await createClient()

  const payload: Partial<NewEntry> = { ...entry }

  if (entry.type === 'income') {
    delete (payload as any).expenditure_category
    delete (payload as any).staff_name
    delete (payload as any).vehicle_no
  } else {
    delete (payload as any).income_category
    delete (payload as any).book_no
    delete (payload as any).receipt_no
  }

  const { data, error } = await supabase
    .from('account_entries')
    .insert([payload])
    .select()
    .single()

  if (error) throw new Error(`createEntry: ${error.message}`)

  revalidatePath('/admin/accounts')
  return data as AccountEntry
}

// ── Update entry ──────────────────────────────────────────
export async function updateEntry(id: string, patch: Partial<NewEntry>): Promise<AccountEntry> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('account_entries')
    .update(patch)
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(`updateEntry: ${error.message}`)

  revalidatePath('/admin/accounts')
  return data as AccountEntry
}

// ── Soft-delete entry ─────────────────────────────────────
export async function deleteEntry(id: string): Promise<void> {
  const supabase = await createClient()

  // Get account entry first
  const { data: entry, error: entryError } = await supabase
    .from('account_entries')
    .select('*')
    .eq('id', id)
    .single()

  if (entryError) throw new Error(entryError.message)

  // Return payment back to fee
  if (entry.student_id && entry.fee_type) {
    const { data: fee } = await supabase
      .from('student_fees')
      .select('*')
      .eq('student_id', entry.student_id)
      .eq('fee_type', entry.fee_type)
      .single()

    if (fee) {
      await supabase
        .from('student_fees')
        .update({
          paid_amount: fee.paid_amount - entry.amount
        })
        .eq('id', fee.id)
    }
  }

      // Update payment history
    const { data: payment } = await supabase
      .from('fee_payments')
      .select('*')
      .eq('student_id', entry.student_id)
      .eq('receipt_no', entry.receipt_no)
      .single()

    if (payment) {
      const details = payment.payment_details as any[]

      const updatedDetails = details.filter(
        d => d.fee_type !== entry.fee_type
      )

      const updatedTotal = updatedDetails.reduce(
        (sum: number, d: any) => sum + Number(d.amount),
        0
      )

      if (updatedDetails.length === 0) {
        await supabase
          .from('fee_payments')
          .delete()
          .eq('id', payment.id)
      } else {
        await supabase
          .from('fee_payments')
          .update({
            payment_details: updatedDetails,
            total_paid: updatedTotal,
          })
          .eq('id', payment.id)
      }
    }

  // Delete account entry
  const { error } = await supabase
    .from('account_entries')
    .update({ is_deleted: true })
    .eq('id', id)

  if (error) throw new Error(error.message)

  revalidatePath('/admin/accounts')
  revalidatePath('/admin/staff')
}

// ── Overall totals ────────────────────────────────────────
export async function fetchTotals(): Promise<{ income: number; expenditure: number; balance: number }> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('account_entries')
    .select('type, amount')
    .eq('is_deleted', false)

  if (error) throw new Error(`fetchTotals: ${error.message}`)

  const income = (data ?? [])
    .filter(r => r.type === 'income')
    .reduce((s: number, r: any) => s + Number(r.amount), 0)

  const expenditure = (data ?? [])
    .filter(r => r.type === 'expenditure')
    .reduce((s: number, r: any) => s + Number(r.amount), 0)

  return { income, expenditure, balance: income - expenditure }
}

// ── Monthly summary ───────────────────────────────────────
export async function fetchMonthlySummary(limit = 12): Promise<MonthlySummary[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('monthly_summary')
    .select('*')
    .limit(limit)

  if (error) throw new Error(`fetchMonthlySummary: ${error.message}`)
  return (data ?? []) as MonthlySummary[]
}

// ── Category summary ──────────────────────────────────────
export async function fetchCategorySummary(): Promise<CategorySummary[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('category_summary')
    .select('*')

  if (error) throw new Error(`fetchCategorySummary: ${error.message}`)
  return (data ?? []) as CategorySummary[]
}