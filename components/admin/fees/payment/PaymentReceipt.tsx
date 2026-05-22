'use client'

import { useRef } from 'react'
import { PaymentDetail } from '@/type/fees'
import { Printer, Plus, CheckCircle2 } from 'lucide-react'

interface Props {
  receiptNo: string
  paymentDate: string
  studentName: string
  admissionNo: string
  standard: string
  paymentDetails: PaymentDetail[]
  totalPaid: number
  remainingBalance: number
  onNewPayment: () => void
}

export default function PaymentReceipt({
  receiptNo, paymentDate, studentName, admissionNo,
  standard, paymentDetails, totalPaid, remainingBalance, onNewPayment,
}: Props) {
  const printRef = useRef<HTMLDivElement>(null)

  function handlePrint() {
    const formattedDate = new Date(paymentDate).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric'
    })

    const feeRows = paymentDetails.map(d => `
      <div class="fee-row">
        <span>${d.label}</span>
        <span>Rs.${d.amount.toLocaleString()}</span>
      </div>
    `).join('')

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Receipt - ${receiptNo}</title>
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
    .balance-row { display:flex; justify-content:space-between; align-items:center; margin-top:6px; }
    .balance-row span:first-child { font-size:11px; color:#9ca3af; }
    .balance-row .paid { font-size:11px; font-weight:600; color:#0d9488; }
    .balance-row .due { font-size:11px; font-weight:600; color:#ef4444; }
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
          <p>${receiptNo}</p>
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
          <span class="value">Rs.${totalPaid.toLocaleString()}</span>
        </div>
        <div class="balance-row">
          <span>Remaining Balance</span>
          ${remainingBalance > 0
            ? `<span class="due">Rs.${remainingBalance.toLocaleString()}</span>`
            : `<span class="paid">Fully Paid ✓</span>`
          }
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

    const printWindow = window.open('', '_blank', 'width=500,height=700')
    if (!printWindow) {
      alert('Please allow popups for this site to print the receipt.')
      return
    }

    printWindow.document.open()
    printWindow.document.write(html)
    printWindow.document.close()

    // ── wait for content to load before printing ──
    printWindow.onload = () => {
      printWindow.focus()
      printWindow.print()
      // ── close only after print dialog is dismissed ──
      printWindow.onafterprint = () => printWindow.close()
    }
  }

  const formattedDate = new Date(paymentDate).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric'
  })

  return (
    <div className="mt-4 space-y-4">

      {/* Success banner */}
      <div className="bg-teal-50 border border-teal-200 rounded-xl px-4 py-3 flex items-center gap-3">
        <CheckCircle2 className="text-teal-600" size={28} />
        <div>
          <p className="text-sm font-semibold text-teal-700">Payment saved successfully!</p>
          <p className="text-xs text-teal-500 mt-0.5">Receipt No: {receiptNo}</p>
        </div>
      </div>

      {/* Receipt preview */}
      <div ref={printRef} className="border-2 border-teal-600 rounded-xl overflow-hidden">
        <div className="bg-teal-600 text-white text-center py-4 px-4">
          <h2 className="text-base font-bold tracking-wide">IQRAH ENGLISH SCHOOL</h2>
          <p className="text-xs text-teal-100 mt-0.5">FEE RECEIPT</p>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-2 gap-3 mb-4 pb-4 border-b border-dashed border-gray-200">
            <div>
              <p className="text-xs text-gray-400">Receipt No</p>
              <p className="text-sm font-semibold text-gray-600 mt-0.5">{receiptNo}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Date</p>
              <p className="text-sm font-semibold text-gray-600 mt-0.5">{formattedDate}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Student</p>
              <p className="text-sm font-semibold text-gray-600 mt-0.5">{studentName}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Adm No</p>
              <p className="text-sm font-semibold text-gray-600 mt-0.5">{admissionNo}</p>
            </div>
            <div className="col-span-2">
              <p className="text-xs text-gray-400">Class</p>
              <p className="text-sm font-semibold text-gray-600 mt-0.5">{standard}</p>
            </div>
          </div>

          <div className="mb-4">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Payment Details</p>
            {paymentDetails.map((d, i) => (
              <div key={i} className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-500">{d.label}</span>
                <span className="text-sm font-semibold text-teal-600">₹{d.amount.toLocaleString()}</span>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center pt-2 border-t-2 border-teal-600">
            <span className="text-sm font-bold text-gray-700">TOTAL PAID</span>
            <span className="text-lg font-bold text-teal-600">₹{totalPaid.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center mt-1">
            <span className="text-xs text-gray-400">Remaining Balance</span>
            <span className={`text-xs font-semibold ${remainingBalance > 0 ? 'text-red-400' : 'text-teal-500'}`}>
              {remainingBalance > 0 ? `₹${remainingBalance.toLocaleString()}` : 'Fully Paid '}
            </span>
          </div>
        </div>
        <div className="bg-gray-50 border-t border-gray-100 text-center py-3 px-4">
          <p className="text-xs text-gray-400">Thank you for your payment</p>
          <p className="text-xs text-gray-300 mt-0.5">IQRA English School - {new Date().getFullYear()}</p>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3">
        <button
          onClick={handlePrint}
          className="flex-1 flex items-center justify-center gap-2 bg-teal-600 text-white
            py-2.5 rounded-xl text-sm font-semibold hover:bg-teal-700 transition-all">
          <Printer size={16} />
          Print Receipt
        </button>
        <button
          onClick={onNewPayment}
          className="flex-1 flex items-center justify-center gap-2 border border-gray-300 text-gray-500 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50">
           <Plus size={16} />
             New Payment
        </button>
      </div>
    </div>
  )
}