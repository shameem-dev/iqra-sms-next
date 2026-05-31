'use client'

interface Props { student: any }

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-start py-2.5 border-b border-slate-100 last:border-0">
      <span className="text-xs text-slate-400 w-36 shrink-0">{label}</span>
      <span className="text-sm text-slate-700 font-medium text-right">{value || '—'}</span>
    </div>
  )
}

export default function ParentChild({ student }: Props) {
  if (!student) return <div className="text-center text-slate-400 py-10">No student data found.</div>

  return (
    <div className="space-y-4">
      <div className="bg-teal-600 rounded-xl p-5 text-white">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center text-xl font-bold shrink-0">
            {student.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          <div>
            <h2 className="text-lg font-bold">{student.name}</h2>
            <p className="text-teal-200 text-sm">{student.standard}</p>
            <p className="text-teal-100 text-xs mt-0.5">Admission No: {student.admission_no}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h3 className="text-sm font-bold text-slate-600 mb-3">Student Details</h3>
        <Row label="Admission No"    value={student.admission_no} />
        <Row label="Full Name"       value={student.name} />
        <Row label="Class"           value={student.standard} />
        <Row label="Gender"          value={student.gender} />
        <Row label="Date of Birth"   value={student.date_of_birth ? new Date(student.date_of_birth).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'} />
        <Row label="Parent/Guardian" value={student.parent_guardian} />
        <Row label="Mobile"          value={student.mobile_no} />
        <Row label="Vehicle Point"   value={student.vehicle_point || '—'} />
        <Row label="Address"         value={student.address} />
      </div>

    
    </div>
  )
}