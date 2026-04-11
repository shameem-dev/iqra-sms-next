'use client'
import { useState } from 'react'

const feeTypes = [
  { key: 'admission', label: 'Admission Fee' },
  { key: 'welfare', label: 'Welfare Fee' },
  { key: 'book', label: 'Book Fee' },
  { key: 'exam', label: 'Exam Fee' },
  { key: 'tuition1', label: 'Tuition Fee 1' },
  { key: 'tuition2', label: 'Tuition Fee 2' },
  { key: 'tuition3', label: 'Tuition Fee 3' },
  { key: 'tuition4', label: 'Tuition Fee 4' },
  { key: 'others', label: 'Others' },
]

const defaultFees = Object.fromEntries(
  feeTypes.map(f => [f.key, { total: 0, paid: 0, payNow: 0 }])
)

export default function FeesModule() {
  const [admNo, setAdmNo] = useState('')
  const [studentName, setStudentName] = useState('')
  const [std, setStd] = useState('')
  const [fees, setFees] = useState(defaultFees)

  const updateFee = (key: string, field: string, value: number) => {
    setFees(prev => ({
      ...prev,
      [key]: { ...prev[key], [field]: value },
    }))
  }

  const getBalance = (key: string) => {
    const f = fees[key]
    return f.total - f.paid - f.payNow
  }

  const totals = {
    total: feeTypes.reduce((s, f) => s + fees[f.key].total, 0),
    paid: feeTypes.reduce((s, f) => s + fees[f.key].paid, 0),
    payNow: feeTypes.reduce((s, f) => s + fees[f.key].payNow, 0),
    balance: feeTypes.reduce((s, f) => s + getBalance(f.key), 0),
  }

  const handleSave = () => {
    if (!studentName) return alert('Please enter student name')
    setFees(prev => {
      const updated = { ...prev }
      feeTypes.forEach(f => {
        updated[f.key] = {
          ...updated[f.key],
          paid: updated[f.key].paid + updated[f.key].payNow,
          payNow: 0,
        }
      })
      return updated
    })
    alert('Payment saved!')
  }

  const handleClear = () => {
    setAdmNo('')
    setStudentName('')
    setStd('')
    setFees(defaultFees)
  }

  const handlePrint = () => {
    if (!studentName) return alert('Please enter student name')
    window.print()
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-5xl mx-auto bg-white rounded-xl shadow p-6">

        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-xl font-semibold text-gray-800">Fees Collection</h1>
          <span className="text-sm text-gray-500">
            {new Date().toLocaleDateString('en-IN', {
              day: '2-digit', month: 'short', year: 'numeric'
            })}
          </span>
        </div>

        {/* Student Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Admission No.</label>
            <input
              type="text"
              value={admNo}
              onChange={e => setAdmNo(e.target.value)}
              placeholder="e.g. 2024-001"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Name of Student</label>
            <input
              type="text"
              value={studentName}
              onChange={e => setStudentName(e.target.value)}
              placeholder="Full name"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Standard / Class</label>
            <select
              value={std}
              onChange={e => setStd(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select class</option>
              {['LKG','UKG','1','2','3','4','5','6','7','8','9','10'].map(c => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Fees Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left px-3 py-2 border border-gray-200 text-xs text-gray-500 font-medium">Fee Type</th>
                <th className="text-left px-3 py-2 border border-gray-200 text-xs text-gray-500 font-medium">Total (₹)</th>
                <th className="text-left px-3 py-2 border border-gray-200 text-xs text-gray-500 font-medium">Paid (₹)</th>
                <th className="text-left px-3 py-2 border border-gray-200 text-xs text-gray-500 font-medium">Balance (₹)</th>
                <th className="text-left px-3 py-2 border border-gray-200 text-xs text-gray-500 font-medium">Pay Now (₹)</th>
              </tr>
            </thead>
            <tbody>
              {feeTypes.map(f => {
                const bal = getBalance(f.key)
                return (
                  <tr key={f.key} className="hover:bg-gray-50">
                    <td className="px-3 py-2 border border-gray-200 text-gray-700">
                      {f.label}
                    </td>
                    <td className="px-3 py-2 border border-gray-200">
                      <input
                        type="number"
                        min={0}
                        value={fees[f.key].total || ''}
                        onChange={e => updateFee(f.key, 'total', parseFloat(e.target.value) || 0)}
                        className="w-full border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                      />
                    </td>
                    <td className="px-3 py-2 border border-gray-200">
                      <input
                        type="number"
                        min={0}
                        value={fees[f.key].paid || ''}
                        readOnly
                        className="w-full border border-gray-100 rounded px-2 py-1 text-sm bg-gray-50 text-gray-500"
                      />
                    </td>
                    <td className="px-3 py-2 border border-gray-200">
                      <span className={`font-medium ${bal > 0 ? 'text-red-500' : 'text-green-600'}`}>
                        ₹{bal.toLocaleString('en-IN')}
                      </span>
                    </td>
                    <td className="px-3 py-2 border border-gray-200">
                      <input
                        type="number"
                        min={0}
                        value={fees[f.key].payNow || ''}
                        onChange={e => updateFee(f.key, 'payNow', parseFloat(e.target.value) || 0)}
                        placeholder="0"
                        className="w-full border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                      />
                    </td>
                  </tr>
                )
              })}

              {/* Totals Row */}
              <tr className="bg-gray-50 font-medium">
                <td className="px-3 py-2 border border-gray-200 text-gray-800">Total</td>
                <td className="px-3 py-2 border border-gray-200 text-gray-800">
                  ₹{totals.total.toLocaleString('en-IN')}
                </td>
                <td className="px-3 py-2 border border-gray-200 text-gray-800">
                  ₹{totals.paid.toLocaleString('en-IN')}
                </td>
                <td className="px-3 py-2 border border-gray-200">
                  <span className={totals.balance > 0 ? 'text-red-500' : 'text-green-600'}>
                    ₹{totals.balance.toLocaleString('en-IN')}
                  </span>
                </td>
                <td className="px-3 py-2 border border-gray-200 text-blue-600">
                  ₹{totals.payNow.toLocaleString('en-IN')}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 mt-6 print:hidden">
          <button
            onClick={handleClear}
            className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-700"
          >
            Clear
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Save Payment
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 text-sm bg-green-700 text-white rounded-lg hover:bg-green-800"
          >
            Print Receipt
          </button>
        </div>

      </div>
    </div>
  )
}