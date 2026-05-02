'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Save, Loader2, CheckCircle2 } from 'lucide-react'

interface Props {
  subjectAssignments: any[]
  userId: string
}

const ACADEMIC_YEAR = '2025-2026'

const EXAM_FIELDS = [
  { key: 'ut1',         label: 'UT 1',        maxKey: 'max_ut1' },
  { key: 'ut2',         label: 'UT 2',        maxKey: 'max_ut2' },
  { key: 'ut3',         label: 'UT 3',        maxKey: 'max_ut3' },
  { key: 'ut4',         label: 'UT 4',        maxKey: 'max_ut4' },
  { key: 'mid_term',    label: 'Mid Term',    maxKey: 'max_mid_term' },
  { key: 'half_yearly', label: 'Half Yearly', maxKey: 'max_half_yearly' },
  { key: 'final',       label: 'Final',       maxKey: 'max_final' },
]

export default function TeacherMarks({ subjectAssignments, userId }: Props) {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!
  )

  const standards = [...new Set(subjectAssignments.map(a => a.standard))]

  const [selectedStandard, setSelectedStandard]     = useState(standards[0] || '')
  const [selectedSubjectId, setSelectedSubjectId]   = useState<number | null>(null)
  const [students, setStudents]                     = useState<any[]>([])
  const [marks, setMarks]                           = useState<Record<number, any>>({})
  const [loading, setLoading]                       = useState(false)
  const [saving, setSaving]                         = useState(false)
  const [saved, setSaved]                           = useState(false)
  const [error, setError]                           = useState('')

  const subjectsInStandard = subjectAssignments.filter(a => a.standard === selectedStandard)
  const selectedAssignment = subjectAssignments.find(a => a.subject_id === selectedSubjectId)
  const subject = selectedAssignment?.subjects

  useEffect(() => {
    const first = subjectsInStandard[0]
    setSelectedSubjectId(first?.subject_id || null)
  }, [selectedStandard])

  useEffect(() => {
    if (!selectedSubjectId || !selectedStandard) return
    ;(async () => {
      setLoading(true); setError('')

      const { data: studentData } = await supabase
        .from('students_list')
        .select('id, name, admission_no')
        .eq('standard', selectedStandard)
        .order('name')

      if (!studentData) { setLoading(false); return }
      setStudents(studentData)

      const studentIds = studentData.map(s => s.id)
      const { data: marksData } = await supabase
        .from('marks')
        .select('*')
        .eq('subject_id', selectedSubjectId)
        .eq('academic_year', ACADEMIC_YEAR)
        .in('student_id', studentIds)

      const marksMap: Record<number, any> = {}
      studentData.forEach(s => {
        const existing = marksData?.find(m => m.student_id === s.id)
        marksMap[s.id] = existing || {
          student_id: s.id, subject_id: selectedSubjectId,
          academic_year: ACADEMIC_YEAR,
          ut1: null, ut2: null, ut3: null, ut4: null,
          mid_term: null, half_yearly: null, final: null,
        }
      })
      setMarks(marksMap)
      setLoading(false)
    })()
  }, [selectedSubjectId, selectedStandard])

  function updateMark(studentId: number, field: string, value: string) {
    setMarks(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], [field]: value === '' ? null : Number(value) }
    }))
  }

  async function handleSave() {
    setSaving(true); setError(''); setSaved(false)
    try {
      for (const studentId of Object.keys(marks)) {
        const row = marks[Number(studentId)]
        const { id, ...payload } = row
        if (id) {
          await supabase.from('marks').update({
            ...payload, entered_by: userId, updated_at: new Date().toISOString()
          }).eq('id', id)
        } else {
          const { data } = await supabase.from('marks').insert({
            ...payload, entered_by: userId, updated_at: new Date().toISOString()
          }).select().single()
          if (data) setMarks(prev => ({ ...prev, [Number(studentId)]: data }))
        }
      }
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err: any) {
      setError(err.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col min-h-0">

      {/* ── Sticky selector + save bar ── */}
      <div className="sticky top-0 z-10 bg-slate-50 border-b border-slate-200 px-4 pt-4 pb-3 space-y-3">

        {/* Class pills */}
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Class</p>
          <div className="flex flex-wrap gap-2">
            {standards.map(std => (
              <button key={std} onClick={() => setSelectedStandard(std)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all active:scale-95 ${
                  selectedStandard === std
                    ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                    : 'bg-white text-slate-600 border-slate-200'
                }`}>
                {std}
              </button>
            ))}
          </div>
        </div>

        {/* Subject pills */}
        {selectedStandard && (
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Subject</p>
            <div className="flex flex-wrap gap-2">
              {subjectsInStandard.map(a => (
                <button key={a.subject_id} onClick={() => setSelectedSubjectId(a.subject_id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all active:scale-95 ${
                    selectedSubjectId === a.subject_id
                      ? 'bg-violet-600 text-white border-violet-600 shadow-sm'
                      : 'bg-white text-slate-600 border-slate-200'
                  }`}>
                  {a.subjects?.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Save button + feedback */}
        {students.length > 0 && (
          <div className="flex items-center gap-3">
            <button onClick={handleSave} disabled={saving}
              className="flex items-center gap-2 h-10 px-5 text-sm font-bold bg-teal-600 text-white rounded-xl active:scale-95 disabled:opacity-50 transition-all shadow-sm">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Saving…' : 'Save Marks'}
            </button>
            {saved && (
              <span className="flex items-center gap-1.5 text-xs font-medium text-green-600">
                <CheckCircle2 className="w-4 h-4" /> Saved!
              </span>
            )}
            {error && (
              <span className="text-xs text-red-600">⚠️ {error}</span>
            )}
          </div>
        )}
      </div>

      {/* ── Content ── */}
      <div className="px-4 py-3 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-400 gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">Loading students…</span>
          </div>
        ) : students.length === 0 ? (
          <div className="text-center py-16 text-slate-400 text-sm">
            No students found in {selectedStandard}
          </div>
        ) : (
          students.map((student, i) => (
            <div key={student.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              {/* Student header */}
              <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 border-b border-slate-100">
                <div className="w-7 h-7 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-xs font-bold shrink-0">
                  {i + 1}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-800 truncate">{student.name}</p>
                  <p className="text-xs text-slate-400">{student.admission_no}</p>
                </div>
              </div>

              {/* Marks grid — 2 columns on mobile, more on wider screens */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-px bg-slate-100">
                {EXAM_FIELDS.map(f => {
                  const max = subject?.[f.maxKey]
                  const val = marks[student.id]?.[f.key]
                  const filled = val !== null && val !== undefined && val !== ''
                  return (
                    <div key={f.key} className="bg-white px-3 py-2.5 flex flex-col gap-1">
                      <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
                        {f.label}{max ? ` /${max}` : ''}
                      </label>
                      <input
                        type="number"
                        inputMode="numeric"
                        min="0"
                        max={max || undefined}
                        value={val ?? ''}
                        onChange={e => updateMark(student.id, f.key, e.target.value)}
                        placeholder="—"
                        className={`w-full h-10 text-center rounded-xl border text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500 transition-colors ${
                          filled
                            ? 'border-teal-200 bg-teal-50 text-teal-700'
                            : 'border-slate-200 bg-white text-slate-700'
                        }`}
                      />
                    </div>
                  )
                })}
              </div>
            </div>
          ))
        )}

        {/* Bottom save button for long lists */}
        {students.length > 3 && (
          <button onClick={handleSave} disabled={saving}
            className="w-full h-14 flex items-center justify-center gap-2 text-base font-bold bg-teal-600 text-white rounded-2xl active:scale-95 disabled:opacity-50 transition-all shadow-md mb-4">
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            {saving ? 'Saving…' : 'Save Marks'}
          </button>
        )}
      </div>
    </div>
  )
}