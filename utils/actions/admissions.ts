'use server'

import { createClient } from '@/utils/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
import { AdmissionRecord } from '@/type/admission'

// ── Supabase Admin client ─────────────────────────────────────────────────────
// Uses the SERVICE ROLE key — never expose this on the client side.
// This is required for creating/deleting auth users from server actions.
const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ── Password helper ───────────────────────────────────────────────────────────
// Supabase requires passwords to be at least 6 characters.
// If the admission number is shorter (e.g. "001"), we pad it with zeros.
// Example: "001" → "001000"
function makePassword(admissionNo: string): string {
  return admissionNo.length >= 6 ? admissionNo : admissionNo.padEnd(6, '0')
}

// ─────────────────────────────────────────────────────────────────────────────
// getAdmissions
// Fetches all student records ordered by admission number.
// FIX: Now explicitly selects `parent_auth_user_id` and `parent_email`
//      so the Login Status badge (Active / None) works correctly in the UI.
// ─────────────────────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────────────────────
// addAdmission
// Inserts a new student record, then automatically creates a Supabase Auth
// account for the parent with credentials:
//   Email:    <admission_no>@iqra.school
//   Password: <admission_no>  (padded to 6 chars if needed)
//
// FIX: The parent login failure is now caught silently so the student is still
//      saved even if auth creation fails. The student will show "None" login
//      status and can be fixed later via "Generate Logins".
// ─────────────────────────────────────────────────────────────────────────────
export async function addAdmission(record: AdmissionRecord): Promise<AdmissionRecord> {
  const supabase = await createClient()

  // Step 1: Insert the student record first
  const { data, error } = await supabase
    .from('students_list')
    .insert([record])
    .select()
    .single()

  if (error) throw new Error(error.message)

  // Step 2: Try to create parent auth account
  // Wrapped in try/catch so a failed auth creation does NOT roll back
  // the student insert. The student record is always saved.
  try {
    const email    = `${record.admission_no}@iqra.school`
    const password = makePassword(record.admission_no)

    const { data: authData, error: authError } = await supabaseAdmin
      .auth.admin.createUser({
        email,
        password,
        email_confirm: true, // skip email verification for school accounts
        user_metadata: {
          full_name: record.name,
          role: 'parent',
        },
      })

    if (authError) {
      // Log the specific error so you can debug from server logs
      // Common causes: duplicate email (student re-added), invalid email format
      console.error(
        `[addAdmission] Auth creation failed for ${record.admission_no}:`,
        authError.message
      )
      // We do NOT throw — student is saved, login just won't be created
    } else if (authData.user) {
      const authUserId = authData.user.id

      // Step 3: Create profile row for the parent
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

      // Step 4: Link the auth user back to the student row
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
    // Unexpected runtime error — log but don't crash
    console.error(
      `[addAdmission] Unexpected error during parent login creation for ${record.admission_no}:`,
      err
    )
  }

  revalidatePath('/admin')
  return data as AdmissionRecord
}

// ─────────────────────────────────────────────────────────────────────────────
// updateAdmission
// Updates an existing student record by ID.
// Note: Does NOT update the parent auth email/password even if admission_no
//       changes. If you need that, handle it separately.
// ─────────────────────────────────────────────────────────────────────────────
export async function updateAdmission(
  id: number,
  record: Partial<AdmissionRecord>
): Promise<AdmissionRecord> {
  const supabase = await createClient()

  // Strip `id` from the update payload to avoid Supabase errors
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

// ─────────────────────────────────────────────────────────────────────────────
// deleteAdmission
// Deletes a student record by ID.
// NOTE: This does NOT delete the parent's Supabase Auth account.
//       To also delete the auth user, you would need:
//         await supabaseAdmin.auth.admin.deleteUser(student.parent_auth_user_id)
//       Add that if your school policy requires removing parent portal access
//       when a student is deleted.
// ─────────────────────────────────────────────────────────────────────────────
export async function deleteAdmission(id: number): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('students_list')
    .delete()
    .eq('id', id)

  if (error) throw new Error(error.message)

  // FIX: was revalidating '/admin' — changed to match the actual page path
  revalidatePath('/admin')
}