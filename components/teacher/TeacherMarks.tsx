'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Save, Loader2, CheckCircle2, BookOpen, ChevronRight } from 'lucide-react'

interface Props {
  subjectAssignments: any[]
  userId: string
}

const ACADEMIC_YEAR = '2025-2026'

const EXAM_FIELDS = [
  { key: 'ut1',         label: 'UT 1',        maxKey: 'max_ut1',         color: 'blue' },
  { key: 'ut2',         label: 'UT 2',        maxKey: 'max_ut2',         color: 'blue' },
  { key: 'ut3',         label: 'UT 3',        maxKey: 'max_ut3',         color: 'blue' },
  { key: 'ut4',         label: 'UT 4',        maxKey: 'max_ut4',         color: 'blue' },
  { key: 'mid_term',    label: 'Mid Term',    maxKey: 'max_mid_term',    color: 'amber' },
  { key: 'half_yearly', label: 'Half Yearly', maxKey: 'max_half_yearly', color: 'amber' },
  { key: 'final',       label: 'Final',       maxKey: 'max_final',       color: 'teal' },
]

const COLOR_MAP: Record<string, { filled: string; ring: string; label: string }> = {
  blue:  { filled: 'bg-blue-50 border-blue-200 text-blue-700',   ring: 'focus:ring-blue-400',   label: 'text-blue-400' },
  amber: { filled: 'bg-amber-50 border-amber-200 text-amber-700', ring: 'focus:ring-amber-400', label: 'text-amber-400' },
  teal:  { filled: 'bg-teal-50 border-teal-200 text-teal-700',   ring: 'focus:ring-teal-400',   label: 'text-teal-500' },
}

function getScorePercent(val: any, max: any): number | null {
  if (val == null || val === '' || !max) return null
  return Math.round((Number(val) / Number(max)) * 100)
}

