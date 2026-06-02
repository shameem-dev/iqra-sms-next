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

  const { error } = await supabase
    .from('account_entries')
    .update({ is_deleted: true })
    .eq('id', id)

  if (error) throw new Error(`deleteEntry: ${error.message}`)

  // Clear data cache instances on both operational tracks concurrently
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