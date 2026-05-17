'use client'

import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import {
  AlertCircle,
  CheckCircle2,
  Pencil,
  Save,
  X,
  Loader2,
  BookOpen,
  Users,
  BarChart2,
  ClipboardList,
  Lock,
  Unlock,
  Globe,
} from 'lucide-react'
import { Subject, MarkWithStudent, MarkFormData, SubjectFormData } from '@/type/mark'
import SubjectModal from '@/components/marks/SubjectModal'
import SubjectTabs from '@/components/marks/SubjectTabs'
import MarksTable from '@/components/marks/MarksTable'
import TopScorers from '@/components/marks/TopScorers'
import ClassTopper from '@/components/marks/ClassTopper'
import { getAcademicYear } from '@/lib/academicYear'

const STANDARDS = [
  'FS1 A', 'FS1 B',
  'FS2 A', 'FS2 B',
  'GRADE 1 A',
  'GRADE 2 A', 'GRADE 2 B',
  'GRADE 3 A',
  'GRADE 4 A',
]

const DEFAULT_STANDARD = 'FS1 A'
const ACADEMIC_YEAR = getAcademicYear()


const examColumns: { label: string; field: keyof Omit<MarkFormData, 'id'>; maxKey: keyof Subject }[] = [
  { label: 'UT1',         field: 'ut1',         maxKey: 'max_ut1' },
  { label: 'UT2',         field: 'ut2',         maxKey: 'max_ut2' },
  { label: 'UT3',         field: 'ut3',         maxKey: 'max_ut3' },
  { label: 'UT4',         field: 'ut4',         maxKey: 'max_ut4' },
  { label: 'Mid Term',    field: 'mid_term',    maxKey: 'max_mid_term' },
  { label: 'Half Yearly', field: 'half_yearly', maxKey: 'max_half_yearly' },
  { label: 'Final',       field: 'final',       maxKey: 'max_final' },
]

const emptyMarks = (): MarkFormData => ({
  ut1: null, ut2: null, ut3: null, ut4: null,
  mid_term: null, half_yearly: null, final: null,
})

const emptySubjectForm = (standard: string): SubjectFormData => ({
  name: '', standard,subject_type: 'academic',
  max_ut1: 0, max_ut2: 0, max_ut3: 0, max_ut4: 0,
  max_mid_term: 0, max_half_yearly: 0, max_final: 0,
})

interface StudentAllMarks {
  student_id: number
  name: string
  admission_no: string
  subjectMarks: {
  subject_id: number
  total: number
  maxTotal: number
  marks: MarkFormData
}[]
}

function StatCard({
  label, value, icon: Icon, gradient, shadow,
}: {
  label: string; value: string | number; icon: React.ElementType; gradient: string; shadow: string
}) {
  return (
    <div className={`relative overflow-hidden rounded-2xl px-5 py-4 ${gradient} shadow-lg ${shadow}`}>
      <div className="absolute -right-5 -top-5 w-24 h-24 rounded-full bg-white/10" />
      <div className="absolute right-3 bottom-2 w-12 h-12 rounded-full bg-black/10" />
      <div className="relative z-10 flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0">
          <Icon size={18} className="text-white" />
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[.18em] text-white/60">{label}</p>
          <p className="text-xl font-black text-white leading-tight">{value}</p>
        </div>
      </div>
    </div>
  )
}
// ─── Section Header ───────────────────────────────────────────────────────────
function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-base font-bold text-slate-800 tracking-tight">{title}</h2>
      {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
    </div>
  )
}

// ─── Alert ────────────────────────────────────────────────────────────────────
function Alert({ type, message }: { type: 'error' | 'success'; message: string }) {
  const isError = type === 'error'
  return (
    <div className={`flex items-center gap-2.5 border rounded-xl px-4 py-3 text-sm font-medium ${
      isError
        ? 'bg-red-50 border-red-200 text-red-600'
        : 'bg-emerald-50 border-emerald-200 text-emerald-700'
    }`}>
      {isError
        ? <AlertCircle size={15} className="shrink-0" />
        : <CheckCircle2 size={15} className="shrink-0" />
      }
      {message}
    </div>
  )
}

