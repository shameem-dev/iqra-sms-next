'use client'

import { StudentFeeStatus } from '@/type/fees'

interface Props {
  students: StudentFeeStatus[]
}

export default function FeeSummaryBar({ students }: Props) {
  const totalStudents = students.length
  const paid    = students.filter(s => s.status === 'paid').length
  const partial = students.filter(s => s.status === 'partial').length
  const pending = students.filter(s => s.status === 'pending').length

  const grandTotal   = students.reduce((sum, s) => sum + s.totalAmount, 0)
  const grandPaid    = students.reduce((sum, s) => sum + s.totalPaid, 0)
  const grandBalance = students.reduce((sum, s) => sum + s.totalBalance, 0)

  const collectPercent = grandTotal === 0 ? 0 : Math.min((grandPaid / grandTotal) * 100, 100)

  const cards = [
    {
      label: 'Total Students',
      value: totalStudents,
      sub: 'enrolled',
      bg: 'bg-gray-50',
      border: 'border-gray-200',
      text: 'text-gray-700',
      sub_text: 'text-gray-400',
    },
    {
      label: 'Fully Paid',
      value: paid,
      sub: `${totalStudents === 0 ? 0 : ((paid / totalStudents) * 100).toFixed(0)}% of class`,
      bg: 'bg-teal-50',
      border: 'border-teal-200',
      text: 'text-teal-600',
      sub_text: 'text-teal-400',
    },
    {
      label: 'Partial',
      value: partial,
      sub: `${totalStudents === 0 ? 0 : ((partial / totalStudents) * 100).toFixed(0)}% of class`,
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      text: 'text-yellow-600',
      sub_text: 'text-yellow-400',
    },
    {
      label: 'Pending',
      value: pending,
      sub: `${totalStudents === 0 ? 0 : ((pending / totalStudents) * 100).toFixed(0)}% of class`,
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-500',
      sub_text: 'text-red-300',
    },
  ]

  return (
    <div className="space-y-3">
      {/* Student Count Cards */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {cards.map(card => (
          <div
            key={card.label}
            className={`${card.bg} border ${card.border} rounded-xl p-3 text-center`}
          >
            <p className={`text-2xl font-bold ${card.text}`}>{card.value}</p>
            <p className="text-xs font-medium text-gray-500 mt-0.5">{card.label}</p>
            <p className={`text-xs ${card.sub_text} mt-0.5`}>{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Collection Summary */}
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Fee Collection</h3>
          <span className="text-xs font-bold text-teal-600">{collectPercent.toFixed(1)}% collected</span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-100 rounded-full h-3 mb-3 overflow-hidden">
          <div
            className="h-3 rounded-full bg-teal-500 transition-all duration-700"
            style={{ width: `${collectPercent}%` }}
          />
        </div>

        {/* Amounts */}
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center">
            <p className="text-xs text-gray-400 mb-0.5">Total Fees</p>
            <p className="text-sm font-bold text-gray-600">₹{grandTotal.toLocaleString()}</p>
          </div>
          <div className="text-center border-x border-gray-100">
            <p className="text-xs text-gray-400 mb-0.5">Collected</p>
            <p className="text-sm font-bold text-teal-600">₹{grandPaid.toLocaleString()}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-400 mb-0.5">Outstanding</p>
            <p className={`text-sm font-bold ${grandBalance > 0 ? 'text-red-500' : 'text-gray-400'}`}>
              ₹{grandBalance.toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}