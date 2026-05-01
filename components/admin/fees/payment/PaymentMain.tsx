'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import {
  ALL_STANDARDS, getDefaultAmount,
  ACADEMIC_YEAR, generateReceiptNo, FIXED_FEE_TYPES,
} from '@/utils/actions/feeConstants'
import { FeeRowUI, PaymentDetail } from '@/type/fees'
import StudentSearch from '@/components/admin/fees/payment/StudentSearch'
import StudentFeeSummary from '@/components/admin/fees/payment/StudentFeeSummary'
import PaymentForm from '@/components/admin/fees/payment/PaymentForm'
import PaymentReceipt from '@/components/admin/fees/payment/PaymentReceipt'
import BulkFeeAssignment from '@/components/admin/fees/payment/BulkFeeAssignment'

interface Student {
  id: number
  name: string
  admission_no: string
  standard: string
}

interface StudentWithStatus extends Student {
  totalAmount: number
  totalPaid: number
  totalBalance: number
}

interface Props {
  preselectedStudent?: Student | null
  onBack?: () => void
}

type ActiveTab = 'individual' | 'bulk'

export default function PaymentPage({ preselectedStudent, onBack }: Props) {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!
  )

  const hasPreselected = !!preselectedStudent?.id

  // ── Tab state — always 'individual' if preselected ────────────────────
  const [activeTab, setActiveTab] = useState<ActiveTab>('individual')

  const [selectedStandard, setSelectedStandard] = useState('')
  const [students, setStudents]                 = useState<StudentWithStatus[]>([])
  const [loadingStudents, setLoadingStudents]   = useState(false)
  const [selectedStudent, setSelectedStudent]   = useState<Student | null>(null)
  const [fees, setFees]                         = useState<FeeRowUI[]>([])
  const [loadingFees, setLoadingFees]           = useState(false)
  const [showPaymentForm, setShowPaymentForm]   = useState(false)
  const [receiptData, setReceiptData]           = useState<{
    receiptNo: string
    date: string
    details: PaymentDetail[]
    totalPaid: number
    remainingBalance: number
  } | null>(null)
  const [error, setError] = useState('')

  // ── 1. Lowest-level helpers ───────────────────────────────────────────

  async function initializeFeesForStudent(student: Student) {
    const feeRows = [
      ...FIXED_FEE_TYPES.map(feeType => ({
        student_id: student.id, fee_type: feeType,
        total_amount: getDefaultAmount(feeType, student.standard),
        paid_amount: 0, academic_year: ACADEMIC_YEAR,
      })),
      {
        student_id: student.id, fee_type: 'Tuition Fee 1',
        total_amount: getDefaultAmount('Tuition Fee 1', student.standard),
        paid_amount: 0, academic_year: ACADEMIC_YEAR,
      }
    ]
    const { data, error } = await supabase.from('student_fees').insert(feeRows).select()
    if (error) { setError(error.message); return }
    if (data) {
      setFees(data.map((f: any) => ({
        ...f, label: f.fee_type,
        balance: f.total_amount - f.paid_amount, payNow: 0,
      })))
    }
  }

  async function fetchStudentFees(student: Student) {
    setLoadingFees(true)
    setError('')
    const { data: existingFees } = await supabase
      .from('student_fees')
      .select('*')
      .eq('student_id', student.id)
      .eq('academic_year', ACADEMIC_YEAR)

    if (!existingFees || existingFees.length === 0) {
      await initializeFeesForStudent(student)
    } else {
      setFees(existingFees.map((f: any) => ({
        ...f, label: f.fee_type,
        balance: f.total_amount - f.paid_amount, payNow: 0,
      })))
    }
    setLoadingFees(false)
  }

  async function fetchStudents() {
    setLoadingStudents(true)
    setError('')
    const { data: studentsList, error: studentsError } = await supabase
      .from('students_list')
      .select('id, name, admission_no, standard')
      .eq('standard', selectedStandard)
      .order('admission_no')

    if (studentsError) { setError(studentsError.message); setLoadingStudents(false); return }
    if (!studentsList || studentsList.length === 0) { setStudents([]); setLoadingStudents(false); return }

    const studentIds = studentsList.map((s: any) => s.id)
    const { data: feesData } = await supabase
      .from('student_fees')
      .select('*')
      .in('student_id', studentIds)
      .eq('academic_year', ACADEMIC_YEAR)

    const studentsWithStatus: StudentWithStatus[] = studentsList.map((s: any) => {
      const studentFees = feesData?.filter((f: any) => f.student_id === s.id) || []
      const totalAmount = studentFees.reduce((sum: number, f: any) => sum + (f.total_amount || 0), 0)
      const totalPaid   = studentFees.reduce((sum: number, f: any) => sum + (f.paid_amount  || 0), 0)
      return { ...s, totalAmount, totalPaid, totalBalance: totalAmount - totalPaid }
    })

    setStudents(studentsWithStatus)
    setLoadingStudents(false)
  }

  // ── 2. Mid-level handlers ─────────────────────────────────────────────

  async function handleSelectStudent(student: Student) {
    setSelectedStudent(student)
    setShowPaymentForm(false)
    setReceiptData(null)
    setError('')
    await fetchStudentFees(student)
  }

  async function handleAddTuition(feeType: string, totalAmount: number) {
    if (!selectedStudent) return
    const { data, error } = await supabase
      .from('student_fees')
      .insert({
        student_id: selectedStudent.id, fee_type: feeType,
        total_amount: totalAmount, paid_amount: 0, academic_year: ACADEMIC_YEAR,
      }).select().single()
    if (error) { setError(error.message); return }
    if (data) {
      setFees(prev => [...prev, {
        ...data, label: data.fee_type,
        balance: data.total_amount - data.paid_amount, payNow: 0,
      }])
    }
  }

  async function handleDeleteTuition(feeRowId: number) {
    const { error } = await supabase.from('student_fees').delete().eq('id', feeRowId)
    if (error) { setError(error.message); return }
    setFees(prev => prev.filter(f => f.id !== feeRowId))
  }

  async function handleAddVehicle(feeType: string, totalAmount: number) {
    if (!selectedStudent) return
    const { data, error } = await supabase
      .from('student_fees')
      .insert({
        student_id: selectedStudent.id, fee_type: feeType,
        total_amount: totalAmount, paid_amount: 0, academic_year: ACADEMIC_YEAR,
      }).select().single()
    if (error) { setError(error.message); return }
    if (data) {
      setFees(prev => [...prev, {
        ...data, label: data.fee_type,
        balance: data.total_amount - data.paid_amount, payNow: 0,
      }])
    }
  }

  async function handleDeleteVehicle(feeRowId: number) {
    const { error } = await supabase.from('student_fees').delete().eq('id', feeRowId)
    if (error) { setError(error.message); return }
    setFees(prev => prev.filter(f => f.id !== feeRowId))
  }

  async function handleEditVehicle(feeRowId: number, newTotalAmount: number) {
    const fee = fees.find(f => f.id === feeRowId)
    if (!fee) return
    if (newTotalAmount < fee.paid_amount) {
      setError(`Total cannot be less than already paid ₹${fee.paid_amount}`)
      return
    }
    const { error } = await supabase
      .from('student_fees').update({ total_amount: newTotalAmount }).eq('id', feeRowId)
    if (error) { setError(error.message); return }
    setFees(prev => prev.map(f =>
      f.id === feeRowId
        ? { ...f, total_amount: newTotalAmount, balance: newTotalAmount - f.paid_amount }
        : f
    ))
  }

  async function handleEditFee(feeId: number, newTotalAmount: number) {
    const { error } = await supabase
      .from('student_fees').update({ total_amount: newTotalAmount }).eq('id', feeId)
    if (error) { setError(error.message); return }
    setFees(prev => prev.map(f =>
      f.id === feeId
        ? { ...f, total_amount: newTotalAmount, balance: newTotalAmount - f.paid_amount }
        : f
    ))
  }

  async function handleSavePayment(details: PaymentDetail[], receiptNo: string, date: string) {
    if (!selectedStudent) return
    setError('')

    for (const detail of details) {
      const fee = fees.find(f => f.fee_type === detail.fee_type)
      if (!fee) continue
      const { error } = await supabase
        .from('student_fees')
        .update({ paid_amount: fee.paid_amount + detail.amount, updated_at: new Date().toISOString() })
        .eq('id', fee.id)
      if (error) { setError(error.message); return }
    }

    const totalPaid = details.reduce((sum, d) => sum + d.amount, 0)

    const { error: paymentError } = await supabase.from('fee_payments').insert({
      student_id: selectedStudent.id,
      receipt_no: receiptNo, total_paid: totalPaid,
      payment_date: date, academic_year: ACADEMIC_YEAR,
      payment_details: details,
    })
    if (paymentError) { setError(paymentError.message); return }

    const { error: accountError } = await supabase.from('account_entries').insert(
      details.map(d => ({
        type: 'income', date, amount: d.amount,
        income_category: d.fee_type, receipt_no: receiptNo,
        notes: `${selectedStudent.name} - ${selectedStudent.standard}`,
        is_deleted: false,
      }))
    )
    if (accountError) { setError(accountError.message); return }

    await fetchStudentFees(selectedStudent)
    const remainingBalance = fees.reduce((sum, f) => sum + f.balance, 0) - totalPaid
    setReceiptData({ receiptNo, date, details, totalPaid, remainingBalance })
    setShowPaymentForm(false)
  }

  // ── 3. Effects ────────────────────────────────────────────────────────

  useEffect(() => {
    if (hasPreselected) handleSelectStudent(preselectedStudent!)
  }, [])

  useEffect(() => {
    if (selectedStandard) fetchStudents()
  }, [selectedStandard])

  // ── 4. Derived values ─────────────────────────────────────────────────

  const fixedFees   = fees.filter(f => FIXED_FEE_TYPES.includes(f.fee_type as any))
  const tuitionFees = fees.filter(f => f.fee_type.startsWith('Tuition Fee'))
  const vehicleFees = fees.filter(f => f.fee_type.startsWith('Vehicle Fee'))
  const unpaidFees  = fees.filter(f => f.balance > 0)

  // ── 5. Shared fee detail JSX ──────────────────────────────────────────

  const feeDetailJSX = (
    <>
      {loadingFees && (
        <div className="text-center py-16 text-gray-400 text-sm">
          Loading fee details...
        </div>
      )}
      {!loadingFees && selectedStudent && (
        <>
          <StudentFeeSummary
            student={selectedStudent}
            fixedFees={fixedFees}
            tuitionFees={tuitionFees}
            vehicleFees={vehicleFees}
            onAddTuition={handleAddTuition}
            onDeleteTuition={handleDeleteTuition}
            onEditFee={handleEditFee}
            onAddVehicle={handleAddVehicle}
            onDeleteVehicle={handleDeleteVehicle}
            onEditVehicle={handleEditVehicle}
            onRecordPayment={() => setShowPaymentForm(true)}
            showPaymentForm={showPaymentForm}
          />
          {showPaymentForm && !receiptData && (
            <PaymentForm
              key={selectedStudent.id}
              unpaidFees={unpaidFees}
              onSave={handleSavePayment}
              onCancel={() => setShowPaymentForm(false)}
              receiptNo={generateReceiptNo()}
            />
          )}
          {receiptData && (
            <PaymentReceipt
              receiptNo={receiptData.receiptNo}
              paymentDate={receiptData.date}
              studentName={selectedStudent.name}
              admissionNo={selectedStudent.admission_no}
              standard={selectedStudent.standard}
              paymentDetails={receiptData.details}
              totalPaid={receiptData.totalPaid}
              remainingBalance={receiptData.remainingBalance}
              onNewPayment={() => { setReceiptData(null); setShowPaymentForm(true) }}
            />
          )}
        </>
      )}
    </>
  )

  // ── 6. Render ─────────────────────────────────────────────────────────

  return (
    <div className="p-6 max-w-5xl mx-auto">

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-700">Fee Payment Entry</h1>
          <p className="text-xs text-gray-400 mt-1">Academic Year: {ACADEMIC_YEAR}</p>
        </div>
        {onBack && (
          <button onClick={onBack}
            className="border border-gray-300 text-gray-500 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50">
            ← Back to Tracker
          </button>
        )}
      </div>

      {/* ── Tabs — hidden when preselected ── */}
      {!hasPreselected && (
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6">
          <button
            onClick={() => {
              setActiveTab('individual')
              setSelectedStudent(null)
              setFees([])
              setShowPaymentForm(false)
              setReceiptData(null)
              setError('')
            }}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-all
              ${activeTab === 'individual'
                ? 'bg-white text-teal-600 shadow-sm border border-gray-200'
                : 'text-gray-500 hover:text-gray-700'}`}>
            💳 Individual Payment
          </button>
          <button
            onClick={() => {
              setActiveTab('bulk')
              setError('')
            }}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-all
              ${activeTab === 'bulk'
                ? 'bg-white text-teal-600 shadow-sm border border-gray-200'
                : 'text-gray-500 hover:text-gray-700'}`}>
            📋 Bulk Assign Fees
          </button>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {/* ── CASE A: Preselected — fee detail only, no tabs ── */}
      {hasPreselected && feeDetailJSX}

      {/* ── CASE B: Individual tab ── */}
      {!hasPreselected && activeTab === 'individual' && (
        <>
          {!selectedStudent && (
            <StudentSearch
              students={students}
              selectedStandard={selectedStandard}
              onSelectStandard={(s) => {
                setSelectedStandard(s)
                setSelectedStudent(null)
                setFees([])
                setShowPaymentForm(false)
                setReceiptData(null)
              }}
              onSelectStudent={handleSelectStudent}
              loading={loadingStudents}
              standards={ALL_STANDARDS}
            />
          )}
          {selectedStudent && !loadingFees && (
            <button
              onClick={() => {
                setSelectedStudent(null)
                setFees([])
                setShowPaymentForm(false)
                setReceiptData(null)
              }}
              className="text-sm text-gray-500 hover:text-gray-700 mb-4 flex items-center gap-1">
              ← Back to student list
            </button>
          )}
          {selectedStudent && feeDetailJSX}
        </>
      )}

      {/* ── CASE C: Bulk Assign tab ── */}
      {!hasPreselected && activeTab === 'bulk' && (
        <BulkFeeAssignment />
      )}
    </div>
  )
}