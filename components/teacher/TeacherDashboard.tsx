'use client'

import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'
import { GraduationCap, ClipboardList, CalendarCheck, LogOut, User, BookOpen } from 'lucide-react'

import TeacherMarks from './TeacherMarks'
import TeacherAttendance from './TeacherAttendance'
import TeacherProfile from './TeacherProfile'

interface Props {
  teacher: any
  fullName: string
  classAssignment: any | null
  subjectAssignments: any[]
  userId: string
}

type Tab = 'profile' | 'marks' | 'attendance'

export default function TeacherDashboard({
  teacher, fullName, classAssignment, subjectAssignments, userId
}: Props) {
  const router = useRouter()
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!
  )

  const [activeTab, setActiveTab] = useState<Tab>('profile')

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const tabs = [
    { id: 'profile',    label: 'My Profile',  icon: User,          show: true },
    { id: 'marks',      label: 'Marks Entry', icon: BookOpen,       show: subjectAssignments.length > 0 },
    { id: 'attendance', label: 'Attendance',  icon: CalendarCheck,  show: !!classAssignment },
  ] as const

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ── Top Nav ── */}
      <div className="bg-teal-700 text-white px-6 py-4 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center font-bold text-sm">
            {fullName?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-semibold leading-tight">{fullName}</p>
            <p className="text-teal-200 text-xs">
              {classAssignment ? `Class Teacher — ${classAssignment.standard}` : 'Subject Teacher'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs bg-white/20 px-3 py-1 rounded-full">Teacher Portal</span>
          <button onClick={handleLogout}
            className="flex items-center gap-1.5 text-xs bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-colors">
            <LogOut className="w-3.5 h-3.5" /> Logout
          </button>
        </div>
      </div>

      {/* ── Tab Bar ── */}
      <div className="bg-white border-b border-slate-200 px-6">
        <div className="flex gap-0">
          {tabs.filter(t => t.show).map(tab => (
            <button key={tab.id}
              onClick={() => setActiveTab(tab.id as Tab)}
              className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-teal-600 text-teal-700'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}>
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Content ── */}
      <div className="max-w-5xl mx-auto p-6">
        {activeTab === 'profile' && (
          <TeacherProfile teacher={teacher} />
        )}
        {activeTab === 'marks' && subjectAssignments.length > 0 && (
          <TeacherMarks
            subjectAssignments={subjectAssignments}
            userId={userId}
          />
        )}
        {activeTab === 'attendance' && classAssignment && (
          <TeacherAttendance
            classAssignment={classAssignment}
            userId={userId}
          />
        )}
      </div>
    </div>
  )
}