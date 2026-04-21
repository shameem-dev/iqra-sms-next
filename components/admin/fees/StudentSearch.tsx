'use client'
import { useState, useEffect } from 'react'
import { Student } from '@/type/fees'
import { getAllStudents } from '@/utils/actions/fees'

interface Props {
  onSelect: (student: Student) => void
  selected: Student | null
}

export default function StudentSearch({ onSelect, selected }: Props) {
  const [students, setStudents] = useState<Student[]>([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAllStudents()
      .then(setStudents)
      .finally(() => setLoading(false))
  }, [])

  
  const filtered = students.filter(s =>
    s.name.toLowerCase().includes(query.toLowerCase()) ||
    s.admission_no.includes(query)
  )

  const initials = (name: string) =>
    name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5">
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-4">
        Select student
      </p>
      <input
        type="text"
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Search by name or admission no."
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-4  placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
      />
      {loading ? (
        <p className="text-sm text-gray-400 text-center py-4">Loading...</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-4">No students found</p>
      ) : (
        <div className="space-y-1 max-h-72 overflow-y-auto">
          {filtered.map(s => (
            <button
              key={s.id}
              onClick={() => onSelect(s)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all ${
                selected?.id === s.id
                  ? 'bg-teal-50 border border-teal-200'
                  : 'hover:bg-gray-50 border border-transparent'
              }`}
            >
              <div className="w-8 h-8 rounded-full bg-teal-50 flex items-center justify-center text-xs font-medium text-teal-700 shrink-0">
                {initials(s.name)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{s.name}</p>
                <p className="text-xs text-gray-400">Adm: {s.admission_no} · Std: {s.standard}</p>
              </div>
              {selected?.id === s.id && (
                <span className="text-xs text-teal-600 font-medium">Selected</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}