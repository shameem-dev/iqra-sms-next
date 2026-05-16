'use client'

import { TrendingUp, Trophy, Medal, Loader2 } from 'lucide-react'
import { Subject, MarkWithStudent, MarkFormData } from '@/type/mark'

/* ─── shared types ─── */

interface ExamColumn {
  label: string
  field: keyof MarkFormData
  maxKey: keyof Subject
}

interface StudentResult {
  student_id: number
  name: string
  admission_no: string
  total: number
  maxTotal: number
  percent: string
}

interface Props {
  /* TopScorers */
  activeSubject: Subject
  marksData: MarkWithStudent[]
  examColumns: ExamColumn[]
  /* ClassTopper */
  selectedStandard: string
  toppers: StudentResult[]
  toppersLoading: boolean
}

/* ─── shared helpers ─── */

const topScorerRank = [
  { bg: 'bg-teal-600', text: 'text-white', bar: 'bg-teal-500' },
  { bg: 'bg-teal-400', text: 'text-white', bar: 'bg-teal-300' },
  { bg: 'bg-teal-100', text: 'text-teal-700', bar: 'bg-teal-200' },
]

const classTopperRank = [
  {
    border: 'border-amber-200', bg: 'bg-amber-50',
    badgeBg: 'bg-amber-400', percentColor: 'text-amber-600', barColor: 'bg-amber-400',
  },
  {
    border: 'border-slate-200', bg: 'bg-slate-50',
    badgeBg: 'bg-slate-400', percentColor: 'text-slate-500', barColor: 'bg-slate-400',
  },
  {
    border: 'border-orange-200', bg: 'bg-orange-50',
    badgeBg: 'bg-orange-400', percentColor: 'text-orange-500', barColor: 'bg-orange-400',
  },
]

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
}

/* ─── TopScorers (left column) ─── */

