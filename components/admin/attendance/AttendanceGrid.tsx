'use client'

import { Student, Status, getDaysInMonth, fmtDate, getDayLabel, isWeekend } from '@/type/attedence'
import AttendanceCell from './AttendanceCell'

interface Props {
  students: Student[]
  attendance: Record<string, Record<number, Status>>
  dirtyDates: Set<string>
  year: number
  month: number
  holidays: Record<string, string>   // ← NEW
  onToggle: (dateStr: string, studentId: number) => void
  onMarkDayAll: (dateStr: string, status: Status) => void
  onMarkStudentAll: (studentId: number, status: Status) => void
  getDayStats: (dateStr: string) => { present: number; absent: number; none: number }
  getStudentStats: (studentId: number) => { present: number; absent: number; marked: number; pct: number | null }
}

const GENDER_STYLE: Record<string, { row: string; text: string; border: string }> = {
  Male:   { row: 'bg-blue-50',  text: 'text-blue-500',  border: 'border-blue-100'  },
  Female: { row: 'bg-pink-50',  text: 'text-pink-500',  border: 'border-pink-100'  },
  Other:  { row: 'bg-gray-50',  text: 'text-gray-400',  border: 'border-gray-100'  },
}

export default function AttendanceGrid({
  students, attendance, dirtyDates, year, month, holidays,
  onToggle, onMarkDayAll, onMarkStudentAll,
  getDayStats, getStudentStats,
}: Props) {
  const daysInMonth = getDaysInMonth(year, month)
  const todayStr    = new Date().toISOString().split('T')[0]

  const maleStudents   = students.filter(s => s.gender === 'Male')
  const femaleStudents = students.filter(s => s.gender === 'Female')
  const otherStudents  = students.filter(s => s.gender !== 'Male' && s.gender !== 'Female')

  function renderGenderGroup(group: Student[], genderLabel: string) {
    if (group.length === 0) return null
    const style = GENDER_STYLE[genderLabel] || GENDER_STYLE['Other']

    return (
      <>
        <tr className={style.row}>
          <td colSpan={daysInMonth + 2}
            className={`px-3 py-1.5 text-xs font-bold uppercase tracking-widest border-b ${style.text} ${style.border}`}>
            {genderLabel === 'Male' ? '' : genderLabel === 'Female' ? '' : ''} {genderLabel}
          </td>
        </tr>

        {group.map(student => {
          const stats = getStudentStats(student.id)
          return (
            <tr key={student.id}
              className="border-b border-slate-100 hover:bg-slate-50 transition-colors group">

              {/* Name */}
              <td className="sticky left-0 z-10 bg-white group-hover:bg-slate-50 px-3 py-1.5 border-r border-slate-200 transition-colors">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium text-slate-700 text-xs truncate max-w-[110px]">{student.name}</p>
                    <p className="text-slate-400 text-[10px]">{student.admission_no}</p>
                  </div>
                  <div className="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <button onClick={() => onMarkStudentAll(student.id, 'present')}
                      title="Present all month"
                      className="w-5 h-3 rounded-sm bg-emerald-100 hover:bg-emerald-400 text-emerald-700 hover:text-white text-[8px] font-bold transition-colors">
                      P
                    </button>
                    <button onClick={() => onMarkStudentAll(student.id, 'absent')}
                      title="Absent all month"
                      className="w-5 h-3 rounded-sm bg-red-100 hover:bg-red-400 text-red-700 hover:text-white text-[8px] font-bold transition-colors">
                      A
                    </button>
                  </div>
                </div>
              </td>

              {/* Monthly summary */}
              <td className="px-1 py-1.5 text-center border-r border-slate-100 bg-white group-hover:bg-slate-50">
                <div className="text-[10px] leading-tight">
                  <div className="text-emerald-600 font-semibold">{stats.present}P</div>
                  <div className="text-red-500 font-semibold">{stats.absent}A</div>
                  {stats.pct !== null ? (
                    <div className={`font-bold ${stats.pct >= 75 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {stats.pct}%
                    </div>
                  ) : (
                    <div className="text-slate-300">—%</div>
                  )}
                </div>
              </td>

              {/* Cells */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const d         = i + 1
                const dateStr   = fmtDate(year, month, d)
                const isHoliday = !!holidays[dateStr]
                const status    = attendance[dateStr]?.[student.id] ?? 'none'

                // Holiday cell — blocked
                if (isHoliday) {
                  return (
                    <td key={d}
                      className="p-0.5 text-center border-r border-slate-100 bg-orange-50"
                      title={holidays[dateStr]}>
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[9px] font-bold text-orange-400 bg-orange-100">
                        H
                      </div>
                    </td>
                  )
                }

                return (
                  <AttendanceCell
                    key={d}
                    status={status}
                    isDirty={dirtyDates.has(dateStr)}
                    isWeekend={isWeekend(year, month, d)}
                    isToday={dateStr === todayStr}
                    onToggle={() => onToggle(dateStr, student.id)}
                  />
                )
              })}
            </tr>
          )
        })}
      </>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">

      {/* Legend */}
      <div className="flex items-center gap-4 px-4 py-3 border-b border-slate-100 bg-slate-50 text-xs text-slate-500 flex-wrap">
        <span className="flex items-center gap-1">
          <span className="w-5 h-5 rounded bg-emerald-500 inline-flex items-center justify-center text-white font-bold">P</span>
          Present
        </span>
        <span className="flex items-center gap-1">
          <span className="w-5 h-5 rounded bg-red-500 inline-flex items-center justify-center text-white font-bold">A</span>
          Absent
        </span>
        <span className="flex items-center gap-1">
          <span className="w-5 h-5 rounded bg-slate-100 inline-flex items-center justify-center text-slate-300 font-bold">—</span>
          Not marked
        </span>
        <span className="flex items-center gap-1">
          <span className="w-5 h-5 rounded bg-orange-100 inline-flex items-center justify-center text-[10px]">H</span>
          Holiday
        </span>
        
        <span className="ml-auto text-slate-400">{students.length} students</span>
      </div>

      <div className="overflow-x-auto">
        <table className="text-xs border-collapse" style={{ minWidth: `${200 + daysInMonth * 36}px` }}>
          <thead>

            {/* Day numbers */}
            <tr className="border-b border-slate-200">
              <th className="sticky left-0 z-20 bg-slate-50 px-3 py-2 text-left text-xs font-semibold text-slate-600 border-r border-slate-200 min-w-[160px]">
                Student
              </th>
              <th className="bg-slate-50 px-1 py-2 text-center text-xs font-semibold text-slate-500 border-r border-slate-100 min-w-[52px]">
                Month
              </th>
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const d         = i + 1
                const dateStr   = fmtDate(year, month, d)
                const weekend   = isWeekend(year, month, d)
                const isToday   = dateStr === todayStr
                const isHoliday = !!holidays[dateStr]
                return (
                  <th key={d}
                    title={isHoliday ? holidays[dateStr] : undefined}
                    className={`py-1 text-center font-semibold border-r border-slate-100 w-8 ${
                      isHoliday ? 'bg-orange-50 text-orange-400' :
                      isToday   ? 'bg-teal-50 text-teal-700'     :
                      weekend   ? 'bg-slate-100 text-slate-400'  :
                                  'bg-slate-50 text-slate-600'
                    }`}>
                    <div>{d}</div>
                    <div className="text-[9px] font-normal">
                      {isHoliday ? '' : getDayLabel(year, month, d)}
                    </div>
                  </th>
                )
              })}
            </tr>

            {/* Mark all per day */}
            <tr className="border-b-2 border-slate-200">
              <td className="sticky left-0 z-20 bg-white px-3 py-1 text-xs text-slate-400 border-r border-slate-200 italic">
                Mark all ↓
              </td>
              <td className="bg-white border-r border-slate-100" />
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const d         = i + 1
                const dateStr   = fmtDate(year, month, d)
                const isHoliday = !!holidays[dateStr]
                return (
                  <td key={d} className={`py-1 text-center border-r border-slate-100 ${isHoliday ? 'bg-orange-50' : 'bg-white'}`}>
                    {!isHoliday && (
                      <div className="flex flex-col gap-0.5 items-center">
                        <button onClick={() => onMarkDayAll(dateStr, 'present')}
                          title="All Present"
                          className="w-6 h-3 rounded-sm bg-emerald-100 hover:bg-emerald-400 text-emerald-700 hover:text-white text-[8px] font-bold transition-colors">
                          P
                        </button>
                        <button onClick={() => onMarkDayAll(dateStr, 'absent')}
                          title="All Absent"
                          className="w-6 h-3 rounded-sm bg-red-100 hover:bg-red-400 text-red-700 hover:text-white text-[8px] font-bold transition-colors">
                          A
                        </button>
                      </div>
                    )}
                  </td>
                )
              })}
            </tr>
          </thead>

          <tbody>
            {renderGenderGroup(maleStudents,   'Male')}
            {renderGenderGroup(femaleStudents, 'Female')}
            {renderGenderGroup(otherStudents,  'Other')}
          </tbody>

          {/* Footer */}
          <tfoot>
            <tr className="border-t-2 border-slate-300 bg-slate-50">
              <td className="sticky left-0 z-10 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600 border-r border-slate-200">
                Daily Total
              </td>
              <td className="border-r border-slate-100" />
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const d         = i + 1
                const dateStr   = fmtDate(year, month, d)
                const isHoliday = !!holidays[dateStr]
                const stats     = getDayStats(dateStr)
                return (
                  <td key={d} className={`py-1.5 text-center border-r border-slate-100 ${isHoliday ? 'bg-orange-50' : ''}`}>
                    {isHoliday ? (
                      <span className="text-[10px] text-orange-400">—</span>
                    ) : (
                      <div className="text-[10px] leading-tight">
                        <div className="text-emerald-600 font-semibold">{stats.present}</div>
                        <div className="text-red-500 font-semibold">{stats.absent}</div>
                        {stats.none > 0 && (
                          <div className="text-slate-300">{stats.none}?</div>
                        )}
                      </div>
                    )}
                  </td>
                )
              })}
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}