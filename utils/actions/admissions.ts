'use server'

import { createClient } from '@/utils/supabase/server'
import { AdmissionRecord } from '@/type/admission'

export async function getAdmissions() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('admission_register')
    .select('*')
    .order('admission_no', { ascending: true })

  if (error) throw new Error(error.message)
  return data as AdmissionRecord[]
}

export async function addAdmission(record: AdmissionRecord) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('admission_register')
    .insert([record])
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function updateAdmission(id: number, record: Partial<AdmissionRecord>) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('admission_register')
    .update(record)
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function deleteAdmission(id: number) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('admission_register')
    .delete()
    .eq('id', id)

  if (error) throw new Error(error.message)
}