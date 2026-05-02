'use server'

import { createClient } from '@/utils/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
import { AdmissionRecord } from '@/type/admission'

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ── Supabase requires min 6 chars for password ────────────────────────────────
function makePassword(admissionNo: string): string {
  return admissionNo.length >= 6 ? admissionNo : admissionNo.padEnd(6, '0')
}

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

  try {
    const email    = `${record.admission_no}@iqra.school`
    const password = makePassword(record.admission_no) // ← fixed

    const { data: authData, error: authError } = await supabaseAdmin
      .auth.admin.createUser({
        email, password, email_confirm: true,
        user_metadata: { full_name: record.name, role: 'parent' },
      })

    if (!authError && authData.user) {
      const authUserId = authData.user.id

      await supabaseAdmin.from('profiles').insert({
        id: authUserId, username: email,
        full_name: record.name, role: 'parent', student_id: data.id,
      })

      await supabaseAdmin
        .from('students_list')
        .update({ parent_auth_user_id: authUserId, parent_email: email })
        .eq('id', data.id)
    }
  } catch {
    console.error('Parent login creation failed for', record.admission_no)
  }

  revalidatePath('/dashboard/admission')
  return data
}

export async function updateAdmission(id: number, record: Partial<AdmissionRecord>) {
  const supabase = await createClient()
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
  revalidatePath('/admin')
}