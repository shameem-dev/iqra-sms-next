'use client'

import { FS_STANDARDS, GRADE_STANDARDS } from '@/utils/actions/feeConstants'
import { ClipboardList, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react'

type StatusFilter = 'all' | 'paid' | 'partial' | 'pending'

interface Props {
  selectedStandard: string
  onSelectStandard: (standard: string) => void
  statusFilter: StatusFilter
  onSelectStatus: (status: StatusFilter) => void
  feeTypeFilter: string
  onSelectFeeType: (feeType: string) => void
  search: string
  onSearch: (value: string) => void
}

const STATUS_OPTIONS: { value: StatusFilter; label: string; Icon: React.ElementType; color: string }[] = [
  { value: 'all',     label: 'All',     Icon: ClipboardList, color: 'bg-gray-100 text-gray-600 border-gray-200 hover:border-gray-400' },
  { value: 'paid',    label: 'Paid',    Icon: CheckCircle2,  color: 'bg-teal-50 text-teal-600 border-teal-200 hover:border-teal-400' },
  { value: 'partial', label: 'Partial', Icon: AlertTriangle, color: 'bg-yellow-50 text-yellow-600 border-yellow-200 hover:border-yellow-400' },
  { value: 'pending', label: 'Pending', Icon: XCircle,       color: 'bg-red-50 text-red-500 border-red-200 hover:border-red-400' },
]

const ACTIVE_STATUS_COLOR: Record<string, string> = {
  all:     'bg-gray-700 text-white border-gray-700',
  paid:    'bg-teal-600 text-white border-teal-600',
  partial: 'bg-yellow-500 text-white border-yellow-500',
  pending: 'bg-red-500 text-white border-red-500',
}

const FIXED_FEE_TYPES   = ['Admission Fee', 'Welfare Fee', 'Book Fee', 'Exam Fee', 'Others']
const TUITION_FEE_TYPES = ['Tuition Fee 1', 'Tuition Fee 2', 'Tuition Fee 3', 'Tuition Fee 4']
const VEHICLE_FEE_TYPES = [
  'Vehicle Fee Term 1', 'Vehicle Fee Term 2', 'Vehicle Fee Term 3',
  'Vehicle Fee Term 4', 'Vehicle Fee Term 5', 'Vehicle Fee Term 6',
  'Vehicle Fee Term 7', 'Vehicle Fee Term 8', 'Vehicle Fee Term 9',
  'Vehicle Fee Term 10',
]

export default function FeeFilters({
  selectedStandard, onSelectStandard,
  statusFilter, onSelectStatus,
  feeTypeFilter, onSelectFeeType,
  search, onSearch,
}: Props) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-5">

      {/* Search */}
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm select-none">🔍</span>
        <input
          type="text"
          value={search}
          onChange={e => onSearch(e.target.value)}
          placeholder="Search name or adm no..."
          className="w-full border border-gray-300 rounded-xl pl-9 pr-9 py-2.5 text-sm text-gray-600
            focus:outline-none focus:border-teal-400 bg-white transition-colors"
        />
        {search && (
          <button
            onClick={() => onSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg leading-none">
            ×
          </button>
        )}
      </div>

      {/* Class Selector */}
      <div>
        <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">Class</label>
        <div className="space-y-2">
          <button
            onClick={() => onSelectStandard('')}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium border transition-all
              ${selectedStandard === ''
                ? 'bg-gray-700 text-white border-gray-700'
                : 'bg-gray-50 text-gray-500 border-gray-200 hover:border-gray-400'}`}>
            All Classes
          </button>
          <div>
            <p className="text-xs text-gray-400 px-1 mb-1">Foundation Stage</p>
            <div className="grid grid-cols-2 gap-1.5">
              {FS_STANDARDS.map(s => (
                <button key={s} onClick={() => onSelectStandard(s)}
                  className={`px-2 py-1.5 rounded-lg text-xs font-medium border transition-all text-center
                    ${selectedStandard === s
                      ? 'bg-teal-600 text-white border-teal-600'
                      : 'bg-gray-50 text-gray-500 border-gray-200 hover:border-teal-300 hover:text-teal-600'}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs text-gray-400 px-1 mb-1">Grade</p>
            <div className="grid grid-cols-2 gap-1.5">
              {GRADE_STANDARDS.map(s => (
                <button key={s} onClick={() => onSelectStandard(s)}
                  className={`px-2 py-1.5 rounded-lg text-xs font-medium border transition-all text-center
                    ${selectedStandard === s
                      ? 'bg-teal-600 text-white border-teal-600'
                      : 'bg-gray-50 text-gray-500 border-gray-200 hover:border-teal-300 hover:text-teal-600'}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-100" />

      {/* Fee Type Filter */}
      <div>
        <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">Fee Type</label>
        <div className="space-y-1.5">
          <button
            onClick={() => onSelectFeeType('')}
            className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium border transition-all
              ${feeTypeFilter === ''
                ? 'bg-gray-700 text-white border-gray-700'
                : 'bg-gray-50 text-gray-500 border-gray-200 hover:border-gray-400'}`}>
            All Fee Types
          </button>

          <p className="text-xs text-gray-400 px-1 pt-1">Fixed Fees</p>
          {FIXED_FEE_TYPES.map(ft => (
            <button key={ft} onClick={() => onSelectFeeType(ft)}
              className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium border transition-all
                ${feeTypeFilter === ft
                  ? 'bg-teal-600 text-white border-teal-600'
                  : 'bg-gray-50 text-gray-500 border-gray-200 hover:border-teal-300 hover:text-teal-600'}`}>
              {ft}
            </button>
          ))}

          <p className="text-xs text-gray-400 px-1 pt-1">Tuition Fees</p>
          {TUITION_FEE_TYPES.map(ft => (
            <button key={ft} onClick={() => onSelectFeeType(ft)}
              className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium border transition-all
                ${feeTypeFilter === ft
                  ? 'bg-teal-600 text-white border-teal-600'
                  : 'bg-gray-50 text-gray-500 border-gray-200 hover:border-teal-300 hover:text-teal-600'}`}>
              {ft}
            </button>
          ))}

          <p className="text-xs text-gray-400 px-1 pt-1">Vehicle Fees</p>
          {VEHICLE_FEE_TYPES.map(ft => (
            <button key={ft} onClick={() => onSelectFeeType(ft)}
              className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium border transition-all
                ${feeTypeFilter === ft
                  ? 'bg-teal-600 text-white border-teal-600'
                  : 'bg-gray-50 text-gray-500 border-gray-200 hover:border-teal-300 hover:text-teal-600'}`}>
              {ft}
            </button>
          ))}
        </div>
      </div>

      <div className="border-t border-gray-100" />

      {/* Payment Status */}
      <div>
        <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">Payment Status</label>
        <div className="grid grid-cols-2 gap-1.5">
          {STATUS_OPTIONS.map(({ value, label, Icon, color }) => (
            <button key={value} onClick={() => onSelectStatus(value)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition-all
                ${statusFilter === value ? ACTIVE_STATUS_COLOR[value] : color}`}>
              <Icon size={13} strokeWidth={2.2} />
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}