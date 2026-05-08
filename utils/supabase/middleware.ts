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

  const { data: { user } } = await supabase.auth.getUser()
  const path = request.nextUrl.pathname
  const role = user?.user_metadata?.role

  // ── DEBUG: remove after fixing
  console.log('MIDDLEWARE:', { path, hasUser: !!user, role })

  // Not logged in → force login
  if (!user) {
    // Allow /login through, block everything else
    if (!path.startsWith('/login')) {
      const loginUrl = new URL('/login', request.url)
      return NextResponse.redirect(loginUrl)
    }
    return supabaseResponse
  }

  // Logged in + on login or root → go to dashboard
  if (path === '/login' || path === '/') {
    if (role === 'admin')   return NextResponse.redirect(new URL('/admin', request.url))
    if (role === 'teacher') return NextResponse.redirect(new URL('/teacher', request.url))
    if (role === 'parent')  return NextResponse.redirect(new URL('/parent', request.url))
  }

  // Role-based route protection
  if (role === 'teacher' && (path.startsWith('/admin') || path.startsWith('/parent'))) {
    return NextResponse.redirect(new URL('/teacher', request.url))
  }
  if (role === 'parent' && (path.startsWith('/admin') || path.startsWith('/teacher'))) {
    return NextResponse.redirect(new URL('/parent', request.url))
  }
  if (role !== 'admin' && path.startsWith('/admin')) {
    return NextResponse.redirect(new URL(`/${role}`, request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api|images).*)'],
}