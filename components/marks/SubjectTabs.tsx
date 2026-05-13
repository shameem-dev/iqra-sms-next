'use client'

import { Pencil, Trash2, Plus } from 'lucide-react'
import { Subject } from '@/type/mark'

interface Props {
  subjects: Subject[]
  activeSubject: Subject | null
  onSelectSubject: (subject: Subject) => void
  onEditSubject: (subject: Subject) => void
  onDeleteSubject: (subject: Subject) => void
  onAddSubject: () => void
}

export default function SubjectTabs({
  subjects,
  activeSubject,
  onSelectSubject,
  onEditSubject,
  onDeleteSubject,
  onAddSubject,
}: Props) {
  return (
    <div className="flex flex-wrap gap-2 mb-6 items-center">
      {subjects.map(subject => (
        <div key={subject.id} className="relative group">
          <button
            onClick={() => {
              if (activeSubject?.id !== subject.id) onSelectSubject(subject)
            }}
            className={`px-4 py-2 rounded-full text-sm font-medium border transition-all pr-16
              ${activeSubject?.id === subject.id
                ? 'bg-teal-600 text-white border-teal-600'
                : 'bg-white text-gray-600 border-gray-300 hover:border-teal-400 hover:text-teal-600'
              }`}
          >
            {subject.name}
          </button>

          {/* Edit / Delete on hover */}
          <div className="absolute right-1 top-1/2 -translate-y-1/2 hidden group-hover:flex gap-1">
            <button
              onClick={e => { e.stopPropagation(); onEditSubject(subject) }}
              className="w-6 h-6 flex items-center justify-center rounded-full bg-white border border-gray-200 text-gray-400 hover:text-teal-600 hover:border-teal-300 shadow-sm"
              title="Edit subject"
            >
              <Pencil size={11} />
            </button>
            <button
              onClick={e => { e.stopPropagation(); onDeleteSubject(subject) }}
              className="w-6 h-6 flex items-center justify-center rounded-full bg-white border border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-300 shadow-sm"
              title="Delete subject"
            >
              <Trash2 size={11} />
            </button>
          </div>
        </div>
      ))}

      <button
        onClick={onAddSubject}
        className="px-4 py-2 rounded-full text-sm font-medium border border-dashed border-gray-300 text-gray-400 hover:border-teal-400 hover:text-teal-500 transition-all flex items-center gap-1"
      >
        <Plus size={13} />
        Add Subject
      </button>
    </div>
  )
}