// ─────────────────────────────────────────────────────────────────────────────
// /api/admin/create-parent-bulk/route.ts
// What this route does:
//   1. Finds all students with no parent login (parent_auth_user_id IS NULL)
//   2. Creates a Supabase Auth account for each parent
//   3. Creates a profile row for each parent
//   4. Links the auth user ID back to the student row
//   5. Returns { created, failed, results[] } so the UI can show a summary
// ─────────────────────────────────────────────────────────────────────────────

import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Admin client — has full DB access via service role key
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Supabase requires passwords to be at least 6 characters.
// Pad short admission numbers with zeros.
function makePassword(admissionNo: string): string {
  return admissionNo.length >= 6 ? admissionNo : admissionNo.padEnd(6, '0')
}

export async function POST() {
  // ── Step 1: Fetch students without a parent login ──────────────────────────
  const { data: students, error: fetchError } = await supabaseAdmin
    .from('students_list')
    .select('id, name, admission_no')
    .is('parent_auth_user_id', null)

  if (fetchError) {
    console.error('[create-parent-bulk] Failed to fetch students:', fetchError.message)
    return NextResponse.json(
      { error: fetchError.message },
      { status: 400 }
    )
  }

  // No students need logins
  if (!students || students.length === 0) {
    return NextResponse.json({
      success: true,
      message: 'All students already have parent logins',
      created: 0,
      failed: 0,
      results: [],
    })
  }

  // ── Step 2: Process each student ──────────────────────────────────────────
  let created = 0
  let failed  = 0

  // `results` holds successfully created logins — returned to the UI
  const results: { name: string; admission_no: string; email: string }[] = []

  // `errors` holds failure details — useful for debugging from server logs
  const errors: { admission_no: string; reason: string }[] = []

  for (const student of students) {
    const email    = `${student.admission_no}@iqra.school`
    const password = makePassword(student.admission_no)

    try {
      // Step 2a: Create Supabase Auth user
      const { data: authData, error: authError } = await supabaseAdmin
        .auth.admin.createUser({
          email,
          password,
          email_confirm: true, // auto-confirm so parent can log in immediately
          user_metadata: {
            full_name: student.name,
            role: 'parent',
          },
        })

      if (authError) {
        // Most common cause: email already exists in auth.users
        // (e.g. student was previously deleted but auth user wasn't cleaned up)
        console.error(
          `[create-parent-bulk] Auth failed for ${student.admission_no}:`,
          authError.message
        )
        errors.push({ admission_no: student.admission_no, reason: authError.message })
        failed++
        continue // move to next student
      }

      const authUserId = authData.user.id

      // Step 2b: Create profile row for this parent
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .insert({
          id: authUserId,
          username: email,
          full_name: student.name,
          role: 'parent',
          student_id: student.id,
        })

      if (profileError) {
        // Profile insert failed but auth user exists — log it, don't count as failure
        // The link step below will still work, so the parent CAN log in
        console.warn(
          `[create-parent-bulk] Profile insert failed for ${student.admission_no}:`,
          profileError.message
        )
      }

      // Step 2c: Link auth user ID back to the student row
      const { error: linkError } = await supabaseAdmin
        .from('students_list')
        .update({
          parent_auth_user_id: authUserId,
          parent_email: email,
        })
        .eq('id', student.id)

      if (linkError) {
        // This is a problem — auth user exists but student row isn't updated
        // The badge will still show "None" until fixed
        console.error(
          `[create-parent-bulk] Link failed for ${student.admission_no}:`,
          linkError.message
        )
        errors.push({
          admission_no: student.admission_no,
          reason: `Auth created but link failed: ${linkError.message}`,
        })
        failed++
        continue
      }

      // All 3 steps succeeded
      results.push({ name: student.name, admission_no: student.admission_no, email })
      created++

    } catch (err) {
      // Unexpected runtime error for this student
      const message = err instanceof Error ? err.message : 'Unknown error'
      console.error(
        `[create-parent-bulk] Unexpected error for ${student.admission_no}:`,
        message
      )
      errors.push({ admission_no: student.admission_no, reason: message })
      failed++
    }
  }

  // ── Step 3: Return summary ─────────────────────────────────────────────────
  // `results` → shown in success banner on the UI
  // `errors`  → logged above; available here if you want to show them in UI later
  return NextResponse.json({
    success: true,
    created,
    failed,
    results,
    // Uncomment below if you want to show failed student names in the UI:
    // errors,
  })
}