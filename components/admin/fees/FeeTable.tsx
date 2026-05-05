'use client'
import { FeeRowUI } from '@/type/fees'

interface Props {
  rows: FeeRowUI[]
  onChange: (id: number, field: 'total_amount' | 'payNow', value: number) => void
  onDelete: (id: number) => Promise<void>  // FIX: add missing prop
}

export default function FeeTable({ rows, onChange, onDelete }: Props) {
  const totalSum   = rows.reduce((s, r) => s + r.total_amount, 0)
  const paidSum    = rows.reduce((s, r) => s + r.paid_amount, 0)
  const balanceSum = rows.reduce((s, r) => s + r.balance, 0)
  const payNowSum  = rows.reduce((s, r) => s + r.payNow, 0)

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm" style={{ tableLayout: 'fixed' }}>
        <thead>
          <tr className="border-b border-gray-100">
            <th className="text-left text-xs font-medium text-gray-400 pb-3 w-[24%]">Fee type</th>
            <th className="text-right text-xs font-medium text-gray-400 pb-3 w-[15%]">Total (₹)</th>
            <th className="text-right text-xs font-medium text-gray-400 pb-3 w-[15%]">Paid (₹)</th>
            <th className="text-right text-xs font-medium text-gray-400 pb-3 w-[15%]">Balance (₹)</th>
            <th className="text-right text-xs font-medium text-gray-400 pb-3 w-[22%]">Pay now (₹)</th>
            <th className="text-right text-xs font-medium text-gray-400 pb-3 w-[9%]"></th>
          </tr>
        </thead>
        <tbody>
          {rows.map(row => (
            <tr key={row.id} className="border-b border-gray-50 group">
              <td className="py-2.5 text-gray-700">{row.label}</td>
              <td className="py-2.5 text-right">
                <input
                  type="number"
                  min={0}
                  value={row.total_amount || ''}
                  onChange={e => onChange(row.id, 'total_amount', parseFloat(e.target.value) || 0)}
                  className="w-full text-right border border-gray-200 rounded-md px-2 py-1 text-sm focus:outline-none text-gray-500 focus:ring-1 focus:ring-blue-400"
                />
              </td>
              <td className="py-2.5 text-right">
                <span className="text-gray-600">
                  {row.paid_amount.toLocaleString('en-IN')}
                </span>
              </td>
              <td className="py-2.5 text-right">
                <span className={`font-medium ${row.balance > 0 ? 'text-red-500' : 'text-green-600'}`}>
                  {row.balance.toLocaleString('en-IN')}
                </span>
              </td>
              <td className="py-2.5 text-right">
                <input
                  type="number"
                  min={0}
                  max={row.balance.toString()}
                  value={row.payNow || ''}
                  onChange={e => onChange(row.id, 'payNow', parseFloat(e.target.value) || 0)}
                  placeholder="0"
                  className="w-[80%] text-right border border-gray-200 text-gray-500 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400"
                />
              </td>
              <td className="py-2.5 text-right">
                <button
                  onClick={() => onDelete(row.id)}
                  className="text-xs text-red-400 hover:text-red-600 transition-colors px-1"
                  title="Delete row"
                >
                  ✕
                </button>
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-gray-200">
            <td className="py-3 font-medium text-gray-800">Total</td>
            <td className="py-3 text-right font-medium text-gray-800">
              ₹{totalSum.toLocaleString('en-IN')}
            </td>
            <td className="py-3 text-right font-medium text-gray-800">
              ₹{paidSum.toLocaleString('en-IN')}
            </td>
            <td className={`py-3 text-right font-medium ${balanceSum > 0 ? 'text-red-500' : 'text-green-600'}`}>
              ₹{balanceSum.toLocaleString('en-IN')}
            </td>
            <td className="py-3 text-right font-medium text-blue-600">
              ₹{payNowSum.toLocaleString('en-IN')}
            </td>
            <td />
          </tr>
        </tfoot>
      </table>
    </div>
  )
}