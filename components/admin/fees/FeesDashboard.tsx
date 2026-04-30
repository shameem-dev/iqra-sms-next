'use client'
import { useState, useCallback } from 'react'
import type { Student, FeeRowUI } from '@/type/fees'
import {
  FEE_TYPES,
  getOrCreateFeeRows,
  deleteFeeRow,
  updateTotal,
  savePayment
} from '@/utils/actions/fees'
import StudentSearch from './StudentSearch'
import FeeTable from './FeeTable'
import { printReceipt } from './PrintReceipt'

export default function FeesDashboard() {
  const [selected, setSelected] = useState<Student | null>(null)
  const [feeRows, setFeeRows] = useState<FeeRowUI[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const year = new Date().getFullYear()

  const loadFees = useCallback(async (student: Student) => {
    setSelected(student)
    setLoading(true)
    try {
      const rows = await getOrCreateFeeRows(student.id!)
      const uiRows: FeeRowUI[] = FEE_TYPES.map(ft => {
        const row = rows.find(r => r.fee_type === ft.key)
        return {
          id: row?.id ?? 0,
          student_id: student.id!,
          fee_type: ft.key,
          total_amount: row?.total_amount ?? 0,
          paid_amount: row?.paid_amount ?? 0,
          academic_year: row?.academic_year ?? '2026-2027',
          label: ft.label,
          balance: (row?.total_amount ?? 0) - (row?.paid_amount ?? 0),
          payNow: 0,
        }
      })
      setFeeRows(uiRows)
    } catch {
      alert('Error loading fees')
    } finally {
      setLoading(false)
    }
  }, [])

  const handleChange = (
    id: number,
    field: 'total_amount' | 'payNow',
    value: number
  ) => {
    setFeeRows(prev =>
      prev.map(r => {
        if (r.id !== id) return r
        const updated = { ...r, [field]: value }
        updated.balance = updated.total_amount - updated.paid_amount
        return updated
      })
    )
  }

  const handleSaveTotal = async () => {
    try {
      await Promise.all(feeRows.map(r => updateTotal(r.id, r.total_amount)))
      alert('Fee structure saved!')
    } catch {
      alert('Error saving fee structure')
    }
  }

  const handleSavePayment = async () => {
    if (!selected) return

    const payments = feeRows
      .filter(r => r.payNow > 0)
      .map(r => ({
        id: r.id,
        fee_type: r.fee_type,
        payNow: r.payNow
      }))

    if (payments.length === 0) {
      alert('Enter an amount in Pay now column first')
      return
    }

    setSaving(true)
    try {
      const receipt = await savePayment(selected.id!, payments)
      await loadFees(selected)
      if (receipt) printReceipt(selected, receipt)
    } catch {
      alert('Error saving payment')
    } finally {
      setSaving(false)
    }
  }

  const initials = (name: string) =>
    name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()

  const handleDelete = async (id: number) => {
  if (!confirm('Delete this fee row?')) return
  try {
    await deleteFeeRow(id)
    setFeeRows(prev => prev.filter(r => r.id !== id))
  } catch {
    alert('Error deleting fee')
  }
}

  return (
    <div className="min-h-screen bg-gray-50 p-2 md:p-2">
      <div className="max-w-8xl mx-auto">

        

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* Left — Student list */}
          <div className="md:col-span-1">
            <StudentSearch onSelect={loadFees} selected={selected} />
          </div>

          {/* Right — Fee table */}
          <div className="md:col-span-2">
            {!selected ? (
              <div className="bg-white border border-gray-100 rounded-2xl p-16 text-center">
                <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-3">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-300">
                    <path d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/>
                  </svg>
                </div>
                <p className="text-gray-400 text-sm">
                  Select a student to view fee structure
                </p>
              </div>

            ) : loading ? (
              <div className="bg-white border border-gray-100 rounded-2xl p-16 text-center">
                <p className="text-gray-400 text-sm animate-pulse">
                  Loading fees...
                </p>
              </div>

            ) : (
              <div className="bg-white border border-gray-100 rounded-2xl p-6">

                {/* Student header */}
                <div className="flex items-center justify-between mb-5 pb-4 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-sm font-medium text-blue-700 shrink-0">
                      {initials(selected.name)}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {selected.name}
                      </p>
                      <p className="text-xs text-gray-400">
                        Adm: {selected.admission_no} · Std: {selected.standard}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-400 bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
                    {year}-{year+1}
                  </span>
                </div>

                {/* Fee table */}
                
                <FeeTable
                  rows={feeRows}
                  onChange={handleChange}
                  onDelete={handleDelete}  
                />

                {/* Summary cards */}
                <div className="grid grid-cols-3 gap-3 mt-5">
                  <div className="bg-gray-50 rounded-xl p-3 text-center">
                    <p className="text-xs text-gray-400 mb-1">Total fees</p>
                    <p className="text-base font-medium text-gray-800">
                      ₹{feeRows.reduce((s, r) => s + r.total_amount, 0).toLocaleString('en-IN')}
                    </p>
                  </div>
                  <div className="bg-green-50 rounded-xl p-3 text-center">
                    <p className="text-xs text-green-600 mb-1">Total paid</p>
                    <p className="text-base font-medium text-green-700">
                      ₹{feeRows.reduce((s, r) => s + r.paid_amount, 0).toLocaleString('en-IN')}
                    </p>
                  </div>
                  <div className="bg-red-50 rounded-xl p-3 text-center">
                    <p className="text-xs text-red-400 mb-1">Balance due</p>
                    <p className="text-base font-medium text-red-600">
                      ₹{feeRows.reduce((s, r) => s + r.balance, 0).toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 mt-5 pt-4 border-t border-gray-100">
                  <button
                    onClick={handleSaveTotal}
                    className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-700"
                  >
                    Save fee structure
                  </button>
                  <button
                    onClick={handleSavePayment}
                    disabled={saving}
                    className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? 'Saving...' : 'Save & print receipt'}
                  </button>
                </div>

              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}