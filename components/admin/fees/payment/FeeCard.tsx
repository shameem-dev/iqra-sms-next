'use client'

import { useState } from 'react'
import { FeeRowUI } from '@/type/fees'
import { getStatusConfig } from '@/utils/actions/feeConstants'
import { SquarePen, AlertCircle } from 'lucide-react'

interface Props {
  fee: FeeRowUI
  onEdit?: (feeId: number, newTotalAmount: number) => Promise<void>
}

export default function FeeCard({ fee, onEdit }: Props) {
  const [editMode, setEditMode] = useState(false)
  const [editAmount, setEditAmount] = useState(fee.total_amount)
  const [saving, setSaving] = useState(false)

  const status =
    fee.total_amount === 0 ? 'paid'
    : fee.paid_amount >= fee.total_amount ? 'paid'
    : fee.paid_amount > 0 ? 'partial'
    : 'pending'

  const config = getStatusConfig(status)
  const percent = fee.total_amount === 0
    ? 0
    : Math.min((fee.paid_amount / fee.total_amount) * 100, 100)
  const isNA = fee.total_amount === 0

  async function handleSaveEdit() {
    if (!onEdit) return
    if (editAmount < fee.paid_amount) {
      alert(`Total cannot be less than already paid ₹${fee.paid_amount}`)
      return
    }
    setSaving(true)
    await onEdit(fee.id, editAmount)
    setEditMode(false)
    setSaving(false)
  }

  return (
    <div className={`border rounded-xl p-4 ${config.border} ${config.bg}`}>
      {/* Header */}
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-semibold text-gray-600">{fee.label}</h3>
        <div className="flex items-center gap-2">
          {isNA ? (
            <span className="text-xs text-gray-400 border border-gray-200 rounded-full px-2 py-0.5">N/A</span>
          ) : (
            <span className={`text-xs font-semibold rounded-full px-2 py-0.5 border ${config.text} ${config.border} ${config.bg}`}>
              {config.icon} {config.label}
            </span>
          )}
          {onEdit && !editMode && (
            <button
              onClick={() => { setEditAmount(fee.total_amount); setEditMode(true) }}
              className="w-6 h-6 flex items-center justify-center rounded-full bg-white border border-gray-200 text-gray-400 hover:text-teal-600 hover:border-teal-300 text-xs shadow-sm"
              title="Edit total amount"
            ><SquarePen size={12} /></button>
          )}
        </div>
      </div>

      {/* Edit Mode */}
      {editMode ? (
        <div className="mb-3">
          <p className="text-xs text-gray-400 mb-2">Edit total amount for {fee.label}</p>
          <div className="flex gap-2 items-center">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
              <input
                type="number"
                min={fee.paid_amount}
                value={editAmount}
                onChange={e => setEditAmount(parseInt(e.target.value) || 0)}
                className="w-full border border-teal-400 rounded-lg pl-7 pr-3 py-2 text-sm focus:outline-none text-gray-600"
                autoFocus
              />
            </div>
            <button onClick={handleSaveEdit} disabled={saving}
              className="bg-teal-600 text-white px-3 py-2 rounded-lg text-xs font-medium hover:bg-teal-700 disabled:opacity-50">
              {saving ? '...' : 'Save'}
            </button>
            <button onClick={() => setEditMode(false)}
              className="border border-gray-300 text-gray-500 px-3 py-2 rounded-lg text-xs font-medium hover:bg-gray-50">
              Cancel
            </button>
          </div>
          {fee.paid_amount > 0 && (
            <p className="text-xs text-yellow-600 mt-1 flex items-center gap-1">
              <AlertCircle size={11} />
              Min: ₹{fee.paid_amount.toLocaleString()} (already paid)
            </p>
          )}
        </div>
      ) : (
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
      )}

      {/* Progress Bar */}
      {!editMode && (
        isNA ? (
          <p className="text-xs text-gray-400 text-center">No amount set</p>
        ) : (
          <div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-500
                  ${status === 'paid' ? 'bg-teal-500' : status === 'partial' ? 'bg-yellow-400' : 'bg-red-400'}`}
                style={{ width: `${percent}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1 text-right">{percent.toFixed(0)}%</p>
          </div>
        )
      )}
    </div>
  )
}