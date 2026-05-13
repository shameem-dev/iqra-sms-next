'use client'

import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'
import { CalendarCheck, LogOut, User, BookOpen } from 'lucide-react'

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

// ─── single source of truth for header height ───
const HEADER_H = 64 // px  (matches h-16)

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
    { id: 'marks',      label: 'Marks',      icon: BookOpen,      show: subjectAssignments.length > 0 },
    { id: 'attendance', label: 'Attendance', icon: CalendarCheck, show: !!classAssignment },
    { id: 'profile',    label: 'Profile',    icon: User,          show: true },
  ] as const

  const visibleTabs = tabs.filter(t => t.show)
  const initials = fullName?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">

      {/* ── Fixed Top Header — explicit height so main offset is exact ── */}
      <header
        className="fixed top-0 inset-x-0 z-30 bg-teal-700 text-white px-4 flex items-center justify-between shadow-md shrink-0"
        style={{ height: HEADER_H }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center font-bold text-sm shrink-0 ring-2 ring-white/30">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold leading-tight truncate">{fullName}</p>
            <p className="text-teal-100 text-xs truncate">
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

      {/* ── Scrollable content — top padding = exact header height ── */}
      <main
        className="flex-1 overflow-y-auto pb-24"
        style={{ paddingTop: HEADER_H }}
      >
        <div className="max-w-2xl mx-auto px-4">
          {activeTab === 'profile' && <TeacherProfile teacher={teacher} />}
          {activeTab === 'marks' && subjectAssignments.length > 0 && (
            <TeacherMarks subjectAssignments={subjectAssignments} userId={userId} />
          )}
          {activeTab === 'attendance' && classAssignment && (
            <TeacherAttendance classAssignment={classAssignment} userId={userId} />
          )}
        </div>
      </main>

      {/* ── Fixed Bottom Tab Bar ── */}
      <nav className="fixed bottom-0 inset-x-0 z-30 bg-teal-700 border-t border-teal-800 shadow-[0_-2px_10px_rgba(0,0,0,0.1)]">
        <div className="max-w-2xl mx-auto flex">
          {visibleTabs.map(tab => {
            const active = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as Tab)}
                className={`flex-1 flex flex-col items-center justify-center gap-1 py-3 transition-all active:bg-teal-800 ${
                  active ? 'text-white' : 'text-teal-300'
                }`}
              >
                <div className="relative">
                  <tab.icon className={`w-5 h-5 transition-transform ${active ? 'scale-110' : 'opacity-80'}`} />
                  {active && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full" />
                  )}
                </div>
                <span className={`text-[11px] font-medium leading-none ${active ? 'opacity-100' : 'opacity-70'}`}>
                  {tab.label}
                </span>
              </button>
            )
          })}
        </div>
        {/* iOS home indicator safe area */}
        <div className="h-[env(safe-area-inset-bottom)] bg-teal-700" />
      </nav>
    </div>
  )
}