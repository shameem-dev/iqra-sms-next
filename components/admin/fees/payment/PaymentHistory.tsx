'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { FeePayment, PaymentDetail } from '@/type/fees'
import { ACADEMIC_YEAR } from '@/utils/actions/feeConstants'
import { History, ChevronDown, ChevronUp, Printer, Receipt } from 'lucide-react'

interface Props {
  studentId: number
  studentName: string
  admissionNo: string
  standard: string
}

export default function PaymentHistory({ studentId, studentName, admissionNo, standard }: Props) {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!
  )

  const [payments, setPayments] = useState<FeePayment[]>([])
  const [loading, setLoading]   = useState(true)
  const [expanded, setExpanded] = useState<number | null>(null)

  useEffect(() => {
    async function fetchPayments() {
      setLoading(true)
      const { data } = await supabase
        .from('fee_payments')
        .select('*')
        .eq('student_id', studentId)
        .eq('academic_year', ACADEMIC_YEAR)
        .order('payment_date', { ascending: false })
      setPayments(data ?? [])
      setLoading(false)
    }
    fetchPayments()
  }, [studentId])

  function handlePrint(payment: FeePayment) {
    const formattedDate = new Date(payment.payment_date).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
    })

    const feeRows = (payment.payment_details as PaymentDetail[]).map(d => `
      <div class="fee-row">
        <span>${d.label}</span>
        <span>Rs.${d.amount.toLocaleString()}</span>
      </div>
    `).join('')

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Receipt - ${payment.receipt_no}</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family:Arial,sans-serif; font-size:13px; color:#333; background:#f3f4f6; display:flex; justify-content:center; align-items:flex-start; padding:30px; }
    .receipt { width:380px; border:2px solid #0d9488; border-radius:12px; overflow:hidden; background:#fff; }
    .header { background:#0d9488; color:white; text-align:center; padding:18px 16px; }
    .header h1 { font-size:20px; font-weight:bold; letter-spacing:1px; }
    .header p { font-size:11px; opacity:.85; margin-top:3px; letter-spacing:0.5px; }
    .body { padding:16px; }
    .meta { display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:14px; padding-bottom:14px; border-bottom:1px dashed #e5e7eb; }
    .meta-item label { font-size:10px; color:#9ca3af; display:block; margin-bottom:2px; text-transform:uppercase; letter-spacing:0.4px; }
    .meta-item p { font-size:12px; font-weight:600; color:#374151; }
    .meta-item.full { grid-column:span 2; }
    .fees-section { margin-bottom:14px; }
    .fees-title { font-size:10px; color:#9ca3af; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:8px; }
    .fee-row { display:flex; justify-content:space-between; align-items:center; padding:7px 0; border-bottom:1px solid #f3f4f6; font-size:12px; }
    .fee-row span:first-child { color:#6b7280; }
    .fee-row span:last-child { font-weight:600; color:#0d9488; }
    .total-section { border-top:2px solid #0d9488; padding-top:10px; margin-top:4px; }
    .total-row { display:flex; justify-content:space-between; align-items:center; }
    .total-row .label { font-size:13px; font-weight:bold; color:#374151; }
    .total-row .value { font-size:18px; font-weight:bold; color:#0d9488; }
    .footer { background:#f9fafb; border-top:1px solid #e5e7eb; text-align:center; padding:12px; }
    .footer p { font-size:10px; color:#9ca3af; margin-bottom:2px; }
    @media print {
      body { background:white; padding:0; }
      .receipt { border-radius:0; border:2px solid #0d9488; width:100%; }
    }
  </style>
</head>
<body>
  <div class="receipt">
    <div class="header">
      <h1>IQRAH ENGLISH SCHOOL</h1>
      <p>FEE RECEIPT</p>
    </div>
    <div class="body">
      <div class="meta">
        <div class="meta-item">
          <label>Receipt No</label>
          <p>${payment.receipt_no}</p>
        </div>
        <div class="meta-item">
          <label>Date</label>
          <p>${formattedDate}</p>
        </div>
        <div class="meta-item">
          <label>Student</label>
          <p>${studentName}</p>
        </div>
        <div class="meta-item">
          <label>Adm No</label>
          <p>${admissionNo}</p>
        </div>
        <div class="meta-item full">
          <label>Class</label>
          <p>${standard}</p>
        </div>
      </div>
      <div class="fees-section">
        <p class="fees-title">Payment Details</p>
        ${feeRows}
      </div>
      <div class="total-section">
        <div class="total-row">
          <span class="label">TOTAL PAID</span>
          <span class="value">Rs.${payment.total_paid.toLocaleString()}</span>
        </div>
      </div>
    </div>
    <div class="footer">
      <p>Thank you for your payment</p>
      <p>IQRAH English School - ${new Date().getFullYear()}</p>
    </div>
  </div>
</body>
</html>`

    const win = window.open('', '_blank', 'width=500,height=700')
    if (!win) { alert('Please allow popups to print.'); return }
    win.document.open()
    win.document.write(html)
    win.document.close()
    win.onload = () => {
      win.focus()
      win.print()
      win.onafterprint = () => win.close()
    }
  }

  if (loading) {
    return (
      <div className="text-center py-6 text-gray-400 text-sm">
        Loading payment history...
      </div>
    )
  }

  return (
    <div>
      {/* Section header */}
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 px-1">
        Payment History
      </p>

      {payments.length === 0 ? (
        <div className="bg-gray-50 border border-dashed border-gray-200 rounded-xl py-8 text-center">
          <History size={28} className="mx-auto text-gray-300 mb-2" />
          <p className="text-sm text-gray-400">No payments recorded yet</p>
          <p className="text-xs text-gray-300 mt-0.5">Payments will appear here after recording</p>
        </div>
      ) : (
        <div className="space-y-2">
          {payments.map((payment, idx) => {
            const isOpen = expanded === idx
            const details = payment.payment_details as PaymentDetail[]
            const formattedDate = new Date(payment.payment_date).toLocaleDateString('en-IN', {
              day: '2-digit', month: 'short', year: 'numeric',
            })

            return (
              <div
                key={payment.id}
                className="border border-gray-200 rounded-xl overflow-hidden bg-white"
              >
                {/* Row header — always visible */}
                <div className="flex items-center gap-3 px-4 py-3">
                  {/* Receipt icon */}
                  <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-100 flex items-center justify-center flex-shrink-0">
                    <Receipt size={14} className="text-teal-600" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-700 truncate">
                      {payment.receipt_no}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">{formattedDate}</p>
                  </div>

                  {/* Amount */}
                  <p className="text-sm font-bold text-teal-600 mr-2">
                    ₹{payment.total_paid.toLocaleString()}
                  </p>

                  {/* Actions */}
                  <button
                    onClick={() => handlePrint(payment)}
                    title="Print receipt"
                    className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:bg-teal-50 hover:border-teal-200 hover:text-teal-600 transition-all"
                  >
                    <Printer size={14} />
                  </button>
                  <button
                    onClick={() => setExpanded(isOpen ? null : idx)}
                    title="View details"
                    className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-50 transition-all"
                  >
                    {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                </div>

                {/* Expandable details */}
                {isOpen && (
                  <div className="border-t border-gray-100 bg-gray-50 px-4 py-3">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                      Payment Breakdown
                    </p>
                    <div className="space-y-1.5">
                      {details.map((d, i) => (
                        <div key={i} className="flex justify-between items-center">
                          <span className="text-xs text-gray-500">{d.label}</span>
                          <span className="text-xs font-semibold text-teal-600">
                            ₹{d.amount.toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between items-center mt-3 pt-2 border-t border-gray-200">
                      <span className="text-xs font-bold text-gray-600">Total Paid</span>
                      <span className="text-sm font-bold text-teal-600">
                        ₹{payment.total_paid.toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )
          })}

          {/* Summary footer */}
          <div className="flex justify-between items-center px-4 py-2.5 bg-teal-50 border border-teal-100 rounded-xl mt-1">
            <span className="text-xs font-semibold text-teal-700">
              {payments.length} payment{payments.length !== 1 ? 's' : ''} this year
            </span>
            <span className="text-sm font-bold text-teal-700">
              ₹{payments.reduce((s, p) => s + p.total_paid, 0).toLocaleString()} total
            </span>
          </div>
        </div>
      )}
    </div>
  )
}   