function ScoreBadge({ pct }: { pct: number | null }) {
  if (pct === null) return null
  const color =
    pct >= 80 ? 'bg-emerald-100 text-emerald-700' :
    pct >= 50 ? 'bg-amber-100 text-amber-700' :
                'bg-rose-100 text-rose-700'
  return (
    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${color}`}>
      {pct}%
    </span>
  )
}

export default function TeacherMarks({ subjectAssignments, userId }: Props) {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!
  )

  const standards = [...new Set(subjectAssignments.map(a => a.standard))]

  const [selectedStandard, setSelectedStandard]   = useState(standards[0] || '')
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(null)
  const [students, setStudents]                   = useState<any[]>([])
  const [marks, setMarks]                         = useState<Record<number, any>>({})
  const [loading, setLoading]                     = useState(false)
  const [saving, setSaving]                       = useState(false)
  const [saved, setSaved]                         = useState(false)
  const [error, setError]                         = useState('')

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
    <div className="flex flex-col gap-0 pt-4">

      {/* ── Sticky Selector Bar ── */}
      <div className="sticky top-0 z-10 bg-slate-50 pb-3 space-y-3">

        {/* Header row */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black tracking-[0.2em] uppercase text-slate-400">
              Marks Entry
            </p>
            <h1 className="text-2xl font-black text-slate-900 leading-tight tracking-tight">
              {subject?.name || 'Select Subject'}
            </h1>
          </div>

          {students.length > 0 && (
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-1.5 h-10 px-5 bg-teal-700 text-white rounded-xl text-[11px] font-bold tracking-wide active:scale-95 disabled:opacity-50 transition-all shadow-lg shadow-teal-100"
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

        {/* Class selector */}
        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Class</p>
          <div className="flex flex-wrap gap-2">
            {standards.map(std => (
              <button
                key={std}
                onClick={() => setSelectedStandard(std)}
                className={`px-4 py-2 rounded-xl text-[12px] font-black tracking-wide border transition-all active:scale-95 ${
                  selectedStandard === std
                    ? 'bg-teal-700 text-white border-teal-700 shadow-md shadow-teal-100'
                    : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                }`}
              >
                {std}
              </button>
            ))}
          </div>
        </div>

        {/* Subject selector */}
        {selectedStandard && (
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Subject</p>
            <div className="flex flex-wrap gap-2">
              {subjectsInStandard.map(a => (
                <button
                  key={a.subject_id}
                  onClick={() => setSelectedSubjectId(a.subject_id)}
                  className={`px-4 py-2 rounded-xl text-[12px] font-black tracking-wide border transition-all active:scale-95 ${
                    selectedSubjectId === a.subject_id
                      ? 'bg-slate-800 text-white border-slate-800 shadow-md'
                      : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {a.subjects?.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-rose-50 border border-rose-100 rounded-xl px-4 py-2.5 text-[12px] text-rose-600 font-bold">
            ⚠️ {error}
          </div>
        )}

        {/* Divider */}
        <div className="h-px bg-slate-200" />
      </div>

      {/* ── Student List ── */}
      <div className="space-y-3 pt-3 pb-6">
        {loading ? (
          <div className="bg-white rounded-2xl border border-slate-200 py-20 flex items-center justify-center gap-3 text-slate-400 shadow-sm">
            <Loader2 className="w-5 h-5 animate-spin text-teal-500" />
            <span className="text-[13px] font-medium tracking-wide uppercase">Loading Students…</span>
          </div>
        ) : students.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 py-20 text-center shadow-sm">
            <BookOpen className="w-8 h-8 text-slate-200 mx-auto mb-3" />
            <p className="text-[13px] font-bold text-slate-400">No students in {selectedStandard}</p>
          </div>
        ) : (
          students.map((student, i) => {
            const studentMarks = marks[student.id] || {}

            // Calculate overall filled count
            const filledCount = EXAM_FIELDS.filter(f =>
              studentMarks[f.key] !== null && studentMarks[f.key] !== undefined && studentMarks[f.key] !== ''
            ).length

            return (
              <div
                key={student.id}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
              >
                {/* Student header */}
                <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
                  <div className="w-8 h-8 rounded-xl bg-teal-700 text-white flex items-center justify-center text-[11px] font-black shrink-0">
                    {String(i + 1).padStart(2, '0')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-black text-slate-900 leading-tight truncate">{student.name}</p>
                    <p className="text-[11px] text-slate-400 font-mono tracking-tighter uppercase">{student.admission_no}</p>
                  </div>
                  {/* Progress indicator */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <div className="flex gap-0.5">
                      {EXAM_FIELDS.map(f => {
                        const filled = studentMarks[f.key] !== null && studentMarks[f.key] !== undefined && studentMarks[f.key] !== ''
                        return (
                          <div
                            key={f.key}
                            className={`w-1.5 h-4 rounded-full transition-colors ${
                              filled ? 'bg-teal-500' : 'bg-slate-100'
                            }`}
                          />
                        )
                      })}
                    </div>
                    <span className="text-[10px] font-black text-slate-300 ml-1">{filledCount}/{EXAM_FIELDS.length}</span>
                  </div>
                </div>

                {/* Marks grid */}
                <div className="p-3 grid grid-cols-2 gap-2">
                  {EXAM_FIELDS.map(f => {
                    const max = subject?.[f.maxKey]
                    const val = studentMarks[f.key]
                    const filled = val !== null && val !== undefined && val !== ''
                    const pct = getScorePercent(val, max)
                    const colors = COLOR_MAP[f.color] || COLOR_MAP.blue

                    return (
                      <div
                        key={f.key}
                        className={`relative rounded-xl border px-3 pt-2 pb-2.5 transition-all ${
                          filled ? colors.filled : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <label className={`text-[10px] font-black uppercase tracking-widest ${
                            filled ? colors.label : 'text-slate-400'
                          }`}>
                            {f.label}
                            {max ? <span className="font-medium opacity-70"> /{max}</span> : ''}
                          </label>
                          <ScoreBadge pct={pct} />
                        </div>
                        <input
                          type="number"
                          inputMode="numeric"
                          min="0"
                          max={max || undefined}
                          value={val ?? ''}
                          onChange={e => updateMark(student.id, f.key, e.target.value)}
                          placeholder="—"
                          className={`w-full h-9 text-center rounded-lg border text-[15px] font-black focus:outline-none focus:ring-2 transition-colors bg-white ${
                            filled
                              ? `border-transparent ${colors.ring}`
                              : `border-slate-200 focus:ring-slate-300 text-slate-400`
                          } ${filled ? (
                            f.color === 'blue'  ? 'text-blue-700' :
                            f.color === 'amber' ? 'text-amber-700' :
                                                  'text-teal-700'
                          ) : ''}`}
                        />
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })
        )}

        {/* Bottom save for long lists */}
        {students.length > 3 && (
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full h-14 flex items-center justify-center gap-2 text-[13px] font-black tracking-wide bg-teal-700 text-white rounded-2xl active:scale-95 disabled:opacity-50 transition-all shadow-lg shadow-teal-100"
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            {saving ? 'Saving…' : 'Save All Marks'}
          </button>
        )}
      </div>
    </div>
  )
}