'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import {
  ALL_STANDARDS,INSTALLMENT_FEE_TYPES, VEHICLE_FEE_TYPES, ACADEMIC_YEAR,
} from '@/utils/actions/feeConstants'
import {
  Check,
  Search,
  X,
  CheckCircle,
  SkipForward,
  XCircle,
  Plus,
  GraduationCap,
  Bus,
} from 'lucide-react'

interface Student {
  id: number
  name: string
  admission_no: string
  standard: string
}

type FeeCategory = 'installment' | 'vehicle'

export default function BulkFeeAssignment() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!
  )

  // ── Step state ────────────────────────────────────────────────────────
  const [step, setStep] = useState<1 | 2 | 3>(1)

  // ── Step 1 state ──────────────────────────────────────────────────────
  const [selectedStandard, setSelectedStandard] = useState('')
  const [feeCategory, setFeeCategory]           = useState<FeeCategory>('installment')
  const [selectedFeeType, setSelectedFeeType]   = useState('')
  const [amount, setAmount]                     = useState<number>(0)
  const [step1Error, setStep1Error]             = useState('')

  // ── Step 2 state ──────────────────────────────────────────────────────
  const [students, setStudents]           = useState<Student[]>([])
  const [loadingStudents, setLoadingStudents] = useState(false)
  const [selectedIds, setSelectedIds]     = useState<Set<number>>(new Set())
  const [search, setSearch]              = useState('')
  const [step2Error, setStep2Error]       = useState('')

  // ── Step 3 state ──────────────────────────────────────────────────────
  const [assigning, setAssigning]         = useState(false)
  const [assignResults, setAssignResults] = useState<{
    success: string[]
    skipped: string[]
    failed: string[]
  } | null>(null)

  // ── Fee type options based on category ───────────────────────────────
  const feeTypeOptions = feeCategory === 'installment'
    ? [...INSTALLMENT_FEE_TYPES]
    : [...VEHICLE_FEE_TYPES]

  // Reset fee type when category changes
  useEffect(() => {
    setSelectedFeeType('')
  }, [feeCategory])

  // ── Fetch students when standard selected ─────────────────────────────
  async function fetchStudents(standard: string) {
    setLoadingStudents(true)
    setStep2Error('')
    const { data, error } = await supabase
      .from('students_list')
      .select('id, name, admission_no, standard')
      .eq('standard', standard)
      .order('admission_no')

    if (error) { setStep2Error(error.message); setLoadingStudents(false); return }
    setStudents(data || [])
    setSelectedIds(new Set())
    setLoadingStudents(false)
  }

  // ── Step 1 → Step 2 ───────────────────────────────────────────────────
  function handleProceedToStudents() {
    setStep1Error('')
    if (!selectedStandard) { setStep1Error('Please select a class.'); return }
    if (!selectedFeeType)  { setStep1Error('Please select a fee type.'); return }
    if (amount <= 0)       { setStep1Error('Please enter a valid amount.'); return }
    fetchStudents(selectedStandard)
    setStep(2)
  }

  // ── Student toggle ────────────────────────────────────────────────────
  function toggleStudent(id: number) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  // ── Step 2 → Step 3 ───────────────────────────────────────────────────
  function handleProceedToConfirm() {
    setStep2Error('')
    if (selectedIds.size === 0) {
      setStep2Error('Please select at least one student.')
      return
    }
    setStep(3)
  }

  // ── Assign fees ───────────────────────────────────────────────────────
  async function handleAssign() {
    setAssigning(true)
    const results = { success: [] as string[], skipped: [] as string[], failed: [] as string[] }
    const selectedStudents = students.filter(s => selectedIds.has(s.id))

    for (const student of selectedStudents) {
      const { data: existing } = await supabase
        .from('student_fees')
        .select('id')
        .eq('student_id', student.id)
        .eq('fee_type', selectedFeeType)
        .eq('academic_year', ACADEMIC_YEAR)
        .single()

      if (existing) {
        results.skipped.push(`${student.name} (${student.admission_no})`)
        continue
      }

      const { error } = await supabase.from('student_fees').insert({
        student_id:    student.id,
        fee_type:      selectedFeeType,
        total_amount:  amount,
        paid_amount:   0,
        academic_year: ACADEMIC_YEAR,
      })

      if (error) {
        results.failed.push(`${student.name} (${student.admission_no})`)
      } else {
        results.success.push(`${student.name} (${student.admission_no})`)
      }
    }

    setAssignResults(results)
    setAssigning(false)
  }

  // ── Reset everything ──────────────────────────────────────────────────
  function handleReset() {
    setStep(1)
    setSelectedStandard('')
    setFeeCategory('installment')
    setSelectedFeeType('')
    setAmount(0)
    setStep1Error('')
    setStudents([])
    setSelectedIds(new Set())
    setSearch('')
    setStep2Error('')
    setAssignResults(null)
  }

  // ── Filtered students ─────────────────────────────────────────────────
  const filteredStudents = students.filter(s => {
    const q = search.toLowerCase()
    return s.name.toLowerCase().includes(q) || s.admission_no.toLowerCase().includes(q)
  })

  // ── Step indicator ────────────────────────────────────────────────────
  const steps = [
    { n: 1, label: 'Fee Setup' },
    { n: 2, label: 'Select Students' },
    { n: 3, label: 'Confirm & Assign' },
  ]

  return (
    <div className="space-y-6">

      {/* ── Step Indicator ── */}
      <div className="flex items-center gap-0">
        {steps.map((s, i) => (
          <div key={s.n} className="flex items-center flex-1">
            <div className="flex flex-col items-center flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all
                ${step === s.n
                  ? 'bg-teal-600 border-teal-600 text-white'
                  : step > s.n
                  ? 'bg-teal-100 border-teal-400 text-teal-600'
                  : 'bg-gray-100 border-gray-300 text-gray-400'}`}>
                {step > s.n ? <Check className="w-3.5 h-3.5" /> : s.n}
              </div>
              <p className={`text-xs mt-1 font-medium
                ${step === s.n ? 'text-teal-600' : step > s.n ? 'text-teal-400' : 'text-gray-400'}`}>
                {s.label}
              </p>
            </div>
            {i < steps.length - 1 && (
              <div className={`h-0.5 flex-1 mb-5 transition-all
                ${step > s.n ? 'bg-teal-400' : 'bg-gray-200'}`} />
            )}
          </div>
        ))}
      </div>

      {/* ════════════════════════════════════
          STEP 1 — Fee Setup
          ════════════════════════════════════ */}
      {step === 1 && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-5">
          <div>
            <h2 className="text-sm font-bold text-gray-700">Step 1 — Fee Setup</h2>
            <p className="text-xs text-gray-400 mt-0.5">Select class, fee type and amount to assign</p>
          </div>

          {/* Class */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
              Class
            </label>
            <select
              value={selectedStandard}
              onChange={e => setSelectedStandard(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-600
                focus:outline-none focus:border-teal-400">
              <option value="">Select a class</option>
              {ALL_STANDARDS.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Fee Category */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
              Fee Category
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setFeeCategory('installment')}
                className={`py-2.5 px-4 rounded-lg text-sm font-semibold border transition-all flex items-center justify-center gap-2
                  ${feeCategory === 'installment'
                    ? 'bg-teal-600 text-white border-teal-600'
                    : 'bg-gray-50 text-gray-500 border-gray-200 hover:border-teal-300'}`}>
                <GraduationCap className="w-4 h-4" />
                Installment
              </button>
              <button
                onClick={() => setFeeCategory('vehicle')}
                className={`py-2.5 px-4 rounded-lg text-sm font-semibold border transition-all flex items-center justify-center gap-2
                  ${feeCategory === 'vehicle'
                    ? 'bg-teal-600 text-white border-teal-600'
                    : 'bg-gray-50 text-gray-500 border-gray-200 hover:border-teal-300'}`}>
                <Bus className="w-4 h-4" />
                Vehicle Fee
              </button>
            </div>
          </div>

          {/* Fee Type */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
              {feeCategory === 'installment' ? 'Installment Term' : 'Vehicle Term'}
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {feeTypeOptions.map(ft => (
                <button
                  key={ft}
                  onClick={() => setSelectedFeeType(ft)}
                  className={`py-2 px-3 rounded-lg text-xs font-medium border transition-all text-left
                    ${selectedFeeType === ft
                      ? 'bg-teal-600 text-white border-teal-600'
                      : 'bg-gray-50 text-gray-500 border-gray-200 hover:border-teal-300 hover:text-teal-600'}`}>
                  {ft}
                </button>
              ))}
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
              Amount per Student
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
              <input
                type="number"
                min={1}
                value={amount || ''}
                onChange={e => setAmount(parseInt(e.target.value) || 0)}
                placeholder="Enter amount"
                className="w-full border border-gray-300 rounded-lg pl-7 pr-3 py-2.5 text-sm
                  focus:outline-none focus:border-teal-400 text-gray-600"
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">
              This amount will be assigned individually to each selected student
            </p>
          </div>

          {/* Summary preview */}
          {selectedStandard && selectedFeeType && amount > 0 && (
            <div className="bg-teal-50 border border-teal-200 rounded-xl p-3">
              <p className="text-xs font-semibold text-teal-700 mb-1">Assignment Preview</p>
              <p className="text-xs text-teal-600">
                Class: <span className="font-bold">{selectedStandard}</span>
              </p>
              <p className="text-xs text-teal-600 mt-0.5">
                Fee: <span className="font-bold">{selectedFeeType}</span> — ₹{amount.toLocaleString()} per student
              </p>
            </div>
          )}

          {step1Error && (
            <p className="text-xs text-red-500 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">
              {step1Error}
            </p>
          )}

          <button
            onClick={handleProceedToStudents}
            className="w-full bg-teal-600 text-white py-3 rounded-xl text-sm font-semibold
              hover:bg-teal-700 transition-all">
            Next → Select Students
          </button>
        </div>
      )}

      {/* ════════════════════════════════════
          STEP 2 — Select Students
          ════════════════════════════════════ */}
      {step === 2 && (
        <div className="space-y-4">

          {/* Summary bar */}
          <div className="bg-teal-50 border border-teal-200 rounded-xl p-3 flex justify-between items-center">
            <div>
              <p className="text-xs font-semibold text-teal-700">{selectedFeeType}</p>
              <p className="text-xs text-teal-600 mt-0.5">
                {selectedStandard} · ₹{amount.toLocaleString()} per student
              </p>
            </div>
            <button
              onClick={() => { setStep(1); setSelectedIds(new Set()) }}
              className="text-xs text-teal-600 hover:text-teal-800 border border-teal-300
                rounded-lg px-2 py-1 hover:bg-teal-100 transition-all">
              Edit
            </button>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-sm font-bold text-gray-700">Step 2 — Select Students</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  {selectedIds.size} of {students.length} selected
                </p>
              </div>
              {students.length > 0 && (
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedIds(new Set(students.map(s => s.id)))}
                    className="text-xs text-teal-600 border border-teal-300 rounded-lg px-2.5 py-1
                      hover:bg-teal-50 transition-all font-medium">
                    All
                  </button>
                  <button
                    onClick={() => setSelectedIds(new Set())}
                    className="text-xs text-gray-500 border border-gray-300 rounded-lg px-2.5 py-1
                      hover:bg-gray-50 transition-all font-medium">
                    None
                  </button>
                </div>
              )}
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by name or admission no..."
                className="w-full border border-gray-300 rounded-xl pl-9 pr-9 py-2.5 text-sm
                  text-gray-600 focus:outline-none focus:border-teal-400 bg-white"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Student list */}
            {loadingStudents ? (
              <div className="text-center py-10 text-gray-400 text-sm">Loading students...</div>
            ) : filteredStudents.length === 0 ? (
              <div className="text-center py-10 text-gray-400 text-sm">No students found</div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {filteredStudents.map(student => {
                  const isSelected = selectedIds.has(student.id)
                  return (
                    <button
                      key={student.id}
                      onClick={() => toggleStudent(student.id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all
                        ${isSelected
                          ? 'border-teal-400 bg-teal-50'
                          : 'border-gray-200 bg-white hover:border-teal-300 hover:bg-gray-50'}`}>
                      {/* Checkbox */}
                      <div className={`w-5 h-5 rounded flex items-center justify-center shrink-0
                        border-2 transition-all
                        ${isSelected
                          ? 'bg-teal-600 border-teal-600'
                          : 'bg-white border-gray-300'}`}>
                        {isSelected && (
                          <Check className="w-3 h-3 text-white" strokeWidth={3} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-700 truncate">{student.name}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          Adm: {student.admission_no} · {student.standard}
                        </p>
                      </div>
                      {isSelected && (
                        <span className="text-xs text-teal-600 font-semibold shrink-0">
                          ₹{amount.toLocaleString()}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            )}

            {step2Error && (
              <p className="text-xs text-red-500 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">
                {step2Error}
              </p>
            )}

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setStep(1)}
                className="flex-1 border border-gray-300 text-gray-500 py-2.5 rounded-xl text-sm
                  font-medium hover:bg-gray-50">
                ← Back
              </button>
              <button
                onClick={handleProceedToConfirm}
                className="flex-1 bg-teal-600 text-white py-2.5 rounded-xl text-sm font-semibold
                  hover:bg-teal-700 transition-all">
                Next → Confirm ({selectedIds.size})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════
          STEP 3 — Confirm & Assign
          ════════════════════════════════════ */}
      {step === 3 && !assignResults && (
        <div className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
            <div>
              <h2 className="text-sm font-bold text-gray-700">Step 3 — Confirm Assignment</h2>
              <p className="text-xs text-gray-400 mt-0.5">Review before assigning</p>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Class</span>
                <span className="font-semibold text-gray-700">{selectedStandard}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Fee Type</span>
                <span className="font-semibold text-gray-700">{selectedFeeType}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Amount per Student</span>
                <span className="font-semibold text-teal-600">₹{amount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Students Selected</span>
                <span className="font-semibold text-gray-700">{selectedIds.size}</span>
              </div>
              <div className="border-t border-gray-200 pt-2 flex justify-between text-xs">
                <span className="text-gray-400">Total to Assign</span>
                <span className="font-bold text-gray-700 text-sm">
                  ₹{(amount * selectedIds.size).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Student list preview */}
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-2">
                Students ({selectedIds.size})
              </p>
              <div className="space-y-1.5 max-h-60 overflow-y-auto">
                {students
                  .filter(s => selectedIds.has(s.id))
                  .map(s => (
                    <div key={s.id}
                      className="flex justify-between items-center bg-gray-50 border border-gray-100
                        rounded-lg px-3 py-2">
                      <div>
                        <p className="text-xs font-semibold text-gray-700">{s.name}</p>
                        <p className="text-xs text-gray-400">{s.admission_no}</p>
                      </div>
                      <span className="text-xs font-semibold text-teal-600">
                        ₹{amount.toLocaleString()}
                      </span>
                    </div>
                  ))}
              </div>
            </div>

            <p className="text-xs text-yellow-700 bg-yellow-50 border border-yellow-200 px-3 py-2 rounded-lg">
              Students who already have <strong>{selectedFeeType}</strong> assigned will be skipped automatically.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(2)}
                className="flex-1 border border-gray-300 text-gray-500 py-2.5 rounded-xl text-sm
                  font-medium hover:bg-gray-50">
                ← Back
              </button>
              <button
                onClick={handleAssign}
                disabled={assigning}
                className="flex-1 bg-teal-600 text-white py-2.5 rounded-xl text-sm font-semibold
                  hover:bg-teal-700 disabled:opacity-50 transition-all">
                {assigning ? 'Assigning...' : `Assign to ${selectedIds.size} Students`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════
          STEP 3 — Results
          ════════════════════════════════════ */}
      {step === 3 && assignResults && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
          <div>
            <h2 className="text-sm font-bold text-gray-700">Assignment Complete</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {selectedFeeType} · {selectedStandard} · ₹{amount.toLocaleString()}
            </p>
          </div>

          {/* Result summary cards */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-teal-50 border border-teal-200 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-teal-600">{assignResults.success.length}</p>
              <p className="text-xs text-teal-500 mt-0.5">Assigned</p>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-yellow-600">{assignResults.skipped.length}</p>
              <p className="text-xs text-yellow-500 mt-0.5">Skipped</p>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-red-500">{assignResults.failed.length}</p>
              <p className="text-xs text-red-400 mt-0.5">Failed</p>
            </div>
          </div>

          {/* Assigned list */}
          {assignResults.success.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-teal-600 mb-2 flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" />
                Successfully assigned ({assignResults.success.length})
              </p>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {assignResults.success.map((name, i) => (
                  <p key={i} className="text-xs text-gray-600 bg-teal-50 px-3 py-1.5 rounded-lg">
                    {name}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Skipped list */}
          {assignResults.skipped.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-yellow-600 mb-2 flex items-center gap-1">
                <SkipForward className="w-3.5 h-3.5" />
                Skipped — already assigned ({assignResults.skipped.length})
              </p>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {assignResults.skipped.map((name, i) => (
                  <p key={i} className="text-xs text-gray-600 bg-yellow-50 px-3 py-1.5 rounded-lg">
                    {name}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Failed list */}
          {assignResults.failed.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-red-500 mb-2 flex items-center gap-1">
                <XCircle className="w-3.5 h-3.5" />
                Failed ({assignResults.failed.length})
              </p>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {assignResults.failed.map((name, i) => (
                  <p key={i} className="text-xs text-gray-600 bg-red-50 px-3 py-1.5 rounded-lg">
                    {name}
                  </p>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={handleReset}
            className="w-full bg-teal-600 text-white py-3 rounded-xl text-sm font-semibold
              hover:bg-teal-700 transition-all flex items-center justify-center gap-2">
            <Plus className="w-4 h-4" />
            New Bulk Assignment
          </button>
        </div>
      )}
    </div>
  )
}