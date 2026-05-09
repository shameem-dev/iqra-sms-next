'use client'

import { useState } from 'react'
import { FeeRowUI, PaymentDetail } from '@/type/fees'

interface Props {
  unpaidFees: FeeRowUI[]
  onSave: (details: PaymentDetail[], receiptNo: string, date: string) => Promise<void>
  onCancel: () => void
  receiptNo: string
}

export default function PaymentForm({ unpaidFees, onSave, onCancel, receiptNo }: Props) {
  const [selectedFees, setSelectedFees] = useState<Record<string, boolean>>({})
  const [payAmounts, setPayAmounts] = useState<Record<string, number>>(
    () => {
      const init: Record<string, number> = {}
      unpaidFees.forEach(fee => { init[fee.fee_type] = fee.balance })
      return init
    }
  )
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function toggleFee(feeType: string) {
    setSelectedFees(prev => ({ ...prev, [feeType]: !prev[feeType] }))
  }

  function handleAmountChange(feeType: string, value: string) {
    setPayAmounts(prev => ({ ...prev, [feeType]: parseInt(value) || 0 }))
  }

  const totalPayingNow = unpaidFees
    .filter(f => selectedFees[f.fee_type])
    .reduce((sum, f) => sum + (payAmounts[f.fee_type] || 0), 0)

  async function handleSubmit() {
    setError('')
    const selected = unpaidFees.filter(f => selectedFees[f.fee_type])
    if (selected.length === 0) { setError('Please select at least one fee.'); return }
    for (const fee of selected) {
      const amt = payAmounts[fee.fee_type] || 0
      if (amt <= 0) { setError(`Enter valid amount for ${fee.label}.`); return }
      if (amt > fee.balance) { setError(`Amount for ${fee.label} exceeds balance ₹${fee.balance}.`); return }
    }
    setSaving(true)
    const details: PaymentDetail[] = selected.map(fee => ({
      fee_type: fee.fee_type,
      label: fee.label,
      amount: payAmounts[fee.fee_type] || 0,
    }))
    await onSave(details, receiptNo, paymentDate)
    setSaving(false)
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 mt-4">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-sm font-bold text-gray-600">Record Payment</h3>
          <p className="text-xs text-gray-400 mt-0.5">Receipt No: {receiptNo}</p>
        </div>
      </div>
      <div className="mb-4">
        <label className="block text-xs text-gray-500 mb-1">Payment Date</label>
        <input type="date" value={paymentDate}
          onChange={e => setPaymentDate(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-400 text-gray-600" />
      </div>
      <div className="mb-4">
        <p className="text-xs text-gray-500 mb-2">Select fees to pay:</p>
        <div className="space-y-2">
          {unpaidFees.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-4">No pending fees.</p>
          ) : (
            unpaidFees.map(fee => (
              <div key={fee.fee_type}
                className={`border rounded-xl p-3 transition-all
                  ${selectedFees[fee.fee_type] ? 'border-teal-400 bg-teal-50' : 'border-gray-200 bg-white'}`}>
                <div className="flex items-center gap-3">
                  <input type="checkbox" checked={!!selectedFees[fee.fee_type]}
                    onChange={() => toggleFee(fee.fee_type)}
                    className="w-4 h-4 accent-teal-600 cursor-pointer" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600">{fee.label}</p>
                    <p className="text-xs text-gray-400">Balance: ₹{fee.balance.toLocaleString()}</p>
                  </div>
                  {selectedFees[fee.fee_type] && (
                    <div className="relative w-32">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
                      <input type="number" min={1} max={fee.balance}
                        value={payAmounts[fee.fee_type] || ''}
                        onChange={e => handleAmountChange(fee.fee_type, e.target.value)}
                        className="w-full border border-teal-300 rounded-lg pl-7 pr-2 py-1.5 text-sm focus:outline-none text-gray-600" />
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      <div className="border-t border-gray-100 pt-3 mb-4">
        <div className="flex justify-between items-center">
          <p className="text-sm font-semibold text-gray-600">Total Paying Now</p>
          <p className="text-lg font-bold text-teal-600">₹{totalPayingNow.toLocaleString()}</p>
        </div>
      </div>
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-500 text-xs px-3 py-2 rounded-lg mb-3">{error}</div>
      )}
      <div className="flex gap-3">
        <button onClick={handleSubmit} disabled={saving || totalPayingNow === 0}
          className="flex-1 bg-teal-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-teal-700 disabled:opacity-50">
          {saving ? 'Saving...' : `Save ₹${totalPayingNow.toLocaleString()}`}
        </button>
        <button onClick={onCancel}
          className="flex-1 border border-gray-300 text-gray-500 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50">
          Cancel
        </button>
      </div>
    </div>
  )
}