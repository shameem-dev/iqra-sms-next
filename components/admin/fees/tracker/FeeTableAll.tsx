'use client'

import { StudentFeeStatus } from '@/type/fees'
import { getStatusConfig, getFeeStatus } from '@/utils/actions/feeConstants'

interface Props {
  students: StudentFeeStatus[]
  onSelectStudent: (student: StudentFeeStatus) => void
  loading: boolean
  feeTypeFilter: string
}

export default function FeeTableAll({ students, onSelectStudent, loading, feeTypeFilter }: Props) {
  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-xl p-4 animate-pulse">
            <div className="flex justify-between items-center">
              <div className="space-y-2 flex-1">
                <div className="h-3.5 bg-gray-200 rounded w-1/3" />
                <div className="h-2.5 bg-gray-100 rounded w-1/4" />
              </div>
              <div className="h-5 w-16 bg-gray-100 rounded-full" />
            </div>
            <div className="mt-3 h-1.5 bg-gray-100 rounded-full" />
          </div>
        ))}
      </div>
    )
  }

  if (students.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
        <p className="text-3xl mb-3">🔍</p>
        <p className="text-sm font-medium text-gray-500">No students found</p>
        <p className="text-xs text-gray-400 mt-1">Try adjusting your filters or search</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-gray-400 px-1">
        {students.length} student{students.length !== 1 ? 's' : ''}
        {feeTypeFilter ? ` — filtered by ${feeTypeFilter}` : ''}
      </p>

      {students.map(student => {
        // ── Fee-type mode ──────────────────────────────────────────
        if (feeTypeFilter) {
          const feeRow = student.fees.find((f: any) => f.fee_type === feeTypeFilter)
          const total   = feeRow?.total_amount ?? 0
          const paid    = feeRow?.paid_amount  ?? 0
          const balance = total - paid
          const status  = getFeeStatus(paid, total)
          const config  = getStatusConfig(status)
          const percent = total === 0 ? 0 : Math.min((paid / total) * 100, 100)

          return (
            <button
              key={student.student_id}
              onClick={() => onSelectStudent(student)}
              className="w-full bg-white border border-gray-200 rounded-xl p-4 text-left hover:border-teal-400 hover:shadow-sm transition-all group"
            >
              {/* Student info */}
              <div className="flex justify-between items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <p className="text-sm font-semibold text-gray-700 truncate">{student.name}</p>
                    <span className={`text-xs font-semibold rounded-full px-2 py-0.5 border flex-shrink-0 ${config.text} ${config.border} ${config.bg}`}>
                      {config.icon} {config.label}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400">
                    Adm: {student.admission_no} · {student.standard}
                  </p>

                  {/* Fee type label badge */}
                  <span className="inline-block mt-1.5 text-xs bg-teal-50 border border-teal-200 text-teal-600 rounded-full px-2 py-0.5 font-medium">
                    {feeTypeFilter}
                  </span>
                </div>

                {/* Amounts for this fee only */}
                <div className="text-right shrink-0">
                  {total > 0 ? (
                    <>
                      <p className="text-xs text-gray-400">Balance</p>
                      <p className={`text-sm font-bold ${balance > 0 ? 'text-red-500' : 'text-teal-600'}`}>
                        ₹{balance.toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">of ₹{total.toLocaleString()}</p>
                    </>
                  ) : (
                    <p className="text-xs text-gray-400">Not set</p>
                  )}
                </div>
              </div>

              {/* Fee amounts row */}
              <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-gray-100 text-center">
                <div>
                  <p className="text-xs text-gray-400">Total</p>
                  <p className="text-xs font-semibold text-gray-600">₹{total.toLocaleString()}</p>
                </div>
                <div className="border-x border-gray-100">
                  <p className="text-xs text-gray-400">Paid</p>
                  <p className="text-xs font-semibold text-teal-600">₹{paid.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Balance</p>
                  <p className={`text-xs font-semibold ${balance > 0 ? 'text-red-500' : 'text-gray-400'}`}>
                    ₹{balance.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-3">
                <div className="w-full bg-gray-100 rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full transition-all duration-500
                      ${status === 'paid' ? 'bg-teal-500'
                      : status === 'partial' ? 'bg-yellow-400'
                      : 'bg-red-400'}`}
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <div className="flex justify-between mt-1">
                  <p className="text-xs text-gray-400">{percent.toFixed(0)}% paid</p>
                  <span className="text-xs text-gray-300 group-hover:text-teal-500 transition-all">
                    View Details →
                  </span>
                </div>
              </div>
            </button>
          )
        }

        // ── Normal mode (grand total) ──────────────────────────────
        const config  = getStatusConfig(student.status)
        const percent = student.totalAmount === 0
          ? 0
          : Math.min((student.totalPaid / student.totalAmount) * 100, 100)

        return (
          <button
            key={student.student_id}
            onClick={() => onSelectStudent(student)}
            className="w-full bg-white border border-gray-200 rounded-xl p-4 text-left hover:border-teal-400 hover:shadow-sm transition-all group"
          >
            <div className="flex justify-between items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                  <p className="text-sm font-semibold text-gray-700 truncate">{student.name}</p>
                  <span className={`text-xs font-semibold rounded-full px-2 py-0.5 border flex-shrink-0 ${config.text} ${config.border} ${config.bg}`}>
                    {config.icon} {config.label}
                  </span>
                </div>
                <p className="text-xs text-gray-400">
                  Adm: {student.admission_no} · {student.standard}
                </p>
                <div className="mt-2 w-full bg-gray-100 rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full transition-all
                      ${student.status === 'paid' ? 'bg-teal-500'
                      : student.status === 'partial' ? 'bg-yellow-400'
                      : 'bg-red-400'}`}
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>

              <div className="text-right ml-4 shrink-0">
                {student.totalAmount > 0 ? (
                  <>
                    <p className="text-xs text-gray-400">Balance</p>
                    <p className={`text-sm font-bold ${student.totalBalance > 0 ? 'text-red-500' : 'text-teal-600'}`}>
                      ₹{student.totalBalance.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">of ₹{student.totalAmount.toLocaleString()}</p>
                  </>
                ) : (
                  <p className="text-xs text-gray-400">No fees set</p>
                )}
              </div>
            </div>

            <div className="flex justify-between mt-2">
              <div className="flex gap-3">
                <span className="text-xs text-gray-400">
                  Paid: <span className="text-teal-600 font-medium">₹{student.totalPaid.toLocaleString()}</span>
                </span>
                {student.totalBalance > 0 && (
                  <span className="text-xs text-gray-400">
                    Due: <span className="text-red-400 font-medium">₹{student.totalBalance.toLocaleString()}</span>
                  </span>
                )}
              </div>
              <span className="text-xs text-gray-300 group-hover:text-teal-500 transition-all">
                View Details →
              </span>
            </div>
          </button>
        )
      })}
    </div>
  )
}