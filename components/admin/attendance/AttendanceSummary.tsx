'use client'

import { Student, Status, getDaysInMonth, fmtDate } from '@/type/attedence'

interface Props {
  students: Student[]
  attendance: Record<string, Record<number, Status>>
  year: number
  month: number
}

export default function AttendanceSummary({ students, attendance, year, month }: Props) {
  const daysInMonth = getDaysInMonth(year, month)
  const monthName   = new Date(year, month).toLocaleString('en-IN', { month: 'long', year: 'numeric' })

  // Calculate stats per student
  const studentStats = students.map(student => {
    let present = 0
    let absent  = 0
    let marked  = 0

    for (let d = 1; d <= daysInMonth; d++) {
      const status = attendance[fmtDate(year, month, d)]?.[student.id]
      if (status === 'present') { present++; marked++ }
      else if (status === 'absent') { absent++; marked++ }
    }

    const pct = marked > 0 ? Math.round((present / marked) * 100) : null

    return { ...student, present, absent, marked, pct }
  })

  const maleStudents   = studentStats.filter(s => s.gender === 'Male')
  const femaleStudents = studentStats.filter(s => s.gender === 'Female')
  const otherStudents  = studentStats.filter(s => s.gender !== 'Male' && s.gender !== 'Female')

  // Overall class stats
  const totalPresent = studentStats.reduce((s, st) => s + st.present, 0)
  const totalAbsent  = studentStats.reduce((s, st) => s + st.absent, 0)
  const totalMarked  = studentStats.reduce((s, st) => s + st.marked, 0)
  const classAvgPct  = totalMarked > 0 ? Math.round((totalPresent / totalMarked) * 100) : null

  function renderGroup(group: typeof studentStats, label: string) {
    if (group.length === 0) return null
    return (
      <>
        {/* Gender header */}
        <tr className={label === 'Male' ? 'bg-blue-50' : label === 'Female' ? 'bg-pink-50' : 'bg-gray-50'}>
          <td colSpan={5} className={`px-4 py-1.5 text-xs font-bold uppercase tracking-widest border-b ${
            label === 'Male'   ? 'text-blue-500 border-blue-100'  :
            label === 'Female' ? 'text-pink-500 border-pink-100'  :
                                 'text-gray-400 border-gray-100'
          }`}>
            {label === 'Male' ? '' : label === 'Female' ? '' : ''} {label}
          </td>
        </tr>

        {group.map((student, i) => (
          <tr key={student.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
            {/* # */}
            <td className="px-4 py-3 text-xs text-slate-400 w-8">{i + 1}</td>

            {/* Name */}
            <td className="px-4 py-3">
              <p className="text-sm font-medium text-slate-700">{student.name}</p>
              <p className="text-xs text-slate-400">{student.admission_no}</p>
            </td>

            {/* Present */}
            <td className="px-4 py-3 text-center">
              <span className="inline-flex items-center justify-center w-10 h-7 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                {student.present}
              </span>
            </td>

            {/* Absent */}
            <td className="px-4 py-3 text-center">
              <span className="inline-flex items-center justify-center w-10 h-7 rounded-lg text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
                {student.absent}
              </span>
            </td>

            {/* Attendance % */}
            <td className="px-4 py-3 text-center">
              {student.pct !== null ? (
                <div className="flex items-center gap-2">
                  {/* Progress bar */}
                  <div className="flex-1 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        student.pct >= 75 ? 'bg-emerald-500' :
                        student.pct >= 50 ? 'bg-amber-500'   : 'bg-red-500'
                      }`}
                      style={{ width: `${student.pct}%` }}
                    />
                  </div>
                  <span className={`text-xs font-bold w-10 text-right ${
                    student.pct >= 75 ? 'text-emerald-600' :
                    student.pct >= 50 ? 'text-amber-600'   : 'text-red-600'
                  }`}>
                    {student.pct}%
                  </span>
                </div>
              ) : (
                <span className="text-xs text-slate-300">Not marked</span>
              )}
            </td>
          </tr>
        ))}
      </>
    )
  }

  if (students.length === 0) return null

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">

      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between flex-wrap gap-2">
        <div>
          <p className="text-sm font-bold text-slate-700">Student Attendance Summary</p>
          <p className="text-xs text-slate-400 mt-0.5">{monthName} · {students.length} students</p>
        </div>

        {/* Class overall stats */}
        <div className="flex items-center gap-3">
          <div className="text-center">
            <p className="text-xs text-slate-400">Total Present</p>
            <p className="text-sm font-bold text-emerald-600">{totalPresent}</p>
          </div>
          <div className="w-px h-8 bg-slate-200" />
          <div className="text-center">
            <p className="text-xs text-slate-400">Total Absent</p>
            <p className="text-sm font-bold text-red-600">{totalAbsent}</p>
          </div>
          <div className="w-px h-8 bg-slate-200" />
          <div className="text-center">
            <p className="text-xs text-slate-400">Class Avg</p>
            <p className={`text-sm font-bold ${
              classAvgPct === null      ? 'text-slate-400' :
              classAvgPct >= 75         ? 'text-emerald-600' :
              classAvgPct >= 50         ? 'text-amber-600'   : 'text-red-600'
            }`}>
              {classAvgPct !== null ? `${classAvgPct}%` : '—'}
            </p>
          </div>
        </div>
      </div>

      {/* Table */}
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50">
            <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-400 w-8">#</th>
            <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500">Student</th>
            <th className="px-4 py-2.5 text-center text-xs font-medium text-emerald-600">Present</th>
            <th className="px-4 py-2.5 text-center text-xs font-medium text-red-600">Absent</th>
            <th className="px-4 py-2.5 text-center text-xs font-medium text-slate-500">Attendance %</th>
          </tr>
        </thead>
        <tbody>
          {renderGroup(maleStudents,   'Male')}
          {renderGroup(femaleStudents, 'Female')}
          {renderGroup(otherStudents,  'Other')}
        </tbody>

        {/* Footer totals */}
        <tfoot>
          <tr className="border-t-2 border-slate-200 bg-slate-50">
            <td colSpan={2} className="px-4 py-2.5 text-xs font-semibold text-slate-600">
              Class Total
            </td>
            <td className="px-4 py-2.5 text-center">
              <span className="text-sm font-bold text-emerald-600">{totalPresent}</span>
            </td>
            <td className="px-4 py-2.5 text-center">
              <span className="text-sm font-bold text-red-600">{totalAbsent}</span>
            </td>
            <td className="px-4 py-2.5 text-center">
              {classAvgPct !== null ? (
                <span className={`text-sm font-bold ${
                  classAvgPct >= 75 ? 'text-emerald-600' :
                  classAvgPct >= 50 ? 'text-amber-600'   : 'text-red-600'
                }`}>{classAvgPct}%</span>
              ) : (
                <span className="text-xs text-slate-300">—</span>
              )}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  )
}