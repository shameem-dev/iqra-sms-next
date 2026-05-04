'use client'

import { Status } from '@/type/attedence'

interface Props {
  status: Status
  isDirty: boolean
  isWeekend: boolean
  isToday: boolean
  onToggle: () => void
}

export default function AttendanceCell({
  status, isDirty, isWeekend, isToday, onToggle
}: Props) {
  return (
    <td className={`p-0.5 text-center border-r border-slate-100 transition-colors
      ${isWeekend ? 'bg-slate-50' : ''}
      ${isToday   ? 'bg-teal-50/40' : ''}
    `}>
      <button
        onClick={onToggle}
        title={
          status === 'none'    ? 'Click to mark Present' :
          status === 'present' ? 'Click to mark Absent'  :
                                 'Click to clear'
        }
        className={`w-7 h-7 rounded-lg text-xs font-bold transition-all hover:scale-110
          ${status === 'present' ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-500 hover:text-white' :
            status === 'absent'  ? 'bg-red-100 text-red-700 hover:bg-red-500 hover:text-white' :
                                   'bg-slate-100 text-slate-300 hover:bg-slate-200 hover:text-slate-500'
          }
          ${isDirty ? 'ring-1 ring-amber-400' : ''}
        `}>
        {status === 'present' ? 'P' :
         status === 'absent'  ? 'A' : '—'}
      </button>
    </td>
  )
}