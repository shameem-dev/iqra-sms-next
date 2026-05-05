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

const rankStyles = [
  { bg: 'bg-teal-600', text: 'text-white' },
  { bg: 'bg-teal-400', text: 'text-white' },
  { bg: 'bg-slate-200', text: 'text-slate-600' },
]

export default function TopScorers({ activeSubject, marksData, examColumns }: Props) {
  const activeColumns = examColumns.filter(
    col => (activeSubject[col.maxKey] as number) > 0
  )

  return (
    <div className="mt-8 border-t pt-6">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp size={15} className="text-slate-500" />
        <h3 className="font-semibold text-sm text-slate-600">
          Top Scorers — {activeSubject.name}
        </h3>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {activeColumns.map(col => {
          const withMarks = marksData
            .filter(r => r.marks[col.field] !== null)
            .sort((a, b) => (b.marks[col.field] as number || 0) - (a.marks[col.field] as number || 0))
            .slice(0, 3)

          const max = activeSubject[col.maxKey] as number

          return (
            <div
              key={col.field}
              className="bg-white border border-slate-100 rounded-xl overflow-hidden shadow-sm"
            >
              {/* Card Header */}
              <div className="bg-teal-600 px-3 py-2">
                <p className="text-xs text-teal-100 font-semibold">{col.label}</p>
                <p className="text-xs text-teal-200">out of {max}</p>
              </div>

              {/* Rank List */}
              <div className="divide-y divide-slate-100">
                {withMarks.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4">No marks yet</p>
                ) : (
                  withMarks.map((student, i) => (
                    <div
                      key={student.student_id}
                      className="flex items-center gap-2 px-3 py-2"
                    >
                      <span
                        className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${rankStyles[i].bg} ${rankStyles[i].text}`}
                      >
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-600 truncate">
                          {student.name}
                        </p>
                        <p className="text-xs text-slate-400">{student.admission_no}</p>
                      </div>
                      <span className="text-sm font-bold text-teal-600 shrink-0">
                        {student.marks[col.field]}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}