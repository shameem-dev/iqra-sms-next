'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Save, Loader2, ChevronDown } from 'lucide-react'

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

  // Group subjects by standard
  const standards = [...new Set(subjectAssignments.map(a => a.standard))]

  const [selectedStandard, setSelectedStandard] = useState(standards[0] || '')
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(null)
  const [students, setStudents]   = useState<any[]>([])
  const [marks, setMarks]         = useState<Record<number, any>>({})
  const [loading, setLoading]     = useState(false)
  const [saving, setSaving]       = useState(false)
  const [saved, setSaved]         = useState(false)
  const [error, setError]         = useState('')

  // Subjects for selected standard
  const subjectsInStandard = subjectAssignments.filter(a => a.standard === selectedStandard)

  // Selected subject details
  const selectedAssignment = subjectAssignments.find(a => a.subject_id === selectedSubjectId)
  const subject = selectedAssignment?.subjects

  // Auto-select first subject when standard changes
  useEffect(() => {
    const first = subjectsInStandard[0]
    setSelectedSubjectId(first?.subject_id || null)
  }, [selectedStandard])

  // Load students + marks when subject selected
  useEffect(() => {
    if (!selectedSubjectId || !selectedStandard) return
    ;(async () => {
      setLoading(true); setError('')

      // Load students in this class
      const { data: studentData } = await supabase
        .from('students_list')
        .select('id, name, admission_no')
        .eq('standard', selectedStandard)
        .order('name')

      if (!studentData) { setLoading(false); return }
      setStudents(studentData)

      // Load existing marks
      const studentIds = studentData.map(s => s.id)
      const { data: marksData } = await supabase
        .from('marks')
        .select('*')
        .eq('subject_id', selectedSubjectId)
        .eq('academic_year', ACADEMIC_YEAR)
        .in('student_id', studentIds)

      // Build marks map: student_id → marks row
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
          // Update existing
          await supabase.from('marks').update({
            ...payload, entered_by: userId, updated_at: new Date().toISOString()
          }).eq('id', id)
        } else {
          // Insert new
          const { data } = await supabase.from('marks').insert({
            ...payload, entered_by: userId, updated_at: new Date().toISOString()
          }).select().single()
          if (data) {
            setMarks(prev => ({ ...prev, [Number(studentId)]: data }))
          }
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
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-slate-700">Marks Entry</h2>
        {students.length > 0 && (
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-2 h-9 px-4 text-sm font-semibold bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-60 transition-colors">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving…' : 'Save Marks'}
          </button>
        )}
      </div>

      {saved && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
          ✅ Marks saved successfully!
        </div>
      )}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          ⚠️ {error}
        </div>
      )}

      {/* Standard + Subject selector */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-wrap gap-3">
        {/* Standard pills */}
        <div className="space-y-1 flex-1">
          <p className="text-xs font-medium text-slate-500 mb-2">Class</p>
          <div className="flex flex-wrap gap-2">
            {standards.map(std => (
              <button key={std}
                onClick={() => setSelectedStandard(std)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                  selectedStandard === std
                    ? 'bg-teal-600 text-white border-teal-600'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-teal-300'
                }`}>
                {std}
              </button>
            ))}
          </div>
        </div>

        {/* Subject pills */}
        {selectedStandard && (
          <div className="space-y-1 flex-1">
            <p className="text-xs font-medium text-slate-500 mb-2">Subject</p>
            <div className="flex flex-wrap gap-2">
              {subjectsInStandard.map(a => (
                <button key={a.subject_id}
                  onClick={() => setSelectedSubjectId(a.subject_id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                    selectedSubjectId === a.subject_id
                      ? 'bg-violet-600 text-white border-violet-600'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-violet-300'
                  }`}>
                  {a.subjects?.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Marks table */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-slate-400 gap-2">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Loading students…</span>
        </div>
      ) : students.length === 0 ? (
        <div className="text-center py-16 text-slate-400 text-sm">No students found in {selectedStandard}</div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 whitespace-nowrap sticky left-0 bg-slate-50">#</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 whitespace-nowrap sticky left-8 bg-slate-50">Student</th>
                  {EXAM_FIELDS.map(f => (
                    <th key={f.key} className="px-3 py-3 text-center text-xs font-medium text-slate-500 whitespace-nowrap">
                      <div>{f.label}</div>
                      {subject?.[f.maxKey] && (
                        <div className="text-slate-300 font-normal">/{subject[f.maxKey]}</div>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((student, i) => (
                  <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-2 text-xs text-slate-400 sticky left-0 bg-white">{i + 1}</td>
                    <td className="px-4 py-2 sticky left-8 bg-white">
                      <p className="text-sm font-medium text-slate-700 whitespace-nowrap">{student.name}</p>
                      <p className="text-xs text-slate-400">{student.admission_no}</p>
                    </td>
                    {EXAM_FIELDS.map(f => (
                      <td key={f.key} className="px-2 py-2">
                        <input
                          type="number" min="0"
                          max={subject?.[f.maxKey] || undefined}
                          value={marks[student.id]?.[f.key] ?? ''}
                          onChange={e => updateMark(student.id, f.key, e.target.value)}
                          className="w-16 text-center border border-slate-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                          placeholder="—"
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}