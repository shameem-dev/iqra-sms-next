'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
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
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: '#dce8f5' }}
    >
      {/* Background watermark */}
      <div
        className="fixed bottom-0 right-0 w-96 h-96 pointer-events-none select-none"
     
      />

      {/* Card */}
      <div className="flex rounded-2xl overflow-hidden shadow-2xl w-full max-w-3xl mx-4" style={{ minHeight: 420 }}>

        {/* Left panel */}
        <div
          className="hidden md:flex flex-col items-center justify-center w-72 flex-shrink-0 relative overflow-hidden"
          style={{ background: 'linear-gradient(160deg, #1a4f8a 0%, #0d3260 100%)' }}
        >
   
          {/* Logo box */}
          <div
            className="relative flex items-center justify-center rounded-3xl mb-4"
           
          >
          
             <Image
              src="/images/logo.png"
      width={100}
      height={100}
      alt="Iqrah"
      className='rounded-3xl'
    />
          </div>

          <p className="text-white text-sm font-medium mt-2" style={{ letterSpacing: '0.2em' }}>
            IQRAH
          </p>
          <p className="text-blue-200 text-xs mt-1" style={{ opacity: 0.7, letterSpacing: '0.15em' }}>
            SINCE 2000
          </p>
        </div>

        {/* Right panel */}
        <div className="flex-1 bg-white text-gray-800 flex flex-col justify-center px-10 py-12">

          <div className="mb-8">
            <h1 className="text-3xl font-semibold text-gray-800">
              Login to <span style={{ color: '#1a4f8a', fontWeight: 700 }}>Panel</span>
            </h1>
            <p className="text-sm text-gray-400 mt-1">Enter your credentials to continue</p>
          </div>

          {error && (
            <div
              className="mb-5 px-4 py-3 rounded-lg text-sm"
              style={{ background: '#fef2f2', color: '#b91c1c', border: '1px solid #fca5a5' }}
            >
              {error}
            </div>
          )}

          <div className="flex flex-col gap-5">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-2 tracking-wide">
                Username
              </label>
              <input
                type="email"
                placeholder="Enter username"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-sm border border-gray-200 bg-gray-50
                  focus:outline-none focus:border-blue-700 focus:bg-white transition"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-2 tracking-wide">
                Password
              </label>
              <input
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                className="w-full px-4 py-3 rounded-xl text-sm border border-gray-200 bg-gray-50
                  focus:outline-none focus:border-blue-700 focus:bg-white transition"
              />
            </div>
          </div>

          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full mt-7 py-3 rounded-xl text-white text-sm font-semibold tracking-wide transition-all"
            style={{
              background: loading ? '#7aa0c4' : 'linear-gradient(90deg, #1a4f8a 0%, #1560a8 100%)',
              boxShadow: loading ? 'none' : '0 4px 18px rgba(26,79,138,0.35)',
            }}
          >
            {loading ? 'Signing in...' : 'Login'}
          </button>

          <p className="text-center text-xs text-gray-400 mt-6">
            Iqrah Public School &nbsp;•&nbsp;  Portal &nbsp;•&nbsp; 2026
          </p>
        </div>
      </div>
    </div>
  )
}