'use client'

import { useState, useEffect, useMemo } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Loader2, BookOpen, Clock } from 'lucide-react'
import { getAcademicYear } from '@/lib/academicYear'

interface Props { studentId: number; standard: string }

const ACADEMIC_YEAR = getAcademicYear()

const EXAM_FIELDS = [
  { key: 'ut1',         label: 'UT 1',        maxKey: 'max_ut1',         color: 'blue'  },
  { key: 'ut2',         label: 'UT 2',        maxKey: 'max_ut2',         color: 'blue'  },
  { key: 'ut3',         label: 'UT 3',        maxKey: 'max_ut3',         color: 'blue'  },
  { key: 'ut4',         label: 'UT 4',        maxKey: 'max_ut4',         color: 'blue'  },
  { key: 'ut5',         label: 'UT 5',        maxKey: 'max_ut5',         color: 'blue'  },
  { key: 'ut6',         label: 'UT 6',        maxKey: 'max_ut6',         color: 'blue'  },
  { key: 'ut7',         label: 'UT 7',        maxKey: 'max_ut7',         color: 'blue'  },
  { key: 'ut8',         label: 'UT 8',        maxKey: 'max_ut8',         color: 'blue'  },
  { key: 'mid_term',    label: 'Mid Term',    maxKey: 'max_mid_term',    color: 'amber' },
  { key: 'half_yearly', label: 'Half Yearly', maxKey: 'max_half_yearly', color: 'amber' },
  { key: 'final',       label: 'Final',       maxKey: 'max_final',       color: 'teal'  },
]

const SUBJECT_TYPES = [
  { key: 'academic',      label: 'Academic'      },
  { key: 'moral_studies', label: 'Moral Studies' },
] as const

type SubjectTypeKey = 'academic' | 'moral_studies'

function getGrade(pct: number | null): { letter: string; bg: string; text: string; ring: string } {
  if (pct === null) return { letter: '—', bg: 'bg-slate-100',    text: 'text-slate-400',   ring: 'ring-slate-200'  }
  if (pct >= 90)   return { letter: 'A+', bg: 'bg-emerald-50',  text: 'text-emerald-700', ring: 'ring-emerald-200' }
  if (pct >= 80)   return { letter: 'A',  bg: 'bg-emerald-50',  text: 'text-emerald-600', ring: 'ring-emerald-200' }
  if (pct >= 70)   return { letter: 'B+', bg: 'bg-sky-50',      text: 'text-sky-700',     ring: 'ring-sky-200'    }
  if (pct >= 60)   return { letter: 'B',  bg: 'bg-sky-50',      text: 'text-sky-600',     ring: 'ring-sky-200'    }
  if (pct >= 50)   return { letter: 'C',  bg: 'bg-amber-50',    text: 'text-amber-700',   ring: 'ring-amber-200'  }
  if (pct >= 35)   return { letter: 'D',  bg: 'bg-orange-50',   text: 'text-orange-600',  ring: 'ring-orange-200' }
  return                  { letter: 'F',  bg: 'bg-rose-50',     text: 'text-rose-600',    ring: 'ring-rose-200'   }
}

function getScorePercent(val: any, max: any): number | null {
  if (val == null || val === '' || !max) return null
  return Math.round((Number(val) / Number(max)) * 100)
}

