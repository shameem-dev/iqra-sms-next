'use client'

import { useState } from 'react'
import { getStatusConfig, getFeeStatus } from '@/utils/actions/feeConstants'

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
  students: StudentWithStatus[]
  selectedStandard: string
  onSelectStandard: (standard: string) => void
  onSelectStudent: (student: Student) => void
  loading: boolean
  standards: string[]
}

export default function StudentSearch({
  students, selectedStandard, onSelectStandard,
  onSelectStudent, loading, standards,
}: Props) {
  const [search, setSearch] = useState('')

  const filtered = students.filter(s => {
    const q = search.toLowerCase()
    return s.name.toLowerCase().includes(q) || s.admission_no.toLowerCase().includes(q)
  })

  return (
    <div className="space-y-4">
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <label className="block text-xs font-medium text-gray-500 mb-1">Select Class</label>
        <select value={selectedStandard} onChange={e => onSelectStandard(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-600 focus:outline-none focus:border-teal-400">
          <option value="">Select Class</option>
          {standards.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {selectedStandard && (
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or admission no..."
            className="w-full border border-gray-300 rounded-xl pl-9 pr-4 py-2.5 text-sm text-gray-600 focus:outline-none focus:border-teal-400 bg-white" />
          {search && (
            <button onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">×</button>
          )}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-400 text-sm">Loading students...</div>
      ) : !selectedStandard ? (
        <div className="text-center py-12 text-gray-400 text-sm">Select a class to view students</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400 text-sm">
          {search ? `No students found for "${search}"` : 'No students in this class'}
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-gray-400 px-1">{filtered.length} student{filtered.length !== 1 ? 's' : ''} found</p>
          {filtered.map(student => {
            const status = getFeeStatus(student.totalPaid, student.totalAmount)
            const config = getStatusConfig(status)
            const percent = student.totalAmount === 0 ? 0
              : Math.min((student.totalPaid / student.totalAmount) * 100, 100)
            return (
              <button key={student.id} onClick={() => onSelectStudent(student)}
                className="w-full bg-white border border-gray-200 rounded-xl p-4 text-left hover:border-teal-400 hover:shadow-sm transition-all group">
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-semibold text-gray-700 truncate">{student.name}</p>
                      <span className={`text-xs font-medium rounded-full px-2 py-0.5 border flex-shrink-0 ${config.text} ${config.border} ${config.bg}`}>
                        {config.icon} {config.label}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400">Adm: {student.admission_no} · {student.standard}</p>
                    <div className="mt-2 w-full bg-gray-100 rounded-full h-1.5">
                      <div className={`h-1.5 rounded-full transition-all
                        ${status === 'paid' ? 'bg-teal-500' : status === 'partial' ? 'bg-yellow-400' : 'bg-red-400'}`}
                        style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                  <div className="text-right ml-4 flex-shrink-0">
                    {student.totalAmount > 0 ? (
                      <>
                        <p className="text-xs text-gray-400">Balance</p>
                        <p className={`text-sm font-bold ${student.totalBalance > 0 ? 'text-red-500' : 'text-teal-600'}`}>
                          ₹{student.totalBalance.toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">of ₹{student.totalAmount.toLocaleString()}</p>
                      </>
                    ) : (
                      <p className="text-xs text-gray-400">No fees set</p>
                    )}
                  </div>
                </div>
                <div className="flex justify-end mt-2">
                  <span className="text-xs text-gray-300 group-hover:text-teal-500 transition-all">View Details →</span>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}