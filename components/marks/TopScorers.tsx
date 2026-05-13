'use client'

import { TrendingUp } from 'lucide-react'
import { Subject, MarkWithStudent, MarkFormData } from '@/type/mark'

interface ExamColumn {
  label: string
  field: keyof MarkFormData
  maxKey: keyof Subject
}

interface Props {
  activeSubject: Subject
  marksData: MarkWithStudent[]
  examColumns: ExamColumn[]
}

const rankConfig = [
  { bg: 'bg-teal-600', text: 'text-white', bar: 'bg-teal-500' },
  { bg: 'bg-teal-400', text: 'text-white', bar: 'bg-teal-300' },
  { bg: 'bg-teal-100', text: 'text-teal-700', bar: 'bg-teal-200' },
]

function getInitials(name: string) {
  return name
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export default function TopScorers({ activeSubject, marksData, examColumns }: Props) {
  const activeColumns = examColumns.filter(
    col => (activeSubject[col.maxKey] as number) > 0
  )

  return (
    <div className="mt-8 border-t border-slate-100 pt-6">
      {/* Section header */}
      <div className="flex items-center gap-2 mb-5">
        <div className="w-7 h-7 rounded-lg bg-teal-50 flex items-center justify-center">
          <TrendingUp size={14} className="text-teal-600" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-700">Top Scorers</h3>
          <p className="text-xs text-slate-400">{activeSubject.name}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
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
              <div className="bg-teal-600 px-3.5 py-2.5 flex items-baseline justify-between">
                <p className="text-sm font-semibold text-white">{col.label}</p>
                <p className="text-xs text-teal-200">/{max}</p>
              </div>

              {/* Rank list */}
              <div className="divide-y divide-slate-50">
                {withMarks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-6 gap-1">
                    <span className="text-slate-200 text-2xl">—</span>
                    <p className="text-xs text-slate-300">No marks yet</p>
                  </div>
                ) : (
                  withMarks.map((student, i) => {
                    const cfg = rankConfig[i]
                    const score = student.marks[col.field] as number
                    const pct = max > 0 ? (score / max) * 100 : 0

                    return (
                      <div
                        key={student.student_id}
                        className="flex items-center gap-2.5 px-3 py-2.5"
                      >
                        {/* Rank */}
                        <span
                          className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${cfg.bg} ${cfg.text}`}
                        >
                          {i + 1}
                        </span>

                        {/* Avatar + name */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <div className="w-5 h-5 rounded-full bg-teal-50 flex items-center justify-center shrink-0">
                              <span className="text-[9px] font-semibold text-teal-600">
                                {getInitials(student.name)}
                              </span>
                            </div>
                            <p className="text-xs font-semibold text-slate-700 truncate leading-tight">
                              {student.name}
                            </p>
                          </div>
                          {/* Score bar */}
                          <div className="h-0.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${cfg.bar} rounded-full`}
                              style={{ width: `${Math.min(pct, 100)}%` }}
                            />
                          </div>
                        </div>

                        {/* Score */}
                        <span className="text-sm font-bold text-teal-600 shrink-0 tabular-nums">
                          {score}
                        </span>
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