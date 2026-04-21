'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { AdmissionRecord } from '@/type/admission'

export async function getAdmissions() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('students_list')
    .select('*')
    .order('admission_no', { ascending: true })

  if (error) throw new Error(error.message)
  return data as AdmissionRecord[]
}

export async function addAdmission(record: AdmissionRecord) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('students_list')
    .insert([record])
    .select()
    .single()

  if (error) throw new Error(error.message)

  revalidatePath('/dashboard/admission')
  return data
}

export async function updateAdmission(
  id: number,
  record: Partial<AdmissionRecord>
) {
  const supabase = await createClient()

  // remove id from payload for safety
  const { id: _, ...safeRecord } = record

  const { data, error } = await supabase
    .from('students_list')
    .update(safeRecord)
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(error.message)

  revalidatePath('/dashboard/admission')
  return data
}

export async function deleteAdmission(id: number) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('students_list')
    .delete()
    .eq('id', id)

  if (error) throw new Error(error.message)

  revalidatePath('/dashboard/admission')
}