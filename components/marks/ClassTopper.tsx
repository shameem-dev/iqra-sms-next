'use client'

import { Loader2, Trophy, Medal, ArrowUpDown, Users } from 'lucide-react'
import { useState, useMemo } from 'react'

interface SubjectMark {
  subject_name: string
  marks: number | null
  maxMarks: number
}

interface StudentResult {
  student_id: number
  name: string
  admission_no: string
  gender: string          // 'Male' | 'Female'
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

function getInitials(name: string) {
  const parts = name.trim().split(' ')
  return parts
    .slice(0, 2)
    .map(p => p[0]?.toUpperCase() ?? '')
    .join('')
}

function getRankConfig(rank: number) {
  if (rank === 1)
    return {
      border: 'border-amber-200',
      bg: 'bg-amber-50',
      badgeBg: 'bg-amber-400',
      badgeText: 'text-white',
      percentColor: 'text-amber-600',
      barColor: 'bg-amber-400',
    }
  if (rank === 2)
    return {
      border: 'border-slate-200',
      bg: 'bg-slate-50',
      badgeBg: 'bg-slate-400',
      badgeText: 'text-white',
      percentColor: 'text-slate-500',
      barColor: 'bg-slate-400',
    }
  if (rank === 3)
    return {
      border: 'border-orange-200',
      bg: 'bg-orange-50',
      badgeBg: 'bg-orange-400',
      badgeText: 'text-white',
      percentColor: 'text-orange-500',
      barColor: 'bg-orange-400',
    }
  return {
    border: 'border-slate-100',
    bg: 'bg-white',
    badgeBg: 'bg-slate-100',
    badgeText: 'text-slate-500',
    percentColor: 'text-slate-600',
    barColor: 'bg-slate-300',
  }
}

// Assign ranks considering ties
function assignRanks(students: StudentResult[]): (StudentResult & { rank: number })[] {
  const sorted = [...students].sort((a, b) => b.total - a.total)
  return sorted.map((student, i) => {
    const rank =
      i > 0 && student.total === sorted[i - 1].total
        ? sorted.findIndex(s => s.total === student.total) + 1
        : i + 1
    return { ...student, rank }
  })
}

export default function ClassTopper({ selectedStandard, toppers, loading }: Props) {
  const [sortMode, setSortMode] = useState<SortMode>('rank')

  // Collect all unique subject names
  const allSubjects = useMemo(() => {
    const names = new Set<string>()
    toppers.forEach(s => s.subjectMarks?.forEach(m => names.add(m.subject_name)))
    return Array.from(names)
  }, [toppers])

  const hasSubjects = allSubjects.length > 0

  // Ranked list (for rank mode)
  const rankedStudents = useMemo(() => assignRanks(toppers), [toppers])

  // Alphabetical: Boys (Male) first A→Z, then Girls (Female) A→Z
  const alphabeticalStudents = useMemo(() => {
    const boys = rankedStudents
      .filter(s => s.gender?.toLowerCase() === 'male')
      .sort((a, b) => a.name.localeCompare(b.name))
    const girls = rankedStudents
      .filter(s => s.gender?.toLowerCase() === 'female')
      .sort((a, b) => a.name.localeCompare(b.name))
    return [...boys, ...girls]
  }, [rankedStudents])

  const displayStudents = sortMode === 'rank' ? rankedStudents : alphabeticalStudents

  // ─── Loading ───────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-10 text-slate-400 text-sm">
        <Loader2 size={18} className="animate-spin" />
        Calculating class toppers…
      </div>
    )
  }

  if (!toppers.length) return null

  // ─── Main render ──────────────────────────────────────────
  return (
    <div className="w-full bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50">
        <div className="flex items-center gap-2">
          <Trophy size={18} className="text-amber-400" />
          <div>
            <p className="text-sm font-semibold text-slate-700">Class Toppers</p>
            <p className="text-xs text-slate-400">{selectedStandard} · {toppers.length} Students</p>
          </div>
        </div>

        {/* Sort toggle */}
        <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-0.5">
          <button
            onClick={() => setSortMode('rank')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              sortMode === 'rank'
                ? 'bg-slate-700 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Trophy size={11} />
            Rank
          </button>
          <button
            onClick={() => setSortMode('alphabetical')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              sortMode === 'alphabetical'
                ? 'bg-slate-700 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Users size={11} />
            A–Z
          </button>
        </div>
      </div>

      {/* ── Table view (when subject marks available) ── */}
      {hasSubjects ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 whitespace-nowrap sticky left-0 bg-slate-50 z-10 min-w-[44px]">
                  Rank
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 whitespace-nowrap sticky left-[44px] bg-slate-50 z-10 min-w-[160px]">
                  Student
                </th>
                {allSubjects.map(sub => (
                  <th
                    key={sub}
                    className="text-center px-3 py-3 text-xs font-semibold text-slate-500 whitespace-nowrap min-w-[90px]"
                  >
                    {sub}
                  </th>
                ))}
                <th className="text-center px-3 py-3 text-xs font-semibold text-slate-700 whitespace-nowrap min-w-[80px]">
                  Total
                </th>
                <th className="text-center px-3 py-3 text-xs font-semibold text-slate-700 whitespace-nowrap min-w-[70px]">
                  %
                </th>
              </tr>
            </thead>
            <tbody>
              {sortMode === 'rank' && rankedStudents.map(student => (
                <StudentRow
                  key={student.student_id}
                  student={student}
                  allSubjects={allSubjects}
                  sortMode={sortMode}
                />
              ))}

              {sortMode === 'alphabetical' && (
                <>
                  <tr className="bg-blue-50">
                    <td colSpan={2 + allSubjects.length + 2} className="px-4 py-1.5 text-xs font-semibold text-blue-500 uppercase tracking-wider">
                      Boys
                    </td>
                  </tr>
                  {alphabeticalStudents
                    .filter(s => s.gender?.toLowerCase() === 'male')
                    .map(student => (
                      <StudentRow
                        key={student.student_id}
                        student={student}
                        allSubjects={allSubjects}
                        sortMode={sortMode}
                      />
                    ))
                  }
                  <tr className="bg-pink-50">
                    <td colSpan={2 + allSubjects.length + 2} className="px-4 py-1.5 text-xs font-semibold text-pink-500 uppercase tracking-wider">
                      Girls
                    </td>
                  </tr>
                  {alphabeticalStudents
                    .filter(s => s.gender?.toLowerCase() === 'female')
                    .map(student => (
                      <StudentRow
                        key={student.student_id}
                        student={student}
                        allSubjects={allSubjects}
                        sortMode={sortMode}
                      />
                    ))
                  }
                </>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        /* ── Card view (no subject breakdown) ── */
        <div className="flex flex-col gap-2.5 p-4 max-h-[520px] overflow-y-auto">
          {sortMode === 'alphabetical' ? (
            <>
              {/* Boys */}
              <p className="text-xs font-semibold text-blue-500 uppercase tracking-wider px-1 mt-1">Boys</p>
              {alphabeticalStudents
                .filter(s => s.gender?.toLowerCase() === 'male')
                .map(student => <StudentCard key={student.student_id} student={student} />)}

              {/* Girls */}
              <p className="text-xs font-semibold text-pink-500 uppercase tracking-wider px-1 mt-2">Girls</p>
              {alphabeticalStudents
                .filter(s => s.gender?.toLowerCase() === 'female')
                .map(student => <StudentCard key={student.student_id} student={student} />)}
            </>
          ) : (
            rankedStudents.map(student => <StudentCard key={student.student_id} student={student} />)
          )}
        </div>
      )}
    </div>
  )
}

// ─── Table Row ────────────────────────────────────────────────────────────────
function StudentRow({
  student,
  allSubjects,
  sortMode,
}: {
  student: StudentResult & { rank: number }
  allSubjects: string[]
  sortMode: SortMode
}) {
  const cfg = getRankConfig(student.rank)
  const pct = parseFloat(student.percent) || 0

  return (
    <tr className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
      {/* Rank */}
      <td className="px-4 py-3 sticky left-0 z-10 bg-white">

        <div className={`w-7 h-7 rounded-full flex items-center justify-center ${cfg.badgeBg}`}>
          {student.rank <= 3
            ? <Medal size={13} className="text-white" />
            : <span className={`text-xs font-bold ${cfg.badgeText}`}>{student.rank}</span>
          }
        </div>
      </td>

      {/* Name */}
      <td className="px-4 py-3 sticky left-11 z-10 bg-white">
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

      {/* Subject marks */}
      {allSubjects.map(sub => {
        const sm = student.subjectMarks?.find(m => m.subject_name === sub)
        return (
          <td key={sub} className="px-3 py-3 text-center">
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

      {/* Total */}
      <td className="px-3 py-3 text-center">
        <span className="text-sm font-semibold text-slate-700">
          {student.total}
          <span className="text-xs font-normal text-slate-400">/{student.maxTotal}</span>
        </span>
      </td>

      {/* Percent */}
      <td className="px-3 py-3 text-center">
        <span className={`text-sm font-bold ${cfg.percentColor}`}>{student.percent}%</span>
      </td>
    </tr>
  )
}

// ─── Card (no subjects) ───────────────────────────────────────────────────────
function StudentCard({ student }: { student: StudentResult & { rank: number } }) {
  const cfg = getRankConfig(student.rank)
  const pct = Math.min(parseFloat(student.percent) || 0, 100)

  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl border ${cfg.border}`}>
      {/* Rank badge */}
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${cfg.badgeBg}`}>
        {student.rank <= 3
          ? <Medal size={14} className="text-white" />
          : <span className={`text-xs font-bold ${cfg.badgeText}`}>{student.rank}</span>
        }
      </div>

      {/* Avatar */}
      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 ${
        student.gender?.toLowerCase() === 'female' ? 'bg-pink-400' : 'bg-blue-400'
      }`}>
        {getInitials(student.name)}
      </div>

      {/* Name & adm */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-700 truncate">{student.name}</p>
        <p className="text-xs text-slate-400">{student.admission_no}</p>
        {/* Progress bar */}
        <div className="mt-1.5 h-1 bg-slate-100 rounded-full overflow-hidden w-full">
          <div
            className={`h-full rounded-full transition-all duration-500 ${cfg.barColor}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Score + % */}
      <div className="text-right flex-shrink-0">
        <p className={`text-lg font-bold leading-none ${cfg.percentColor}`}>{student.percent}%</p>
        <p className="text-xs text-slate-400 mt-0.5">{student.total}/{student.maxTotal}</p>
      </div>
    </div>
  )
}