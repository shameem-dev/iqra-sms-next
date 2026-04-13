'use client'


// imports
import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const supabase = createClient()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    setLoading(true)
    setError('')

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    const role = data.user?.user_metadata?.role

    // role based redirection z
    if (role === 'admin') {
      router.push('/admin')
    } else if (role === 'teacher') {
      router.push('/teacher')
    } else if (role === 'parent') {
      router.push('/parent')
    } else {
      setError('Unknown role. Contact administrator.')
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center"
      style={{ background: 'linear-gradient(135deg, #1a4f8a 0%, #0d3260 100%)' }}>
      <div className="bg-white rounded-2xl p-10 w-full max-w-md shadow-xl">

        {/* Logo & Header */}
        <div className="flex flex-col items-center mb-8 gap-3">
          <div className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ background: '#1a4f8a' }}>
            <svg width="32" height="32" viewBox="0 0 36 36" fill="none">
              <path d="M18 4L6 10V18C6 24.627 11.373 30 18 32C24.627 30 30 24.627 30 18V10L18 4Z"
                fill="white" fillOpacity="0.15" stroke="white" strokeWidth="1.5" />
              <path d="M13 18H23M18 13V23" stroke="white" strokeWidth="2" strokeLinecap="round" />
              <circle cx="18" cy="18" r="3" fill="white" fillOpacity="0.9" />
            </svg>
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-medium tracking-wide text-gray-800">IQRA School</h1>
            <p className="text-sm text-gray-500 mt-1">Student Management System</p>
          </div>
          <div className="w-10 h-0.5 rounded-full" style={{ background: '#1a4f8a' }} />
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 px-4 py-3 rounded-lg text-sm text-center"
            style={{ background: '#fef2f2', color: '#b91c1c', border: '0.5px solid #fca5a5' }}>
            {error}
          </div>
        )}

        {/* Fields */}
        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-widest mb-2">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <rect x="1" y="3" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.2" />
                  <path d="M1 5.5L8 9.5L15 5.5" stroke="currentColor" strokeWidth="1.2" />
                </svg>
              </span>
              <input
                type="email"
                placeholder="you@iqraschool.edu"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl text-sm border border-gray-200 bg-gray-50
                  focus:outline-none focus:border-blue-700 focus:bg-white transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-widest mb-2">
              Password
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <rect x="3" y="7" width="10" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
                  <path d="M5 7V5a3 3 0 0 1 6 0v2" stroke="currentColor" strokeWidth="1.2" />
                  <circle cx="8" cy="10.5" r="1" fill="currentColor" />
                </svg>
              </span>
              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl text-sm border border-gray-200 bg-gray-50
                  focus:outline-none focus:border-blue-700 focus:bg-white transition"
              />
            </div>
          </div>
        </div>

        {/* Button */}
        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full mt-6 py-3 rounded-xl text-white text-sm font-medium tracking-wide transition"
          style={{ background: loading ? '#7aa0c4' : '#1a4f8a' }}
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>

        
        <p className="text-center text-xs text-gray-400 mt-5">
          IQRA School &nbsp;•&nbsp; Secure Portal &nbsp;•&nbsp; 2026
        </p>
      </div>
    </div>
  )
}