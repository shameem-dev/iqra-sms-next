'use client'

import { X, BookOpen } from 'lucide-react'
import { Subject, SubjectFormData } from '@/type/mark'

interface Props {
  show: boolean
  onClose: () => void
  onSubmit: (e: React.FormEvent) => void
  form: SubjectFormData
  setForm: (form: SubjectFormData) => void
  editingSubject: Subject | null
  saving: boolean
  selectedStandard: string
}

const subjectFormFields = [
  { label: 'UT1', key: 'max_ut1' },
  { label: 'UT2', key: 'max_ut2' },
  { label: 'UT3', key: 'max_ut3' },
  { label: 'UT4', key: 'max_ut4' },
  { label: 'Mid Term', key: 'max_mid_term' },
  { label: 'Half Yearly', key: 'max_half_yearly' },
  { label: 'Final', key: 'max_final' },
]

export default function SubjectModal({
  show,
  onClose,
  onSubmit,
  form,
  setForm,
  editingSubject,
  saving,
  selectedStandard,
}: Props) {
  if (!show) return null

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">

        {/* Header */}
        <div className="bg-gradient-to-r from-teal-600 to-teal-500 px-6 py-4">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                <BookOpen size={16} className="text-white" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-white">
                  {editingSubject ? 'Edit Subject' : 'Add Subject'}
                </h2>
                <p className="text-xs text-teal-100 mt-0.5">{selectedStandard}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-lg bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors"
            >
              <X size={14} className="text-white" />
            </button>
          </div>
        </div>

        <div className="p-6">
          <form onSubmit={onSubmit} className="space-y-5">

            {/* Subject Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                Subject Name
              </label>
              <input
                type="text"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Mathematics"
                className="
                  w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm
                  text-slate-700 placeholder:text-slate-300
                  focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-50
                  transition-all
                "
                required
              />
            </div>

            {/* Max Marks */}
            <div>
              <div className="flex items-baseline justify-between mb-3">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Max Marks per Exam
                </label>
                <span className="text-[11px] text-slate-400">Set 0 to skip</span>
              </div>

              <div className="grid grid-cols-4 gap-2.5">
                {subjectFormFields.map(({ label, key }) => (
                  <div key={key} className="group">
                    <label className="block text-[11px] font-medium text-slate-400 mb-1 group-focus-within:text-teal-500 transition-colors">
                      {label}
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={form[key as keyof SubjectFormData] as number}
                      onChange={e =>
                        setForm({
                          ...form,
                          [key]: parseInt(e.target.value) || 0,
                        })
                      }
                      className="
                        w-full border border-slate-200 rounded-lg px-2 py-2 text-sm text-center
                        text-slate-700 font-medium
                        focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-50
                        transition-all hover:border-slate-300
                      "
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-slate-100" />

            {/* Buttons */}
            <div className="flex gap-2.5">
              <button
                type="submit"
                disabled={saving}
                className="
                  flex-1 bg-teal-600 hover:bg-teal-700 active:bg-teal-800
                  text-white py-2.5 rounded-xl text-sm font-semibold
                  disabled:opacity-50 disabled:cursor-not-allowed
                  transition-all shadow-sm shadow-teal-200
                "
              >
                {saving
                  ? 'Saving…'
                  : editingSubject
                    ? 'Update Subject'
                    : 'Add Subject'
                }
              </button>
              <button
                type="button"
                onClick={onClose}
                className="
                  px-5 border border-slate-200 text-slate-500 py-2.5 rounded-xl
                  text-sm font-medium hover:bg-slate-50 hover:border-slate-300
                  transition-all
                "
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}