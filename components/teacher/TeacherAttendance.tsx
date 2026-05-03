'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Save, Loader2, ChevronLeft, ChevronRight, CheckCircle2, XCircle } from 'lucide-react'

interface Props {
  classAssignment: any
  userId: string
}

type Status = 'present' | 'absent'

const STATUS_CONFIG: Record<Status, { label: string; color: string; ring: string }> = {
  present: { label: 'P', color: 'bg-emerald-500 text-white', ring: 'ring-emerald-400' },
  absent:  { label: 'A', color: 'bg-red-500 text-white',     ring: 'ring-red-400'     },
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

      const { data: attData } = await supabase
        .from('attendance')
        .select('student_id, status')
        .eq('standard', standard)
        .eq('date', selectedDate)

      const attMap: Record<number, Status> = {}
      studentData.forEach(s => {
        const existing = attData?.find(a => a.student_id === s.id)
        // treat any stored 'late' as 'present' since we removed that option
        const raw = existing?.status
        attMap[s.id] = raw === 'absent' ? 'absent' : 'present'
      })
      setAttendance(attMap)
      setLoading(false)
    })()
  }, [selectedDate, standard])

  function toggleStatus(studentId: number) {
    setAttendance(prev => ({
      ...prev,
      [studentId]: prev[studentId] === 'present' ? 'absent' : 'present',
    }))
  }

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

  function changeDate(days: number) {
    const d = new Date(selectedDate)
    d.setDate(d.getDate() + days)
    setSelectedDate(d.toISOString().split('T')[0])
  }

  const presentCount = Object.values(attendance).filter(s => s === 'present').length
  const absentCount  = Object.values(attendance).filter(s => s === 'absent').length

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ── Sticky top bar ── */}
      <div className="sticky top-0 z-20 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-800 leading-tight">Attendance</h2>
            <p className="text-xs text-slate-400">{standard} · {students.length} students</p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving || students.length === 0}
            className="flex items-center gap-1.5 h-10 px-4 text-sm font-semibold bg-teal-600 text-white rounded-xl active:scale-95 disabled:opacity-50 transition-all shadow-sm"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {/* {saving ? 'Saving…' : 'Save'} */}
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4 space-y-3">

        {/* ── Feedback banners ── */}
        {saved && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            Saved for {selectedDate}
          </div>
        )}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            ⚠️ {error}
          </div>
        )}

        {/* ── Date selector ── */}
        <div className="bg-white rounded-2xl border text-black font-bold border-slate-700 p-3 flex items-center justify-between gap-2">
          <button
            onClick={() => changeDate(-1)}
            className="w-10 h-10 flex items-center justify-center rounded-xl border border-slate-200 active:bg-slate-100 transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-slate-500" />
          </button>

          <div className="flex-1 flex flex-col items-center gap-0.5">
            <input
              type="date"
              value={selectedDate}
              max={today}
              onChange={e => setSelectedDate(e.target.value)}
              className="w-full h-10 px-3 text-sm text-center border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            {selectedDate === today && (
              <span className="text-[10px] font-semibold text-teal-600 tracking-wide uppercase">Today</span>
            )}
          </div>

          <button
            onClick={() => changeDate(1)}
            disabled={selectedDate >= today}
            className="w-10 h-10 flex items-center justify-center rounded-xl border border-slate-200 active:bg-slate-100 disabled:opacity-30 transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* ── Stats + Bulk actions ── */}
        <div className="grid grid-cols-2 gap-2">
          {/* Present stat + bulk */}
          <button
            onClick={() => markAll('present')}
            className="group bg-emerald-50 border border-emerald-200 rounded-2xl p-3 flex items-center gap-3 active:scale-95 transition-all"
          >
            <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shrink-0 shadow-sm">
              <CheckCircle2 className="w-5 h-5 text-white" />
            </div>
            <div className="text-left">
              <p className="text-lg font-bold text-emerald-700 leading-tight">{presentCount}</p>
              <p className="text-xs text-emerald-600 font-medium">Present · Tap to set all</p>
            </div>
          </button>

          {/* Absent stat + bulk */}
          <button
            onClick={() => markAll('absent')}
            className="group bg-red-50 border border-red-200 rounded-2xl p-3 flex items-center gap-3 active:scale-95 transition-all"
          >
            <div className="w-10 h-10 bg-red-500 rounded-xl flex items-center justify-center shrink-0 shadow-sm">
              <XCircle className="w-5 h-5 text-white" />
            </div>
            <div className="text-left">
              <p className="text-lg font-bold text-red-700 leading-tight">{absentCount}</p>
              <p className="text-xs text-red-600 font-medium">Absent · Tap to set all</p>
            </div>
          </button>
        </div>

        {/* ── Student list ── */}
        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-400 gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">Loading…</span>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden divide-y divide-slate-100">
            {students.map((student, i) => {
              const status = attendance[student.id] || 'present'
              const cfg    = STATUS_CONFIG[status]

              return (
                <div
                  key={student.id}
                  className="flex items-center gap-3 px-4 py-3 active:bg-slate-50 transition-colors"
                >
                  {/* Index */}
                  <span className="text-xs text-slate-300 w-5 shrink-0 text-right">{i + 1}</span>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{student.name}</p>
                    <p className="text-xs text-slate-400">{student.admission_no}</p>
                  </div>

               

                  {/* Toggle button */}
                  <button
                    onClick={() => toggleStatus(student.id)}
                    className={`w-11 h-11 rounded-xl text-sm font-bold shrink-0 ring-2 ring-offset-1 active:scale-90 transition-all ${cfg.color} ${cfg.ring}`}
                  >
                    {cfg.label}
                  </button>
                </div>
              )
            })}
          </div>
        )}

        {/* ── Bottom save (thumb-friendly) ── */}
        {students.length > 0 && !loading && (
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full h-14 flex items-center justify-center gap-2 text-base font-bold bg-teal-600 text-white rounded-2xl active:scale-95 disabled:opacity-50 transition-all shadow-md mb-4"
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            {saving ? 'Saving…' : 'Save '}
          </button>
        )}
      </div>
    </div>
  )
}