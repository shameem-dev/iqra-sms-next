'use client'

interface Props { student: any }

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-start py-2 border-b border-slate-50 last:border-0">
      <span className="text-xs text-slate-500 w-36 shrink-0">{label}</span>
      <span className="text-xs text-slate-800 font-medium text-right">{value || '—'}</span>
    </div>
  )
}

export default function ParentChild({ student }: Props) {
  if (!student) return <div className="text-center text-slate-400 py-10">No student data found.</div>

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-blue-600 rounded-xl p-6 text-white">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center text-2xl font-bold">
            {student.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-bold">{student.name}</h2>
            <p className="text-blue-200 text-sm">{student.standard}</p>
            <p className="text-blue-100 text-xs mt-0.5">Admission No: {student.admission_no}</p>
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h3 className="text-sm font-bold text-slate-700 mb-4">Student Details</h3>
        <Row label="Admission No"     value={student.admission_no} />
        <Row label="Full Name"        value={student.name} />
        <Row label="Class"            value={student.standard} />
        <Row label="Gender"           value={student.gender} />
        <Row label="Date of Birth"    value={student.date_of_birth ? new Date(student.date_of_birth).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'} />
        <Row label="Parent/Guardian"  value={student.parent_guardian} />
        <Row label="Mobile"           value={student.mobile_no} />
        <Row label="Vehicle Point"    value={student.vehicle_point || '—'} />
        <Row label="Address"          value={student.address} />
      </div>

      {/* Login info */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <p className="text-xs font-bold text-blue-800 mb-2">🔐 Your Login Credentials</p>
        <div className="flex justify-between text-xs">
          <span className="text-blue-600">Email</span>
          <span className="font-mono font-bold text-blue-800">{student.admission_no}@iqra.school</span>
        </div>
        <div className="flex justify-between text-xs mt-1">
          <span className="text-blue-600">Password</span>
          <span className="font-mono font-bold text-blue-800">{student.admission_no}</span>
        </div>
        <p className="text-xs text-blue-500 mt-2">Please keep these credentials safe.</p>
      </div>
    </div>
  )
}