import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Ensure password is at least 6 chars
function makePassword(admissionNo: string): string {
  return admissionNo.length >= 6 ? admissionNo : admissionNo.padEnd(6, '0')
}

export async function POST() {
  const { data: students, error } = await supabaseAdmin
    .from('students_list')
    .select('id, name, admission_no')
    .is('parent_auth_user_id', null)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  if (!students || students.length === 0) {
    return NextResponse.json({ message: 'All students already have parent logins', count: 0 })
  }

  let created = 0
  let failed  = 0
  const results: any[] = []

  for (const student of students) {
    const email    = `${student.admission_no}@iqra.school`
    const password = makePassword(student.admission_no)

    try {
      const { data, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email, password, email_confirm: true,
        user_metadata: { full_name: student.name, role: 'parent' },
      })
      if (authError) { failed++; continue }

      const authUserId = data.user.id

      await supabaseAdmin.from('profiles').insert({
        id: authUserId, username: email,
        full_name: student.name, role: 'parent', student_id: student.id,
      })

      await supabaseAdmin.from('students_list')
        .update({ parent_auth_user_id: authUserId, parent_email: email })
        .eq('id', student.id)

      results.push({ name: student.name, admission_no: student.admission_no, email, password })
      created++
    } catch { failed++ }
  }

  return NextResponse.json({ success: true, created, failed, results })
}