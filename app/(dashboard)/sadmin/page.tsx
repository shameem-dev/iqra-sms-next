import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import AdminLayout from "@/components/admin/sadmin_layout"
import { redirect } from 'next/navigation'

export default async function AdminPage() {
  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll() {},
      },
    }
  )

  // ✅ Get user
  const { data: { user } } = await supabase.auth.getUser()

  // ✅ Get role from profiles table
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user!.id)
    .single()

  const role = profile?.role

  // ✅ Only allow sadmin
  if (role !== 'sadmin') {
    redirect(`/${role ?? 'login'}`)
  }

  return <AdminLayout />
}