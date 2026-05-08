'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Save, Loader2, ChevronLeft, ChevronRight } from 'lucide-react'

interface Props {
  classAssignment: any
  userId: string
}

type Status = 'present' | 'absent'

const STATUS_CONFIG: Record<Status, { label: string; color: string }> = {
  present: { label: 'P', color: 'bg-emerald-500 text-white' },
  absent:  { label: 'A', color: 'bg-red-500 text-white' },
}

const STATUS_CYCLE: Record<Status, Status> = {
  present: 'absent',
  absent:  'present',
}

export default function TeacherAttendance({ classAssignment, userId }: Props) {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!
  )

  const standard = classAssignment.standard
  const today    = new Date().toISOString().split('T')[0]

  const [selectedDate, setSelectedDate] = useState(today)
  const [students, setStudents]         = useState<any[]>([])
  const [attendance, setAttendance]     = useState<Record<number, Status>>({})
  const [loading, setLoading]           = useState(false)
  const [saving, setSaving]             = useState(false)
  const [saved, setSaved]               = useState(false)
  const [error, setError]               = useState('')

  // ── Holiday state ─────────────────────────────────────────────────────────
  const [holidays, setHolidays] = useState<Record<string, { title: string; type: string }>>({})

  // ── Load all holidays once ────────────────────────────────────────────────
  useEffect(() => {
    ;(async () => {
      const { data } = await supabase
        .from('school_holidays')
        .select('date, title, type')
      const map: Record<string, { title: string; type: string }> = {}
      ;(data || []).forEach((h: any) => { map[h.date] = { title: h.title, type: h.type } })
      setHolidays(map)
    })()
  }, [])

  // ── Load students + attendance for selected date ───────────────────────────
  useEffect(() => {
    ;(async () => {
      setLoading(true); setError('')

      const { data: studentData } = await supabase
        .from('students_list')
        .select('id, name, admission_no, gender')
        .eq('standard', standard)
        .order('name')

      if (!studentData) { setLoading(false); return }

      // Sort: Male first → Female, then alphabetical within each group
      const sorted = [...studentData].sort((a, b) => {
        const genderOrder: Record<string, number> = { Male: 0, Female: 1 }
        const gDiff = (genderOrder[a.gender] ?? 2) - (genderOrder[b.gender] ?? 2)
        return gDiff !== 0 ? gDiff : a.name.localeCompare(b.name)
      })
      setStudents(sorted)

      // Load existing attendance for this date
      const { data: attData } = await supabase
        .from('attendance')
        .select('student_id, status')
        .eq('standard', standard)
        .eq('date', selectedDate)

      // Build map — default all to 'present'
      const attMap: Record<number, Status> = {}
      sorted.forEach(s => {
        const existing = attData?.find(a => a.student_id === s.id)
        attMap[s.id]   = (existing?.status as Status) || 'present'
      })
      setAttendance(attMap)
      setLoading(false)
    })()
  }, [selectedDate, standard])

  // ── Derived: is selected date a holiday ───────────────────────────────────
  const holidayInfo  = holidays[selectedDate]
  const isHoliday    = !!holidayInfo

  const TYPE_EMOJI: Record<string, string> = {
    holiday: '🎉',
    leave:   '📅',
    exam:    '📝',
    event:   '🎊',
  }

  // ── Toggle present ↔ absent ───────────────────────────────────────────────
  function toggleStatus(studentId: number) {
    setAttendance(prev => ({
      ...prev,
      [studentId]: STATUS_CYCLE[prev[studentId] || 'present'],
    }))
  }

  // ── Mark all present or all absent ────────────────────────────────────────
  function markAll(status: Status) {
    const allMap: Record<number, Status> = {}
    students.forEach(s => { allMap[s.id] = status })
    setAttendance(allMap)
  }

  // ── Save attendance ───────────────────────────────────────────────────────
  async function handleSave() {
    if (isHoliday) return  // extra safety guard
    setSaving(true); setError(''); setSaved(false)
    try {
      const rows = students.map(student => ({
        student_id: student.id,
        standard,
        date:       selectedDate,
        status:     attendance[student.id] || 'present',
        marked_by:  userId,
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

  // ── Date navigation ───────────────────────────────────────────────────────
  function changeDate(days: number) {
    const d = new Date(selectedDate)
    d.setDate(d.getDate() + days)
    setSelectedDate(d.toISOString().split('T')[0])
  }

  const presentCount = Object.values(attendance).filter(s => s === 'present').length
  const absentCount  = Object.values(attendance).filter(s => s === 'absent').length

  // ── Group students by gender ──────────────────────────────────────────────
  const maleStudents   = students.filter(s => s.gender === 'Male')
  const femaleStudents = students.filter(s => s.gender === 'Female')
  const otherStudents  = students.filter(s => s.gender !== 'Male' && s.gender !== 'Female')

  function renderGroup(group: any[], label: string, color: string) {
    if (group.length === 0) return null
    return (
      <>
        <tr className={color}>
          <td colSpan={3} className="px-4 py-1.5 text-xs font-bold uppercase tracking-widest border-b">
            {label === 'Male' ? '♂' : label === 'Female' ? '♀' : '⚧'} {label}
          </td>
        </tr>
        {group.map((student, i) => {
          const status = attendance[student.id] || 'present'
          const config = STATUS_CONFIG[status]
          return (
            <tr key={student.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
              <td className="px-4 py-3 text-xs text-slate-400 w-8">{i + 1}</td>
              <td className="px-4 py-3">
                <p className="font-medium text-slate-700 text-sm">{student.name}</p>
                <p className="text-xs text-slate-400">{student.admission_no}</p>
              </td>
              <td className="px-4 py-3 text-center">
                <button
                  onClick={() => toggleStatus(student.id)}
                  className={`w-10 h-10 rounded-xl text-sm font-bold transition-all hover:scale-110 active:scale-95 shadow-sm ${config.color}`}>
                  {config.label}
                </button>
              </td>
            </tr>
          )
        })}
      </>
    )
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">

      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-700">Attendance — {standard}</h2>
          <p className="text-xs text-slate-400 mt-0.5">{students.length} students</p>
        </div>
        {/* Hide save button on holidays */}
        {!isHoliday && (
          <button
            onClick={handleSave}
            disabled={saving || students.length === 0}
            className="flex items-center gap-2 h-9 px-4 text-sm font-semibold bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-60 transition-colors">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving…' : 'Save Attendance'}
          </button>
        )}
      </div>

      {/* ── Messages ── */}
      {saved && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
          ✅ Attendance saved for {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}!
        </div>
      )}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          ⚠️ {error}
        </div>
      )}

      {/* ── Date selector ── */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">

        {/* Date navigation */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <button onClick={() => changeDate(-1)}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
              <ChevronLeft className="w-4 h-4 text-slate-500" />
            </button>
            <input type="date" value={selectedDate}
              max={today}
              onChange={e => setSelectedDate(e.target.value)}
              className="h-9 px-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" />
            <button onClick={() => changeDate(1)}
              disabled={selectedDate >= today}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 transition-colors">
              <ChevronRight className="w-4 h-4 text-slate-500" />
            </button>
            {selectedDate === today && (
              <span className="text-xs font-medium text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full">
                Today
              </span>
            )}
            {/* Holiday badge next to date */}
            {isHoliday && (
              <span className="text-xs font-medium text-orange-700 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                {TYPE_EMOJI[holidayInfo.type] || '🎌'} {holidayInfo.title}
              </span>
            )}
          </div>

          {/* Stats — only shown on non-holidays */}
          {!isHoliday && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg">
                ✓ Present: {presentCount}
              </span>
              <span className="text-xs font-medium text-red-700 bg-red-50 px-3 py-1.5 rounded-lg">
                ✗ Absent: {absentCount}
              </span>
            </div>
          )}
        </div>

        {/* Mark all — only shown on non-holidays */}
        {!isHoliday && (
          <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
            <span className="text-xs text-slate-400">Mark all:</span>
            <button onClick={() => markAll('present')}
              className="text-xs px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors font-medium">
              All Present
            </button>
            <button onClick={() => markAll('absent')}
              className="text-xs px-3 py-1.5 bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100 transition-colors font-medium">
              All Absent
            </button>
          </div>
        )}
      </div>

      {/* ── Holiday block ── */}
      {isHoliday ? (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-10 text-center">
          <div className="text-5xl mb-4">
            {TYPE_EMOJI[holidayInfo.type] || '🎌'}
          </div>
          <p className="text-lg font-bold text-orange-700">{holidayInfo.title}</p>
          <p className="text-sm text-orange-500 mt-2">
            This day is marked as a holiday by the admin.
          </p>
          <p className="text-xs text-orange-400 mt-1">
            Attendance cannot be taken on this day.
          </p>
          <div className="mt-4 flex justify-center gap-2">
            <button onClick={() => changeDate(-1)}
              className="text-xs px-4 py-2 bg-white border border-orange-200 text-orange-600 rounded-lg hover:bg-orange-50 transition-colors">
              ← Previous Day
            </button>
            {selectedDate < today && (
              <button onClick={() => changeDate(1)}
                className="text-xs px-4 py-2 bg-white border border-orange-200 text-orange-600 rounded-lg hover:bg-orange-50 transition-colors">
                Next Day →
              </button>
            )}
          </div>
        </div>

      ) : loading ? (
        <div className="flex items-center justify-center py-16 text-slate-400 gap-2">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Loading…</span>
        </div>

      ) : students.length === 0 ? (
        <div className="text-center py-16 text-slate-400 text-sm">
          No students found in {standard}
        </div>

      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 w-8">#</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Student</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-slate-500">
                  Status — tap to toggle
                </th>
              </tr>
            </thead>
            <tbody>
              {renderGroup(maleStudents,   'Male',   'bg-blue-50 text-blue-500 border-blue-100')}
              {renderGroup(femaleStudents, 'Female', 'bg-pink-50 text-pink-500 border-pink-100')}
              {renderGroup(otherStudents,  'Other',  'bg-gray-50 text-gray-400 border-gray-100')}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}