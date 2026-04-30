import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  const { email, password, studentId, parentName } = await req.json()

  if (!email || !password || !studentId) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // 1. Create Supabase Auth user
  const { data, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: parentName, role: 'parent' },
  })
  if (authError) return NextResponse.json({ error: authError.message }, { status: 400 })

  const authUserId = data.user.id

  // 2. Create profile linked to student
  const { error: profileError } = await supabaseAdmin
    .from('profiles')
    .insert({
      id: authUserId,
      username: email,
      full_name: parentName,
      role: 'parent',
      student_id: studentId,
    })
  if (profileError) return NextResponse.json({ error: profileError.message }, { status: 400 })

  return NextResponse.json({ success: true, userId: authUserId })
}