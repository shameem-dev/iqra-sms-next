  'use client'

  import { useState } from 'react'
  import { FeeRowUI } from '@/type/fees'
  import { getStatusConfig, getFeeStatus, VEHICLE_FEE_TYPES } from '@/utils/actions/feeConstants'
  import { Bus, Plus, Pencil, Trash2, Save, CheckCircle2 } from 'lucide-react'

  interface Props {
    vehicleFees: FeeRowUI[]
    onAdd: (feeType: string, totalAmount: number) => Promise<void>
    onDelete: (feeRowId: number) => Promise<void>
    onEdit: (feeRowId: number, newTotalAmount: number) => Promise<void>
  }

  export default function VehicleFeeSection({ vehicleFees, onAdd, onDelete, onEdit }: Props) {
    const [addingTerm, setAddingTerm]     = useState<string | null>(null)
    const [addAmount, setAddAmount]       = useState(0)
    const [editingId, setEditingId]       = useState<number | null>(null)
    const [editAmount, setEditAmount]     = useState(0)
    const [saving, setSaving]             = useState(false)
    const [deleting, setDeleting]         = useState<number | null>(null)

    const existingTypes  = vehicleFees.map(f => f.fee_type)
    const nextTerm       = VEHICLE_FEE_TYPES.find(t => !existingTypes.includes(t))
    const canAddMore     = !!nextTerm && vehicleFees.length < 10

    const totalAmount  = vehicleFees.reduce((s, f) => s + f.total_amount, 0)
    const totalPaid    = vehicleFees.reduce((s, f) => s + f.paid_amount,  0)
    const totalBalance = totalAmount - totalPaid
    const overallStatus = getFeeStatus(totalPaid, totalAmount)
    const overallConfig = getStatusConfig(overallStatus)
    const collectPct    = totalAmount === 0 ? 0 : Math.min((totalPaid / totalAmount) * 100, 100)

    async function handleAdd() {
      if (!nextTerm) return
      setSaving(true)
      await onAdd(nextTerm, addAmount)
      setAddingTerm(null)
      setAddAmount(0)
      setSaving(false)
    }

    async function handleEdit(feeId: number) {
      setSaving(true)
      await onEdit(feeId, editAmount)
      setEditingId(null)
      setSaving(false)
    }

    async function handleDelete(fee: FeeRowUI) {
      if (!confirm(`Delete "${fee.fee_type}"? This cannot be undone.`)) return
      setDeleting(fee.id)
      await onDelete(fee.id)
      setDeleting(null)
    }

    return (
      <div className="bg-white border border-gray-200 rounded-xl p-4">

        {/* ── Section Header ── */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-2">
            <Bus size={18} className="text-gray-600" />
            <div>
              <h3 className="text-sm font-bold text-gray-600">Vehicle Fees</h3>
              <p className="text-xs text-gray-400 mt-0.5">
                {vehicleFees.length} of 10 terms added
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {vehicleFees.length > 0 && (
              <span className={`text-xs font-semibold rounded-full px-2 py-0.5 border
                ${overallConfig.text} ${overallConfig.border} ${overallConfig.bg}`}>
                {overallConfig.icon} {overallConfig.label}
              </span>
            )}
            {canAddMore && !addingTerm && (
              <button
                onClick={() => { setAddingTerm(nextTerm!); setAddAmount(0) }}
                className="flex items-center gap-1 text-xs px-3 py-1 rounded-full border border-dashed border-teal-400 text-teal-500 hover:bg-teal-50 transition-all">
                
                  <Plus size={14} />
                  Add Term

              </button>
            )}
          </div>
        </div>

        {/* ── Overall Summary Bar (only if fees exist) ── */}
        {vehicleFees.length > 0 && (
          <div className="grid grid-cols-3 gap-2 mb-4 pb-4 border-b border-gray-100 text-center">
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Total</p>
              <p className="text-sm font-bold text-gray-600">₹{totalAmount.toLocaleString()}</p>
            </div>
            <div className="border-x border-gray-100">
              <p className="text-xs text-gray-400 mb-0.5">Paid</p>
              <p className="text-sm font-bold text-teal-600">₹{totalPaid.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Balance</p>
              <p className={`text-sm font-bold ${totalBalance > 0 ? 'text-red-500' : 'text-gray-400'}`}>
                ₹{totalBalance.toLocaleString()}
              </p>
            </div>
          </div>
        )}

        {/* ── Empty State ── */}
        {vehicleFees.length === 0 && !addingTerm && (
          <div className="text-center py-6 border-2 border-dashed border-gray-200 rounded-xl">
            <div className="flex justify-center mb-2">
  <Bus size={28} className="text-gray-400" />
</div>
            <p className="text-xs text-gray-400">No vehicle fees added yet</p>
            <button
              onClick={() => { setAddingTerm(nextTerm!); setAddAmount(0) }}
              className="mt-3 flex items-center gap-1 mx-auto text-xs px-4 py-1.5 rounded-full border border-dashed border-teal-400 text-teal-500 hover:bg-teal-50 transition-all">
              
              <Plus size={14} />
              Add Term 1
            </button>
          </div>
        )}

        {/* ── Term Rows ── */}
        <div className="space-y-2">
          {vehicleFees.map(fee => {
            const balance = fee.total_amount - fee.paid_amount
            const status  = getFeeStatus(fee.paid_amount, fee.total_amount)
            const config  = getStatusConfig(status)
            const pct     = fee.total_amount === 0 ? 0 : Math.min((fee.paid_amount / fee.total_amount) * 100, 100)
            const isEditing = editingId === fee.id

            return (
              <div key={fee.id} className={`border rounded-xl p-3 ${config.border} ${config.bg}`}>

                {/* Row Header */}
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-semibold text-gray-600">{fee.fee_type}</span>
                  <div className="flex items-center gap-1.5">
                    <span className={`text-xs font-semibold rounded-full px-2 py-0.5 border
                      ${config.text} ${config.border} ${config.bg}`}>
                      {config.icon} {config.label}
                    </span>
                    {!isEditing && (
                      <>
                        <button
                          onClick={() => { setEditingId(fee.id); setEditAmount(fee.total_amount) }}
                          className="w-6 h-6 flex items-center justify-center rounded-full bg-white border border-gray-200
                            text-gray-400 hover:text-teal-600 hover:border-teal-300 text-xs shadow-sm"
                          title="Edit amount">
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(fee)}
                          disabled={deleting === fee.id}
                          className="w-6 h-6 flex items-center justify-center rounded-full bg-white border border-gray-200
                            text-gray-400 hover:text-red-500 hover:border-red-300 text-xs shadow-sm disabled:opacity-50"
                          title="Delete term">
                          {deleting === fee.id ? '...' : <Trash2 size={14} />}
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Edit Mode */}
                {isEditing ? (
                  <div className="mt-2">
                    <p className="text-xs text-gray-400 mb-2">Edit total amount for {fee.fee_type}</p>
                    <div className="flex gap-2 items-center">
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
                        <input
                          type="number"
                          min={fee.paid_amount}
                          value={editAmount}
                          onChange={e => setEditAmount(parseInt(e.target.value) || 0)}
                          className="w-full border border-teal-400 rounded-lg pl-7 pr-3 py-2 text-sm
                            focus:outline-none text-gray-600"
                          autoFocus
                        />
                      </div>
                      <button
                        onClick={() => handleEdit(fee.id)}
                        disabled={saving}
                        className="bg-teal-600 text-white px-3 py-2 rounded-lg text-xs font-medium
                          hover:bg-teal-700 disabled:opacity-50">
                        {saving ? (
  '...'
) : (
  <span className="flex items-center gap-1">
    <Save size={14} />
    Save
  </span>
)}
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="border border-gray-300 text-gray-500 px-3 py-2 rounded-lg text-xs font-medium hover:bg-gray-50">
                        Cancel
                      </button>
                    </div>
                    {fee.paid_amount > 0 && (
                      <p className="text-xs text-yellow-600 mt-1">
                        Min: ₹{fee.paid_amount.toLocaleString()} (already paid)
                      </p>
                    )}
                  </div>
                ) : (
                  <>
                    {/* Amounts */}
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

                    {/* Progress */}
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full transition-all duration-500
                          ${status === 'paid' ? 'bg-teal-500' : status === 'partial' ? 'bg-yellow-400' : 'bg-red-400'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-1 text-right">{pct.toFixed(0)}%</p>
                  </>
                )}
              </div>
            )
          })}

          {/* ── Add New Term Form ── */}
          {addingTerm && (
            <div className="border-2 border-dashed border-teal-300 rounded-xl p-4 bg-teal-50">
              <div className="flex justify-between items-center mb-3">
                <h4 className="text-sm font-semibold text-gray-600">
                  {addingTerm}
                  <span className="ml-2 text-xs text-teal-500 font-normal">(new)</span>
                </h4>
              </div>
              <div className="mb-4">
                <label className="block text-xs text-gray-500 mb-1">Total Amount for this term</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
                  <input
                    type="number"
                    min={0}
                    value={addAmount}
                    onChange={e => setAddAmount(parseInt(e.target.value) || 0)}
                    placeholder="Enter amount"
                    className="w-full border border-gray-300 rounded-lg pl-7 pr-3 py-2 text-sm
                      focus:outline-none focus:border-teal-400 bg-white"
                    autoFocus
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Amount can be set per student individually
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleAdd}
                  disabled={saving || addAmount <= 0}
                  className="flex-1 bg-teal-600 text-white py-2 rounded-lg text-sm font-medium
                    hover:bg-teal-700 disabled:opacity-50">
                  {saving ? (
  'Saving...'
) : (
  <span className="flex items-center justify-center gap-1">
    <Save size={14} />
    Save
  </span>
)}
                </button>
                <button
                  onClick={() => { setAddingTerm(null); setAddAmount(0) }}
                  className="flex-1 border border-gray-300 text-gray-500 py-2 rounded-lg text-sm font-medium hover:bg-gray-50">
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Overall Progress Bar (only if fees exist) ── */}
        {vehicleFees.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex justify-between items-center mb-1">
              <p className="text-xs text-gray-400">Overall Vehicle Fee Progress</p>
              <p className="text-xs font-semibold text-teal-600">{collectPct.toFixed(0)}%</p>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-700
                  ${overallStatus === 'paid' ? 'bg-teal-500' : overallStatus === 'partial' ? 'bg-yellow-400' : 'bg-red-400'}`}
                style={{ width: `${collectPct}%` }}
              />
            </div>
            {vehicleFees.length < 10 && (
              <p className="text-xs text-gray-400 mt-1">
                {10 - vehicleFees.length} term{10 - vehicleFees.length !== 1 ? 's' : ''} remaining to add
              </p>
            )}
            {vehicleFees.length === 10 && (
              <p className="text-xs text-teal-500 mt-1 font-medium flex items-center gap-1">
  <CheckCircle2 size={14} />
  All 10 terms added
</p>
            )}
          </div>
        )}
      </div>
    )
  }