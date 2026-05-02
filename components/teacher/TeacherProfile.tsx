'use client'

import { MapPin, Phone, Briefcase, GraduationCap, Calendar } from 'lucide-react'

interface Props { teacher: any }

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between items-start py-2 border-b border-slate-50 last:border-0">
      <span className="text-xs text-slate-500 w-36 shrink-0">{label}</span>
      <span className="text-xs text-slate-800 font-medium text-right">{value || '—'}</span>
    </div>
  )
}

function Section({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex items-center gap-2 mb-4">
        <Icon className="w-4 h-4 text-teal-600" />
        <h3 className="text-sm font-bold text-slate-700">{title}</h3>
      </div>
      {children}
    </div>
  )
}

export default function TeacherProfile({ teacher }: Props) {
  if (!teacher) return <div className="text-center text-slate-400 py-10">No profile data found.</div>

  return (
    <div className="space-y-4">
      {/* Header card */}
      <div className="bg-teal-600 rounded-xl p-6 text-white">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center text-2xl font-bold">
            {teacher.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-bold">{teacher.name}</h2>
            <p className="text-teal-200 text-sm">{teacher.designation || 'Teacher'}</p>
            <p className="text-teal-100 text-xs mt-0.5">{teacher.department || ''}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Section icon={MapPin} title="Personal Info">
          <Row label="Mobile"      value={teacher.mobile ? <a href={`tel:${teacher.mobile}`} className="text-teal-600">{teacher.mobile}</a> : null} />
          <Row label="Address"     value={teacher.address} />
          <Row label="Date of Birth" value={teacher.date_of_birth ? new Date(teacher.date_of_birth).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : null} />
          <Row label="Date Joined" value={teacher.date_joined ? new Date(teacher.date_joined).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : null} />
        </Section>

        <Section icon={Briefcase} title="Financial Details">
          <Row label="Basic Salary" value={`₹ ${Number(teacher.basic_salary || 0).toLocaleString('en-IN')}`} />
          <Row label="TA"           value={`₹ ${Number(teacher.ta || 0).toLocaleString('en-IN')}`} />
          <Row label="Total Salary" value={<span className="text-teal-700 font-bold">₹ {Number(teacher.total_salary || 0).toLocaleString('en-IN')}</span>} />
          <Row label="Medical Used"      value={`₹ ${Number(teacher.medical_used || 0).toLocaleString('en-IN')}`} />
          <Row label="Medical Remaining" value={`₹ ${Number(teacher.medical_remaining || 0).toLocaleString('en-IN')}`} />
        </Section>

        <Section icon={GraduationCap} title="Education">
          <Row label="Qualification" value={teacher.edu_qualification} />
          <Row label="Certificate"   value={teacher.certificate_option} />
        </Section>

        {(teacher.leaves || []).length > 0 && (
          <Section icon={Calendar} title="Leave Balance">
            {(teacher.leaves || []).map((l: any) => (
              <div key={l.id} className="flex items-center justify-between py-1.5 border-b border-slate-50 last:border-0">
                <span className="text-xs text-slate-500 capitalize">{l.leave_type} Leave</span>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-orange-600">Used: {l.days_used}</span>
                  <span className="text-slate-300">|</span>
                  <span className="text-green-600">Left: {l.days_remaining}</span>
                </div>
              </div>
            ))}
          </Section>
        )}
      </div>
    </div>
  )
}