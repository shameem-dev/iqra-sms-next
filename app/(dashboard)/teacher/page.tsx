import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import TeacherDashboard from '@/components/teacher/TeacherDashboard'

export default async function TeacherPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const role = user.user_metadata?.role
  if (role !== 'teacher') redirect('/login')

  // Get teacher's profile with staff_id
  const { data: profile } = await supabase
    .from('profiles')
    .select('staff_id, full_name')
    .eq('id', user.id)
    .single()

  if (!profile?.staff_id) redirect('/login')

  // Get teacher's assignments
  const { data: assignments } = await supabase
    .from('teacher_assignments')
    .select('id, type, standard, subject_id, subjects(id, name, standard, max_ut1, max_ut2, max_ut3, max_ut4, max_mid_term, max_half_yearly, max_final)')
    .eq('staff_id', profile.staff_id)

  // Get staff details
  const { data: staffData } = await supabase
    .from('staff')
    .select('*')
    .eq('id', profile.staff_id)
    .single()

  const classAssignment    = assignments?.find(a => a.type === 'class_teacher')
  const subjectAssignments = assignments?.filter(a => a.type === 'subject_teacher') || []

  return (
    <TeacherDashboard
      teacher={staffData}
      fullName={profile.full_name}
      classAssignment={classAssignment || null}
      subjectAssignments={subjectAssignments}
      userId={user.id}
    />
  )
}