
import { createClient } from "@/utils/supabase/server"

export default async function Page() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  return <p>User: {user ? user.email : 'Not logged in'}</p>
}