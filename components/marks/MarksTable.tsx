'use client'

import { Subject, MarkWithStudent, MarkFormData } from '@/type/mark'

interface ExamColumn {
  label: string
  field: keyof Omit<MarkFormData, 'id'>
  maxKey: keyof Subject
}

interface Props {
  activeSubject: Subject
  selectedStandard: string
  academicYear: string
  marksData: MarkWithStudent[]
  editMode: boolean
  saving: boolean
  onEditToggle: () => void
  onSave: () => void
  onCancel: () => void
  onMarkChange: (studentId: number, field: keyof Omit<MarkFormData, 'id'>, value: string) => void
  examColumns: ExamColumn[]
}

export default function MarksTable({
  activeSubject,
  selectedStandard,
  academicYear,
  marksData,
  editMode,
  saving,
  onEditToggle,
  onSave,
  onCancel,
  onMarkChange,
  examColumns,
}: Props) {
  const activeColumns = examColumns.filter(
    col => (activeSubject[col.maxKey] as number) > 0
  )

  function isOverMax(value: number | null, max: number): boolean {
    if (value === null || max === 0) return false
    return value > max
  }

  function calcTotal(marks: MarkFormData): number {
    return [marks.ut1, marks.ut2, marks.ut3, marks.ut4,
       marks.ut5,
    marks.ut6,
    marks.ut7,
    marks.ut8,
      marks.mid_term, marks.half_yearly, marks.final]
      .reduce<number>((sum, v) => sum + (v ?? 0), 0)
  }

    function calcMaxTotal(): number {
    return [
        activeSubject.max_ut1,
        activeSubject.max_ut2,
        activeSubject.max_ut3,
        activeSubject.max_ut4,

        activeSubject.max_ut5,
        activeSubject.max_ut6,
        activeSubject.max_ut7,
        activeSubject.max_ut8,

        activeSubject.max_mid_term,
        activeSubject.max_half_yearly,
        activeSubject.max_final,
      ].reduce<number>((sum, v) => sum + (v ?? 0), 0)
  }
      

  function calcPercent(marks: MarkFormData): string {
    const max = calcMaxTotal()
    if (max === 0) return '—'
    return ((calcTotal(marks) / max) * 100).toFixed(1) + '%'
  }

  return (
    <div className="bg-white rounded-xl shadow p-4">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left">
              <th className="px-3 py-2 w-8 text-gray-600">#</th>
              <th className="px-3 py-2 text-gray-600">Name</th>
              <th className="px-3 py-2 text-gray-600">Adm No</th>
              {activeColumns.map(col => (
                <th key={col.field} className="px-3 py-2 text-center text-gray-600">
                  {col.label}
                  <span className="block text-xs text-gray-400 font-normal">
                    /{activeSubject[col.maxKey] as number}
                  </span>
                </th>
              ))}
              <th className="px-3 py-2 text-center text-gray-600">Total</th>
              <th className="px-3 py-2 text-center text-gray-600">%</th>
            </tr>
          </thead>
          <tbody>
            {marksData.map((row, index) => (
              <tr key={row.student_id} className="border-t hover:bg-gray-50">
                <td className="px-3 py-2 text-gray-400 text-xs">{index + 1}</td>
                <td className="px-3 py-2 font-medium text-gray-500">{row.name}</td>
                <td className="px-3 py-2 text-gray-400 text-xs">{row.admission_no}</td>
                {activeColumns.map(col => {
                  const max = activeSubject[col.maxKey] as number
                  const val = row.marks[col.field]
                  const over = isOverMax(val as number | null, max)
                  return (
                    <td key={col.field} className="px-2 py-1 text-center">
                      {editMode ? (
                        <input
                          type="number"
                          min={0}
                          max={max}
                          value={val === null || val === undefined ? '' : val}
                          onChange={e =>
                            onMarkChange(row.student_id, col.field, e.target.value)
                          }
                          className={`w-16 border rounded px-2 py-1 text-center text-sm
                            ${over
                              ? 'border-red-500 bg-red-50 text-red-600'
                              : 'border-gray-300 text-slate-800 focus:border-teal-400 focus:outline-none'
                            }`}
                        />
                      ) : (
                        <span className={val === null || val === undefined ? 'text-gray-300' : 'text-gray-600'}>
                          {val === null || val === undefined ? '—' : val}
                        </span>
                      )}
                    </td>
                  )
                })}
                <td className="px-3 py-2 text-center font-semibold text-gray-500">
                  {calcTotal(row.marks)}
                </td>
                <td className="px-3 py-2 text-center text-teal-600 font-medium">
                  {calcPercent(row.marks)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}