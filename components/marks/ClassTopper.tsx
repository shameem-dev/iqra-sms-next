'use client'

import * as XLSX from 'xlsx'
import { Loader2, Trophy, Medal, Users } from 'lucide-react'
import { useState, useMemo } from 'react'

interface SubjectMark {
  subject_name: string
  subject_type: string
  marks: number | null
  maxMarks: number
}

interface StudentResult {
  student_id: number
  name: string
  admission_no: string
  gender: string
  total: number
  maxTotal: number
  percent: string
  subjectMarks?: SubjectMark[]
}

interface Props {
  selectedStandard: string
  toppers: StudentResult[]
  loading: boolean
}

type SortMode = 'rank' | 'alphabetical'
type FilterMode = 'academic' | 'moral_studies'

function getInitials(name: string) {
  const parts = name.trim().split(' ')
  return parts.slice(0, 2).map(p => p[0]?.toUpperCase() ?? '').join('')
}

function getRankConfig(rank: number) {
  if (rank === 1) return { border: 'border-amber-200', badgeBg: 'bg-amber-400', badgeText: 'text-white', percentColor: 'text-amber-600', barColor: 'bg-amber-400' }
  if (rank === 2) return { border: 'border-slate-200', badgeBg: 'bg-slate-400', badgeText: 'text-white', percentColor: 'text-slate-500', barColor: 'bg-slate-400' }
  if (rank === 3) return { border: 'border-orange-200', badgeBg: 'bg-orange-400', badgeText: 'text-white', percentColor: 'text-orange-500', barColor: 'bg-orange-400' }
  return { border: 'border-slate-100', badgeBg: 'bg-slate-100', badgeText: 'text-slate-500', percentColor: 'text-slate-600', barColor: 'bg-slate-300' }
}

function assignRanks(students: StudentResult[]): (StudentResult & { rank: number })[] {
  const sorted = [...students].sort((a, b) => b.total - a.total)
  return sorted.map((student, i) => {
    const rank = i > 0 && student.total === sorted[i - 1].total
      ? sorted.findIndex(s => s.total === student.total) + 1
      : i + 1
    return { ...student, rank }
  })
}

// Recalculate total/maxTotal/percent for a student based on filtered subject types
function calcFiltered(student: StudentResult, types: string[]) {
  const subs = student.subjectMarks?.filter(m => types.includes(m.subject_type)) ?? []
  const total    = subs.reduce((s, m) => s + (m.marks ?? 0), 0)
  const maxTotal = subs.reduce((s, m) => s + m.maxMarks, 0)
  const percent  = maxTotal === 0 ? '0.0' : ((total / maxTotal) * 100).toFixed(1)
  return { total, maxTotal, percent }
}

const TYPE_LABELS: Record<string, { label: string; headerBg: string; headerText: string; btnActive: string; btnInactive: string }> = {
  academic:      { label: 'Academic',      headerBg: 'bg-indigo-50',  headerText: 'text-indigo-600',  btnActive: 'bg-indigo-600 text-white',  btnInactive: 'text-indigo-600 border-indigo-200 hover:bg-indigo-50' },
  moral_studies: { label: 'Moral Studies', headerBg: 'bg-emerald-50', headerText: 'text-emerald-600', btnActive: 'bg-emerald-600 text-white', btnInactive: 'text-emerald-600 border-emerald-200 hover:bg-emerald-50' },
}

