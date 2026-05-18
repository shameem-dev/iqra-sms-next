'use client'

import { StudentFeeStatus } from '@/type/fees'

interface Props {
  students: StudentFeeStatus[]
}

export default function FeeSummaryBar({ students }: Props) {
  const totalStudents = students.length
  const paid    = students.filter(s => s.status === 'paid').length
  const partial = students.filter(s => s.status === 'partial').length
  const pending = students.filter(s => s.status === 'pending').length

  const grandTotal   = students.reduce((sum, s) => sum + s.totalAmount, 0)
  const grandPaid    = students.reduce((sum, s) => sum + s.totalPaid, 0)
  const grandBalance = students.reduce((sum, s) => sum + s.totalBalance, 0)

  const collectPercent = grandTotal === 0 ? 0 : Math.min((grandPaid / grandTotal) * 100, 100)

  const cards = [
    {
      label: 'Total Students',
      value: totalStudents,
      sub: 'enrolled',
      gradient: 'bg-[linear-gradient(135deg,_#1e3a5f_0%,_#1e40af_50%,_#1d4ed8_100%)]',
      shadow: 'shadow-blue-200',
    },
    {
      label: 'Fully Paid',
      value: paid,
      sub: `${totalStudents === 0 ? 0 : ((paid / totalStudents) * 100).toFixed(0)}% of class`,
      gradient: 'bg-[linear-gradient(135deg,_#059669_0%,_#0D9488_55%,_#0891B2_100%)]',
      shadow: 'shadow-emerald-200',
    },
    {
      label: 'Partial',
      value: partial,
      sub: `${totalStudents === 0 ? 0 : ((partial / totalStudents) * 100).toFixed(0)}% of class`,
      gradient: 'bg-[linear-gradient(135deg,_#F59E0B_0%,_#F97316_55%,_#EF4444_100%)]',
      shadow: 'shadow-amber-200',
    },
    {
      label: 'Pending',
      value: pending,
      sub: `${totalStudents === 0 ? 0 : ((pending / totalStudents) * 100).toFixed(0)}% of class`,
      gradient: 'bg-[linear-gradient(135deg,_#DC2626_0%,_#DB2777_60%,_#9333EA_100%)]',
      shadow: 'shadow-rose-200',
    },
  ]

  return (
    <div className="space-y-3">
      {/* Student Count Cards */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {cards.map(card => (
          <div
            key={card.label}
            className={`relative overflow-hidden rounded-2xl p-4 text-center ${card.gradient} shadow-lg ${card.shadow}`}
          >
            {/* Decorative circles */}
            <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full bg-white/10" />
            <div className="absolute right-2 bottom-2 w-10 h-10 rounded-full bg-black/10" />

            <div className="relative z-10">
              <p className="text-[2rem] font-black text-white leading-none">{card.value}</p>
              <p className="text-[10px] font-bold uppercase tracking-[.15em] text-white/60 mt-1.5">{card.label}</p>
              <p className="text-[11px] text-white/50 mt-0.5">{card.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Collection Summary */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-[10px] font-bold uppercase tracking-[.18em] text-gray-400">Fee Collection</h3>
          <span className="text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full">
            {collectPercent.toFixed(1)}% collected
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-100 rounded-full h-2.5 mb-4 overflow-hidden">
          <div
            className="h-2.5 rounded-full bg-[linear-gradient(90deg,_#059669,_#0D9488,_#0891B2)] transition-all duration-700"
            style={{ width: `${collectPercent}%` }}
          />
        </div>

        {/* Amounts */}
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center bg-gray-50 rounded-xl py-3">
            <p className="text-[10px] font-bold uppercase tracking-[.12em] text-gray-400 mb-1">Total Fees</p>
            <p className="text-sm font-black text-gray-700">₹{grandTotal.toLocaleString('en-IN')}</p>
          </div>
          <div className="text-center bg-emerald-50 rounded-xl py-3">
            <p className="text-[10px] font-bold uppercase tracking-[.12em] text-emerald-500 mb-1">Collected</p>
            <p className="text-sm font-black text-emerald-700">₹{grandPaid.toLocaleString('en-IN')}</p>
          </div>
          <div className={`text-center rounded-xl py-3 ${grandBalance > 0 ? 'bg-rose-50' : 'bg-gray-50'}`}>
            <p className={`text-[10px] font-bold uppercase tracking-[.12em] mb-1 ${grandBalance > 0 ? 'text-rose-400' : 'text-gray-400'}`}>
              Outstanding
            </p>
            <p className={`text-sm font-black ${grandBalance > 0 ? 'text-rose-600' : 'text-gray-400'}`}>
              ₹{grandBalance.toLocaleString('en-IN')}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}