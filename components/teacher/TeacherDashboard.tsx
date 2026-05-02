'use client'

import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'
import { CalendarCheck, LogOut, User, BookOpen, LogOutIcon } from 'lucide-react'

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
    { id: 'marks',      label: 'Marks',      icon: BookOpen,     show: subjectAssignments.length > 0 },
    { id: 'attendance', label: 'Attendance', icon: CalendarCheck, show: !!classAssignment },
        { id: 'profile',    label: 'Profile',    icon: User,         show: true },

  ] as const

  const visibleTabs = tabs.filter(t => t.show)

  // Initials for avatar
  const initials = fullName?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">

      {/* ── Top header ── */}
      <header className="bg-teal-700 text-white px-4 py-3 flex items-center justify-between shadow-md shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          {/* Avatar */}
          <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center font-bold text-sm shrink-0 ring-2 ring-white/30">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold leading-tight truncate">{fullName}</p>
            <p className="text-teal-200 text-xs truncate">
              {classAssignment
                ? `Class Teacher — ${classAssignment.standard}`
                : 'Subject Teacher'}
            </p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 text-xs bg-white/15 active:bg-white/30 px-3 py-2 rounded-xl transition-colors shrink-0 ml-2"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </header>

      {/* ── Scrollable content area ── */}
      {/* pb-24 leaves room for the fixed bottom nav */}
      <main className="flex-1 overflow-y-auto pb-24">
        <div className="max-w-2xl mx-auto">
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
      </main>

      {/* ── Bottom tab bar (mobile-native style) ── */}
<nav className="fixed bottom-0 inset-x-0 z-30 bg-white border-t border-slate-200 ...">
          <div className="max-w-2xl mx-auto flex">
          {visibleTabs.map(tab => {
            const active = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as Tab)}
                className={`flex-1 flex flex-col items-center justify-center gap-1 py-3 transition-colors active:bg-slate-50 ${
                  active ? 'text-teal-700' : 'text-slate-400'
                }`}
              >
                {/* Active indicator dot */}
                <div className="relative">
                  <tab.icon className={`w-5 h-5 transition-transform ${active ? 'scale-110' : ''}`} />
                  {active && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-teal-500 rounded-full" />
                  )}
                </div>
                <span className={`text-[11px] font-medium leading-none ${active ? 'text-teal-700' : 'text-slate-400'}`}>
                  {tab.label}
                </span>
              </button>
            )
          })}
        </div>

        {/* iOS home indicator safe area */}
        <div className="h-safe-area-inset-bottom bg-white" />
      </nav>
    </div>
  )
}