'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Save, Loader2, ChevronLeft, ChevronRight } from 'lucide-react'

interface Props {
  classAssignment: any
  userId: string
}

type Status = 'present' | 'absent' | 'late'

const STATUS_CONFIG: Record<Status, { label: string; color: string }> = {
  present: { label: 'P', color: 'bg-emerald-500 text-white' },
  absent:  { label: 'A', color: 'bg-red-500 text-white' },
  late:    { label: 'L', color: 'bg-amber-500 text-white' },
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

  // Load students + attendance for selected date
  useEffect(() => {
    ;(async () => {
      setLoading(true); setError('')

      const { data: studentData } = await supabase
        .from('students_list')
        .select('id, name, admission_no, gender')
        .eq('standard', standard)
        .order('name')

      if (!studentData) { setLoading(false); return }
      setStudents(studentData)

      // Load existing attendance for this date
      const { data: attData } = await supabase
        .from('attendance')
        .select('student_id, status')
        .eq('standard', standard)
        .eq('date', selectedDate)

      // Build attendance map — default all to 'present'
      const attMap: Record<number, Status> = {}
      studentData.forEach(s => {
        const existing = attData?.find(a => a.student_id === s.id)
        attMap[s.id] = (existing?.status as Status) || 'present'
      })
      setAttendance(attMap)
      setLoading(false)
    })()
  }, [selectedDate, standard])

  function toggleStatus(studentId: number) {
    setAttendance(prev => {
      const current = prev[studentId] || 'present'
      const next: Status = current === 'present' ? 'absent' : current === 'absent' ? 'late' : 'present'
      return { ...prev, [studentId]: next }
    })
  }

  // Mark all present / absent
  function markAll(status: Status) {
    const allMap: Record<number, Status> = {}
    students.forEach(s => { allMap[s.id] = status })
    setAttendance(allMap)
  }

  async function handleSave() {
    setSaving(true); setError(''); setSaved(false)
    try {
      for (const student of students) {
        const status = attendance[student.id] || 'present'
        await supabase.from('attendance').upsert({
          student_id: student.id,
          standard,
          date: selectedDate,
          status,
          marked_by: userId,
        }, { onConflict: 'student_id,date' })
      }
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err: any) {
      setError(err.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  // Date navigation
  function changeDate(days: number) {
    const d = new Date(selectedDate)
    d.setDate(d.getDate() + days)
    setSelectedDate(d.toISOString().split('T')[0])
  }

  const presentCount = Object.values(attendance).filter(s => s === 'present').length
  const absentCount  = Object.values(attendance).filter(s => s === 'absent').length
  const lateCount    = Object.values(attendance).filter(s => s === 'late').length

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-700">Attendance — {standard}</h2>
          <p className="text-xs text-slate-400 mt-0.5">{students.length} students</p>
        </div>
        <button onClick={handleSave} disabled={saving || students.length === 0}
          className="flex items-center gap-2 h-9 px-4 text-sm font-semibold bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-60 transition-colors">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? 'Saving…' : 'Save Attendance'}
        </button>
      </div>

      {saved && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
          ✅ Attendance saved for {selectedDate}!
        </div>
      )}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          ⚠️ {error}
        </div>
      )}

      {/* Date selector + stats */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-wrap items-center justify-between gap-4">
        {/* Date nav */}
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
            <span className="text-xs font-medium text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full">Today</span>
          )}
        </div>

        {/* Stats */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg">
            ✓ Present: {presentCount}
          </span>
          <span className="text-xs font-medium text-red-700 bg-red-50 px-3 py-1.5 rounded-lg">
            ✗ Absent: {absentCount}
          </span>
          {lateCount > 0 && (
            <span className="text-xs font-medium text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg">
              ⏱ Late: {lateCount}
            </span>
          )}
        </div>

        {/* Mark all buttons */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Mark all:</span>
          <button onClick={() => markAll('present')}
            className="text-xs px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors">
            All Present
          </button>
          <button onClick={() => markAll('absent')}
            className="text-xs px-3 py-1.5 bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100 transition-colors">
            All Absent
          </button>
        </div>
      </div>

      {/* Students list */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-slate-400 gap-2">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Loading…</span>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">#</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Student</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Gender</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-slate-500">Status</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-slate-500">Tap to Change</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {students.map((student, i) => {
                const status = attendance[student.id] || 'present'
                const config = STATUS_CONFIG[status]
                return (
                  <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-xs text-slate-400">{i + 1}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-700">{student.name}</p>
                      <p className="text-xs text-slate-400">{student.admission_no}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                        student.gender === 'Male' ? 'bg-blue-50 text-blue-700' : 'bg-pink-50 text-pink-700'
                      }`}>{student.gender}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold ${config.color}`}>
                        {config.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => toggleStatus(student.id)}
                        className="text-xs text-slate-400 hover:text-teal-600 underline transition-colors">
                        P → A → L → P
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}