// ─── Empty State ──────────────────────────────────────────────────────────────
function EmptyState({ icon: Icon, message, action }: {
  icon: React.ElementType; message: string; action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
      <div className="p-4 bg-slate-100 rounded-2xl">
        <Icon size={28} className="text-slate-400" />
      </div>
      <p className="text-slate-400 text-sm max-w-xs">{message}</p>
      {action}
    </div>
  )
}

// ─── Spinner ──────────────────────────────────────────────────────────────────
function Spinner() {
  return (
    <div className="flex items-center justify-center py-20 gap-3">
      <Loader2 size={18} className="animate-spin text-indigo-500" />
      <span className="text-sm text-slate-400 font-medium">Loading students…</span>
    </div>
  )
}

// ─── Result Status Badge ──────────────────────────────────────────────────────
/**
 * Shows a pill badge with the current publish state.
 * Admins also get a toggle button next to it.
 */
function ResultStatusBadge({
  isPublished,
  isAdmin,
  loading,
  onToggle,
}: {
  isPublished: boolean
  isAdmin: boolean
  loading: boolean
  onToggle: () => void
}) {
  return (
    <div className="flex items-center gap-2">
      {/* Status pill */}
      <span
        className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border ${
          isPublished
            ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
            : 'bg-amber-50 border-amber-200 text-amber-700'
        }`}
      >
        {isPublished
          ? <><Globe size={12} /> Result Published</>
          : <><Lock size={12} /> Result Not Published</>
        }
      </span>

      {/* Toggle button — admin only */}
      {isAdmin && (
        <button
          onClick={onToggle}
          disabled={loading}
          title={isPublished ? 'Unpublish result (allow mark editing)' : 'Publish result (lock mark editing)'}
          className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border transition shadow-sm disabled:opacity-60 ${
            isPublished
              ? 'bg-amber-500 border-amber-600 text-white hover:bg-amber-600'
              : 'bg-emerald-600 border-emerald-700 text-white hover:bg-emerald-700'
          }`}
        >
          {loading
            ? <Loader2 size={12} className="animate-spin" />
            : isPublished
              ? <><Unlock size={12} /> Unpublish</>
              : <><Globe size={12} /> Publish</>
          }
        </button>
      )}
    </div>
  )
}

