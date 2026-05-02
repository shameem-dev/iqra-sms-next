'use client'

import { MapPin, Phone, Briefcase, GraduationCap, Calendar, ChevronRight } from 'lucide-react'

interface Props { teacher: any }

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between py-3 border-b border-slate-100 last:border-0 gap-3">
      <span className="text-xs text-slate-400 shrink-0 mt-0.5">{label}</span>
      <span className="text-xs text-slate-800 font-semibold text-right">{value || '—'}</span>
    </div>
  )
}

function Section({
  icon: Icon,
  title,
  children,
  accent = 'teal',
}: {
  icon: React.ElementType
  title: string
  children: React.ReactNode
  accent?: 'teal' | 'emerald' | 'blue' | 'amber'
}) {
  const colors: Record<string, string> = {
    teal:    'bg-teal-50 text-teal-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    blue:    'bg-blue-50 text-blue-600',
    amber:   'bg-amber-50 text-amber-600',
  }
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100">
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${colors[accent]}`}>
          <Icon className="w-3.5 h-3.5" />
        </div>
        <h3 className="text-sm font-bold text-slate-700">{title}</h3>
      </div>
      <div className="px-4">{children}</div>
    </div>
  )
}

export default function TeacherProfile({ teacher }: Props) {
  if (!teacher) return (
    <div className="flex items-center justify-center py-20 text-slate-400 text-sm">
      No profile data found.
    </div>
  )

  const initials = teacher.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div className="space-y-3 px-4 py-4 max-w-lg mx-auto">

      {/* ── Hero card ── */}
      <div className="bg-gradient-to-br from-teal-600 to-teal-700 rounded-2xl p-5 text-white shadow-md">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-white/20 ring-2 ring-white/30 flex items-center justify-center text-2xl font-bold shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-bold leading-tight truncate">{teacher.name}</h2>
            <p className="text-teal-200 text-sm mt-0.5">{teacher.designation || 'Teacher'}</p>
            {teacher.department && (
              <p className="text-teal-100/70 text-xs mt-0.5 truncate">{teacher.department}</p>
            )}
          </div>
        </div>

        {/* Quick contact */}
        {teacher.mobile && (
          <a
            href={`tel:${teacher.mobile}`}
            className="mt-4 flex items-center justify-between bg-white/15 active:bg-white/25 rounded-xl px-4 py-2.5 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-teal-200" />
              <span className="text-sm font-medium">{teacher.mobile}</span>
            </div>
            <ChevronRight className="w-4 h-4 text-teal-300" />
          </a>
        )}
      </div>

      {/* ── Personal Info ── */}
      <Section icon={MapPin} title="Personal Info" accent="teal">
        <Row label="Address"       value={teacher.address} />
        <Row label="Date of Birth" value={teacher.date_of_birth
          ? new Date(teacher.date_of_birth).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
          : null} />
        <Row label="Date Joined"   value={teacher.date_joined
          ? new Date(teacher.date_joined).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
          : null} />
      </Section>

      {/* ── Salary ── */}
      <Section icon={Briefcase} title="Financial Details" accent="emerald">
        <Row label="Basic Salary"      value={`₹ ${Number(teacher.basic_salary || 0).toLocaleString('en-IN')}`} />
        <Row label="TA"                value={`₹ ${Number(teacher.ta || 0).toLocaleString('en-IN')}`} />
        <Row label="Total Salary"      value={
          <span className="text-emerald-700 font-bold">
            ₹ {Number(teacher.total_salary || 0).toLocaleString('en-IN')}
          </span>
        } />
        <Row label="Medical Used"      value={`₹ ${Number(teacher.medical_used || 0).toLocaleString('en-IN')}`} />
        <Row label="Medical Remaining" value={`₹ ${Number(teacher.medical_remaining || 0).toLocaleString('en-IN')}`} />
      </Section>

      {/* ── Education ── */}
      <Section icon={GraduationCap} title="Education" accent="blue">
        <Row label="Qualification" value={teacher.edu_qualification} />
        <Row label="Certificate"   value={teacher.certificate_option} />
      </Section>

      {/* ── Leave balance ── */}
      {(teacher.leaves || []).length > 0 && (
        <Section icon={Calendar} title="Leave Balance" accent="amber">
          {(teacher.leaves || []).map((l: any) => (
            <div key={l.id} className="py-3 border-b border-slate-100 last:border-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700 capitalize">
                  {l.leave_type} Leave
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-xs bg-orange-50 text-orange-600 font-medium px-2 py-0.5 rounded-lg">
                    Used: {l.days_used}
                  </span>
                  <span className="text-xs bg-green-50 text-green-700 font-medium px-2 py-0.5 rounded-lg">
                    Left: {l.days_remaining}
                  </span>
                </div>
              </div>
              {/* Progress bar */}
              {(l.days_used + l.days_remaining) > 0 && (
                <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-orange-400 rounded-full transition-all"
                    style={{ width: `${(l.days_used / (l.days_used + l.days_remaining)) * 100}%` }}
                  />
                </div>
              )}
            </div>
          ))}
        </Section>
      )}

      {/* bottom padding for fixed nav */}
      <div className="h-2" />
    </div>
  )
}