export default function ClassTopper({ selectedStandard, toppers, loading }: Props) {
  const [sortMode,   setSortMode]   = useState<SortMode>('rank')
  const [filterMode, setFilterMode] = useState<FilterMode>('academic')

  // Build subject groups from first student's subjectMarks
  const subjectsByType = useMemo(() => {
    const map: Record<string, string[]> = {}
    toppers[0]?.subjectMarks?.forEach(m => {
      if (!map[m.subject_type]) map[m.subject_type] = []
      if (!map[m.subject_type].includes(m.subject_name))
        map[m.subject_type].push(m.subject_name)
    })
    return map
  }, [toppers])

  const orderedTypes = useMemo(() =>
    Object.keys(subjectsByType).sort(a => a === 'academic' ? -1 : 1),
    [subjectsByType]
  )

  // Which types are visible based on filter
  const visibleTypes = filterMode === 'all' ? orderedTypes : [filterMode]

  const visibleSubjects = useMemo(() =>
    visibleTypes.flatMap(t => subjectsByType[t] ?? []),
    [visibleTypes, subjectsByType]
  )

  const hasSubjects = visibleSubjects.length > 0

  // Apply filter to students — recalculate totals for filtered types
  const filteredToppers = useMemo(() => {
    if (filterMode === 'all') return toppers
    return toppers.map(s => {
      const { total, maxTotal, percent } = calcFiltered(s, [filterMode])
      return { ...s, total, maxTotal, percent }
    })
  }, [toppers, filterMode])

  const rankedStudents = useMemo(() => assignRanks(filteredToppers), [filteredToppers])

  const alphabeticalStudents = useMemo(() => {
    const boys  = rankedStudents.filter(s => s.gender?.toLowerCase() === 'male').sort((a, b) => a.name.localeCompare(b.name))
    const girls = rankedStudents.filter(s => s.gender?.toLowerCase() === 'female').sort((a, b) => a.name.localeCompare(b.name))
    return [...boys, ...girls]
  }, [rankedStudents])

  const displayStudents = sortMode === 'rank' ? rankedStudents : alphabeticalStudents
  const totalCols = 2 + visibleSubjects.length + (filterMode === 'all' ? orderedTypes.length + 1 : 1) + 1

  // ── Excel download ───────────────────────────────────────
  function downloadExcel() {
    const rows = displayStudents.map(student => {
      const base: Record<string, any> = {
        Rank: student.rank,
        Name: student.name,
        'Admission No': student.admission_no,
        Gender: student.gender,
      }
      visibleTypes.forEach(type => {
        ;(subjectsByType[type] ?? []).forEach(sub => {
          const sm = student.subjectMarks?.find(m => m.subject_name === sub)
          base[sub] = sm?.marks !== null && sm?.marks !== undefined ? sm.marks : ''
        })
        // Per-type subtotal columns when showing all
        if (filterMode === 'all') {
          const { total, maxTotal } = calcFiltered(student, [type])
          const meta = TYPE_LABELS[type]
          base[`${meta?.label ?? type} Total`]   = total
          base[`${meta?.label ?? type} Max`]      = maxTotal
          base[`${meta?.label ?? type} %`]        = maxTotal > 0 ? ((total / maxTotal) * 100).toFixed(1) : '0.0'
        }
      })
      base['Total']     = student.total
      base['Max Total'] = student.maxTotal
      base['%']         = student.percent
      return base
    })
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Class Toppers')
    ws['!cols'] = Object.keys(rows[0] || {}).map(k => ({ wch: Math.max(k.length, 12) }))
    XLSX.writeFile(wb, `ClassToppers_${selectedStandard.replace(/\s+/g, '_')}_${filterMode}.xlsx`)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-10 text-slate-400 text-sm">
        <Loader2 size={18} className="animate-spin" />
        Calculating class toppers…
      </div>
    )
  }

  if (!toppers.length) return null

  return (
    <div className="w-full bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">

      {/* ── Header bar ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-slate-100 bg-slate-50">
        <div className="flex items-center gap-2">
          <Trophy size={18} className="text-amber-400" />
          <div>
            <p className="text-sm font-semibold text-slate-700">Class Toppers</p>
            <p className="text-xs text-slate-400">{selectedStandard} · {toppers.length} Students</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">

          {/* Category filter */}
          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-0.5">
              {orderedTypes.map(type => {
              const meta = TYPE_LABELS[type]
              return (
                <button
                  key={type}
                  onClick={() => setFilterMode(type as FilterMode)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    filterMode === type ? meta.btnActive : `text-slate-500 hover:text-slate-700`
                  }`}
                >
                  {meta?.label ?? type}
                </button>
              )
            })}
          </div>

          {/* Sort toggle */}
          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-0.5">
            <button
              onClick={() => setSortMode('rank')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                sortMode === 'rank' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Trophy size={11} /> Rank
            </button>
            <button
              onClick={() => setSortMode('alphabetical')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                sortMode === 'alphabetical' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Users size={11} /> A–Z
            </button>
          </div>

          {/* Excel button */}
          <button
            onClick={downloadExcel}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition shadow-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Excel
          </button>
        </div>
      </div>

      {/* ── Table view ── */}
      {hasSubjects ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>

              {/* Row 1 — group labels (only shown when filter = all) */}
              {filterMode === 'all' && (
                <tr className="border-b border-slate-100">
                  <th className="sticky left-0 z-20 bg-white w-[44px]" />
                  <th className="sticky left-[44px] z-20 bg-white min-w-[160px]" />
                  {orderedTypes.map(type => {
                    const subs = subjectsByType[type] ?? []
                    const meta = TYPE_LABELS[type] ?? { label: type, headerBg: 'bg-slate-50', headerText: 'text-slate-500' }
                    // subjects cols + 1 subtotal col
                    return (
                      <th
                        key={type}
                        colSpan={subs.length + 1}
                        className={`text-center px-3 py-2 text-xs font-bold uppercase tracking-wider border-l border-slate-200 ${meta.headerBg} ${meta.headerText}`}
                      >
                        {meta.label}
                      </th>
                    )
                  })}
                  {/* Grand total cols */}
                  <th className="bg-slate-100 border-l border-slate-200 min-w-[80px]" />
                  <th className="bg-slate-100 min-w-[70px]" />
                </tr>
              )}

              {/* Row 2 — column names */}
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 whitespace-nowrap sticky left-0 bg-slate-50 z-10">
                  Rank
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 whitespace-nowrap sticky left-[44px] bg-slate-50 z-10">
                  Student
                </th>
                {visibleTypes.map(type =>
                  <>
                    {(subjectsByType[type] ?? []).map((sub, idx) => (
                      <th
                        key={sub}
                        className={`text-center px-3 py-3 text-xs font-semibold text-slate-500 whitespace-nowrap min-w-[90px] ${idx === 0 ? 'border-l border-slate-200' : ''}`}
                      >
                        {sub}
                      </th>
                    ))}
                    {/* Subtotal per type */}
                    <th
                      key={`${type}-total`}
                      className={`text-center px-3 py-3 text-xs font-semibold whitespace-nowrap min-w-[80px] border-l border-slate-200 ${TYPE_LABELS[type]?.headerText ?? 'text-slate-600'} ${TYPE_LABELS[type]?.headerBg ?? ''}`}
                    >
                      {TYPE_LABELS[type]?.label ?? type} Total
                    </th>
                  </>
                )}
                {/* Grand total — only when showing all */}
                {filterMode === 'all' && (
                  <>
                    <th className="text-center px-3 py-3 text-xs font-semibold text-slate-700 whitespace-nowrap border-l border-slate-200 bg-slate-100">
                      Grand Total
                    </th>
                    <th className="text-center px-3 py-3 text-xs font-semibold text-slate-700 whitespace-nowrap bg-slate-100">
                      %
                    </th>
                  </>
                )}
                {/* Single % when filtered */}
                {filterMode !== 'all' && (
                  <th className="text-center px-3 py-3 text-xs font-semibold text-slate-700 whitespace-nowrap border-l border-slate-200">
                    %
                  </th>
                )}
              </tr>
            </thead>

            <tbody>
              {sortMode === 'rank' && rankedStudents.map(student => (
                <StudentRow
                  key={student.student_id}
                  student={student}
                  visibleTypes={visibleTypes}
                  subjectsByType={subjectsByType}
                  filterMode={filterMode}
                />
              ))}

              {sortMode === 'alphabetical' && (
                <>
                  <tr className="bg-blue-50">
                    <td colSpan={totalCols} className="px-4 py-1.5 text-xs font-semibold text-blue-500 uppercase tracking-wider">
                      Boys
                    </td>
                  </tr>
                  {alphabeticalStudents
                    .filter(s => s.gender?.toLowerCase() === 'male')
                    .map(student => (
                      <StudentRow key={student.student_id} student={student} visibleTypes={visibleTypes} subjectsByType={subjectsByType} filterMode={filterMode} />
                    ))}
                  <tr className="bg-pink-50">
                    <td colSpan={totalCols} className="px-4 py-1.5 text-xs font-semibold text-pink-500 uppercase tracking-wider">
                      Girls
                    </td>
                  </tr>
                  {alphabeticalStudents
                    .filter(s => s.gender?.toLowerCase() === 'female')
                    .map(student => (
                      <StudentRow key={student.student_id} student={student} visibleTypes={visibleTypes} subjectsByType={subjectsByType} filterMode={filterMode} />
                    ))}
                </>
              )}
            </tbody>
          </table>
        </div>

      ) : (
        <div className="flex flex-col gap-2.5 p-4 max-h-[520px] overflow-y-auto">
          {sortMode === 'alphabetical' ? (
            <>
              <p className="text-xs font-semibold text-blue-500 uppercase tracking-wider px-1 mt-1">Boys</p>
              {alphabeticalStudents.filter(s => s.gender?.toLowerCase() === 'male').map(s => <StudentCard key={s.student_id} student={s} />)}
              <p className="text-xs font-semibold text-pink-500 uppercase tracking-wider px-1 mt-2">Girls</p>
              {alphabeticalStudents.filter(s => s.gender?.toLowerCase() === 'female').map(s => <StudentCard key={s.student_id} student={s} />)}
            </>
          ) : (
            rankedStudents.map(s => <StudentCard key={s.student_id} student={s} />)
          )}
        </div>
      )}
    </div>
  )
}

// ─── Table Row ────────────────────────────────────────────────────────────────
function StudentRow({
  student, visibleTypes, subjectsByType, filterMode,
}: {
  student: StudentResult & { rank: number }
  visibleTypes: string[]
  subjectsByType: Record<string, string[]>
  filterMode: FilterMode
}) {
  const cfg = getRankConfig(student.rank)
  return (
    <tr className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
      <td className="px-4 py-3 sticky left-0 z-10 bg-white">
        <div className={`w-7 h-7 rounded-full flex items-center justify-center ${cfg.badgeBg}`}>
          {student.rank <= 3
            ? <Medal size={13} className="text-white" />
            : <span className={`text-xs font-bold ${cfg.badgeText}`}>{student.rank}</span>
          }
        </div>
      </td>
      <td className="px-4 py-3 sticky left-[44px] z-10 bg-white">
        <div className="flex items-center gap-2.5">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 ${
            student.gender?.toLowerCase() === 'female' ? 'bg-pink-400' : 'bg-blue-400'
          }`}>
            {getInitials(student.name)}
          </div>
          <div>
            <p className="text-sm font-medium text-slate-700 truncate max-w-[120px]">{student.name}</p>
            <p className="text-xs text-slate-400">{student.admission_no}</p>
          </div>
        </div>
      </td>

      {visibleTypes.map(type => {
        const { total, maxTotal, percent } = calcFiltered(student, [type])
        const meta = TYPE_LABELS[type]
        return (
          <>
            {(subjectsByType[type] ?? []).map((sub, idx) => {
              const sm = student.subjectMarks?.find(m => m.subject_name === sub)
              return (
                <td key={sub} className={`px-3 py-3 text-center ${idx === 0 ? 'border-l border-slate-100' : ''}`}>
                  {sm ? (
                    <span className="text-sm text-slate-600">
                      {sm.marks !== null ? sm.marks : <span className="text-slate-300">—</span>}
                      <span className="text-xs text-slate-400">/{sm.maxMarks}</span>
                    </span>
                  ) : (
                    <span className="text-slate-300 text-sm">—</span>
                  )}
                </td>
              )
            })}
            {/* Subtotal for this type */}
            <td key={`${type}-sub`} className={`px-3 py-3 text-center border-l border-slate-100 ${meta?.headerBg ?? ''}`}>
              <span className={`text-sm font-semibold ${meta?.headerText ?? 'text-slate-700'}`}>
                {total}<span className="text-xs font-normal text-slate-400">/{maxTotal}</span>
              </span>
            </td>
          </>
        )
      })}

      {/* Grand total when all */}
      {filterMode === 'all' && (
        <>
          <td className="px-3 py-3 text-center border-l border-slate-200 bg-slate-50">
            <span className="text-sm font-bold text-slate-700">
              {student.total}<span className="text-xs font-normal text-slate-400">/{student.maxTotal}</span>
            </span>
          </td>
          <td className="px-3 py-3 text-center bg-slate-50">
            <span className={`text-sm font-bold ${cfg.percentColor}`}>{student.percent}%</span>
          </td>
        </>
      )}

      {/* Single % when filtered */}
      {filterMode !== 'all' && (
        <td className="px-3 py-3 text-center border-l border-slate-100">
          <span className={`text-sm font-bold ${cfg.percentColor}`}>{student.percent}%</span>
        </td>
      )}
    </tr>
  )
}

// ─── Card (no subjects) ───────────────────────────────────────────────────────
function StudentCard({ student }: { student: StudentResult & { rank: number } }) {
  const cfg = getRankConfig(student.rank)
  const pct = Math.min(parseFloat(student.percent) || 0, 100)
  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl border ${cfg.border}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${cfg.badgeBg}`}>
        {student.rank <= 3
          ? <Medal size={14} className="text-white" />
          : <span className={`text-xs font-bold ${cfg.badgeText}`}>{student.rank}</span>
        }
      </div>
      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 ${
        student.gender?.toLowerCase() === 'female' ? 'bg-pink-400' : 'bg-blue-400'
      }`}>
        {getInitials(student.name)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-700 truncate">{student.name}</p>
        <p className="text-xs text-slate-400">{student.admission_no}</p>
        <div className="mt-1.5 h-1 bg-slate-100 rounded-full overflow-hidden w-full">
          <div className={`h-full rounded-full transition-all duration-500 ${cfg.barColor}`} style={{ width: `${pct}%` }} />
        </div>
      </div>
      <div className="text-right flex-shrink-0">
        <p className={`text-lg font-bold leading-none ${cfg.percentColor}`}>{student.percent}%</p>
        <p className="text-xs text-slate-400 mt-0.5">{student.total}/{student.maxTotal}</p>
      </div>
    </div>
  )
}