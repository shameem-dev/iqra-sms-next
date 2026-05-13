'use client'

import { StudentFeeStatus } from '@/type/fees'

interface Props {
  students: StudentFeeStatus[]
  standard: string
  academicYear: string
  feeTypeFilter?: string 
}

export default function FeePdfReport({ students, standard, academicYear, feeTypeFilter = '' }: Props) {

  // ── When a fee type filter is active, compute stats for that fee only ──
  const getStudentFeeRow = (s: StudentFeeStatus) =>
    feeTypeFilter ? s.fees.find((f: any) => f.fee_type === feeTypeFilter) : null

  const resolvedTotal   = (s: StudentFeeStatus) => feeTypeFilter ? (getStudentFeeRow(s)?.total_amount ?? 0) : s.totalAmount
  const resolvedPaid    = (s: StudentFeeStatus) => feeTypeFilter ? (getStudentFeeRow(s)?.paid_amount  ?? 0) : s.totalPaid
  const resolvedBalance = (s: StudentFeeStatus) => resolvedTotal(s) - resolvedPaid(s)
  const resolvedStatus  = (s: StudentFeeStatus) => {
    const t = resolvedTotal(s), p = resolvedPaid(s)
    if (t === 0) return 'paid'
    if (p >= t)  return 'paid'
    if (p > 0)   return 'partial'
    return 'pending'
  }

  const totalStudents = students.length
  const paid    = students.filter(s => resolvedStatus(s) === 'paid').length
  const partial = students.filter(s => resolvedStatus(s) === 'partial').length
  const pending = students.filter(s => resolvedStatus(s) === 'pending').length

  const grandTotal   = students.reduce((sum, s) => sum + resolvedTotal(s),   0)
  const grandPaid    = students.reduce((sum, s) => sum + resolvedPaid(s),    0)
  const grandBalance = students.reduce((sum, s) => sum + resolvedBalance(s), 0)
  const collectPercent = grandTotal === 0 ? '0.0' : ((grandPaid / grandTotal) * 100).toFixed(1)

  const printDate = new Date().toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  })

  // ── Title ──────────────────────────────────────────────────────────────
  const reportTitle = feeTypeFilter
    ? `Fee Status Report — ${feeTypeFilter}`
    : 'Fee Status Report'

  function buildHTML(): string {
    const rows = students.map((s, idx) => {
      const t = resolvedTotal(s), p = resolvedPaid(s), b = resolvedBalance(s)
      const st = resolvedStatus(s)
      const statusLabel = st === 'paid' ? 'PAID' : st === 'partial' ? 'PARTIAL' : 'PENDING'
      const balanceStyle = b > 0 ? 'color:#ef4444;font-weight:600' : 'color:#9ca3af'
      return `
        <tr>
          <td>${idx + 1}</td>
          <td style="font-weight:600">${s.name}</td>
          <td>${s.admission_no}</td>
          <td>${s.standard}</td>
          <td><span class="status-${st}">${statusLabel}</span></td>
          <td style="text-align:right">Rs.${t.toLocaleString()}</td>
          <td style="text-align:right;color:#0d9488;font-weight:600">Rs.${p.toLocaleString()}</td>
          <td style="text-align:right"><span style="${balanceStyle}">Rs.${b.toLocaleString()}</span></td>
        </tr>`
    }).join('')

    const totalBalStyle = grandBalance > 0 ? 'color:#ef4444' : 'color:#9ca3af'

    // column header label changes when fee type is filtered
    const amountColHeader = feeTypeFilter ? feeTypeFilter : 'Total Fees'

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>${reportTitle} - ${standard || 'All Classes'} - ${academicYear}</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family:Arial,sans-serif; font-size:12px; color:#374151; padding:28px; }
    h1 { font-size:20px; font-weight:bold; color:#111827; }
    .subtitle { font-size:11px; color:#6b7280; margin-top:4px; }
    .fee-filter-badge { display:inline-block; margin-top:8px; background:#ccfbf1; color:#0f766e; border:1px solid #99f6e4; border-radius:20px; padding:3px 12px; font-size:11px; font-weight:600; }
    .summary-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:10px; margin:16px 0; }
    .summary-card { border:1px solid #e5e7eb; border-radius:8px; padding:12px; text-align:center; }
    .num { font-size:22px; font-weight:bold; }
    .lbl { font-size:10px; color:#9ca3af; margin-top:3px; }
    .meta { display:flex; gap:0; margin:0 0 16px; border:1px solid #e5e7eb; border-radius:8px; overflow:hidden; }
    .meta-item { flex:1; text-align:center; padding:12px 8px; background:#f9fafb; border-right:1px solid #e5e7eb; }
    .meta-item:last-child { border-right:none; }
    .meta-val { font-size:16px; font-weight:bold; color:#0d9488; }
    .meta-lbl { font-size:10px; color:#9ca3af; margin-top:3px; }
    table { width:100%; border-collapse:collapse; }
    th { background:#0d9488; color:white; font-size:10px; font-weight:600; padding:9px 10px; text-align:left; }
    th:nth-child(n+6) { text-align:right; }
    td { padding:7px 10px; font-size:11px; border-bottom:1px solid #f3f4f6; vertical-align:middle; }
    tr:nth-child(even) td { background:#f9fafb; }
    .status-paid    { background:#ccfbf1; color:#0f766e; border-radius:4px; padding:2px 8px; font-size:10px; font-weight:600; display:inline-block; }
    .status-partial { background:#fef3c7; color:#b45309; border-radius:4px; padding:2px 8px; font-size:10px; font-weight:600; display:inline-block; }
    .status-pending { background:#fee2e2; color:#dc2626; border-radius:4px; padding:2px 8px; font-size:10px; font-weight:600; display:inline-block; }
    .total-row td { font-weight:bold; background:#f0fdfa !important; border-top:2px solid #0d9488; font-size:12px; }
    .footer { margin-top:24px; text-align:center; font-size:10px; color:#9ca3af; border-top:1px solid #e5e7eb; padding-top:12px; }
    @media print { body { padding:12px; } }
  </style>
</head>
<body>
  <h1>IQRA SCHOOL &mdash; ${reportTitle}</h1>
  <p class="subtitle">
    Class: ${standard || 'All Classes'} &nbsp;&bull;&nbsp;
    Academic Year: ${academicYear} &nbsp;&bull;&nbsp;
    Generated: ${printDate}
  </p>
  ${feeTypeFilter ? `<div class="fee-filter-badge">📋 Filtered by: ${feeTypeFilter}</div>` : ''}

  <div class="summary-grid" style="margin-top:16px">
    <div class="summary-card"><div class="num" style="color:#374151">${totalStudents}</div><div class="lbl">Total Students</div></div>
    <div class="summary-card"><div class="num" style="color:#0d9488">${paid}</div><div class="lbl">Fully Paid</div></div>
    <div class="summary-card"><div class="num" style="color:#d97706">${partial}</div><div class="lbl">Partial</div></div>
    <div class="summary-card"><div class="num" style="color:#ef4444">${pending}</div><div class="lbl">Pending</div></div>
  </div>
  <div class="meta">
    <div class="meta-item"><div class="meta-val">Rs.${grandTotal.toLocaleString()}</div><div class="meta-lbl">${feeTypeFilter ? feeTypeFilter + ' Total' : 'Total Fees'}</div></div>
    <div class="meta-item"><div class="meta-val">Rs.${grandPaid.toLocaleString()}</div><div class="meta-lbl">Collected</div></div>
    <div class="meta-item">
      <div class="meta-val" style="${grandBalance > 0 ? 'color:#ef4444' : 'color:#9ca3af'}">Rs.${grandBalance.toLocaleString()}</div>
      <div class="meta-lbl">Outstanding</div>
    </div>
    <div class="meta-item"><div class="meta-val">${collectPercent}%</div><div class="meta-lbl">Collection Rate</div></div>
  </div>
  <table>
    <thead>
      <tr>
        <th>#</th><th>Student Name</th><th>Adm No</th><th>Class</th><th>Status</th>
        <th style="text-align:right">${amountColHeader}</th>
        <th style="text-align:right">Paid</th>
        <th style="text-align:right">Balance</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
      <tr class="total-row">
        <td colspan="5">TOTAL (${totalStudents} students)</td>
        <td style="text-align:right">Rs.${grandTotal.toLocaleString()}</td>
        <td style="text-align:right;color:#0d9488">Rs.${grandPaid.toLocaleString()}</td>
        <td style="text-align:right;${totalBalStyle}">Rs.${grandBalance.toLocaleString()}</td>
      </tr>
    </tbody>
  </table>
  <div class="footer">
    <p>Iqra School &mdash; ${reportTitle} &mdash; ${academicYear}</p>
    <p style="margin-top:4px">This is a computer-generated report.</p>
  </div>
</body>
</html>`
  }

  function handlePrint() {
    const html = buildHTML()
    const printWindow = window.open('', '_blank', 'width=900,height=700')
    if (!printWindow) {
      alert('Please allow popups for this site to print the report.')
      return
    }
    printWindow.document.open()
    printWindow.document.write(html)
    printWindow.document.close()
    printWindow.onload = () => {
      printWindow.focus()
      printWindow.print()
    }
  }

  return (
    <button onClick={handlePrint}
      className="flex items-center gap-2 border border-gray-300 text-white-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-600 hover:border-white transition-all bg-gray-700">
      Print / Export Report
    </button>
  )
}