'use client'

import { StudentFeeStatus, FeeRow } from '@/type/fees'
import { getStatusConfig, getFeeStatus } from '@/utils/actions/feeConstants'

interface Props {
  student: StudentFeeStatus
  onClose: () => void
  onGoToPayment: (student: {
    id: number
    name: string
    admission_no: string
    standard: string
  }) => void
}

const FIXED_FEE_ORDER = ['Admission Fee', 'Welfare Fee', 'Book Fee', 'Uniform Fee', 'Others']

export default function FeeTableSingle({ student, onClose, onGoToPayment }: Props) {
  const overallConfig = getStatusConfig(student.status)

  const fixedFees   = FIXED_FEE_ORDER
    .map(ft => student.fees.find(f => f.fee_type === ft))
    .filter(Boolean) as FeeRow[]

  const tuitionFees = student.fees.filter(f => f.fee_type.startsWith('Tuition Fee'))
  const vehicleFees = student.fees.filter(f => f.fee_type.startsWith('Vehicle Fee'))  // ← was missing

  function FeeRowCard({ fee }: { fee: FeeRow }) {
    const balance = fee.total_amount - fee.paid_amount
    const status  = getFeeStatus(fee.paid_amount, fee.total_amount)
    const config  = getStatusConfig(status)
    const percent = fee.total_amount === 0 ? 0 : Math.min((fee.paid_amount / fee.total_amount) * 100, 100)
    const isNA    = fee.total_amount === 0

    return (
      <div className={`border rounded-lg p-3 ${config.border} ${config.bg}`}>
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-medium text-gray-600">{fee.fee_type}</span>
          {isNA ? (
            <span className="text-xs text-gray-400 border border-gray-200 rounded-full px-2 py-0.5">N/A</span>
          ) : (
            <span className={`text-xs font-semibold rounded-full px-2 py-0.5 border ${config.text} ${config.border} ${config.bg}`}>
              {config.icon} {config.label}
            </span>
          )}
        </div>
        <div className="grid grid-cols-3 gap-2 text-center mb-2">
          <div>
            <p className="text-xs text-gray-400">Total</p>
            <p className="text-xs font-semibold text-gray-600">₹{fee.total_amount.toLocaleString()}</p>
          </div>
          <div className="border-x border-gray-200">
            <p className="text-xs text-gray-400">Paid</p>
            <p className="text-xs font-semibold text-teal-600">₹{fee.paid_amount.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Balance</p>
            <p className={`text-xs font-semibold ${balance > 0 ? 'text-red-500' : 'text-gray-400'}`}>
              ₹{balance.toLocaleString()}
            </p>
          </div>
        </div>
        {!isNA && (
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div
              className={`h-1.5 rounded-full transition-all duration-500
                ${status === 'paid' ? 'bg-teal-500' : status === 'partial' ? 'bg-yellow-400' : 'bg-red-400'}`}
              style={{ width: `${percent}%` }}
            />
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">

      {/* Header */}
      <div className="flex justify-between items-center px-4 py-3 border-b border-gray-100">
        <button
          onClick={onClose}
          className="text-xs text-white hover:text-white flex items-center gap-1 transition-colors bg-gray-600 hover:bg-gray-700  px-2 py-1 rounded-md border border-gray-400">
          ← Back
        </button>
        <button
          onClick={() => onGoToPayment({
            id: student.student_id,
            name: student.name,
            admission_no: student.admission_no,
            standard: student.standard,
          })}
          className="text-xs bg-teal-600 text-white px-3 py-1.5 rounded-lg hover:bg-teal-700 transition-colors font-medium">
          + Record Payment
        </button>
      </div>

      {/* Student Info */}
      <div className="px-4 py-3 border-b border-gray-100">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-base font-bold text-gray-700">{student.name}</h2>
            <p className="text-xs text-gray-400 mt-0.5">Adm: {student.admission_no} · {student.standard}</p>
          </div>
          <span className={`text-xs font-semibold rounded-full px-3 py-1 border
            ${overallConfig.text} ${overallConfig.border} ${overallConfig.bg}`}>
            {overallConfig.icon} {overallConfig.label}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-gray-100 text-center">
          <div>
            <p className="text-xs text-gray-400">Total Fees</p>
            <p className="text-sm font-bold text-gray-600">₹{student.totalAmount.toLocaleString()}</p>
          </div>
          <div className="border-x border-gray-100">
            <p className="text-xs text-gray-400">Paid</p>
            <p className="text-sm font-bold text-teal-600">₹{student.totalPaid.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Balance</p>
            <p className={`text-sm font-bold ${student.totalBalance > 0 ? 'text-red-500' : 'text-gray-400'}`}>
              ₹{student.totalBalance.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="mt-3">
          <div className="w-full bg-gray-100 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-700
                ${student.status === 'paid' ? 'bg-teal-500' : student.status === 'partial' ? 'bg-yellow-400' : 'bg-red-400'}`}
              style={{ width: student.totalAmount === 0 ? '0%' : `${Math.min((student.totalPaid / student.totalAmount) * 100, 100)}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-1 text-right">
            {student.totalAmount === 0 ? '0' : ((student.totalPaid / student.totalAmount) * 100).toFixed(0)}% paid
          </p>
        </div>
      </div>

      {/* Fee Rows */}
      <div className="p-4 space-y-4">

        {/* Fixed Fees */}
        {fixedFees.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Fixed Fees</p>
            <div className="space-y-2">
              {fixedFees.map(fee => <FeeRowCard key={fee.id} fee={fee} />)}
            </div>
          </div>
        )}

        {/* Tuition Fees */}
        {tuitionFees.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Tuition Fees</p>
            <div className="space-y-2">
              {tuitionFees.map(fee => <FeeRowCard key={fee.id} fee={fee} />)}
            </div>
          </div>
        )}

        {/* Vehicle Fees */}
        {vehicleFees.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
              Vehicle Fees
            </p>
            <div className="space-y-2">
              {vehicleFees.map(fee => <FeeRowCard key={fee.id} fee={fee} />)}
            </div>
          </div>
        )}

        {/* Empty state */}
        {student.fees.length === 0 && (
          <p className="text-center text-sm text-gray-400 py-8">
            No fee records found for this student.
          </p>
        )}
      </div>
    </div>
  )
}