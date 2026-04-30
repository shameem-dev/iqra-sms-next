import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Get session
  const { data: { user } } = await supabase.auth.getUser()
  const path = request.nextUrl.pathname
  const role = user?.user_metadata?.role

  // ── Not logged in ─────────────────────────────────────
  if (!user && !path.startsWith('/login')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // ── Logged in ─────────────────────────────────────────
  if (user) {
    // On login page → redirect to correct dashboard
    if (path === '/login' || path === '/') {
      if (role === 'admin')   return NextResponse.redirect(new URL('/admin', request.url))
      if (role === 'teacher') return NextResponse.redirect(new URL('/teacher', request.url))
      if (role === 'parent')  return NextResponse.redirect(new URL('/parent', request.url))
    }

    // Teacher trying to access admin or parent → block
    if (role === 'teacher' && (path.startsWith('/admin') || path.startsWith('/parent'))) {
      return NextResponse.redirect(new URL('/teacher', request.url))
    }

    // Parent trying to access admin or teacher → block
    if (role === 'parent' && (path.startsWith('/admin') || path.startsWith('/teacher'))) {
      return NextResponse.redirect(new URL('/parent', request.url))
    }

    // Non-admin trying to access admin → block
    if (role !== 'admin' && path.startsWith('/admin')) {
      return NextResponse.redirect(new URL(`/${role}`, request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
}