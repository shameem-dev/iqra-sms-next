'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { STANDARDS } from '@/type/attedence'

interface Props {
  selectedStandard: string
  onSelectStandard: (std: string) => void
  year: number
  month: number
  onPrevMonth: () => void
  onNextMonth: () => void
}

export default function AttendanceControls({
  selectedStandard, onSelectStandard,
  year, month, onPrevMonth, onNextMonth,
}: Props) {
  const monthName = new Date(year, month).toLocaleString('en-IN', {
    month: 'long', year: 'numeric'
  })

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-wrap items-start gap-6">

      {/* Class selector */}
      <div className="flex-1 min-w-[220px]">
        <label className="block text-xs font-medium text-slate-500 mb-2">Select Class</label>
        <div className="flex flex-wrap gap-2">
          {STANDARDS.map(std => (
            <button key={std}
              onClick={() => onSelectStandard(std)}
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

      {/* Month navigation */}
      <div>
        <label className="block text-xs font-medium text-slate-500 mb-2">Month</label>
        <div className="flex items-center gap-2">
          <button onClick={onPrevMonth}
            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
            <ChevronLeft className="w-4 h-4 text-slate-500" />
          </button>
          <span className="text-sm font-semibold text-slate-700 w-36 text-center">
            {monthName}
          </span>
          <button onClick={onNextMonth}
            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
            <ChevronRight className="w-4 h-4 text-slate-500" />
          </button>
        </div>
      </div>
    </div>
  )
}