// ── Horizontal bar for visual score representation ────────────────────────────
function ScoreBar({ pct }: { pct: number | null }) {
  if (pct === null) return null
  const color =
    pct >= 80 ? 'bg-emerald-400' :
    pct >= 50 ? 'bg-amber-400'   :
                'bg-rose-400'
  return (
    <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all ${color}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

export default function ParentMarks({ studentId, standard }: Props) {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!
  )

  const [marksData,         setMarksData]         = useState<any[]>([])
  const [loading,           setLoading]           = useState(true)
  const [isPublished,       setIsPublished]       = useState(false)
  const [activeSubjectType, setActiveSubjectType] = useState<SubjectTypeKey>('academic')
  const [activeExamKey,     setActiveExamKey]     = useState<string>('')

  useEffect(() => {
    ;(async () => {
      setLoading(true)

      // Check if results are published for this standard
      const { data: statusData } = await supabase
        .from('result_status')
        .select('is_published')
        .eq('standard', standard)
        .eq('academic_year', ACADEMIC_YEAR)
        .single()
      setIsPublished(statusData?.is_published ?? false)

      // Only fetch marks if published
      if (statusData?.is_published) {
        const { data } = await supabase
          .from('marks')
          .select(`
            *,
            subjects(
              id, name, subject_type,
              max_ut1, max_ut2, max_ut3, max_ut4,
              max_ut5, max_ut6, max_ut7, max_ut8,
              max_mid_term, max_half_yearly, max_final
            )
          `)
          .eq('student_id', studentId)
          .eq('academic_year', ACADEMIC_YEAR)
        setMarksData(data || [])
      }

      setLoading(false)
    })()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId, standard])

  // ── Bucket rows by subject_type ───────────────────────────────────────────
  const rowsByType = useMemo(() => {
    const map: Record<SubjectTypeKey, any[]> = { academic: [], moral_studies: [] }
    marksData.forEach(m => {
      const type: SubjectTypeKey = m.subjects?.subject_type === 'moral_studies'
        ? 'moral_studies'
        : 'academic'
      map[type].push(m)
    })
    return map
  }, [marksData])

  const rowsInView = rowsByType[activeSubjectType]

  // ── Exam fields that have at least one entered mark in the current view ────
  const activeExamFields = useMemo(() => {
    return EXAM_FIELDS.filter(f =>
      rowsInView.some(m =>
        m[f.key] !== null && m[f.key] !== undefined &&
        Number(m.subjects?.[f.maxKey]) > 0
      )
    )
  }, [rowsInView])

  const activeExamField =
    activeExamFields.find(f => f.key === activeExamKey) || activeExamFields[0] || null

  // Reset exam tab when subject type changes
  useEffect(() => { setActiveExamKey('') }, [activeSubjectType])

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="flex items-center justify-center py-16 text-slate-400 gap-2">
      <Loader2 className="w-4 h-4 animate-spin text-teal-500" />
      <span className="text-sm">Loading marks…</span>
    </div>
  )

  // ── Results not yet published ─────────────────────────────────────────────
  if (!isPublished) return (
    <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
      <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center">
        <Clock className="w-6 h-6 text-amber-500" />
      </div>
      <div>
        <p className="text-[14px] font-black text-slate-700">Results Not Published</p>
        <p className="text-[12px] text-slate-400 mt-1">
          Results for <span className="font-bold">{standard}</span> haven't been released yet.
          <br />Check back later.
        </p>
      </div>
    </div>
  )

  if (marksData.length === 0) return (
    <div className="text-center py-16 text-slate-400">
      <BookOpen className="w-8 h-8 mx-auto mb-3 opacity-30" />
      <p className="text-sm">No marks entered yet for {ACADEMIC_YEAR}.</p>
    </div>
  )

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-700 tracking-wide uppercase">
          Marks — {ACADEMIC_YEAR}
        </h2>
      </div>

      {/* ── Academic | Moral Studies tabs ── */}
      <div className="flex rounded-xl bg-slate-100 p-1 gap-1">
        {SUBJECT_TYPES.map(t => {
          const count = rowsByType[t.key].length
          return (
            <button
              key={t.key}
              onClick={() => setActiveSubjectType(t.key)}
              className={`flex-1 py-2 rounded-lg text-[12px] font-black tracking-wide transition-all ${
                activeSubjectType === t.key
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {t.label}
              <span className={`ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                activeSubjectType === t.key
                  ? 'bg-teal-100 text-teal-700'
                  : 'bg-slate-200 text-slate-400'
              }`}>
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* ── Exam sub-tabs ── */}
      {activeExamFields.length > 0 && (
        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Exam</p>
          <div className="flex flex-wrap gap-2">
            {activeExamFields.map(f => {
              const isActive = activeExamField?.key === f.key
              const activeStyle =
                f.color === 'blue'  ? 'bg-blue-600 text-white border-blue-600 shadow-md' :
                f.color === 'amber' ? 'bg-amber-500 text-white border-amber-500 shadow-md' :
                                      'bg-teal-700 text-white border-teal-700 shadow-md'
              return (
                <button
                  key={f.key}
                  onClick={() => setActiveExamKey(f.key)}
                  className={`px-3.5 py-1.5 rounded-xl text-[11px] font-black tracking-wide border transition-all active:scale-95 ${
                    isActive ? activeStyle : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {f.label}
                </button>
              )
            })}
          </div>
        </div>
      )}

      <div className="h-px bg-slate-200" />

      {/* ── Empty states ── */}
      {rowsInView.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 py-16 text-center shadow-sm">
          <BookOpen className="w-8 h-8 text-slate-200 mx-auto mb-3" />
          <p className="text-[13px] font-bold text-slate-400">
            No {activeSubjectType === 'moral_studies' ? 'Moral Studies' : 'Academic'} marks yet.
          </p>
        </div>
      )}

      {rowsInView.length > 0 && !activeExamField && (
        <div className="bg-white rounded-2xl border border-slate-100 py-16 text-center shadow-sm">
          <p className="text-[13px] font-bold text-slate-400">No marks entered yet for these subjects.</p>
        </div>
      )}

      {/* ── Subject cards for the active exam ── */}
      {activeExamField && rowsInView.length > 0 && (() => {
        // Aggregate totals across all subjects for this exam
        const totalScored = rowsInView.reduce((s, m) => {
          const v = m[activeExamField.key]
          return s + (v !== null && v !== undefined ? Number(v) : 0)
        }, 0)
        const totalMax = rowsInView.reduce((s, m) => {
          const mx = m.subjects?.[activeExamField.maxKey]
          return s + (mx ? Number(mx) : 0)
        }, 0)
        const overallPct   = totalMax > 0 ? Math.round((totalScored / totalMax) * 100) : null
        const overallGrade = getGrade(overallPct)

        return (
          <div className="space-y-3">

            {/* ── Overall summary card ── */}
            {overallPct !== null && (
              <div className={`rounded-2xl border px-4 py-3.5 flex items-center gap-4 ${overallGrade.bg} ring-1 ${overallGrade.ring}`}>
                {/* Grade badge */}
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-[18px] font-black shrink-0 ${overallGrade.bg} ${overallGrade.text} ring-2 ${overallGrade.ring}`}>
                  {overallGrade.letter}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-[11px] font-black uppercase tracking-widest ${overallGrade.text} opacity-70`}>
                    {activeExamField.label} — Overall
                  </p>
                  <p className={`text-[22px] font-black leading-tight ${overallGrade.text}`}>
                    {totalScored}
                    <span className={`text-[14px] font-medium opacity-60`}>/{totalMax}</span>
                  </p>
                  <ScoreBar pct={overallPct} />
                </div>
                <div className={`text-[28px] font-black tabular-nums ${overallGrade.text}`}>
                  {overallPct}%
                </div>
              </div>
            )}

            {/* ── Per-subject rows ── */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden divide-y divide-slate-50">
              {rowsInView.map(m => {
                const sub  = m.subjects
                const max  = sub?.[activeExamField.maxKey]
                const val  = m[activeExamField.key]
                const pct  = getScorePercent(val, max)
                const grade = getGrade(pct)
                const hasData = val !== null && val !== undefined && Number(max) > 0

                return (
                  <div key={m.id} className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {/* Subject name */}
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-bold text-slate-700 truncate">{sub?.name ?? '—'}</p>
                        {max ? (
                          <p className="text-[10px] text-slate-400 mt-0.5">Max: {max}</p>
                        ) : (
                          <p className="text-[10px] text-slate-300 mt-0.5 italic">Not configured</p>
                        )}
                      </div>

                      {hasData ? (
                        <>
                          {/* Score */}
                          <div className="text-right shrink-0">
                            <p className="text-[15px] font-black text-slate-800 leading-none">
                              {val}
                              <span className="text-[11px] text-slate-300 font-medium">/{max}</span>
                            </p>
                            {pct !== null && (
                              <p className="text-[10px] font-bold text-slate-400 mt-0.5">{pct}%</p>
                            )}
                          </div>

                          {/* Grade pill */}
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-[12px] font-black ring-1 shrink-0 ${grade.bg} ${grade.text} ${grade.ring}`}>
                            {grade.letter}
                          </div>
                        </>
                      ) : (
                        <span className="text-[11px] text-slate-300 font-bold italic shrink-0">
                          {!max ? 'N/A' : '—'}
                        </span>
                      )}
                    </div>

                    {/* Score bar */}
                    {hasData && pct !== null && (
                      <div className="mt-2">
                        <ScoreBar pct={pct} />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 text-[11px] text-slate-400 pt-1 pb-2">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                80%+ Great
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
                50–79% Average
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-400 inline-block" />
                Below 50%
              </span>
            </div>
          </div>
        )
      })()}

    </div>
  )
}