import { Student, FeePayment } from '@/type/fees'

export function printReceipt(student: Student, receipt: FeePayment) {
  const win = window.open('', '_blank')
  win?.document.write(`
    <html>
    <head>
      <title>Fee Receipt - ${receipt.receipt_no}</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: Arial, sans-serif; padding: 40px; max-width: 580px; margin: auto; color: #222; }
        .header { text-align: center; margin-bottom: 24px; border-bottom: 2px solid #222; padding-bottom: 16px; }
        .header h1 { font-size: 22px; font-weight: 700; }
        .header p { font-size: 13px; color: #666; margin-top: 4px; }
        .receipt-no { display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 20px; color: #444; }
        .student-info { background: #f9f9f9; border: 1px solid #eee; border-radius: 8px; padding: 14px 16px; margin-bottom: 20px; }
        .student-info p { font-size: 13px; margin-bottom: 4px; }
        .student-info span { font-weight: 600; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
        th { font-size: 12px; text-align: left; padding: 8px 10px; background: #f0f0f0; border: 1px solid #ddd; }
        td { font-size: 13px; padding: 9px 10px; border: 1px solid #ddd; }
        td:last-child { text-align: right; font-weight: 600; }
        .total-row td { background: #f9f9f9; font-weight: 700; font-size: 14px; }
        .footer { display: flex; justify-content: space-between; margin-top: 40px; font-size: 12px; color: #888; }
        .stamp { border: 2px dashed #ccc; border-radius: 50%; width: 80px; height: 80px; display: flex; align-items: center; justify-content: center; font-size: 10px; color: #aaa; text-align: center; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>IQRA School</h1>
        <p>Fee Receipt</p>
      </div>
      <div class="receipt-no">
        <span>Receipt No: <strong>${receipt.receipt_no}</strong></span>
        <span>Date: ${new Date(receipt.payment_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
      </div>
      <div class="student-info">
        <p>Name: <span>${student.name}</span></p>
        <p>Admission No: <span>${student.admission_no}</span></p>
        <p>Standard: <span>${student.standard || '—'}</span></p>
        ${student.parent_guardian ? `<p>Parent: <span>${student.parent_guardian}</span></p>` : ''}
      </div>
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Fee type</th>
            <th style="text-align:right">Amount (₹)</th>
          </tr>
        </thead>
        <tbody>
          ${receipt.payment_details.map((p, i) => `
            <tr>
              <td>${i + 1}</td>
              <td>${p.label}</td>
              <td style="text-align:right">₹${p.amount.toLocaleString('en-IN')}</td>
            </tr>
          `).join('')}
          <tr class="total-row">
            <td colspan="2">Total paid</td>
            <td>₹${receipt.total_paid.toLocaleString('en-IN')}</td>
          </tr>
        </tbody>
      </table>
      <div class="footer">
        <div>
          <p>Academic year: ${receipt.academic_year}</p>
          <p style="margin-top:30px">Received by: _______________</p>
        </div>
        <div class="stamp">School<br/>Seal</div>
      </div>
      <script>window.print()<\/script>
    </body>
    </html>
  `)
  win?.document.close()
}