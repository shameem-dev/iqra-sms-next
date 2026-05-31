'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Loader2 } from 'lucide-react'
import { getAcademicYear } from '@/lib/academicYear'


interface Props { studentId: number }

const ACADEMIC_YEAR = getAcademicYear()

export default function ParentFees({ studentId }: Props) {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!
  )

  const [fees, setFees]         = useState<any[]>([])
  const [payments, setPayments] = useState<any[]>([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    ;(async () => {
      setLoading(true)
      const [{ data: feesData }, { data: paymentsData }] = await Promise.all([
        supabase.from('student_fees').select('*').eq('student_id', studentId).eq('academic_year', ACADEMIC_YEAR),
        supabase.from('fee_payments').select('*').eq('student_id', studentId).eq('academic_year', ACADEMIC_YEAR).order('payment_date', { ascending: false }),
      ])
      setFees(feesData || [])
      setPayments(paymentsData || [])
      setLoading(false)
    })()
  }, [studentId])

  const totalAmount  = fees.reduce((s, f) => s + Number(f.total_amount || 0), 0)
  const totalPaid    = fees.reduce((s, f) => s + Number(f.paid_amount  || 0), 0)
  const totalBalance = totalAmount - totalPaid

  if (loading) return (
    <div className="flex items-center justify-center py-16 text-slate-400 gap-2">
      <Loader2 className="w-5 h-5 animate-spin text-teal-500" /><span className="text-sm">Loading fees…</span>
    </div>
  )

  return (
    <div className="space-y-4">
      <h2 className="text-base font-bold text-slate-700">Fee Summary — {ACADEMIC_YEAR}</h2>
<div className="grid grid-cols-3 gap-3">
  {/* Total Fees — purple to blue */}
  <div className="rounded-xl p-4 text-center" style={{ background: 'linear-gradient(135deg, #6B4FC8 0%, #4A7FD4 100%)' }}>
    <p className="text-xs mb-1 font-medium" style={{ color: 'rgba(255,255,255,0.75)' }}>Total Fees</p>
    <p className="text-lg font-bold text-white">₹{totalAmount.toLocaleString('en-IN')}</p>
  </div>

  {/* Paid — teal to green */}
  <div className="rounded-xl p-4 text-center" style={{ background: 'linear-gradient(135deg, #1A9E7A 0%, #2DC9A0 100%)' }}>
    <p className="text-xs mb-1 font-medium" style={{ color: 'rgba(255,255,255,0.75)' }}>Paid</p>
    <p className="text-lg font-bold text-white">₹{totalPaid.toLocaleString('en-IN')}</p>
  </div>

  {/* Balance — red/orange if owing, blue/purple if clear */}
  <div
    className="rounded-xl p-4 text-center"
    style={{
      background: totalBalance > 0
        ? 'linear-gradient(135deg, #F5A623 0%, #E8453C 100%)'
        : 'linear-gradient(135deg, #4A7FD4 0%, #7B52D3 100%)'
    }}
  >
    <p className="text-xs mb-1 font-medium" style={{ color: 'rgba(255,255,255,0.75)' }}>Balance</p>
    <p className="text-lg font-bold text-white">₹{totalBalance.toLocaleString('en-IN')}</p>
  </div>
</div>
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Fee Breakdown</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-400">Fee Type</th>
                <th className="px-4 py-2.5 text-right text-xs font-medium text-slate-400">Total</th>
                <th className="px-4 py-2.5 text-right text-xs font-medium text-slate-400">Paid</th>
                <th className="px-4 py-2.5 text-right text-xs font-medium text-slate-400">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {fees.map(f => {
                const balance = Number(f.total_amount) - Number(f.paid_amount)
                return (
                  <tr key={f.id} className="hover:bg-slate-50">
                    <td className="px-4 py-2.5 text-slate-700">{f.fee_type}</td>
                    <td className="px-4 py-2.5 text-right text-slate-600">₹{Number(f.total_amount).toLocaleString('en-IN')}</td>
                    <td className="px-4 py-2.5 text-right text-teal-600">₹{Number(f.paid_amount).toLocaleString('en-IN')}</td>
                    <td className={`px-4 py-2.5 text-right font-medium ${balance > 0 ? 'text-red-600' : 'text-teal-600'}`}>
                      ₹{balance.toLocaleString('en-IN')}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {payments.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Payment History</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-400">Date</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-400">Receipt No</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-400">Details</th>
                  <th className="px-4 py-2.5 text-right text-xs font-medium text-slate-400">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="px-4 py-2.5 text-slate-600 whitespace-nowrap">
                      {new Date(p.payment_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-2.5 font-mono text-xs text-teal-600">{p.receipt_no}</td>
                    <td className="px-4 py-2.5 text-xs text-slate-400">
                      {(p.payment_details || []).map((d: any) => d.fee_type).join(', ')}
                    </td>
                    <td className="px-4 py-2.5 text-right font-semibold text-teal-700">
                      ₹{Number(p.total_paid).toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}