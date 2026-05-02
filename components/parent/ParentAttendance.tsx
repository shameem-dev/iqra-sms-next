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
  const [year, setYear]   = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth()) // 0-indexed
  const [records, setRecords] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      setLoading(true)
      const from = `${year}-${String(month + 1).padStart(2, '0')}-01`
      const lastDay = new Date(year, month + 1, 0).getDate()
      const to   = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

      const { data } = await supabase
        .from('attendance')
        .select('date, status')
        .eq('student_id', studentId)
        .gte('date', from)
        .lte('date', to)
        .order('date')

      setRecords(data || [])
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

  const monthName = new Date(year, month).toLocaleString('en-IN', { month: 'long', year: 'numeric' })
  const presentCount = records.filter(r => r.status === 'present').length
  const absentCount  = records.filter(r => r.status === 'absent').length
  const lateCount    = records.filter(r => r.status === 'late').length
  const totalDays    = records.length
  const pct          = totalDays > 0 ? Math.round((presentCount / totalDays) * 100) : 0

  // Build calendar
  const firstDay  = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const attMap: Record<string, string> = {}
  records.forEach(r => { attMap[r.date] = r.status })

  const STATUS_COLOR: Record<string, string> = {
    present: 'bg-emerald-500 text-white',
    absent:  'bg-red-500 text-white',
    late:    'bg-amber-500 text-white',
  }

  return (
    <div className="space-y-4">
      <h2 className="text-base font-bold text-slate-700">Attendance — {studentName}</h2>

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
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
          <p className="text-xs text-slate-500">Total Days</p>
          <p className="text-xl font-bold text-slate-700">{totalDays}</p>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-center">
          <p className="text-xs text-emerald-600">Present</p>
          <p className="text-xl font-bold text-emerald-700">{presentCount}</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-center">
          <p className="text-xs text-red-600">Absent</p>
          <p className="text-xl font-bold text-red-700">{absentCount}</p>
        </div>
        <div className={`rounded-xl p-3 text-center border ${pct >= 75 ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
          <p className={`text-xs ${pct >= 75 ? 'text-emerald-600' : 'text-red-600'}`}>Attendance %</p>
          <p className={`text-xl font-bold ${pct >= 75 ? 'text-emerald-700' : 'text-red-700'}`}>{pct}%</p>
        </div>
      </div>

      {/* Calendar */}
      {loading ? (
        <div className="flex items-center justify-center py-10 text-slate-400 gap-2">
          <Loader2 className="w-5 h-5 animate-spin" /><span className="text-sm">Loading…</span>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          {/* Day headers */}
          <div className="grid grid-cols-7 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <div key={d} className="text-center text-xs font-medium text-slate-400 py-1">{d}</div>
            ))}
          </div>
          {/* Day cells */}
          <div className="grid grid-cols-7 gap-1">
            {/* Empty cells for first day offset */}
            {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} />)}
            {/* Day cells */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day   = i + 1
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
              const status  = attMap[dateStr]
              const isToday = dateStr === today.toISOString().split('T')[0]
              return (
                <div key={day}
                  className={`aspect-square flex items-center justify-center rounded-lg text-xs font-medium transition-colors
                    ${status ? STATUS_COLOR[status] : 'bg-slate-50 text-slate-400'}
                    ${isToday ? 'ring-2 ring-blue-500 ring-offset-1' : ''}
                  `}>
                  {day}
                </div>
              )
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-emerald-500 inline-block" /> Present</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-500 inline-block" /> Absent</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-amber-500 inline-block" /> Late</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-slate-200 inline-block" /> No record</span>
          </div>
        </div>
      )}
    </div>
  )
}