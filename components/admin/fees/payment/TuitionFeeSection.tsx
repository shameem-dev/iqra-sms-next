'use client'

import { useState } from 'react'
import { FeeRowUI } from '@/type/fees'
import { getStatusConfig, getDefaultAmount } from '@/utils/actions/feeConstants'
import { BookOpen, Plus, Trash2, Save } from 'lucide-react'

interface Props {
  tuitionFees: FeeRowUI[]
  studentStandard: string
  onAdd: (feeType: string, totalAmount: number) => Promise<void>
  onDelete: (feeRowId: number, feeType: string) => Promise<void>
}

const TUITION_TYPES = ['Tuition Fee 1', 'Tuition Fee 2', 'Tuition Fee 3', 'Tuition Fee 4']

export default function TuitionFeeSection({ tuitionFees, studentStandard, onAdd, onDelete }: Props) {
  const [showAddInput, setShowAddInput] = useState(false)
  const [addAmount, setAddAmount] = useState(0)
  const [adding, setAdding] = useState(false)
  const [deleting, setDeleting] = useState<number | null>(null)

  const existingTypes = tuitionFees.map(f => f.fee_type)
  const nextType = TUITION_TYPES.find(t => !existingTypes.includes(t))
  const canAddMore = !!nextType && tuitionFees.length < 4

  function handleShowAdd() {
    const defaultAmt = nextType ? getDefaultAmount(nextType, studentStandard) : 0
    setAddAmount(defaultAmt)
    setShowAddInput(true)
  }

  async function handleSaveAdd() {
    if (!nextType) return
    setAdding(true)
    await onAdd(nextType, addAmount)
    setShowAddInput(false)
    setAdding(false)
  }

  async function handleDelete(fee: FeeRowUI) {
    if (!confirm(`Delete "${fee.label}"?`)) return
    setDeleting(fee.id)
    await onDelete(fee.id, fee.fee_type)
    setDeleting(null)
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-bold text-gray-600 flex items-center gap-2">
            <BookOpen size={16} />
            Tuition Fees
          </h3>
        {canAddMore && !showAddInput && (
          <button onClick={handleShowAdd}
            className="flex items-center gap-1 text-xs px-3 py-1 rounded-full border border-dashed border-teal-400 text-teal-500 hover:bg-teal-50 transition-all">
            
              <Plus size={14} />
              Add
            
          </button>
        )}
      </div>

      <div className="space-y-3">
        {tuitionFees.length === 0 && !showAddInput && (
          <p className="text-xs text-gray-400 text-center py-4">No tuition fees added yet.</p>
        )}

        {tuitionFees.map(fee => {
          const status = fee.total_amount === 0 ? 'paid'
            : fee.paid_amount >= fee.total_amount ? 'paid'
            : fee.paid_amount > 0 ? 'partial' : 'pending'
          const config = getStatusConfig(status)
          const percent = fee.total_amount === 0 ? 0
            : Math.min((fee.paid_amount / fee.total_amount) * 100, 100)

          return (
            <div key={fee.id} className={`border rounded-xl p-4 ${config.border} ${config.bg}`}>
              <div className="flex justify-between items-center mb-3">
                <h4 className="text-sm font-semibold text-gray-600">{fee.label}</h4>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-semibold rounded-full px-2 py-0.5 border ${config.text} ${config.border} ${config.bg}`}>
                    {config.icon} {config.label}
                  </span>
                  <button onClick={() => handleDelete(fee)} disabled={deleting === fee.id}
                    className="w-6 h-6 flex items-center justify-center rounded-full bg-white border border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-300 text-xs shadow-sm disabled:opacity-50">
                    {deleting === fee.id ? '...' : <Trash2 size={14} />}
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="text-center">
                  <p className="text-xs text-gray-400 mb-0.5">Total</p>
                  <p className="text-sm font-semibold text-gray-600">₹{fee.total_amount.toLocaleString()}</p>
                </div>
                <div className="text-center border-x border-gray-200">
                  <p className="text-xs text-gray-400 mb-0.5">Paid</p>
                  <p className="text-sm font-semibold text-teal-600">₹{fee.paid_amount.toLocaleString()}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-400 mb-0.5">Balance</p>
                  <p className={`text-sm font-semibold ${fee.balance > 0 ? 'text-red-500' : 'text-gray-400'}`}>
                    ₹{fee.balance.toLocaleString()}
                  </p>
                </div>
              </div>
              <div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className={`h-2 rounded-full transition-all duration-500
                    ${status === 'paid' ? 'bg-teal-500' : status === 'partial' ? 'bg-yellow-400' : 'bg-red-400'}`}
                    style={{ width: `${percent}%` }} />
                </div>
                <p className="text-xs text-gray-400 mt-1 text-right">{percent.toFixed(0)}%</p>
              </div>
            </div>
          )
        })}

        {showAddInput && nextType && (
          <div className="border-2 border-dashed border-teal-300 rounded-xl p-4 bg-teal-50">
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-sm font-semibold text-gray-600">
                {nextType} <span className="ml-2 text-xs text-teal-500 font-normal">(new)</span>
              </h4>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Total Amount</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
                  <input type="number" min={0} value={addAmount}
                    onChange={e => setAddAmount(parseInt(e.target.value) || 0)}
                    className="w-full border border-gray-300 rounded-lg pl-7 pr-3 py-2 text-sm focus:outline-none focus:border-teal-400" />
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Paid Amount</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
                  <input type="number" value={0} disabled
                    className="w-full border border-gray-200 rounded-lg pl-7 pr-3 py-2 text-sm bg-gray-50 text-gray-400" />
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={handleSaveAdd} disabled={adding}
                className="flex-1 bg-teal-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-teal-700 disabled:opacity-50">
                {adding ? (
  'Saving...'
) : (
  <span className="flex items-center justify-center gap-1">
    <Save size={14} />
    Save
  </span>
)}
              </button>
              <button onClick={() => setShowAddInput(false)}
                className="flex-1 border border-gray-300 text-gray-500 py-2 rounded-lg text-sm font-medium hover:bg-gray-50">
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {tuitionFees.length >= 4 && (
        <p className="text-xs text-gray-400 text-center mt-3">Maximum 4 tuition fees reached</p>
      )}
    </div>
  )
}