function TopScorers({ activeSubject, marksData, examColumns }: {
  activeSubject: Subject
  marksData: MarkWithStudent[]
  examColumns: ExamColumn[]
}) {
  const activeColumns = examColumns.filter(
    col => (activeSubject[col.maxKey] as number) > 0
  )

  return (
    <div className="flex-1 min-w-0">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 rounded-lg bg-teal-50 flex items-center justify-center">
          <TrendingUp size={14} className="text-teal-600" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-700">Top Scorers</h3>
          <p className="text-xs text-slate-400">{activeSubject.name}</p>
        </div>
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-2.5">
        {activeColumns.map(col => {
          const withMarks = marksData
            .filter(r => r.marks[col.field] !== null && r.marks[col.field] !== undefined)
            .sort((a, b) =>
              (b.marks[col.field] as number || 0) - (a.marks[col.field] as number || 0)
            )
            .slice(0, 3)

          const max = activeSubject[col.maxKey] as number

          return (
            <div
              key={col.field}
              className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200"
            >
              {/* Card header */}
              <div className="bg-teal-600 px-3 py-2 flex items-baseline justify-between">
                <p className="text-sm font-semibold text-white">{col.label}</p>
                <p className="text-xs text-teal-200">/{max}</p>
              </div>

              {/* Rank list */}
              <div className="divide-y divide-slate-50">
                {withMarks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-5 gap-1">
                    <span className="text-slate-200 text-xl">—</span>
                    <p className="text-xs text-slate-300">No marks yet</p>
                  </div>
                ) : (
                  withMarks.map((student, i) => {
                    const cfg = topScorerRank[i]
                    const score = student.marks[col.field] as number
                    const pct = max > 0 ? (score / max) * 100 : 0

                    return (
                      <div key={student.student_id} className="flex items-center gap-2 px-3 py-2">
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${cfg.bg} ${cfg.text}`}>
                          {
                                i > 0 &&
                                score === (withMarks[i - 1].marks[col.field] as number)
                                  ? withMarks.findIndex(
                                      s => (s.marks[col.field] as number) === score
                                    ) + 1
                                  : i + 1
                              }
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1 mb-0.5">
                            <div className="w-4 h-4 rounded-full bg-teal-50 flex items-center justify-center shrink-0">
                              <span className="text-[8px] font-semibold text-teal-600">{getInitials(student.name)}</span>
                            </div>
                            <p className="text-xs font-semibold text-slate-700 truncate">{student.name}</p>
                          </div>
                          <div className="h-0.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className={`h-full ${cfg.bar} rounded-full`} style={{ width: `${Math.min(pct, 100)}%` }} />
                          </div>
                        </div>
                        <span className="text-sm font-bold text-teal-600 shrink-0 tabular-nums">{score}</span>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ─── ClassTopper (right column) ─── */

function ClassTopper({ selectedStandard, toppers, loading }: {
  selectedStandard: string
  toppers: StudentResult[]
  loading: boolean
}) {
  return (
    <div className="w-full xl:w-72 shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-teal-50 flex items-center justify-center">
            <Trophy size={14} className="text-teal-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-700">Class Toppers</h3>
            <p className="text-xs text-slate-400">{selectedStandard}</p>
          </div>
        </div>
        <span className="text-[11px] bg-teal-50 text-teal-600 font-medium px-2 py-0.5 rounded-full border border-teal-100">
          Exam Rank
        </span>
      </div>

      {/* Body */}
      {loading ? (
        <div className="flex items-center gap-2 text-slate-400 text-sm py-4">
          <Loader2 size={14} className="animate-spin text-teal-500" />
          <span>Calculating…</span>
        </div>
      ) : toppers.length === 0 ? (
        <p className="text-sm text-slate-300 py-4">No data yet.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {toppers.map((student, i) => {
            const cfg = classTopperRank[i] ?? classTopperRank[2]
            const pctNum = parseFloat(student.percent)

            return (
              <div
                key={student.student_id}
                className={`flex items-center gap-3 border ${cfg.border} ${cfg.bg} rounded-2xl px-3.5 py-2.5 transition-all duration-200 hover:shadow-sm`}
              >
                {/* Rank badge */}
                <div className={`w-8 h-8 rounded-xl ${cfg.badgeBg} flex items-center justify-center shrink-0 shadow-sm`}>
                  {i === 0
                    ? <Medal size={15} className="text-white" />
                    : <span className="text-sm font-bold text-white">{i + 1}</span>
                  }
                </div>

                {/* Avatar */}
                <div className="w-7 h-7 rounded-full bg-teal-100 flex items-center justify-center shrink-0">
                  <span className="text-[10px] font-semibold text-teal-700">{getInitials(student.name)}</span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate leading-tight">{student.name}</p>
                  <p className="text-xs text-slate-400 truncate">{student.admission_no}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <div className="flex-1 h-1 bg-white/80 rounded-full overflow-hidden border border-slate-200">
                      <div
                        className={`h-full ${cfg.barColor} rounded-full transition-all duration-500`}
                        style={{ width: `${Math.min(pctNum, 100)}%` }}
                      />
                    </div>
                    <span className="text-[11px] text-slate-400 shrink-0 tabular-nums">
                      {student.total}/{student.maxTotal}
                    </span>
                  </div>
                </div>

                {/* Percentage */}
                <div className="text-right shrink-0 pl-1">
                  <p className={`text-xl font-bold tracking-tight ${cfg.percentColor}`}>{student.percent}%</p>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wide">overall</p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

/* ─── ScoreSection (combined export) ─── */

export default function ScoreSection({
  activeSubject,
  marksData,
  examColumns,
  selectedStandard,
  toppers,
  toppersLoading,
}: Props) {
  return (
    <div className="mt-8 border-t border-slate-100 pt-6">
      <div className="flex flex-col xl:flex-row gap-6">
        {/* Left — subject-wise top scorers */}
        <TopScorers
          activeSubject={activeSubject}
          marksData={marksData}
          examColumns={examColumns}
        />

        {/* Divider (visible only on xl) */}
        <div className="hidden xl:block w-px bg-slate-100 self-stretch" />

        {/* Right — overall class toppers */}
        <ClassTopper
          selectedStandard={selectedStandard}
          toppers={toppers}
          loading={toppersLoading}
        />
      </div>
    </div>
  )
}