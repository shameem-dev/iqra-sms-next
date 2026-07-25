'use client'

import { useState, useEffect } from 'react'
import {
  Loader2, X, Banknote, CheckCircle2, AlertCircle,
  History, Calendar, SplitSquareHorizontal, Receipt,
} from 'lucide-react'
import { markSalaryPaid, type PayrollRecord } from '@/utils/actions/payroll'
import { PAYMENT_MODES } from '@/components/admin/accounts'
import { type PaymentMode } from '@/type/accounts'

interface Staff {
  id: string
  name: string
  basic_salary: number
  ta: number
}

interface Props {
  staff: Staff
  paidMonths: PayrollRecord[]
  onClose: () => void
  onSuccess: (msg: string) => void
}

const inputCls =
  'w-full px-3 py-2 text-sm text-slate-800 bg-white border border-slate-200 rounded-lg ' +
  'focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ' +
  'placeholder:text-slate-400 transition-colors'

const selectCls =
  'w-full px-3 py-2 text-sm text-slate-800 bg-white border border-slate-200 rounded-lg ' +
  'focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-colors'

function fmt(n: number) {
  return n.toLocaleString('en-IN', { minimumFractionDigits: 2 })
}
function monthLabel(ym: string) {
  return new Date(ym + '-01').toLocaleString('en-IN', { month: 'long', year: 'numeric' })
}

