import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import ParentDashboard from '@/components/parent/ParentDashboard'

export default async function ParentPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const role = user.user_metadata?.role
  if (role !== 'parent') redirect('/login')

  // Get profile with student_id
  const { data: profile } = await supabase
    .from('profiles')
    .select('student_id, full_name')
    .eq('id', user.id)
    .single()

  if (!profile?.student_id) redirect('/login')

  // Get student details
  const { data: student } = await supabase
    .from('students_list')
    .select('*')
    .eq('id', profile.student_id)
    .single()

  return (
    <ParentDashboard
      student={student}
      parentName={profile.full_name}
      studentId={profile.student_id}
    />
  )
}