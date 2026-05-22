'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import {
  Save, Loader2, ChevronLeft, ChevronRight, CheckCircle2,
  CalendarDays,
} from 'lucide-react'

interface Props {
  classAssignment: any
  userId: string
}

type Status = 'present' | 'absent'

const STATUS_CYCLE: Record<Status, Status> = {
  present: 'absent',
  absent: 'present',
}

const TYPE_EMOJI: Record<string, string> = {
  holiday: '',
  leave: '',
  exam: '',
  event: '',
}

function formatDisplayDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00')
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)

  if (d.getTime() === today.getTime())
    return {
      label: 'Today',
      sub: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
    }
  if (d.getTime() === yesterday.getTime())
    return {
      label: 'Yesterday',
      sub: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
    }
  return {
    label: d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }),
    sub: d.getFullYear().toString(),
  }
}

export default function TeacherAttendance({ classAssignment, userId }: Props) {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!
  )

  const standard = classAssignment.standard
  const today = new Date().toISOString().split('T')[0]

  const [selectedDate, setSelectedDate] = useState(today)
  const [students, setStudents] = useState<any[]>([])
  const [attendance, setAttendance] = useState<Record<number, Status>>({})
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [holidays, setHolidays] = useState<Record<string, { title: string; type: string }>>({})

  // Load holidays once
  useEffect(() => {
    ;(async () => {
      const { data } = await supabase.from('school_holidays').select('date, title, type')
      const map: Record<string, { title: string; type: string }> = {}
      ;(data || []).forEach((h: any) => { map[h.date] = { title: h.title, type: h.type } })
      setHolidays(map)
    })()
  }, [])

  // Load students + attendance whenever date changes
  useEffect(() => {
    ;(async () => {
      setLoading(true)
      setError('')

      const { data: studentData } = await supabase
        .from('students_list')
        .select('id, name, admission_no')
        .eq('standard', standard)
        .order('name')

      if (!studentData) { setLoading(false); return }
      setStudents(studentData)

      const { data: attData } = await supabase
        .from('attendance')
        .select('student_id, status')
        .eq('standard', standard)
        .eq('date', selectedDate)

      const attMap: Record<number, Status> = {}
      studentData.forEach(s => {
        const existing = attData?.find(a => a.student_id === s.id)
        attMap[s.id] = (existing?.status as Status) || 'present'
      })
      setAttendance(attMap)
      setLoading(false)
    })()
  }, [selectedDate, standard])

  // Derived
  const holidayInfo = holidays[selectedDate]
  const isHoliday = !!holidayInfo
  const presentCount = Object.values(attendance).filter(s => s === 'present').length
  const absentCount = Object.values(attendance).filter(s => s === 'absent').length
  const totalCount = students.length
  const presentPct = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0
  const dateDisplay = formatDisplayDate(selectedDate)

  function toggleStatus(studentId: number) {
    setAttendance(prev => ({
      ...prev,
      [studentId]: STATUS_CYCLE[prev[studentId] || 'present'],
    }))
  }

  function markAll(status: Status) {
    const allMap: Record<number, Status> = {}
    students.forEach(s => { allMap[s.id] = status })
    setAttendance(allMap)
  }

  async function handleSave() {
    if (isHoliday) return
    setSaving(true); setError(''); setSaved(false)
    try {
      const rows = students.map(student => ({
        student_id: student.id,
        standard,
        date: selectedDate,
        status: attendance[student.id] || 'present',
        marked_by: userId,
      }))
      const { error: upsertError } = await supabase
        .from('attendance')
        .upsert(rows, { onConflict: 'student_id,date' })
      if (upsertError) throw new Error(upsertError.message)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err: any) {
      setError(err.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  function changeDate(days: number) {
    const d = new Date(selectedDate)
    d.setDate(d.getDate() + days)
    const newDateStr = d.toISOString().split('T')[0]
    if (newDateStr <= today) setSelectedDate(newDateStr)
  }

  return (
    <div className="flex flex-col gap-3 pt-6">

      {/* ── Attendance Hero Card ── */}
      <div className="bg-white rounded-2xl border border-slate-200 px-4 pt-4 pb-4 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[10px] font-black tracking-[0.2em] uppercase mb-1 text-slate-500">
              Class Attendance
            </p>
            <h1 className="text-2xl font-black text-slate-900 leading-none tracking-tight">
              {standard}
            </h1>
          </div>

          {!isHoliday && (
            <button
              onClick={handleSave}
              disabled={saving || students.length === 0}
              className="inline-flex items-center bg-teal-700 text-white gap-1.5 h-10 px-5 rounded-xl text-[11px] font-bold tracking-wide transition-all disabled:opacity-40 active:scale-95 shrink-0 shadow-lg shadow-teal-100"
            >
              {saving
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : saved
                  ? <CheckCircle2 className="w-3.5 h-3.5" />
                  : <Save className="w-3.5 h-3.5" />}
              {saved ? 'Saved!' : 'Save'}
            </button>
          )}
        </div>

        {/* Stat Pills */}
        {!isHoliday && !loading && totalCount > 0 && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 bg-slate-100 border border-slate-200">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-500 shrink-0" />
              <span className="text-[12px] font-bold text-slate-900">{presentCount}</span>
              <span className="text-[10px] font-semibold text-slate-500 uppercase">Present</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 bg-slate-100 border border-slate-200">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
              <span className="text-[12px] font-bold text-slate-900">{absentCount}</span>
              <span className="text-[10px] font-semibold text-slate-500 uppercase">Absent</span>
            </div>
            <div className="ml-auto flex items-baseline gap-0.5">
              <span className="text-xl font-black text-slate-900 leading-none">{presentPct}</span>
              <span className="text-[10px] font-bold text-slate-400">%</span>
            </div>
          </div>
        )}
      </div>

      {/* ── Date Navigator ── */}
      <div className="flex items-center gap-2 px-3 py-3 bg-teal-600 rounded-2xl">
        <button
          onClick={() => changeDate(-1)}
          className="flex items-center justify-center w-10 h-10 rounded-xl active:scale-90 transition-all bg-teal-700/40 text-white"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <label className="flex-1 relative flex items-center gap-3 px-3.5 py-2 rounded-xl bg-white border border-teal-400 shadow-sm cursor-pointer">
          <CalendarDays className="w-4 h-4 shrink-0 text-teal-600" />
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-bold text-slate-900 leading-none">{dateDisplay.label}</p>
            <p className="text-[10px] text-slate-500 font-medium mt-0.5 uppercase tracking-wider">{dateDisplay.sub}</p>
          </div>
          <span className="text-[9px] font-black tracking-widest uppercase px-2 py-1 rounded-lg shrink-0 bg-teal-50 text-teal-700 border border-teal-100">
            Change
          </span>
          <input
            type="date"
            value={selectedDate}
            max={today}
            onChange={e => setSelectedDate(e.target.value)}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
        </label>

        <button
          onClick={() => changeDate(1)}
          disabled={selectedDate >= today}
          className="flex items-center justify-center w-10 h-10 rounded-xl active:scale-90 disabled:opacity-30 transition-all bg-teal-700/40 text-white"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* ── Progress Bar ── */}
      {!isHoliday && !loading && totalCount > 0 && (
        <div className="h-[4px] w-full bg-slate-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-teal-500 rounded-full transition-all duration-700 ease-out"
            style={{ width: `${presentPct}%` }}
          />
        </div>
      )}

      {/* ── Main Content ── */}
      {isHoliday ? (
        <div className="bg-white rounded-2xl border border-slate-200 px-6 py-16 text-center shadow-sm">
          <div className="text-5xl mb-4">{TYPE_EMOJI[holidayInfo.type] || '🎌'}</div>
          <p className="text-[16px] font-bold text-slate-900">{holidayInfo.title}</p>
          <p className="text-[11px] text-slate-400 mt-2 uppercase tracking-[0.2em] font-black">School Holiday</p>
        </div>
      ) : loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 py-20 flex items-center justify-center gap-3 text-slate-400 shadow-sm">
          <Loader2 className="w-5 h-5 animate-spin text-teal-500" />
          <span className="text-[13px] font-medium tracking-wide uppercase">Updating Class...</span>
        </div>
      ) : (
        <>
          {/* Mark All buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => markAll('present')}
              className="flex-1 py-3 rounded-xl text-[11px] font-black tracking-widest uppercase border active:opacity-80 transition-all bg-teal-50 border-teal-200 text-teal-700"
            >
              All Present
            </button>
            <button
              onClick={() => markAll('absent')}
              className="flex-1 py-3 rounded-xl text-[11px] font-black tracking-widest uppercase border active:opacity-80 transition-all bg-rose-50 border-rose-200 text-rose-600"
            >
              All Absent
            </button>
          </div>

          {/* Student List */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <table className="w-full border-collapse">
              <tbody>
                {students.map((student, i) => {
                  const status = attendance[student.id] || 'present'
                  const present = status === 'present'
                  return (
                    <tr
                      key={student.id}
                      className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60 transition-colors"
                    >
                      <td className="pl-4 pr-2 py-4 w-8 text-right text-[11px] tabular-nums text-slate-300 font-bold">
                        {String(i + 1).padStart(2, '0')}
                      </td>
                      <td className="px-3 py-4">
                        <p className="text-[14px] font-bold text-slate-900 leading-tight">{student.name}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5 font-mono tracking-tighter uppercase">{student.admission_no}</p>
                      </td>
                      <td className="pr-4 py-4 text-right">
                        <button
                          onClick={() => toggleStatus(student.id)}
                          className={`inline-flex items-center justify-center w-10 h-10 rounded-xl text-[12px] font-black transition-all ring-1 ${
                            present
                              ? 'bg-teal-50 text-teal-600 ring-teal-200 shadow-sm shadow-teal-100'
                              : 'bg-rose-50 text-rose-600 ring-rose-200 shadow-sm shadow-rose-100'
                          }`}
                        >
                          {present ? 'P' : 'A'}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ── Error ── */}
      {error && (
        <div className="bg-rose-50 border border-rose-100 rounded-xl px-4 py-3 text-[12px] text-rose-600 font-bold text-center">
          {error}
        </div>
      )}
    </div>
  )
}