import { useState, useEffect, useCallback } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Student, Status, GENDER_ORDER, getDaysInMonth, fmtDate } from '@/type/attedence'

export function useAttendance(
  selectedStandard: string,
  year: number,
  month: number
) {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!
  )

  const [students, setStudents]     = useState<Student[]>([])
  const [attendance, setAttendance] = useState<Record<string, Record<number, Status>>>({})
  const [dirtyDates, setDirtyDates] = useState<Set<string>>(new Set())
  const [loading, setLoading]       = useState(false)
  const [saving, setSaving]         = useState(false)
  const [saved, setSaved]           = useState(false)
  const [error, setError]           = useState('')

  const daysInMonth = getDaysInMonth(year, month)

  // ── Load data ─────────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    if (!selectedStandard) return
    setLoading(true); setError('')

    const { data: studentData, error: studentError } = await supabase
      .from('students_list')
      .select('id, name, admission_no, gender')
      .eq('standard', selectedStandard)

    if (studentError) { setError(studentError.message); setLoading(false); return }

    const sorted = [...(studentData || [])].sort((a, b) => {
      const gDiff = (GENDER_ORDER[a.gender] ?? 2) - (GENDER_ORDER[b.gender] ?? 2)
      return gDiff !== 0 ? gDiff : a.name.localeCompare(b.name)
    })
    setStudents(sorted)

    const from = fmtDate(year, month, 1)
    const to   = fmtDate(year, month, daysInMonth)

    const { data: attData } = await supabase
      .from('attendance')
      .select('student_id, date, status')
      .eq('standard', selectedStandard)
      .gte('date', from)
      .lte('date', to)

    // Build map — only from DB records, no default
    // If no record exists → 'none' (not marked)
    const attMap: Record<string, Record<number, Status>> = {}
    ;(attData || []).forEach((a: any) => {
      if (!attMap[a.date]) attMap[a.date] = {}
      attMap[a.date][a.student_id] = a.status as Status
    })
    setAttendance(attMap)
    setDirtyDates(new Set())
    setLoading(false)
  }, [selectedStandard, year, month])

  useEffect(() => { loadData() }, [loadData])

  // ── Toggle: none → present → absent → none ────────────────────────────────
  function toggleStatus(dateStr: string, studentId: number) {
    setAttendance(prev => {
      const current = prev[dateStr]?.[studentId] ?? 'none'
      const next: Status =
        current === 'none'    ? 'present' :
        current === 'present' ? 'absent'  : 'none'
      return {
        ...prev,
        [dateStr]: { ...(prev[dateStr] || {}), [studentId]: next }
      }
    })
    setDirtyDates(prev => new Set(prev).add(dateStr))
  }

  // ── Mark entire day ───────────────────────────────────────────────────────
  function markDayAll(dateStr: string, status: Status) {
    setAttendance(prev => {
      const dayMap: Record<number, Status> = {}
      students.forEach(s => { dayMap[s.id] = status })
      return { ...prev, [dateStr]: dayMap }
    })
    setDirtyDates(prev => new Set(prev).add(dateStr))
  }

  // ── Mark entire student row ───────────────────────────────────────────────
  function markStudentAll(studentId: number, status: Status) {
    const allDates = new Set<string>()
    for (let d = 1; d <= daysInMonth; d++) allDates.add(fmtDate(year, month, d))

    setAttendance(prev => {
      const updated = { ...prev }
      allDates.forEach(dateStr => {
        updated[dateStr] = { ...(updated[dateStr] || {}), [studentId]: status }
      })
      return updated
    })
    setDirtyDates(allDates)
  }

  // ── Save — only present/absent go to DB, 'none' deletes the record ────────
  async function handleSave() {
    if (dirtyDates.size === 0) return
    setSaving(true); setError(''); setSaved(false)
    try {
      const toUpsert: any[] = []
      const toDelete: { student_id: number; date: string }[] = []

      dirtyDates.forEach(dateStr => {
        students.forEach(student => {
          const status = attendance[dateStr]?.[student.id] ?? 'none'
          if (status === 'none') {
            // Remove record from DB if it existed
            toDelete.push({ student_id: student.id, date: dateStr })
          } else {
            toUpsert.push({
              student_id: student.id,
              standard:   selectedStandard,
              date:       dateStr,
              status,
            })
          }
        })
      })

      // Upsert present/absent records
      if (toUpsert.length > 0) {
        const { error: upsertError } = await supabase
          .from('attendance')
          .upsert(toUpsert, { onConflict: 'student_id,date' })
        if (upsertError) throw new Error(upsertError.message)
      }

      // Delete 'none' records (if they existed before)
      for (const { student_id, date } of toDelete) {
        await supabase
          .from('attendance')
          .delete()
          .eq('student_id', student_id)
          .eq('date', date)
      }

      setDirtyDates(new Set())
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err: any) {
      setError(err.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  // ── Stats — none is not counted ───────────────────────────────────────────
  function getDayStats(dateStr: string) {
    const dayAtt = attendance[dateStr] || {}
    return {
      present: students.filter(s => dayAtt[s.id] === 'present').length,
      absent:  students.filter(s => dayAtt[s.id] === 'absent').length,
      none:    students.filter(s => !dayAtt[s.id] || dayAtt[s.id] === 'none').length,
    }
  }

  function getStudentStats(studentId: number) {
    let present = 0; let absent = 0; let marked = 0
    for (let d = 1; d <= daysInMonth; d++) {
      const status = attendance[fmtDate(year, month, d)]?.[studentId]
      if (status === 'present') { present++; marked++ }
      else if (status === 'absent') { absent++; marked++ }
      // 'none' not counted
    }
    const pct = marked > 0 ? Math.round((present / marked) * 100) : null
    return { present, absent, marked, pct }
  }

  return {
    students, attendance, dirtyDates,
    loading, saving, saved, error,
    loadData, toggleStatus, markDayAll, markStudentAll, handleSave,
    getDayStats, getStudentStats,
  }
}