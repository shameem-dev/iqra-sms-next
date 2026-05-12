'use server'

import { createClient } from '@/utils/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
import { AdmissionRecord } from '@/type/admission'
import { getOrCreateFeeRows } from '@/utils/actions/fees'   // ← NEW IMPORT

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function makePassword(admissionNo: string): string {
  return admissionNo.length >= 6 ? admissionNo : admissionNo.padEnd(6, '0')
}

export async function getAdmissions(): Promise<AdmissionRecord[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('students_list')
    .select(`
      id,
      admission_no,
      name,
      standard,
      date_of_birth,
      aadhar_no,
      parent_guardian,
      address,
      mobile_no,
      vehicle_point,
      gender,
      created_at,
      user_id,
      parent_auth_user_id,
      parent_email
    `)
    .order('admission_no', { ascending: true })

  if (error) throw new Error(error.message)
  return data as AdmissionRecord[]
}

export async function addAdmission(record: AdmissionRecord): Promise<AdmissionRecord> {
  const supabase = await createClient()

  // Step 1: Insert the student record
  const { data, error } = await supabase
    .from('students_list')
    .insert([record])
    .select()
    .single()

  if (error) throw new Error(error.message)

  // Step 2: Scaffold fee rows immediately so student appears in Fee Tracker
  // with zero amounts rather than "no fees assigned".
  try {
    await getOrCreateFeeRows(data.id)
  } catch (err) {
    console.error(
      `[addAdmission] Fee row creation failed for student ${data.id}:`,
      err
    )
  }

  // Step 3: Try to create parent auth account
  try {
    const email    = `${record.admission_no}@iqra.school`
    const password = makePassword(record.admission_no)

    const { data: authData, error: authError } = await supabaseAdmin
      .auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: record.name,
          role: 'parent',
        },
      })

    if (authError) {
      console.error(
        `[addAdmission] Auth creation failed for ${record.admission_no}:`,
        authError.message
      )
    } else if (authData.user) {
      const authUserId = authData.user.id

      // Step 4: Create profile row for the parent
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .insert({
          id: authUserId,
          username: email,
          full_name: record.name,
          role: 'parent',
          student_id: data.id,
        })

      if (profileError) {
        console.error(
          `[addAdmission] Profile insert failed for ${record.admission_no}:`,
          profileError.message
        )
      }

      // Step 5: Link the auth user back to the student row
      const { error: linkError } = await supabaseAdmin
        .from('students_list')
        .update({
          parent_auth_user_id: authUserId,
          parent_email: email,
        })
        .eq('id', data.id)

      if (linkError) {
        console.error(
          `[addAdmission] Linking auth user to student failed for ${record.admission_no}:`,
          linkError.message
        )
      }
    }
  } catch (err) {
    console.error(
      `[addAdmission] Unexpected error during parent login creation for ${record.admission_no}:`,
      err
    )
  }

  revalidatePath('/admin')
  return data as AdmissionRecord
}

export async function updateAdmission(
  id: number,
  record: Partial<AdmissionRecord>
): Promise<AdmissionRecord> {
  const supabase = await createClient()

  const { id: _id, ...safeRecord } = record

  const { data, error } = await supabase
    .from('students_list')
    .update(safeRecord)
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(error.message)

  revalidatePath('/admin')
  return data as AdmissionRecord
}

export async function deleteAdmission(id: number): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('students_list')
    .delete()
    .eq('id', id)

  if (error) throw new Error(error.message)

  revalidatePath('/admin')
}