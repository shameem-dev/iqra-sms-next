'use client'

import { Loader2, Trophy } from 'lucide-react'

interface StudentResult {
  student_id: number
  name: string
  admission_no: string
  total: number
  maxTotal: number
  percent: string
}

interface Props {
  selectedStandard: string
  toppers: StudentResult[]
  loading: boolean
}

const rankStyles = [
  {
    border: 'border-yellow-300',
    bg: 'bg-yellow-50',
    badge: 'bg-yellow-400',
    percent: 'text-yellow-600',
    label: '1st',
  },
  {
    border: 'border-slate-300',
    bg: 'bg-slate-50',
    badge: 'bg-slate-400',
    percent: 'text-slate-600',
    label: '2nd',
  },
  {
    border: 'border-orange-300',
    bg: 'bg-orange-50',
    badge: 'bg-orange-400',
    percent: 'text-orange-600',
    label: '3rd',
  },
]

export default function ClassTopper({ selectedStandard, toppers, loading }: Props) {
  if (loading) {
    return (
      <div className="mt-6 border-t pt-6 flex items-center gap-2 text-slate-400 text-sm">
        <Loader2 size={14} className="animate-spin" />
        Calculating class toppers…
      </div>
    )
  }

  if (toppers.length === 0) return null

  return (
    <div className="mt-6 border-t pt-6 w-full">
      <div className="flex items-center gap-2 mb-4">
        <Trophy size={15} className="text-slate-500" />
        <h3 className="font-semibold text-sm text-slate-600">
          Class Topper — {selectedStandard}
        </h3>
      </div>

      <div className="flex flex-col gap-2 w-full">
        {toppers.map((student, i) => {
          const style = rankStyles[i] ?? rankStyles[2]
          return (
            <div
              key={student.student_id}
              className={`flex items-center gap-3 border ${style.border} ${style.bg} rounded-xl px-4 py-3 w-full`}
            >
              {/* Rank badge */}
              <div className={`w-8 h-8 rounded-full ${style.badge} flex items-center justify-center shrink-0`}>
                <span className="text-white text-xs font-bold">{i + 1}</span>
              </div>

              {/* Name + admission */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-800 truncate">{student.name}</p>
                <p className="text-xs text-slate-400 truncate">{student.admission_no}</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {student.total} / {student.maxTotal} marks
                </p>
              </div>

              {/* Percentage */}
              <div className="text-right shrink-0">
                <p className={`text-xl font-bold ${style.percent}`}>{student.percent}%</p>
                <p className="text-xs text-slate-400">overall</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}