'use client'

import { useRef } from 'react'
import { PaymentDetail } from '@/type/fees'
import { Printer } from 'lucide-react';

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
    const printContent = printRef.current
    if (!printContent) return
    const printWindow = window.open('', '_blank')
    if (!printWindow) return
    printWindow.document.write(`
      <!DOCTYPE html><html><head><title>Receipt - ${receiptNo}</title>
      <style>
        *{margin:0;padding:0;box-sizing:border-box}
        body{font-family:Arial,sans-serif;font-size:13px;color:#333;padding:20px}
        .receipt{max-width:400px;margin:0 auto;border:2px solid #0d9488;border-radius:12px;overflow:hidden}
        .header{background:#0d9488;color:white;text-align:center;padding:16px}
        .header h1{font-size:18px;font-weight:bold}
        .header p{font-size:11px;opacity:.85;margin-top:2px}
        .body{padding:16px}
        .meta{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px;padding-bottom:12px;border-bottom:1px dashed #e5e7eb}
        .meta label{font-size:10px;color:#9ca3af;display:block;margin-bottom:2px}
        .meta p{font-size:12px;font-weight:600;color:#374151}
        .fee-row{display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #f3f4f6;font-size:12px}
        .fee-row span:last-child{font-weight:600;color:#0d9488}
        .total-row{display:flex;justify-content:space-between;padding:10px 0 6px;border-top:2px solid #0d9488;font-weight:bold;font-size:14px;color:#0d9488}
        .balance-row{display:flex;justify-content:space-between;padding:6px 0;font-size:11px;color:#9ca3af}
        .footer{text-align:center;padding:10px;background:#f9fafb;font-size:10px;color:#9ca3af;border-top:1px solid #e5e7eb}
      </style></head><body>${printContent.innerHTML}</body></html>
    `)
    printWindow.document.close()
    printWindow.focus()
    printWindow.print()
    printWindow.close()
  }

  const formattedDate = new Date(paymentDate).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric'
  })

  return (
    <div className="mt-4 space-y-4">
      <div className="bg-teal-50 border border-teal-200 rounded-xl px-4 py-3 flex items-center gap-3">
        <span className="text-2xl"></span>
        <div>
          <p className="text-sm font-semibold text-teal-700">Payment saved successfully!</p>
          <p className="text-xs text-teal-500 mt-0.5">Receipt No: {receiptNo}</p>
        </div>
      </div>

      <div ref={printRef} className="border-2 border-teal-600 rounded-xl overflow-hidden">
        <div className="bg-teal-600 text-white text-center py-4 px-4">
          <h2 className="text-base font-bold tracking-wide">IQRA SCHOOL</h2>
          <p className="text-xs text-teal-100 mt-0.5">FEE RECEIPT</p>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-2 gap-3 mb-4 pb-4 border-b border-dashed border-gray-200">
            <div><p className="text-xs text-gray-400">Receipt No</p><p className="text-sm font-semibold text-gray-600 mt-0.5">{receiptNo}</p></div>
            <div><p className="text-xs text-gray-400">Date</p><p className="text-sm font-semibold text-gray-600 mt-0.5">{formattedDate}</p></div>
            <div><p className="text-xs text-gray-400">Student</p><p className="text-sm font-semibold text-gray-600 mt-0.5">{studentName}</p></div>
            <div><p className="text-xs text-gray-400">Adm No</p><p className="text-sm font-semibold text-gray-600 mt-0.5">{admissionNo}</p></div>
            <div className="col-span-2"><p className="text-xs text-gray-400">Class</p><p className="text-sm font-semibold text-gray-600 mt-0.5">{standard}</p></div>
          </div>
          <div className="mb-4">
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
              {remainingBalance > 0 ? `₹${remainingBalance.toLocaleString()}` : 'Fully Paid'}
            </span>
          </div>
        </div>
        <div className="bg-gray-50 border-t border-gray-100 text-center py-3 px-4">
          <p className="text-xs text-gray-400">Thank you for your payment</p>
          <p className="text-xs text-gray-300 mt-0.5">Iqra School — {new Date().getFullYear()}</p>
        </div>
      </div>

      <div className="flex gap-3">
        <button onClick={handlePrint}
          className="flex-1 bg-teal-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-teal-700">
          <Printer  size={18} /> Print Receipt
        </button>
        <button onClick={onNewPayment}
          className="flex-1 border border-gray-300 text-gray-500 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50">
          + New Payment
        </button>
      </div>
    </div>
  )
}