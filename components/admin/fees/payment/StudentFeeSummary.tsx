'use client'

import { FeeRowUI } from '@/type/fees'
import FeeCard from './FeeCard'
import TuitionFeeSection from './TuitionFeeSection'
import VehicleFeeSection from './VehicleFeeSection'
import { getStatusConfig, getFeeStatus } from '@/utils/actions/feeConstants'

interface Student {
  id: number
  name: string
  admission_no: string
  standard: string
}

interface Props {
  student: Student
  fixedFees: FeeRowUI[]
  tuitionFees: FeeRowUI[]
  vehicleFees: FeeRowUI[]
  onAddTuition: (feeType: string, totalAmount: number) => Promise<void>
  onDeleteTuition: (feeRowId: number, feeType: string) => Promise<void>
  onEditFee: (feeId: number, newTotalAmount: number) => Promise<void>
  onAddVehicle: (feeType: string, totalAmount: number) => Promise<void>
  onDeleteVehicle: (feeRowId: number) => Promise<void>
  onEditVehicle: (feeRowId: number, newTotalAmount: number) => Promise<void>
  onRecordPayment: () => void
  showPaymentForm: boolean
}

const FIXED_FEE_ORDER = ['Admission Fee', 'Welfare Fee', 'Book Fee', 'Exam Fee', 'Others']

export default function StudentFeeSummary({
  student, fixedFees, tuitionFees, vehicleFees,
  onAddTuition, onDeleteTuition, onEditFee,
  onAddVehicle, onDeleteVehicle, onEditVehicle,
  onRecordPayment, showPaymentForm,
}: Props) {
  const allFees    = [...fixedFees, ...tuitionFees, ...vehicleFees]
  const grandTotal   = allFees.reduce((sum, f) => sum + f.total_amount, 0)
  const grandPaid    = allFees.reduce((sum, f) => sum + f.paid_amount,  0)
  const grandBalance = grandTotal - grandPaid
  const overallStatus = getFeeStatus(grandPaid, grandTotal)
  const overallConfig = getStatusConfig(overallStatus)

  const sortedFixedFees = FIXED_FEE_ORDER
    .map(ft => fixedFees.find(f => f.fee_type === ft))
    .filter(Boolean) as FeeRowUI[]

  return (
    <div className="space-y-4">

      {/* ── Student Header ── */}
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-lg font-bold text-gray-700">{student.name}</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Adm No: {student.admission_no} · {student.standard}
            </p>
          </div>
          <span className={`text-xs font-semibold rounded-full px-3 py-1 border
            ${overallConfig.text} ${overallConfig.border} ${overallConfig.bg}`}>
            {overallConfig.icon} {overallConfig.label}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-gray-100">
          <div className="text-center">
            <p className="text-xs text-gray-400 mb-0.5">Total Fees</p>
            <p className="text-base font-bold text-gray-600">₹{grandTotal.toLocaleString()}</p>
          </div>
          <div className="text-center border-x border-gray-100">
            <p className="text-xs text-gray-400 mb-0.5">Total Paid</p>
            <p className="text-base font-bold text-teal-600">₹{grandPaid.toLocaleString()}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-400 mb-0.5">Balance Due</p>
            <p className={`text-base font-bold ${grandBalance > 0 ? 'text-red-500' : 'text-gray-400'}`}>
              ₹{grandBalance.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* ── Fixed Fees ── */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 px-1">Fixed Fees</p>
        <div className="grid grid-cols-1 gap-3">
          {sortedFixedFees.map(fee => (
            <FeeCard key={fee.id} fee={fee} onEdit={onEditFee} />
          ))}
        </div>
      </div>

      {/* ── Tuition Fees ── */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 px-1">Tuition Fees</p>
        <TuitionFeeSection
          tuitionFees={tuitionFees}
          studentStandard={student.standard}
          onAdd={onAddTuition}
          onDelete={onDeleteTuition}
        />
      </div>

      {/* ── Vehicle Fees ── */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 px-1">Vehicle Fees</p>
        <VehicleFeeSection
          vehicleFees={vehicleFees}
          onAdd={onAddVehicle}
          onDelete={onDeleteVehicle}
          onEdit={onEditVehicle}
        />
      </div>

      {/* ── Grand Total ── */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-bold text-gray-600">Grand Total</h3>
          <span className={`text-xs font-semibold rounded-full px-2 py-0.5 border
            ${overallConfig.text} ${overallConfig.border} ${overallConfig.bg}`}>
            {overallConfig.icon} {overallConfig.label}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-3 mt-3">
          <div className="text-center">
            <p className="text-xs text-gray-400 mb-0.5">Total</p>
            <p className="text-sm font-bold text-gray-600">₹{grandTotal.toLocaleString()}</p>
          </div>
          <div className="text-center border-x border-gray-200">
            <p className="text-xs text-gray-400 mb-0.5">Paid</p>
            <p className="text-sm font-bold text-teal-600">₹{grandPaid.toLocaleString()}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-400 mb-0.5">Balance</p>
            <p className={`text-sm font-bold ${grandBalance > 0 ? 'text-red-500' : 'text-gray-400'}`}>
              ₹{grandBalance.toLocaleString()}
            </p>
          </div>
        </div>
        <div className="mt-4">
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className={`h-2.5 rounded-full transition-all duration-500
                ${overallStatus === 'paid' ? 'bg-teal-500' : overallStatus === 'partial' ? 'bg-yellow-400' : 'bg-red-400'}`}
              style={{ width: grandTotal === 0 ? '0%' : `${Math.min((grandPaid / grandTotal) * 100, 100)}%` }}
            />
          </div>
          <div className="flex justify-between mt-1">
            <p className="text-xs text-gray-400">
              {grandTotal === 0 ? '0' : ((grandPaid / grandTotal) * 100).toFixed(0)}% paid
            </p>
            {grandBalance > 0 && (
              <p className="text-xs text-red-400">₹{grandBalance.toLocaleString()} remaining</p>
            )}
          </div>
        </div>
      </div>

      {grandBalance > 0 && !showPaymentForm && (
        <button
          onClick={onRecordPayment}
          className="w-full bg-teal-600 text-white py-3 rounded-xl text-sm font-semibold hover:bg-teal-700 transition-all">
          + Record New Payment
        </button>
      )}

      {grandBalance === 0 && grandTotal > 0 && (
        <div className="text-center py-4 bg-teal-50 border border-teal-200 rounded-xl">
          <p className="text-teal-600 font-semibold text-sm"> All fees paid!</p>
          <p className="text-xs text-teal-400 mt-0.5">No outstanding balance</p>
        </div>
      )}
    </div>
  )
}