export default function PaySalaryModal({ staff, paidMonths, onClose, onSuccess }: Props) {
  const today     = new Date().toISOString().split('T')[0]
  const thisMonth = today.slice(0, 7)

  const [paymentDate, setPaymentDate]     = useState(today)
  const [paymentMode, setPaymentMode]     = useState<PaymentMode>('Cash')
  const [month, setMonth]                 = useState(thisMonth)
  const [payTa, setPayTa]                 = useState(staff.ta > 0)
  const [notes, setNotes]                 = useState('')
  const [billVoucherNo, setBillVoucherNo] = useState('')
  const [saving, setSaving]               = useState(false)
  const [error, setError]                 = useState<string | null>(null)
  const [showHistory, setShowHistory]     = useState(false)

  // Partial payment
  const [isPartial, setIsPartial]         = useState(false)
  const [customAmount, setCustomAmount]   = useState<string>('')

  // Payments already made this month
  const thisMonthPayments = paidMonths.filter(p => p.month === month)
  const totalPaidThisMonth = thisMonthPayments.reduce(
    (sum, p) => sum + Number(p.basic_salary) + (p.ta_paid ? Number(p.ta) : 0), 0
  )

  const fullSalaryMax = staff.basic_salary + staff.ta   // Absolute contract ceiling
  const remaining     = fullSalaryMax - totalPaidThisMonth
  const alreadyPaid   = thisMonthPayments.length > 0
  const isFullyPaidOut = remaining <= 0

  // Dynamically calculate what a "Full Settlement" means right now
  // If they have already paid partial amounts, the dynamic full payment is whatever is left over (remaining).
  const currentFullPaymentTarget = alreadyPaid ? remaining : (staff.basic_salary + (payTa ? staff.ta : 0))

  // Overpayment guard for custom partial inputs
  const customNum        = Number(customAmount) || 0
  const wouldOverpay     = isPartial && customNum > 0 && (totalPaidThisMonth + customNum) > fullSalaryMax
  const overpayBy        = wouldOverpay ? (totalPaidThisMonth + customNum) - fullSalaryMax : 0

  const canSubmit = saving
    ? false
    : isFullyPaidOut
      ? false
      : isPartial
        ? customNum > 0 && !wouldOverpay
        : currentFullPaymentTarget > 0

  // Auto-switch tabs or warn if month updates to an already fully paid month
  useEffect(() => {
    if (isFullyPaidOut) {
      setIsPartial(false)
    }
  }, [month, isFullyPaidOut])

  const handlePay = async () => {
    if (!paymentDate) { setError('Payment date is required'); return }
    if (!month)       { setError('Month is required'); return }
    if (isFullyPaidOut) { setError('This month is already fully settled.'); return }
    if (isPartial && customNum <= 0) { setError('Enter a valid amount'); return }
    if (wouldOverpay) { setError(`Amount exceeds remaining salary by ₹${fmt(overpayBy)}`); return }

    setSaving(true); setError(null)
    try {
      // Determine exact values to transmit down to Server Actions
      let finalBasicSalary = staff.basic_salary
      let finalTa = staff.ta
      let finalPayTa = payTa
      let finalCustomAmount: number | null = null

      if (alreadyPaid || isPartial) {
        // If there are previous partial history tracks or the user picked partial mode, 
        // treat this request under a calculated single transaction entry payload.
        finalCustomAmount = isPartial ? customNum : remaining
      }

      await markSalaryPaid({
        staffId:      staff.id,
        staffName:    staff.name,
        basicSalary:  finalBasicSalary,
        ta:           finalTa,
        paymentDate,
        month,
        payTa:        finalPayTa,
        notes,
        billVoucherNo,
        customAmount: finalCustomAmount,
        paymentMode,
      })

      const displayAmount = finalCustomAmount != null ? finalCustomAmount : (finalBasicSalary + (finalPayTa ? finalTa : 0))
      const label = `Payment of ₹${fmt(displayAmount)} processed for ${staff.name} (${monthLabel(month)}) ✓`

      onSuccess(label)
      onClose()
    } catch (e: any) {
      setError(e.message ?? 'Failed to process payment')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md flex flex-col max-h-[90vh]">

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center">
              <Banknote className="w-4 h-4 text-rose-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">Pay Salary</p>
              <p className="text-xs text-slate-400">{staff.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowHistory(h => !h)}
              title="Payment history"
              className={`p-1.5 rounded-lg transition-colors ${showHistory
                ? 'bg-slate-100 text-slate-700'
                : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'}`}
            >
              <History className="w-4 h-4" />
            </button>
            <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">

          {/* ── History panel ── */}
          {showHistory && (
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Payment History</p>
              {paidMonths.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No payments recorded yet.</p>
              ) : (
                <div className="space-y-2">
                  {paidMonths.map(p => {
                    const amt           = Number(p.basic_salary) + (p.ta_paid ? Number(p.ta) : 0)
                    const isPartialRec  = amt < fullSalaryMax
                    return (
                      <div key={p.id} className="flex items-center justify-between bg-white rounded-lg border border-slate-200 px-3 py-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <p className="text-xs font-medium text-slate-700">{monthLabel(p.month)}</p>
                            {isPartialRec && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-700">partial</span>
                            )}
                          </div>
                          <p className="text-xs text-slate-400">
                            {new Date(p.payment_date + 'T00:00:00').toLocaleDateString('en-IN', {
                              day: '2-digit', month: 'short', year: 'numeric',
                            })}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-semibold text-rose-600">₹{fmt(amt)}</p>
                          {p.ta_paid && <p className="text-xs text-slate-400">incl. TA</p>}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── Form ── */}
          <div className="px-5 py-4 space-y-4">

            {/* Error Display */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span className="flex-1">{error}</span>
                <button onClick={() => setError(null)}><X className="w-3.5 h-3.5" /></button>
              </div>
            )}

            {/* Live Remaining Balance Card */}
            {alreadyPaid && (
              <div className="p-3 bg-teal-50 border border-teal-200 rounded-lg space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-teal-700">Already paid this month</span>
                  <span className="text-xs font-bold text-teal-700 tabular-nums">₹{fmt(totalPaidThisMonth)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-teal-600">Remaining Due</span>
                  <span className={`text-xs font-bold tabular-nums ${isFullyPaidOut ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {isFullyPaidOut ? 'Fully Paid' : `₹${fmt(remaining)}`}
                  </span>
                </div>
              </div>
            )}

            {/* Month Input */}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-medium text-slate-500 mb-1.5">
                <Calendar className="w-3.5 h-3.5" /> Salary Month <span className="text-red-500">*</span>
              </label>
              <input type="month" value={month} onChange={e => setMonth(e.target.value)} className={inputCls} />
            </div>

            {/* Payment Date & Mode of Payment Row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">
                  Payment Date <span className="text-red-500">*</span>
                </label>
                <input type="date" value={paymentDate} onChange={e => setPaymentDate(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">
                  Mode of Payment <span className="text-red-500">*</span>
                </label>
                <select
                  value={paymentMode}
                  onChange={e => setPaymentMode(e.target.value as PaymentMode)}
                  className={selectCls}
                >
                  {PAYMENT_MODES.map(m => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="flex items-center gap-1 text-xs font-medium text-slate-500 mb-1.5">
                <Receipt className="w-3 h-3" /> Bill / Voucher No.
              </label>
              <input
                type="text"
                value={billVoucherNo}
                onChange={e => setBillVoucherNo(e.target.value)}
                placeholder="e.g. VCH-001"
                className={inputCls}
              />
            </div>

            {/* Full / Partial segment selector switch */}
            <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-xl">
              <button
                disabled={isFullyPaidOut}
                onClick={() => setIsPartial(false)}
                className={`flex-1 flex items-center justify-center gap-1.5 h-8 text-xs font-semibold rounded-lg transition-all ${
                  !isPartial && !isFullyPaidOut ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'
                } disabled:opacity-40`}
              >
                <Banknote className="w-3.5 h-3.5" /> {alreadyPaid ? 'Pay Remaining' : 'Full Payment'}
              </button>
              <button
                disabled={isFullyPaidOut}
                onClick={() => setIsPartial(true)}
                className={`flex-1 flex items-center justify-center gap-1.5 h-8 text-xs font-semibold rounded-lg transition-all ${
                  isPartial && !isFullyPaidOut ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'
                } disabled:opacity-40`}
              >
                <SplitSquareHorizontal className="w-3.5 h-3.5" /> Partial Payment
              </button>
            </div>

            {/* Full Payment View Mode breakdown */}
            {!isPartial && (
              <div className="rounded-xl border border-slate-200 overflow-hidden">
                {alreadyPaid ? (
                  <div className="px-4 py-3 flex items-center justify-between bg-rose-50">
                    <span className="text-xs font-semibold text-rose-700 uppercase tracking-wide">Remaining Settlement Amount</span>
                    <span className="text-base font-bold text-rose-700 tabular-nums) ">₹{fmt(remaining)}</span>
                  </div>
                ) : (
                  <>
                    <div className="px-4 py-3 flex items-center justify-between bg-slate-50 border-b border-slate-100">
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Basic Contract Salary</span>
                      <span className="text-sm font-bold text-slate-800 tabular-nums">₹{fmt(staff.basic_salary)}</span>
                    </div>
                    {staff.ta > 0 && (
                      <div className="px-4 py-3 flex items-center justify-between border-b border-slate-100">
                        <label className="flex items-center gap-2.5 cursor-pointer select-none">
                          <input
                            type="checkbox" checked={payTa} onChange={e => setPayTa(e.target.checked)}
                            className="w-4 h-4 rounded accent-teal-600"
                          />
                          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Include TA</span>
                        </label>
                        <span className={`text-sm font-bold tabular-nums transition-colors ${payTa ? 'text-slate-800' : 'text-slate-300 line-through'}`}>
                          ₹{fmt(staff.ta)}
                        </span>
                      </div>
                    )}
                    <div className="px-4 py-3 flex items-center justify-between bg-rose-50">
                      <span className="text-xs font-semibold text-rose-700 uppercase tracking-wide">Total to Pay</span>
                      <span className="text-base font-bold text-rose-700 tabular-nums">₹{fmt(currentFullPaymentTarget)}</span>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Partial Payment View Mode input fields */}
            {isPartial && (
              <div className="rounded-xl border border-amber-200 overflow-hidden">
                <div className="px-4 py-3 bg-amber-50 border-b border-amber-100">
                  <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-0.5">Custom Amount</p>
                  <p className="text-xs text-amber-600">
                    Full limit contract value is ₹{fmt(fullSalaryMax)}.{alreadyPaid && ` Max remaining is ₹${fmt(remaining)}.`}
                  </p>
                </div>
                <div className="px-4 py-3 bg-white space-y-2">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-500">₹</span>
                    <input
                      type="number"
                      min="1"
                      max={remaining}
                      step="0.01"
                      value={customAmount}
                      onChange={e => { setCustomAmount(e.target.value); setError(null) }}
                      placeholder="0.00"
                      className={`${inputCls} pl-7 ${wouldOverpay ? 'border-red-300 focus:ring-red-400' : ''}`}
                      autoFocus
                    />
                  </div>

                  {wouldOverpay && (
                    <p className="text-xs text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      Exceeds remaining month balance by ₹{fmt(overpayBy)}
                    </p>
                  )}

                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={() => setCustomAmount(String(remaining))}
                      className="px-2.5 py-1 text-xs font-medium bg-teal-50 text-teal-700 border border-teal-200 rounded-lg hover:bg-teal-100 transition-colors"
                    >
                      Clear Remaining Due (₹{fmt(remaining)})
                    </button>
                  </div>
                </div>
                {customNum > 0 && !wouldOverpay && (
                  <div className="px-4 py-3 flex items-center justify-between bg-amber-50 border-t border-amber-100">
                    <span className="text-xs font-semibold text-amber-700 uppercase tracking-wide">Paying Now</span>
                    <span className="text-base font-bold text-amber-700 tabular-nums">₹{fmt(customNum)}</span>
                  </div>
                )}
              </div>
            )}

            {/* Dynamic Context Notes label info footer */}
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">Notes (optional)</label>
              <input
                type="text"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder={isPartial ? 'e.g. Advance pay' : 'e.g. Settled remaining month balance'}
                className={inputCls}
              />
            </div>

            <p className="text-xs text-slate-400 bg-slate-50 rounded-lg px-3 py-2 border border-slate-100">
              {isPartial || alreadyPaid
                ? 'Creates 1 custom balance expenditure ledger track entry in Accounts.'
                : `Creates ${payTa && staff.ta > 0 ? '2 separate layout expenditure entries (salary + TA)' : '1 expenditure entry'} in Accounts.`
              }
            </p>
          </div>
        </div>

        {/* ── Footer Actions ── */}
        <div className="flex justify-end gap-2 px-5 py-4 border-t border-slate-100 shrink-0">
          <button onClick={onClose} className="h-9 px-4 text-sm text-slate-600 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
            Cancel
          </button>
          <button
            onClick={handlePay}
            disabled={!canSubmit || isFullyPaidOut}
            className={`h-9 flex items-center gap-2 px-5 text-sm font-semibold text-white rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors
              ${isFullyPaidOut ? 'bg-slate-400' : isPartial ? 'bg-amber-500 hover:bg-amber-600' : 'bg-rose-600 hover:bg-rose-700'}`}
          >
            {saving ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Processing…</>
            ) : isFullyPaidOut ? (
              <><CheckCircle2 className="w-4 h-4" /> Settled for Month</>
            ) : (
              <><CheckCircle2 className="w-4 h-4" /> {isPartial ? 'Pay Partial Amount' : alreadyPaid ? 'Settle Balance' : 'Confirm Payment'}</>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}