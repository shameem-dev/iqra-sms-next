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
  studentId: number
}

type Tab = 'child' | 'fees' | 'marks' | 'attendance'

export default function ParentDashboard({ student, studentId }: Props) {
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

      {/* Top Nav */}
      <div className="bg-teal-600 text-white px-4 sm:px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center font-bold text-sm shrink-0">
            {student?.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          <div>
            <p className="text-xl font-semibold leading-tight pb-[-30px]">{student?.name} </p>
            <p className='opacity-80 text-xs pt-[-30px]'> {student?.standard}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden sm:inline text-xs bg-white/20 px-3 py-1 rounded-full">Parent Portal</span>
          <button onClick={handleLogout}
            className="flex items-center gap-1.5 text-xs bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-colors">
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>

      

      {/* Content */}
      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        {activeTab === 'child'      && <ParentChild student={student} />}
        {activeTab === 'fees'       && <ParentFees studentId={studentId} />}
        {activeTab === 'marks'      && <ParentMarks studentId={studentId} standard={student?.standard} />}
        {activeTab === 'attendance' && <ParentAttendance studentId={studentId} studentName={student?.name} />}
      </div>
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 shadow-lg">
        <div className="max-w-4xl mx-auto flex">
          {tabs.map(tab => (
            <button key={tab.id}
              onClick={() => setActiveTab(tab.id as Tab)}
              className={`relative flex-1 flex flex-col items-center justify-center gap-1 py-3 transition-colors ${
                activeTab === tab.id ? 'text-teal-600' : 'text-slate-400 hover:text-slate-600'
              }`}>
              <tab.icon className="w-5 h-5" />
              <span className="text-xs font-medium">{tab.label}</span>
              {activeTab === tab.id && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-10 h-0.5 bg-teal-500 rounded-full" />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}