// ─── Published Lock Banner ────────────────────────────────────────────────────
function PublishedLockBanner() {
  return (
    <div className="flex items-center gap-2.5 bg-amber-50 border border-amber-200 text-amber-700 rounded-xl px-4 py-3 text-sm font-medium">
      <Lock size={15} className="shrink-0" />
      Results have been published for this class. Mark editing is locked. Contact an admin to make changes.
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function MarksEntryPage() {

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!
  )

  const [selectedStandard, setSelectedStandard] = useState(DEFAULT_STANDARD)
  const [subjects, setSubjects]                 = useState<Subject[]>([])
  const [activeSubject, setActiveSubject]       = useState<Subject | null>(null)
  const [marksData, setMarksData]               = useState<MarkWithStudent[]>([])
  const [editMode, setEditMode]                 = useState(false)
  const [loading, setLoading]                   = useState(false)
  const [saving, setSaving]                     = useState(false)
  const [error, setError]                       = useState('')
  const [success, setSuccess]                   = useState('')
  const [selectedExam, setSelectedExam] = useState<keyof Omit<MarkFormData, 'id'>>('ut1')

  const [showSubjectModal, setShowSubjectModal] = useState(false)
  const [subjectSaving, setSubjectSaving]       = useState(false)
  const [editingSubject, setEditingSubject]     = useState<Subject | null>(null)
  const [subjectForm, setSubjectForm]           = useState<SubjectFormData>(emptySubjectForm(DEFAULT_STANDARD))

  const [allSubjectsMarks, setAllSubjectsMarks] = useState<StudentAllMarks[]>([])
  const [toppersLoading, setToppersLoading]     = useState(false)

  // ── Result publish state ──────────────────────────────────────────────────
  const [isPublished, setIsPublished]       = useState(false)
  const [publishLoading, setPublishLoading] = useState(false)
  /**
   * isAdmin: read from the logged-in user's app_metadata role.
   * Supabase stores custom roles in `app_metadata` (set server-side / via service key).
   * If you use a different role field, adjust the path below.
   *
   * e.g. if your JWT has   app_metadata: { role: 'admin' }
   *      OR               user_metadata: { role: 'admin' }
   */
  const [isAdmin, setIsAdmin] = useState(false)

  // ── On mount: detect admin role from session ──────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const user = data.session?.user
      if (!user) return
      // Check app_metadata first, fall back to user_metadata
      const role =
        (user.app_metadata as any)?.role ??
        (user.user_metadata as any)?.role ??
        ''
      setIsAdmin(role === 'admin')
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (selectedStandard) {
      fetchSubjects()
      fetchResultStatus()
      setActiveSubject(null)
      setMarksData([])
      setAllSubjectsMarks([])
      setEditMode(false)
      setSubjectForm(emptySubjectForm(selectedStandard))
    }
  }, [selectedStandard])

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (activeSubject && selectedStandard) {
      fetchMarks(activeSubject)
      setEditMode(false)
    }
  }, [activeSubject])

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (subjects.length > 0 && selectedStandard) {
      fetchAllSubjectsMarks()
    }
  }, [subjects])

  // ── Fetch result publish status for the selected class ────────────────────
  async function fetchResultStatus() {
    const { data } = await supabase
      .from('result_status')
      .select('is_published')
      .eq('standard', selectedStandard)
      .eq('academic_year', ACADEMIC_YEAR)
      .single()
    // If no row exists yet, treat as not published
    setIsPublished(data?.is_published ?? false)
  }

  // ── Toggle publish / unpublish ────────────────────────────────────────────
  async function handleTogglePublish() {
    setPublishLoading(true)
    setError('')
    setSuccess('')

    const newStatus = !isPublished

    // Upsert so it works whether the row exists or not
    const { error: upsertError } = await supabase
      .from('result_status')
      .upsert(
        {
          standard:      selectedStandard,
          academic_year: ACADEMIC_YEAR,
          is_published:  newStatus,
          published_at:  newStatus ? new Date().toISOString() : null,
          updated_at:    new Date().toISOString(),
        },
        { onConflict: 'standard,academic_year' }
      )

    if (upsertError) {
      setError(upsertError.message)
    } else {
      setIsPublished(newStatus)
      setSuccess(
        newStatus
          ? `Results published for ${selectedStandard}. Mark editing is now locked.`
          : `Results unpublished for ${selectedStandard}. Teachers can edit marks again.`
      )
      // Exit edit mode if we just published
      if (newStatus) setEditMode(false)
    }

    setPublishLoading(false)
  }

  async function fetchSubjects() {
    setError('')
    const { data, error } = await supabase
      .from('subjects')
      .select('*')
      .eq('standard', selectedStandard)
      .eq('is_active', true)
      .order('name')
    if (error) setError(error.message)
    else {
      setSubjects(data || [])
      if (data && data.length > 0) setActiveSubject(data[0])
      else setActiveSubject(null)
    }
  }

  async function fetchMarks(subject: Subject) {
    setLoading(true)
    setError('')

    const { data: students, error: studentError } = await supabase
      .from('students_list')
      .select('*')
      .eq('standard', selectedStandard)
      .order('admission_no')

    if (studentError) { setError(studentError.message); setLoading(false); return }
    if (!students || students.length === 0) { setMarksData([]); setLoading(false); return }

    const studentIds = students.map((s: any) => s.id)

    const { data: existingMarks, error: marksError } = await supabase
      .from('marks')
      .select('*')
      .in('student_id', studentIds)
      .eq('subject_id', subject.id)
      .eq('academic_year', ACADEMIC_YEAR)

    if (marksError) { setError(marksError.message); setLoading(false); return }

    const combined: MarkWithStudent[] = students.map((student: any) => {
      const existing = existingMarks?.find((m: any) => m.student_id === student.id)
      return {
        student_id:   student.id,
        name:         student.name,
        admission_no: student.admission_no,
        standard:     student.standard,
        marks: existing
          ? {
              id:          existing.id,
              ut1:         existing.ut1,
              ut2:         existing.ut2,
              ut3:         existing.ut3,
              ut4:         existing.ut4,
              mid_term:    existing.mid_term,
              half_yearly: existing.half_yearly,
              final:       existing.final,
            }
          : emptyMarks(),
      }
    })

    setMarksData(combined)
    setLoading(false)
  }

  async function fetchAllSubjectsMarks() {
    setToppersLoading(true)

    const { data: students, error: studentError } = await supabase
      .from('students_list')
      .select('*')
      .eq('standard', selectedStandard)
      .order('admission_no')

    if (studentError || !students || students.length === 0) {
      setToppersLoading(false)
      return
    }

    const studentIds = students.map((s: any) => s.id)

    const { data: allMarks, error: marksError } = await supabase
      .from('marks')
      .select('*')
      .in('student_id', studentIds)
      .eq('academic_year', ACADEMIC_YEAR)

    if (marksError) { setToppersLoading(false); return }

    const combined: StudentAllMarks[] = students.map((student: any) => {
      const subjectMarks = subjects.map(subject => {
        const mark = allMarks?.find(
          (m: any) => m.student_id === student.id && m.subject_id === subject.id
        )
        const total = mark
          ? [mark.ut1, mark.ut2, mark.ut3, mark.ut4,
             mark.mid_term, mark.half_yearly, mark.final]
              .reduce((sum: number, v: number | null) => sum + (v || 0), 0)
          : 0
        const maxTotal = [
          subject.max_ut1, subject.max_ut2, subject.max_ut3, subject.max_ut4,
          subject.max_mid_term, subject.max_half_yearly, subject.max_final,
        ].reduce((sum, v) => sum + (v || 0), 0)
        return {
          subject_id: subject.id,
          total,
          maxTotal,
          marks: {
            ut1: mark?.ut1 ?? null,
            ut2: mark?.ut2 ?? null,
            ut3: mark?.ut3 ?? null,
            ut4: mark?.ut4 ?? null,
            mid_term: mark?.mid_term ?? null,
            half_yearly: mark?.half_yearly ?? null,
            final: mark?.final ?? null,
          }
        }
      })
      return {
        student_id:   student.id,
        name:         student.name,
        admission_no: student.admission_no,
        subjectMarks,
      }
    })

    setAllSubjectsMarks(combined)
    setToppersLoading(false)
  }

  function getClassToppers() {
    if (allSubjectsMarks.length === 0) return []
    return allSubjectsMarks
      .map(student => {
        const total    = student.subjectMarks.reduce((sum, sm) => sum + sm.total, 0)
        const maxTotal = student.subjectMarks.reduce((sum, sm) => sum + sm.maxTotal, 0)
        const percent  = maxTotal === 0 ? '0.0' : ((total / maxTotal) * 100).toFixed(1)
        return { student_id: student.student_id, name: student.name, admission_no: student.admission_no, total, maxTotal, percent }
      })
      .filter(s => s.maxTotal > 0)
      .sort((a, b) => parseFloat(b.percent) - parseFloat(a.percent))
      .slice(0, 3)
  }
  function getExamToppers(field: keyof Omit<MarkFormData, 'id'>) {
  if (allSubjectsMarks.length === 0) return []

  return allSubjectsMarks
    .map(student => {
      let total = 0
      let maxTotal = 0

      student.subjectMarks.forEach(subjectMark => {
        total += subjectMark.marks[field] || 0

        const subject = subjects.find(
          s => s.id === subjectMark.subject_id
        )

        if (!subject) return

        maxTotal +=
          (subject[`max_${field}` as keyof Subject] as number) || 0
      })

      const percent =
        maxTotal === 0
          ? '0.0'
          : ((total / maxTotal) * 100).toFixed(1)

      return {
        student_id: student.student_id,
        name: student.name,
        admission_no: student.admission_no,
        total,
        maxTotal,
        percent,
      }
    })
    .filter(s => s.maxTotal > 0)
    .sort((a, b) => b.total - a.total)
}

  function handleMarkChange(studentId: number, field: keyof Omit<MarkFormData, 'id'>, value: string) {
    const num = value.trim() === '' ? null : Number(value)
    setMarksData(prev =>
      prev.map(row =>
        row.student_id === studentId
          ? { ...row, marks: { ...row.marks, [field]: num } }
          : row
      )
    )
  }

  function isOverMax(value: number | null, max: number): boolean {
    if (value === null || max === 0) return false
    return value > max
  }

  async function handleSave() {
    // Block save if published (belt-and-suspenders guard)
    if (isPublished) {
      setError('Results are published. Unplublish first to edit marks.')
      return
    }

    let hasError = false
    if (activeSubject) {
      marksData.forEach(row => {
        examColumns.forEach(col => {
          const max = activeSubject[col.maxKey] as number
          if (isOverMax(row.marks[col.field], max)) hasError = true
        })
      })
    }
    if (hasError) {
      setError('Some marks exceed the maximum. Please fix them before saving.')
      return
    }

    setSaving(true)
    setError('')
    setSuccess('')

    const upsertData = marksData.map(row => ({
      student_id:    row.student_id,
      subject_id:    activeSubject!.id,
      academic_year: ACADEMIC_YEAR,
      ut1:           row.marks.ut1,
      ut2:           row.marks.ut2,
      ut3:           row.marks.ut3,
      ut4:           row.marks.ut4,
      mid_term:      row.marks.mid_term,
      half_yearly:   row.marks.half_yearly,
      final:         row.marks.final,
      updated_at:    new Date().toISOString(),
    }))

    const { data, error } = await supabase
      .from('marks')
      .upsert(upsertData, { onConflict: 'student_id,subject_id,academic_year' })
      .select()

    console.log(data)
    console.log(error)

    if (error) {
      setError(error.message)
    } else {
      setSuccess('Marks saved successfully!')
      setEditMode(false)
      fetchMarks(activeSubject!)
      fetchAllSubjectsMarks()
    }
    setSaving(false)
  }

  function openAddSubjectModal() {
    setEditingSubject(null)
    setSubjectForm(emptySubjectForm(selectedStandard))
    setShowSubjectModal(true)
  }

  function openEditSubjectModal(subject: Subject) {
    setEditingSubject(subject)
    setSubjectForm({
      name: subject.name, standard: subject.standard, subject_type: subject.subject_type,
      max_ut1: subject.max_ut1, max_ut2: subject.max_ut2,
      max_ut3: subject.max_ut3, max_ut4: subject.max_ut4,
      max_mid_term: subject.max_mid_term,
      max_half_yearly: subject.max_half_yearly,
      max_final: subject.max_final,
    })
    setShowSubjectModal(true)
  }

  async function handleSubjectSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubjectSaving(true)
    setError('')

    if (editingSubject) {
      const { error } = await supabase
        .from('subjects')
        .update({ ...subjectForm, standard: selectedStandard })
        .eq('id', editingSubject.id)
      if (error) setError(error.message)
      else {
        setSuccess('Subject updated!')
        setShowSubjectModal(false)
        setEditingSubject(null)
        await fetchSubjects()
      }
    } else {
      const { error } = await supabase
        .from('subjects')
        .insert({ ...subjectForm, standard: selectedStandard })
      if (error) setError(error.message)
      else {
        setSuccess('Subject added!')
        setShowSubjectModal(false)
        setSubjectForm(emptySubjectForm(selectedStandard))
        await fetchSubjects()
      }
    }
    setSubjectSaving(false)
  }

  async function handleDeleteSubject(subject: Subject) {
    if (!confirm(`Delete "${subject.name}"? All related marks will also be deleted.`)) return
    const { error } = await supabase.from('subjects').delete().eq('id', subject.id)
    if (error) setError(error.message)
    else {
      setSuccess('Subject deleted.')
      if (activeSubject?.id === subject.id) { setActiveSubject(null); setMarksData([]) }
      fetchSubjects()
    }
  }

  // ── Derived: can the current user edit marks? ─────────────────────────────
  // Admins can always edit. Teachers are blocked when published.
  const canEditMarks = isAdmin || !isPublished

  // Derived stats
  const totalStudents = marksData.length
  const totalSubjects = subjects.length
  const enteredCount  = marksData.filter(r =>
    examColumns.some(c => r.marks[c.field] !== null)
  ).length

  return (
    <div className="min-h-screen bg-slate-50 w-full">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-30 shadow-sm w-full rounded-lg">
        <div className="w-full px-6 py-4 flex items-center justify-between gap-4">
          <div className="leading-tight">
            <p className="text-xs text-slate-400">Academic Year {ACADEMIC_YEAR}</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap justify-end">

            {/* ── Result Status Badge + Toggle ────────────────────────────── */}
            <ResultStatusBadge
              isPublished={isPublished}
              isAdmin={isAdmin}
              loading={publishLoading}
              onToggle={handleTogglePublish}
            />

            {/* ── Class Selector ──────────────────────────────────────────── */}
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 hidden sm:block">
                Class
              </label>
              <select
                value={selectedStandard}
                onChange={e => setSelectedStandard(e.target.value)}
                className="border border-slate-200 bg-white text-slate-700 text-sm font-semibold rounded-xl px-4 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 transition cursor-pointer"
              >
                {STANDARDS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

          </div>
        </div>
      </header>

      {/* ── Main ───────────────────────────────────────────────────────────── */}
      <main className="w-full px-6 py-6 space-y-5">

        {error   && <Alert type="error"   message={error} />}
        {success && <Alert type="success" message={success} />}

        {/* ── Published lock banner (for teachers) ───────────────────────── */}
        {isPublished && !isAdmin && <PublishedLockBanner />}

      {subjects.length > 0 && (
  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
    <StatCard
      label="Class"
      value={selectedStandard}
      icon={ClipboardList}
      gradient="bg-[linear-gradient(135deg,_#7C3AED_0%,_#4F46E5_55%,_#3730A3_100%)]"
      shadow="shadow-violet-200"
    />
    <StatCard
      label="Students"
      value={totalStudents || '—'}
      icon={Users}
      gradient="bg-[linear-gradient(135deg,_#059669_0%,_#0D9488_55%,_#0891B2_100%)]"
      shadow="shadow-emerald-200"
    />
    <StatCard
      label="Subjects"
      value={totalSubjects}
      icon={BookOpen}
      gradient="bg-[linear-gradient(135deg,_#F59E0B_0%,_#F97316_55%,_#EF4444_100%)]"
      shadow="shadow-amber-200"
    />
    <StatCard
      label="Entries"
      value={totalStudents ? `${enteredCount} / ${totalStudents}` : '—'}
      icon={BarChart2}
      gradient="bg-[linear-gradient(135deg,_#2563EB_0%,_#7C3AED_55%,_#DB2777_100%)]"
      shadow="shadow-blue-200"
    />
  </div>
)}
        {/* ── No subjects ─────────────────────────────────────────────────── */}
        {subjects.length === 0 && !loading && (
          <EmptyState
            icon={BookOpen}
            message={`No subjects set up for ${selectedStandard} yet.`}
            action={
              <button
                onClick={openAddSubjectModal}
                className="mt-1 text-sm font-semibold text-indigo-600 hover:text-indigo-800 underline underline-offset-2 transition"
              >
                Add a subject
              </button>
            }
          />
        )}

        {/* ── Subject Tabs ────────────────────────────────────────────────── */}
        {subjects.length > 0 && (
          <div className="bg-white border border-slate-100 rounded-2xl shadow-sm w-full overflow-hidden">
            <div className="px-5 pt-5 border-b border-slate-100">
              <SectionHeader title="Subjects" subtitle="Choose a subject to view or enter marks" />
            </div>
            <div className="px-5 py-4">
              <SubjectTabs
                subjects={subjects}
                activeSubject={activeSubject}
                onSelectSubject={setActiveSubject}
                onEditSubject={openEditSubjectModal}
                onDeleteSubject={handleDeleteSubject}
                onAddSubject={openAddSubjectModal}
              />
            </div>
          </div>
        )}

        {/* ── Loading ─────────────────────────────────────────────────────── */}
        {loading && <Spinner />}

        {/* ── Marks Table ─────────────────────────────────────────────────── */}
        {!loading && marksData.length > 0 && activeSubject && (
          <div className="bg-white border border-slate-100 rounded-2xl shadow-sm w-full overflow-hidden">
            <div className="px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100">
              <SectionHeader
                title={`${activeSubject.name} — Marks`}
                subtitle={`${selectedStandard} · ${ACADEMIC_YEAR}`}
              />
              <div className="flex gap-2 shrink-0 items-center">

                {/* Lock icon shown to teachers when published */}
                {isPublished && !isAdmin && (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-full">
                    <Lock size={12} /> Locked
                  </span>
                )}

                {/* Edit / Save / Cancel — only when allowed */}
                {canEditMarks && (
                  !editMode ? (
                    <button
                      onClick={() => setEditMode(true)}
                      className="inline-flex items-center gap-1.5 text-sm font-semibold bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 transition shadow-sm"
                    >
                      <Pencil size={14} />
                      Edit Marks
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => { setEditMode(false); fetchMarks(activeSubject) }}
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 transition"
                      >
                        <X size={14} />
                        Cancel
                      </button>
                      <button
                        onClick={handleSave}
                        disabled={saving}
                        className="inline-flex items-center gap-1.5 text-sm font-semibold bg-emerald-600 text-white px-4 py-2 rounded-xl hover:bg-emerald-700 disabled:opacity-60 transition shadow-sm"
                      >
                        {saving
                          ? <Loader2 size={14} className="animate-spin" />
                          : <Save size={14} />
                        }
                        {saving ? 'Saving…' : 'Save'}
                      </button>
                    </>
                  )
                )}
              </div>
            </div>
            <div className="overflow-x-auto w-full">
              <MarksTable
                activeSubject={activeSubject}
                selectedStandard={selectedStandard}
                academicYear={ACADEMIC_YEAR}
                marksData={marksData}
                editMode={editMode && canEditMarks}   // force read-only when locked
                saving={saving}
                onEditToggle={() => canEditMarks && setEditMode(true)}
                onSave={handleSave}
                onCancel={() => { setEditMode(false); fetchMarks(activeSubject) }}
                onMarkChange={handleMarkChange}
                examColumns={examColumns}
              />
            </div>
          </div>
        )}

        {/* ── No students ─────────────────────────────────────────────────── */}
        {!loading && activeSubject && marksData.length === 0 && (
          <EmptyState icon={Users} message={`No students found in ${selectedStandard}.`} />
        )}

        {/* ── Analytics ───────────────────────────────────────────────────── */}
        {!loading && marksData.length > 0 && activeSubject && (
          <div className="lg:grid-cols-2 gap-5">
            <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-5 mb-4">
              <SectionHeader title="Top Scorers" subtitle={`By exam · ${activeSubject.name}`} />
              <TopScorers
                activeSubject={activeSubject}
                marksData={marksData}
                examColumns={examColumns}
              />
            </div>
            <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-5">
  
  {/* Header */}
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
    
    <SectionHeader
      title="Class Toppers"
      subtitle={`${selectedExam
        .replace('_', ' ')
        .replace(/\b\w/g, l => l.toUpperCase())} Rank Across All Subjects`}
    />

    {/* Exam selector */}
    <div className="flex items-center gap-2 shrink-0">
      <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        Exam
      </label>

      <select
        value={selectedExam}
        onChange={e =>
          setSelectedExam(
            e.target.value as keyof Omit<MarkFormData, 'id'>
          )
        }
        className="
          min-w-[150px]
          border border-slate-200
          bg-white
          text-slate-700
          text-sm
          font-semibold
          rounded-xl
          px-4 py-2.5
          shadow-sm
          focus:outline-none
          focus:ring-2
          focus:ring-indigo-300
          transition
          cursor-pointer
        "
      >
        <option value="ut1">UT1</option>
        <option value="ut2">UT2</option>
        <option value="ut3">UT3</option>
        <option value="ut4">UT4</option>
        <option value="mid_term">Mid Term</option>
        <option value="half_yearly">Half Yearly</option>
        <option value="final">Final</option>
      </select>
    </div>
  </div>

  <ClassTopper
    selectedStandard={selectedStandard}
    toppers={getExamToppers(selectedExam)}
    loading={toppersLoading}
  />
</div>
          </div>
        )}
      </main>

      {/* ── Subject Modal ───────────────────────────────────────────────────── */}
      <SubjectModal
        show={showSubjectModal}
        onClose={() => { setShowSubjectModal(false); setEditingSubject(null) }}
        onSubmit={handleSubjectSubmit}
        form={subjectForm}
        setForm={setSubjectForm}
        editingSubject={editingSubject}
        saving={subjectSaving}
        selectedStandard={selectedStandard}
      />
    </div>
  )
}