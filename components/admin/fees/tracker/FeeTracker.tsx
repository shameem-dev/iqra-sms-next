'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { ACADEMIC_YEAR, getFeeStatus } from '@/utils/actions/feeConstants'
import { StudentFeeStatus } from '@/type/fees'
import FeeFilters from '@/components/admin/fees/tracker/FeeFilters'
import FeeSummaryBar from '@/components/admin/fees/tracker/FeeSummaryBar'
import FeeTableAll from '@/components/admin/fees/tracker/FeeTableAll'
import FeeTableSingle from '@/components/admin/fees/tracker/FeeTableSingle'
import FeePdfReport from '@/components/admin/fees/tracker/FeePdfReport'

interface Props {
  onGoToPayment: (student: {
    id: number
    name: string
    admission_no: string
    standard: string
  }) => void
}

export default function FeeTrackerPage({ onGoToPayment }: Props) {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!
  )

  const [selectedStandard, setSelectedStandard] = useState('')
  const [statusFilter, setStatusFilter]         = useState<'all' | 'paid' | 'partial' | 'pending'>('all')
  const [feeTypeFilter, setFeeTypeFilter]       = useState('')
  const [search, setSearch]                     = useState('')
  const [allStudents, setAllStudents]           = useState<StudentFeeStatus[]>([])
  const [loading, setLoading]                   = useState(false)
  const [selectedStudent, setSelectedStudent]   = useState<StudentFeeStatus | null>(null)
  const [error, setError]                       = useState('')

  const fetchAll = useCallback(async () => {
    setLoading(true)
    setError('')
    setSelectedStudent(null)

    let query = supabase
      .from('students_list')
      .select('id, name, admission_no, standard')
      .order('admission_no')

    if (selectedStandard) query = query.eq('standard', selectedStandard)

    const { data: studentsList, error: studentsError } = await query
    if (studentsError) { setError(studentsError.message); setLoading(false); return }
    if (!studentsList || studentsList.length === 0) { setAllStudents([]); setLoading(false); return }

    const studentIds = studentsList.map((s: any) => s.id)
    const { data: feesData, error: feesError } = await supabase
      .from('student_fees')
      .select('*')
      .in('student_id', studentIds)
      .eq('academic_year', ACADEMIC_YEAR)

    if (feesError) { setError(feesError.message); setLoading(false); return }

    const studentsWithFees: StudentFeeStatus[] = studentsList.map((s: any) => {
      const fees         = feesData?.filter((f: any) => f.student_id === s.id) || []
      const totalAmount  = fees.reduce((sum: number, f: any) => sum + (f.total_amount || 0), 0)
      const totalPaid    = fees.reduce((sum: number, f: any) => sum + (f.paid_amount  || 0), 0)
      const totalBalance = totalAmount - totalPaid
      return {
        student_id: s.id, name: s.name,
        admission_no: s.admission_no, standard: s.standard,
        fees, totalAmount, totalPaid, totalBalance,
        status: getFeeStatus(totalPaid, totalAmount),
      }
    })

    setAllStudents(studentsWithFees)
    setLoading(false)
  }, [selectedStandard])

  useEffect(() => { fetchAll() }, [fetchAll])

  const filteredStudents = useMemo(() => {
    return allStudents.filter(s => {
      const q = search.toLowerCase()
      const matchSearch = !search || s.name.toLowerCase().includes(q) || s.admission_no.toLowerCase().includes(q)

      let matchFeeStatus = true
      if (feeTypeFilter) {
        const feeRow = s.fees.find((f: any) => f.fee_type === feeTypeFilter)
        if (!feeRow) {
          matchFeeStatus = false
        } else if (statusFilter !== 'all') {
          const feeStatus = getFeeStatus(feeRow.paid_amount || 0, feeRow.total_amount || 0)
          matchFeeStatus = feeStatus === statusFilter
        }
      } else {
        matchFeeStatus = statusFilter === 'all' || s.status === statusFilter
      }

      return matchSearch && matchFeeStatus
    })
  }, [allStudents, search, statusFilter, feeTypeFilter])

  function handleSelectStandard(standard: string) {
    setSelectedStandard(standard)
    setSearch('')
    setStatusFilter('all')
    setFeeTypeFilter('')
    setSelectedStudent(null)
  }

  function handleSelectFeeType(feeType: string) {
    setFeeTypeFilter(feeType)
    setStatusFilter('all')
  }

  return (
    <div className="p-4  mx-auto">
      <div className="flex justify-between items-center mb-5">
        <div>
          <p className="text-xs text-gray-500 mt-1   py-1 rounded-2xl">Academic Year: {ACADEMIC_YEAR}</p>
        </div>
        <button
          onClick={() => onGoToPayment({ id: 0, name: '', admission_no: '', standard: '' })}
          className="bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-teal-700 transition-all">
          Assign Payment
        </button>
      </div>

      {(feeTypeFilter || statusFilter !== 'all') && (
        <div className="flex flex-wrap gap-2 mb-4">
          {feeTypeFilter && (
            <span className="flex items-center gap-1.5 bg-teal-50 border border-teal-200 text-teal-600 text-xs font-medium px-3 py-1 rounded-full">
              Fee: {feeTypeFilter}
              <button onClick={() => { setFeeTypeFilter(''); setStatusFilter('all') }} className="hover:text-teal-800 font-bold text-sm leading-none">×</button>
            </span>
          )}
          {statusFilter !== 'all' && (
            <span className="flex items-center gap-1.5 bg-gray-100 border border-gray-200 text-gray-600 text-xs font-medium px-3 py-1 rounded-full">
              Status: {statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}
              <button onClick={() => setStatusFilter('all')} className="hover:text-gray-800 font-bold text-sm leading-none">×</button>
            </span>
          )}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg mb-4">{error}</div>
      )}

      <div className="flex flex-col lg:flex-row gap-4">
        <div className="w-full lg:w-64 shrink-0">
          <FeeFilters
            selectedStandard={selectedStandard}
            onSelectStandard={handleSelectStandard}
            statusFilter={statusFilter}
            onSelectStatus={setStatusFilter}
            feeTypeFilter={feeTypeFilter}
            onSelectFeeType={handleSelectFeeType}
            search={search}
            onSearch={setSearch}
          />
        </div>

        <div className="flex-1 min-w-0 space-y-4">
          {selectedStudent ? (
            <FeeTableSingle
              student={selectedStudent}
              onClose={() => setSelectedStudent(null)}
              onGoToPayment={onGoToPayment}
            />
          ) : (
            <>
              {!loading && allStudents.length > 0 && <FeeSummaryBar students={filteredStudents} />}
              {!loading && filteredStudents.length > 0 && (
                <div className="flex justify-end">
                  <FeePdfReport
                    students={filteredStudents}
                    standard={selectedStandard}
                    academicYear={ACADEMIC_YEAR}
                    feeTypeFilter={feeTypeFilter}
                  />
                </div>
              )}
              <FeeTableAll
                students={filteredStudents}
                onSelectStudent={setSelectedStudent}
                loading={loading}
                feeTypeFilter={feeTypeFilter}
              />
            </>
          )}
        </div>
      </div>
    </div>
  )
}