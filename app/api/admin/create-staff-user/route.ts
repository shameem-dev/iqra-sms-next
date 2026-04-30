import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  const { email, password, staffId, staffName, role, assignments } = await req.json()

  if (!email || !password || !staffId) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // 1. Create auth user
  const { data, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email, password, email_confirm: true,
    user_metadata: { full_name: staffName, role: role || 'teacher' },
  })
  if (authError) return NextResponse.json({ error: authError.message }, { status: 400 })

  const authUserId = data.user.id

  // 2. Update staff table
  const { error: staffError } = await supabaseAdmin
    .from('staff').update({ auth_user_id: authUserId, email }).eq('id', staffId)
  if (staffError) return NextResponse.json({ error: staffError.message }, { status: 400 })

  // 3. Create profile
  const { error: profileError } = await supabaseAdmin.from('profiles').insert({
    id: authUserId, username: email, full_name: staffName,
    role: role || 'teacher', staff_id: staffId,
  })
  if (profileError) return NextResponse.json({ error: profileError.message }, { status: 400 })

  // 4. Save assignments (class_teacher + subject_teacher rows)
  if (assignments && assignments.length > 0) {
    const rows = assignments.map((a: any) => ({
      staff_id: staffId,
      type: a.type,
      standard: a.standard,
      subject_id: a.subject_id ?? null,
    }))
    const { error: assignError } = await supabaseAdmin
      .from('teacher_assignments').insert(rows)
    if (assignError) return NextResponse.json({ error: assignError.message }, { status: 400 })
  }

  return NextResponse.json({ success: true, userId: authUserId })
}