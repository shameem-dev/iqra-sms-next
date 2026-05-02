'use client'

import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'
import { User, CreditCard, BookOpen, CalendarCheck, LogOut } from 'lucide-react'
import ParentChild from './ParentChild'
import ParentFees from './ParentFees'
import ParentMarks from './ParentMarks'
import ParentAttendance from './ParentAttendance'

interface Props {
  student: any
  parentName: string
  studentId: number
}

type Tab = 'child' | 'fees' | 'marks' | 'attendance'

export default function ParentDashboard({ student, parentName, studentId }: Props) {
  const router = useRouter()
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!
  )

  const [activeTab, setActiveTab] = useState<Tab>('child')

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const tabs = [
    { id: 'child',      label: 'My Child',   icon: User },
    { id: 'fees',       label: 'Fees',        icon: CreditCard },
    { id: 'marks',      label: 'Marks',       icon: BookOpen },
    { id: 'attendance', label: 'Attendance',  icon: CalendarCheck },
  ] as const

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ── Top Nav ── */}
      <div className="bg-blue-700 text-white px-6 py-4 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center font-bold text-sm">
            {student?.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-semibold leading-tight">{parentName}</p>
            <p className="text-blue-200 text-xs">
              Parent of {student?.name} — {student?.standard}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs bg-white/20 px-3 py-1 rounded-full">Parent Portal</span>
          <button onClick={handleLogout}
            className="flex items-center gap-1.5 text-xs bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-colors">
            <LogOut className="w-3.5 h-3.5" /> Logout
          </button>
        </div>
      </div>

      {/* ── Tab Bar ── */}
      <div className="bg-white border-b border-slate-200 px-6">
        <div className="flex gap-0">
          {tabs.map(tab => (
            <button key={tab.id}
              onClick={() => setActiveTab(tab.id as Tab)}
              className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-700'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}>
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Content ── */}
      <div className="max-w-4xl mx-auto p-6">
        {activeTab === 'child'      && <ParentChild student={student} />}
        {activeTab === 'fees'       && <ParentFees studentId={studentId} />}
        {activeTab === 'marks'      && <ParentMarks studentId={studentId} standard={student?.standard} />}
        {activeTab === 'attendance' && <ParentAttendance studentId={studentId} studentName={student?.name} />}
      </div>
    </div>
  )
}