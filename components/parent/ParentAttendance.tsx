'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Loader2, ChevronLeft, ChevronRight } from 'lucide-react'

interface Props { studentId: number; studentName: string }

export default function ParentAttendance({ studentId, studentName }: Props) {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!
  )

  const today   = new Date()
  const [year, setYear]     = useState(today.getFullYear())
  const [month, setMonth]   = useState(today.getMonth())
  const [records, setRecords]   = useState<any[]>([])
  const [holidays, setHolidays] = useState<Record<string, string>>({})
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    ;(async () => {
      setLoading(true)
      const from    = `${year}-${String(month + 1).padStart(2, '0')}-01`
      const lastDay = new Date(year, month + 1, 0).getDate()
      const to      = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

      // Fetch attendance + holidays in parallel
      const [attResult, holResult] = await Promise.all([
        supabase
          .from('attendance')
          .select('date, status')
          .eq('student_id', studentId)
          .gte('date', from)
          .lte('date', to)
          .order('date'),
        supabase
          .from('school_holidays')
          .select('date, title')
          .gte('date', from)
          .lte('date', to),
      ])

      setRecords(attResult.data || [])

      const map: Record<string, string> = {}
      ;(holResult.data || []).forEach((h: any) => { map[h.date] = h.title })
      setHolidays(map)

      setLoading(false)
    })()
  }, [studentId, year, month])

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(y => y - 1) }
    else setMonth(m => m - 1)
  }
  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(y => y + 1) }
    else setMonth(m => m + 1)
  }

  const monthName    = new Date(year, month).toLocaleString('en-IN', { month: 'long', year: 'numeric' })
  const presentCount = records.filter(r => r.status === 'present').length
  const absentCount  = records.filter(r => r.status === 'absent').length
  const totalDays    = records.length
  const pct          = totalDays > 0 ? Math.round((presentCount / totalDays) * 100) : 0

  const firstDay    = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const attMap: Record<string, string> = {}
  records.forEach(r => { attMap[r.date] = r.status })

  return (
    <div className="space-y-4">
      <h2 className="text-base font-bold text-slate-700">Attendance - {studentName}</h2>

      {/* Month nav */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center justify-between">
        <button onClick={prevMonth}
          className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
          <ChevronLeft className="w-4 h-4 text-slate-500" />
        </button>
        <p className="text-sm font-semibold text-slate-700">{monthName}</p>
        <button onClick={nextMonth}
          disabled={year === today.getFullYear() && month >= today.getMonth()}
          className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 transition-colors">
          <ChevronRight className="w-4 h-4 text-slate-500" />
        </button>
      </div>

 {/* Stats */}
<div className="grid grid-cols-4 gap-3">
  <div className="rounded-xl p-3 text-center" style={{ background: 'linear-gradient(135deg, #6B4FC8 0%, #4A7FD4 100%)' }}>
    <p className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.75)' }}>Total</p>
    <p className="text-xl font-bold text-white">{totalDays}</p>
  </div>
  <div className="rounded-xl p-3 text-center" style={{ background: 'linear-gradient(135deg, #1A9E7A 0%, #2DC9A0 100%)' }}>
    <p className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.75)' }}>Present</p>
    <p className="text-xl font-bold text-white">{presentCount}</p>
  </div>
  <div className="rounded-xl p-3 text-center" style={{ background: 'linear-gradient(135deg, #F5A623 0%, #E8453C 100%)' }}>
    <p className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.75)' }}>Absent</p>
    <p className="text-xl font-bold text-white">{absentCount}</p>
  </div>
  <div
    className="rounded-xl p-3 text-center"
    style={{
      background: pct >= 75
        ? 'linear-gradient(135deg, #4A7FD4 0%, #7B52D3 100%)'
        : 'linear-gradient(135deg, #F5A623 0%, #E8453C 100%)'
    }}
  >
    <p className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.75)' }}>%</p>
    <p className="text-xl font-bold text-white">{pct}%</p>
  </div>
</div>


      {/* Calendar */}
      {loading ? (
        <div className="flex items-center justify-center py-10 text-slate-400 gap-2">
          <Loader2 className="w-5 h-5 animate-spin text-teal-500" />
          <span className="text-sm">Loading…</span>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="grid grid-cols-7 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <div key={d} className="text-center text-xs font-medium text-slate-400 py-1">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day       = i + 1
              const dateStr   = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
              const status    = attMap[dateStr]
              const isToday   = dateStr === today.toISOString().split('T')[0]
              const isHoliday = !!holidays[dateStr]

              // Holiday takes priority over everything
              if (isHoliday) {
                return (
                  <div key={day}
                    title={holidays[dateStr]}
                    className={`aspect-square flex items-center justify-center rounded-lg text-xs font-bold
                      bg-orange-100 text-orange-500
                      ${isToday ? 'ring-2 ring-teal-500 ring-offset-1' : ''}
                    `}>
                    H
                  </div>
                )
              }

              return (
                <div key={day}
                  className={`aspect-square flex items-center justify-center rounded-lg text-xs font-medium
                    ${status === 'present' ? 'bg-teal-500 text-white'  :
                      status === 'absent'  ? 'bg-red-400 text-white'   :
                                             'bg-slate-50 text-slate-400'}
                    ${isToday ? 'ring-2 ring-teal-500 ring-offset-1' : ''}
                  `}>
                  {day}
                </div>
              )
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 mt-4 pt-3 border-t border-slate-100 text-xs text-slate-400 flex-wrap">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-teal-500 inline-block" /> Present
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-red-400 inline-block" /> Absent
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-slate-200 inline-block" /> No record
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-orange-100 inline-block" />
              <span className="text-orange-400">Holiday</span>
            </span>
          </div>

          {/* Holiday list for the month (if any) */}
          {Object.keys(holidays).length > 0 && (
            <div className="mt-3 pt-3 border-t border-slate-100 space-y-1">
              <p className="text-xs font-semibold text-slate-500 mb-2">Holidays this month</p>
              {Object.entries(holidays)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([date, title]) => (
                  <div key={date} className="flex items-center gap-2 text-xs">
                    <span className="text-slate-400 font-mono">
                      {new Date(date + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                    </span>
                    <span className="text-orange-500 font-medium">{title}</span>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}