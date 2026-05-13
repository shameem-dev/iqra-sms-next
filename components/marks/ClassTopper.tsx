'use client'

import { Loader2, Trophy, Medal } from 'lucide-react'

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

const rankConfig = [
  {
    border: 'border-amber-200',
    bg: 'bg-amber-50',
    badgeBg: 'bg-amber-400',
    badgeText: 'text-white',
    percentColor: 'text-amber-600',
    label: 'Gold',
    barColor: 'bg-amber-400',
  },
  {
    border: 'border-slate-200',
    bg: 'bg-slate-50',
    badgeBg: 'bg-slate-400',
    badgeText: 'text-white',
    percentColor: 'text-slate-500',
    label: 'Silver',
    barColor: 'bg-slate-400',
  },
  {
    border: 'border-orange-200',
    bg: 'bg-orange-50',
    badgeBg: 'bg-orange-400',
    badgeText: 'text-white',
    percentColor: 'text-orange-500',
    label: 'Bronze',
    barColor: 'bg-orange-400',
  },
]

function getInitials(name: string) {
  return name
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export default function ClassTopper({ selectedStandard, toppers, loading }: Props) {
  if (loading) {
    return (
      <div className="mt-6 border-t border-slate-100 pt-6 flex items-center gap-2 text-slate-400 text-sm">
        <Loader2 size={14} className="animate-spin text-teal-500" />
        <span>Calculating class toppers…</span>
      </div>
    )
  }

  if (toppers.length === 0) return null

  return (
    <div className="mt-6 border-t border-slate-100 pt-6 w-full">
      {/* Section header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-teal-50 flex items-center justify-center">
            <Trophy size={14} className="text-teal-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-700">Class Toppers</h3>
            <p className="text-xs text-slate-400">{selectedStandard}</p>
          </div>
        </div>
        <span className="text-xs bg-teal-50 text-teal-600 font-medium px-2.5 py-1 rounded-full border border-teal-100">
          Overall Rank
        </span>
      </div>

      <div className="flex flex-col gap-2.5 w-full">
        {toppers.map((student, i) => {
          const cfg = rankConfig[i] ?? rankConfig[2]
          const pctNum = parseFloat(student.percent)

          return (
            <div
              key={student.student_id}
              className={`
                relative flex items-center gap-3
                border ${cfg.border} ${cfg.bg}
                rounded-2xl px-4 py-3 w-full
                transition-all duration-200 hover:shadow-sm
              `}
            >
              {/* Rank badge */}
              <div className={`w-9 h-9 rounded-xl ${cfg.badgeBg} flex items-center justify-center shrink-0 shadow-sm`}>
                {i === 0
                  ? <Medal size={16} className="text-white" />
                  : <span className={`text-sm font-bold ${cfg.badgeText}`}>{i + 1}</span>
                }
              </div>

              {/* Avatar */}
              <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center shrink-0">
                <span className="text-xs font-semibold text-teal-700">{getInitials(student.name)}</span>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate leading-tight">{student.name}</p>
                <p className="text-xs text-slate-400 truncate">{student.admission_no}</p>

                {/* Progress bar */}
                <div className="mt-1.5 flex items-center gap-2">
                  <div className="flex-1 h-1 bg-white/80 rounded-full overflow-hidden border border-slate-200">
                    <div
                      className={`h-full ${cfg.barColor} rounded-full transition-all duration-500`}
                      style={{ width: `${Math.min(pctNum, 100)}%` }}
                    />
                  </div>
                  <span className="text-xs text-slate-400 shrink-0">
                    {student.total}/{student.maxTotal}
                  </span>
                </div>
              </div>

              {/* Percentage */}
              <div className="text-right shrink-0 pl-2">
                <p className={`text-2xl font-bold tracking-tight ${cfg.percentColor}`}>
                  {student.percent}%
                </p>
                <p className="text-[10px] text-slate-400 uppercase tracking-wide">overall</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}