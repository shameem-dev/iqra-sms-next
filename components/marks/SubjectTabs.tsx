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

// -- Color config per subject_type
const TYPE_STYLES = {
  academic: {
    label:       'Academic',
    badge:       'A',
    active:      'bg-teal-600 text-white border-teal-600',
    inactive:    'bg-white text-teal-700 border-teal-300 hover:border-teal-500 hover:bg-teal-50',
    badgeActive: 'bg-white/20 text-white',
    badgeInactive:'bg-teal-100 text-teal-700',
    section:     'text-teal-500',
  },
  moral_studies: {
    label:       'Moral Studies',
    badge:       'M',
    active:      'bg-violet-600 text-white border-violet-600',
    inactive:    'bg-white text-violet-700 border-violet-300 hover:border-violet-500 hover:bg-violet-50',
    badgeActive: 'bg-white/20 text-white',
    badgeInactive:'bg-violet-100 text-violet-700',
    section:     'text-violet-400',
  },
} as const

type SubjectType = keyof typeof TYPE_STYLES

function getTypeStyle(type: string) {
  return TYPE_STYLES[type as SubjectType] ?? TYPE_STYLES.academic
}

function SubjectTab({
  subject,
  active,
  onSelect,
  onEdit,
  onDelete,
}: {
  subject: Subject
  active: boolean
  onSelect: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const s = getTypeStyle(subject.subject_type)

  return (
    <div className="relative group">
      <button
        onClick={onSelect}
        className={`
          px-4 py-2 rounded-full text-sm font-medium border transition-all pr-16
          ${active ? s.active : s.inactive}
        `}
      >
        <span>{subject.name}</span>
        <span className={`
          ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded-full
          ${active ? s.badgeActive : s.badgeInactive}
        `}>
          {s.badge}
        </span>
      </button>

      <div className="absolute right-1 top-1/2 -translate-y-1/2 hidden group-hover:flex gap-1">
        <button
          onClick={e => { e.stopPropagation(); onEdit() }}
          className="w-6 h-6 flex items-center justify-center rounded-full bg-white border border-gray-200 text-gray-400 hover:text-teal-600 hover:border-teal-300 shadow-sm"
          title="Edit subject"
        >
          <Pencil size={11} />
        </button>
        <button
          onClick={e => { e.stopPropagation(); onDelete() }}
          className="w-6 h-6 flex items-center justify-center rounded-full bg-white border border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-300 shadow-sm"
          title="Delete subject"
        >
          <Trash2 size={11} />
        </button>
      </div>
    </div>
  )
}

export default function SubjectTabs({
  subjects,
  activeSubject,
  onSelectSubject,
  onEditSubject,
  onDeleteSubject,
  onAddSubject,
}: Props) {
  const academic = subjects.filter(s => s.subject_type !== 'moral_studies')
  const moral    = subjects.filter(s => s.subject_type === 'moral_studies')

  return (
    <div className="flex flex-col gap-4">

      {academic.length > 0 && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className={`text-[10px] font-bold uppercase tracking-widest mr-1 shrink-0 ${TYPE_STYLES.academic.section}`}>
            Academic
          </span>
          {academic.map(subject => (
            <SubjectTab
              key={subject.id}
              subject={subject}
              active={activeSubject?.id === subject.id}
              onSelect={() => { if (activeSubject?.id !== subject.id) onSelectSubject(subject) }}
              onEdit={() => onEditSubject(subject)}
              onDelete={() => onDeleteSubject(subject)}
            />
          ))}
        </div>
      )}

      {moral.length > 0 && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className={`text-[10px] font-bold uppercase tracking-widest mr-1 shrink-0 ${TYPE_STYLES.moral_studies.section}`}>
            Moral Studies
          </span>
          {moral.map(subject => (
            <SubjectTab
              key={subject.id}
              subject={subject}
              active={activeSubject?.id === subject.id}
              onSelect={() => { if (activeSubject?.id !== subject.id) onSelectSubject(subject) }}
              onEdit={() => onEditSubject(subject)}
              onDelete={() => onDeleteSubject(subject)}
            />
          ))}
        </div>
      )}

      <div>
        <button
          onClick={onAddSubject}
          className="px-4 py-2 rounded-full text-sm font-medium border border-dashed border-gray-300 text-gray-400 hover:border-teal-400 hover:text-teal-500 transition-all flex items-center gap-1"
        >
          <Plus size={13} />
          Add Subject
        </button>
      </div>

    </div>
  )
}